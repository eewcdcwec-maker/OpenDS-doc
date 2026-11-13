// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    'getting-started',
    {
      type: 'category',
      label: 'User guide',
      items: [
        'guide/overview',
        'guide/first-exchange',
        'guide/organization',
        'guide/identity',
        'guide/organization-wallet',
        'guide/connectors',
        'guide/self-hosted-connector',
        'guide/cloud-storage',
        'guide/publish',
        'guide/exchange',
      ],
    },
    {
      type: 'category',
      label: 'Administration',
      items: [
        'administration/configuration',
        'administration/operations',
        'administration/remote-cluster',
        'identity/identity-hosting',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: ['architecture', 'reference/api'],
    },
    {
      type: 'category',
      label: 'Development',
      items: ['development/development', 'development/two-host-test'],
    },
    'troubleshooting',
  ],
};

export default sidebars;
