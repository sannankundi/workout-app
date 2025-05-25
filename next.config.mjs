/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  env: {
    APP_NAME: "FitTrack",
    APP_DESCRIPTION: "Your Personal Fitness Journey Companion",
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "fittrackworkout.web.app"],
    },
  },
  webpack: (config, { isServer }) => {
    // Optimize module loading
    config.optimization = {
      ...config.optimization,
      moduleIds: "deterministic",
      runtimeChunk: "single",
      splitChunks: {
        chunks: "all",
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    };

    // Add resolve fallbacks for Firebase
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
        "firebase/auth": "firebase/auth",
      },
    };

    return config;
  },
};

export default nextConfig;
