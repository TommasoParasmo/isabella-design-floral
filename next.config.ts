import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O clube se chamava "Clube dos Desatentos"; o link antigo continua funcionando.
  async redirects() {
    return [{ source: "/clube-dos-desatentos", destination: "/clube-nao-me-esquecas", permanent: true }];
  },
};

export default nextConfig;
