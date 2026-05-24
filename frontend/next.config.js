/** @type {import('next').NextConfig} */
const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  // Proxy /api/* + /socket.io/* ไปยัง backend
  // ใช้ตอน tunnel (ไม่มี CORS, ไม่ต้อง expose backend แยก)
  async rewrites() {
    return [
      { source: '/api/:path*',       destination: `${BACKEND}/api/:path*` },
      { source: '/socket.io/:path*', destination: `${BACKEND}/socket.io/:path*` }
    ];
  }
};
module.exports = nextConfig;
