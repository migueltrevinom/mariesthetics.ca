import type { NextConfig } from "next";
import { HYDRA_FACIAL_PREFIX_REDIRECTS } from "./src/lib/services/landing/hydraRedirects";

const nextConfig: NextConfig = {
	output: "standalone",
	async redirects() {
		return [...HYDRA_FACIAL_PREFIX_REDIRECTS];
	},
	// Render all metadata (<title>, description, canonical, hreflang) in <head>
	// for every user agent instead of streaming it into <body> after the shell.
	htmlLimitedBots: /.*/,
	eslint: {
		ignoreDuringBuilds: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.verifik.co",
			},
			{
				protocol: "https",
				hostname: "*.digitaloceanspaces.com",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
			},
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
};

export default nextConfig;
