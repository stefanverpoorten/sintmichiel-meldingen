import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
};

export default withBotId(nextConfig);
