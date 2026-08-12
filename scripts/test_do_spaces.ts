import { S3Client, ListBucketsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const KEY = "Km2S1RiyblDGHgvzZwvRf4bwjjDL19hLz4xtT8o68l8";
const REGIONS = ["nyc3", "sfo3", "sfo2", "ams3", "sgp1", "fra1", "lon1"];

async function main() {
  for (const region of REGIONS) {
    const endpoint = `https://${region}.digitaloceanspaces.com`;
    console.log(`Checking region ${region}...`);
    const client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: KEY,
        secretAccessKey: KEY,
      },
    });

    try {
      const buckets = await client.send(new ListBucketsCommand({}));
      console.log(`✅ SUCCESS on ${region}! Buckets:`, buckets.Buckets?.map(b => b.Name));
    } catch (e: any) {
      console.log(`Region ${region}: ${e.message}`);
    }
  }
}

main().catch(console.error);
