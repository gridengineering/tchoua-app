import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "fontkit", "linebreak", "restructure", "deep-equal", "png-js", "brotli", "unicode-properties", "tiny-inflate"],
};

export default nextConfig;
