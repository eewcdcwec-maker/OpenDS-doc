// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    'architecture',
    {
      type: 'category',
      label: 'Getting started',
      items: ['getting-started/installation', 'getting-started/first-data-exchange'],
    },
    {
      type: 'category',
      label: 'User guide',
      items: [
        'user-guide/overview',
        'user-guide/organization-and-team',
        'user-guide/identity',
        'user-guide/connectors',
        'user-guide/publish-data',
        'user-guide/discover-and-exchange-data',
        'user-guide/cloud-storage',
        'user-guide/api',
      ],
    },
    {
      type: 'category',
      label: 'Self-hosting',
      items: ['self-hosting/self-hosted-connector', 'self-hosting/self-hosted-wallet'],
    },
    {
      type: 'category',
      label: 'Administration',
      items: [
        'administration/configuration',
        'administration/operations',
        'administration/identity-services',
        'administration/remote-connector-cluster',
        'administration/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: ['development/development', 'development/testing'],
    },
  ],
};

export default sidebars;
