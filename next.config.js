/** @type {import('next').NextConfig} */
const nextConfig = {
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

              "img-src 'self' data: blob: https:",

              "font-src 'self'",

              // API calls
              "connect-src 'self' https://api.razorpay.com https://*.razorpay.com",

              // Razorpay payment popup
              "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com",

            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;