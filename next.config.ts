import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        domains: ['drive.google.com', 'lh3.googleusercontent.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'drive.google.com',
                pathname: '/uc/**',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '/d/**',
            },
        ],
    },
};

export default nextConfig;
