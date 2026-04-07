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
        {
          label: 'Examples',
          items: [
            { label: 'Overview', slug: 'examples' },
            { label: 'Honeycomb ↗', link: '/examples/honeycomb.html?view=example' },
            { label: 'odoom ↗', link: '/examples/odoom.html?view=example' },
            { label: 'Spreadsheet ↗', link: '/examples/spreadsheet.html?view=example' },
            { label: 'Signal Graph ↗', link: '/examples/signal-graph.html?view=example' },
            { label: 'Reactive Audio Mixer ↗', link: '/examples/audio-mixer.html?view=example' },
            { label: 'Form Engine ↗', link: '/examples/form-engine.html?view=example' }
          ]
        },
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
