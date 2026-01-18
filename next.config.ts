import type { NextConfig } from "next";

import { securityHeaders } from "./src/lib/securityHeaders";

const nextConfig: NextConfig = {
  async headers() {
    const headers = Object.entries(securityHeaders()).map(([key, value]) => ({
      key,
      value,
    }));

    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },
};

export default nextConfig;
