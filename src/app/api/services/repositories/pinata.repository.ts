export class PinataRepository {
  private static getJwt(): string {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
      throw new Error("PINATA_JWT is not configured in the environment variables.");
    }
    // Clean quotes if wrap-configured
    return jwt.replace(/^"|"$/g, "");
  }

  /**
   * Uploads a file buffer to Pinata IPFS
   */
  static async uploadFileToPinata(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<{ ipfsHash: string; url: string }> {
    const jwt = this.getJwt();

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
    // Append the file blob with a filename
    formData.append("file", blob, filename);

    // Optional Pinata configuration options
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: filename,
        keyvalues: {
          uploadedAt: new Date().toISOString(),
        },
      })
    );

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata upload failed with status ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as {
      IpfsHash: string;
      PinSize: number;
      Timestamp: string;
    };

    return {
      ipfsHash: data.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
    };
  }

  /**
   * Deletes (unpins) a file from Pinata IPFS
   */
  static async deleteFileFromPinata(ipfsHash: string): Promise<void> {
    const jwt = this.getJwt();

    const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${ipfsHash}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      // If it's 404, the file might have already been unpinned, so we can ignore or throw
      if (response.status === 404) {
        console.warn(`File with IPFS Hash ${ipfsHash} was not found on Pinata or already unpinned.`);
        return;
      }
      const errorText = await response.text();
      throw new Error(`Pinata unpin failed with status ${response.status}: ${errorText}`);
    }
  }
}
