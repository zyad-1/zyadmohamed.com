/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      { source: '/work', destination: '/', permanent: true },
      { source: '/work/:path*', destination: '/', permanent: true },
      { source: '/portfolio', destination: '/', permanent: true },
      { source: '/portfolio/:path*', destination: '/', permanent: true },
      { source: '/projects', destination: '/', permanent: true },
      { source: '/about', destination: '/', permanent: true },
      { source: '/services', destination: '/', permanent: true },
      { source: '/contact', destination: '/', permanent: true },
      { source: '/reels', destination: '/', permanent: true },
      { source: '/videos', destination: '/', permanent: true },
      { source: '/blog', destination: '/', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/booked/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/d/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/f/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/a/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default nextConfig
