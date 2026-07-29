import type { NextConfig } from "next";

const basePath = "/circle-of-fifths";

const nextConfig: NextConfig = {
  // servido em joaobonatti.com/circle-of-fifths via rewrite no projeto do site.
  // basePath cobre assets, <Link> e router. Este app nao monta URL a mao
  // (zero fetch absoluto, zero location.origin), entao nada mais precisa mudar.
  basePath,
  // com basePath ativo a raiz passa a dar 404, quebrando quem tem o link antigo.
  // basePath: false impede o Next de prefixar o source, senao a regra viraria
  // /circle-of-fifths -> /circle-of-fifths e nunca casaria com a raiz.
  async redirects() {
    return [{ source: "/", destination: basePath, permanent: false, basePath: false }];
  },
};

export default nextConfig;
