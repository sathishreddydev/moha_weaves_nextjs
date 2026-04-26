/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
        protocol: "http",
        hostname: "103.127.146.58",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
    ],
  },

  async headers() {
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

              "img-src 'self' data: blob: https: http:",

              "font-src 'self'",

              // API calls
              "connect-src 'self' https://api.razorpay.com https://*.razorpay.com http://103.127.146.58:5000 ws://103.127.146.58:5000 ws://localhost:3000 ws://localhost:5000 ws: wss:",

              // Razorpay payment popup
              "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com",

            ].join("; "),
          },
        ],
      },
    ];
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_IMAGE_URL: process.env.NEXT_PUBLIC_IMAGE_URL,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  }
}

module.exports = nextConfig