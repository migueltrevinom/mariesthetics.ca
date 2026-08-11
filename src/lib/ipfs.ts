/**
 * IPFS Image Optimization & Caching Helpers
 */

const IPFS_GATEWAYS = [
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
];

/**
 * Extracts raw IPFS hash (Qm... or bafy...) from any IPFS URL or string
 */
export function extractIpfsHash(urlOrHash: string): string | null {
  if (!urlOrHash) return null;
  const match = urlOrHash.match(/(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{55,})/);
  return match ? match[0] : null;
}

/**
 * Returns high-performance cached proxy URL or fast gateway URL for any IPFS image
 */
export function getFastIpfsUrl(urlOrHash: string, gatewayIndex = 0): string {
  const hash = extractIpfsHash(urlOrHash);
  if (!hash) return urlOrHash;

  // Use local API proxy which adds 1-year Immutable Cache headers
  return `/api/media/${hash}`;
}

/**
 * Returns direct Cloudflare/Pinata gateway URL as fallback
 */
export function getGatewayUrl(hash: string, gatewayName: "cloudflare" | "pinata" | "ipfs" = "cloudflare"): string {
  switch (gatewayName) {
    case "cloudflare":
      return `https://cloudflare-ipfs.com/ipfs/${hash}`;
    case "ipfs":
      return `https://ipfs.io/ipfs/${hash}`;
    case "pinata":
    default:
      return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }
}
