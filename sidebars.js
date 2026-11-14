// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    'architecture',
    {
      type: 'category',
      label: 'Getting started',
      items: ['getting-started', 'guide/first-exchange'],
    },
    {
      type: 'category',
      label: 'User guide',
      items: [
        'guide/overview',
        'guide/organization',
        'guide/identity',
        'guide/connectors',
        'guide/publish',
        'guide/exchange',
        'guide/cloud-storage',
        'reference/api',
      ],
    },
    {
      type: 'category',
      label: 'Self-hosting',
      items: ['guide/self-hosted-connector', 'guide/organization-wallet'],
    },
    {
      type: 'category',
      label: 'Administration',
      items: [
        'administration/configuration',
        'administration/operations',
        'identity/identity-hosting',
        'administration/remote-cluster',
        'troubleshooting',
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
