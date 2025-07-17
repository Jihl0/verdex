/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable if using Firebase Storage/Realtime DB
  images: {
    domains: ["firebasestorage.googleapis.com"],
  },
};

export default nextConfig;
