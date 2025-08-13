/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Next.js to produce a static export.
  // This is required for deployment to static hosting services like Firebase Hosting.
  output: 'export',
  // Optional: disable image optimization if you are not using a custom loader,
  // as the default Next.js image optimization does not work with static exports.
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
