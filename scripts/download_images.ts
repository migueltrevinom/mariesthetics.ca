import fs from "fs";
import path from "path";

const GATEWAYS = [
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
];

const SERVICES_IMAGES = [
  { slug: "hybrid-set", hash: "QmQ4YxRD13Vk1r59rFEQ9K1S1i8ekM9F5cNz4F3dXSyeV2" },
  { slug: "volume-set", hash: "QmaRpubkwHH8CwCCKYhpoyzwyvDDHeBosyYFocBa1xUtaU" },
  { slug: "fill-service", hash: "QmXUDKwJRSXQEZSzbZkE7m7MAjMUUbpy43Xgjr9DiB6FGa" },
  { slug: "classic-set", hash: "QmeCTmrvdHwwV2Wdoq5kc5dirzZcLiDPnSpXzVrChvPVCh" },
  { slug: "lip-neutralization", hash: "QmeCFXgjRdYvcihfBeSM7o78BqXcggbRbbEMn47eeft4zq" },
  { slug: "lip-blush", hash: "QmYBe4KnaY5vqtHWWahW38k2gXp2uKaRywNLad7SnfcSXD" },
  { slug: "soft-powder-brows", hash: "QmauFWpQRYH7yH35oU3SU44fRfpcjaoBHvUQx9ZdDMpJwa" },
  { slug: "hydra-facial", hash: "QmZmkT8z2xnxNMdAhwu4KtBbTBdidYV8ujAoTAsjvB5Eou" },
  { slug: "anti-aging-facial", hash: "QmP4vEM1z74kgXC5HcrseVL1KbnXCBGrXWHrCWzdXwZi6Z" },
  { slug: "basic-facial", hash: "QmYygEVs3neAWK4TGsgvFevkVdCB59UHe2PALZjM8ABmNr" },
  { slug: "deep-cleansing-facial", hash: "QmYJtGxNuXBnXXBWcL6T63CuTcqFCc6oZW9UyKMeTTv149" },
];

async function downloadImage(hash: string, localFilePath: string) {
  for (const gateway of GATEWAYS) {
    try {
      const url = `${gateway}${hash}`;
      console.log(`Trying ${url}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(localFilePath, buffer);
        console.log(`✅ Saved ${localFilePath} (${buffer.length} bytes)`);
        return true;
      }
    } catch (e: any) {
      console.log(`Failed gateway ${gateway}: ${e.message}`);
    }
  }
  return false;
}

async function main() {
  const publicDir = path.join(process.cwd(), "public", "images", "services");
  const srcDir = path.join(process.cwd(), "src", "images", "services");

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  console.log("Downloading all production service images to local project...");
  for (const item of SERVICES_IMAGES) {
    const publicPath = path.join(publicDir, `${item.slug}.jpg`);
    const srcPath = path.join(srcDir, `${item.slug}.jpg`);

    let success = false;
    if (fs.existsSync(publicPath) && fs.statSync(publicPath).size > 1000) {
      console.log(`Already downloaded ${item.slug}.jpg`);
      success = true;
    } else {
      success = await downloadImage(item.hash, publicPath);
    }

    if (success && fs.existsSync(publicPath)) {
      fs.copyFileSync(publicPath, srcPath);
      console.log(`✅ Copied to ${srcPath}`);
    } else {
      console.error(`❌ Could not download image for ${item.slug} (${item.hash})`);
    }
  }
  console.log("Download task complete!");
}

main().catch(console.error);
