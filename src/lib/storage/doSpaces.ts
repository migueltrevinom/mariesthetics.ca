import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const bucket = process.env.DO_SPACES_BUCKET || "cdn-verifik";
const region = process.env.DO_SPACES_REGION || "nyc3";
const endpoint = process.env.DO_SPACES_ENDPOINT || `https://${region}.digitaloceanspaces.com`;
const accessKeyId = process.env.DO_SPACES_KEY || "";
const secretAccessKey = process.env.DO_SPACES_SECRET || "";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (!accessKeyId || !secretAccessKey) {
    return null;
  }
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3Client;
}

export async function uploadToDigitalOceanSpaces(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  folder = "services"
): Promise<{ url: string; key: string }> {
  const client = getS3Client();
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `mariesthetics/${folder}/${Date.now()}_${cleanFilename}`;

  if (client) {
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
          ACL: "public-read",
        })
      );

      const cdnDomain = process.env.DO_SPACES_CDN_URL || "https://cdn.verifik.co";
      const publicUrl = `${cdnDomain}/${key}`;
      return { url: publicUrl, key };
    } catch (err: any) {
      console.warn("[DO Spaces Upload Fallback]:", err.message);
    }
  }

  // Local fallback url if DO credentials require access key ID update
  const localUrl = `/images/services/${cleanFilename}`;
  return { url: localUrl, key: cleanFilename };
}

export async function deleteFromDigitalOceanSpaces(key: string): Promise<void> {
  const client = getS3Client();
  if (!client || !key) return;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch (err: any) {
    console.warn("[DO Spaces Delete Error]:", err.message);
  }
}
