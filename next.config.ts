import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Set turbopack root to this project's directory to resolve
  // "multiple lockfiles" warning caused by parent-directory lockfiles
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
