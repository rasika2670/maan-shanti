/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://maanshanti.vercel.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    additionalSitemaps: [
      'https://maanshanti.vercel.app/sitemap.xml',
    ],
  },
  exclude: ['/api/*'],
  changefreq: 'weekly',
  priority: 0.7,
} 