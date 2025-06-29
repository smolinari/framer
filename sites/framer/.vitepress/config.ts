import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Framer App",
  description: "Download Framer and learn how to easily define and manage a visual frame on your desktop. Perfect for content creators, streamers, and anyone needing to highlight specific screen regions.",
  base: '/', // Adjust if deploying to a subdirectory
  head: [
    // Add any custom tags to the <head>
    ['link', { rel: 'icon', href: '/icon.ico' }] // Example for a favicon
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/framer-logo.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Downloads', link: '/downloads' },
      { text: 'Docs', link: '/docs' },
      { text: 'Support Us', link: '/support' }
    ],

    sidebar: {
      '/docs': [
        {
          text: 'Guide',
          items: [
            { text: 'Installation', link: '/docs#installation' },
            { text: 'Basic Usage', link: '/docs#basic-usage' },
            { text: 'Troubleshooting', link: '/docs#troubleshooting' }
          ]
        }
      ]
    },

    socialLinks: [
      // { icon: 'github', link: 'https://github.com/your-repo' } // Example
    ],

    footer: {
      message: 'Released under the MIT License.', // Optional
      copyright: `Copyright © ${new Date().getFullYear()} Scott Molinari | <a href="/imprint">Imprint</a>`
    },

    // Optional: Edit link for docs pages
    // editLink: {
    //   pattern: 'https://github.com/your-repo/edit/main/sites/framer/:path',
    //   text: 'Edit this page on GitHub'
    // }
  }
})