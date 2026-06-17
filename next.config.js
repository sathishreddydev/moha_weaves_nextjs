/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "admin.urumibymounika.com",
        pathname: "/**",
      },
      // Dev only — localhost images
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
    ],
  },
  compiler: {
    // removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,

  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://admin.urumibymounika.com';
    // Strip protocol for wss:// equivalent
    const apiHostname = apiUrl.replace(/^https?:\/\//, '');

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",

              // Razorpay checkout script
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com",

              "style-src 'self' 'unsafe-inline'",

              "img-src 'self' data: blob: https:",

              "font-src 'self'",

              // Video/audio from Cloudinary
              "media-src 'self' https://res.cloudinary.com",

              // API and socket connections — use env var, fall back to prod domain
              [
                "connect-src 'self'",
                "https://api.razorpay.com",
                "https://*.razorpay.com",
                `https://${apiHostname}`,
                `wss://${apiHostname}`,
                ...(isDev
                  ? [
                      "ws://localhost:3000",
                      "http://localhost:3000",
                      "ws://localhost:5000",
                      "http://localhost:5000",
                    ]
                  : []),
              ].join(" "),

              // Razorpay payment popup
              "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com",

            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/(.*)\\.(jpg|jpeg|png|gif|ico|svg|webp|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  env: {
    NEXT_PUBLIC_IMAGE_URL: process.env.NEXT_PUBLIC_IMAGE_URL,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },
}

module.exports = nextConfig
