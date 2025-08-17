/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações para prevenir problemas de build corrompido
  
  // Força regeneração de chunks
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Previne problemas de vendor chunks
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Configurações experimentais para estabilidade
  experimental: {
    // Melhora hot reload
    optimizePackageImports: ['@tanstack/react-query', 'lucide-react'],
  },
  
  // Desabilita indicadores de desenvolvimento flutuantes
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  
  // Configurações de imagem para uploads
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
    ],
  },
};

module.exports = nextConfig;