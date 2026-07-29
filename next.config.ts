import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // servido em joaobonatti.com/circle-of-fifths via rewrite no projeto do site.
  // basePath cobre assets, <Link> e router. Este app nao monta URL a mao
  // (zero fetch absoluto, zero location.origin), entao nada mais precisa mudar.
  basePath: "/circle-of-fifths",
};

export default nextConfig;
