import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tsxTabs from './plugins/tsx-tabs.js';
import legacyDocs from './plugins/legacy-docs.js';
import { pluginPlaygroundButton } from './plugins/playground-button.js';

export default defineConfig({
  site: 'https://tko.io',
  markdown: {
    remarkPlugins: [tsxTabs, legacyDocs]
  },
  integrations: [
    starlight({
      expressiveCode: {
        plugins: [pluginPlaygroundButton()]
      },
      title: 'TKO',
      description: 'Typed Knockout documentation and migration guides.',
      disable404Route: true,
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/knockout/tko' }
      ],
      customCss: ['./src/styles/tko.css'],
      components: {
        Banner: './src/components/Banner.astro',
        Head: './src/components/Head.astro',
        Header: './src/components/Header.astro'
      },
      sidebar: [
        { label: 'Introduction', slug: 'index' },
        { label: 'Knockout 3 to 4 Guide', slug: '3to4' },
        { label: 'Bindings', autogenerate: { directory: 'bindings' } },
        { label: 'Observables', autogenerate: { directory: 'observables' } },
        { label: 'Computed', autogenerate: { directory: 'computed' } },
        { label: 'Components', autogenerate: { directory: 'components' } },
        { label: 'Binding Context', autogenerate: { directory: 'binding-context' } },
        { label: 'Advanced', autogenerate: { directory: 'advanced' } }
      ]
    })
  ]
});
