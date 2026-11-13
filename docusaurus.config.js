
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'OpenDS',
  tagline: 'Open Dataspace Platform',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // Website URL
  url: 'https://docs.open-ds.de',
  baseUrl: '/',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
        },

        // Disable blog
        blog: false,

        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: false,
    },

    navbar: {
      title: '',
      logo: {
        alt: 'OpenDS',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      items: [
        {
          href: 'https://github.com/kwe712/OpenDS',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'OpenDS on GitHub',
        },
      ],
    },

    footer: {
      style: 'light',
      copyright: `© ${new Date().getFullYear()} OpenDS`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;
