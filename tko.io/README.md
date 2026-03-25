# TKO Documentation Site

This is the documentation website for TKO, built with Astro and Starlight.

## Development

```bash
# Install dependencies
bun install

# Start local development server
bun run dev

# Build for production
bun run build

# Preview the production build locally
bun run preview
```

The dev site is available at `http://localhost:4321/` by default.
Use `bun run preview` when you want to test the production build locally, including search.

## Features

- Written in Markdown
- Built with Astro + Starlight
- Full-text search powered by Pagefind in production builds
- Interactive JSX examples using esbuild-wasm
- Legacy docs links normalized during migration
- Styled with the current TKO theme

## Structure

```
tko.io/
├── public/            # Static assets copied as-is
├── src/
│   ├── components/    # Starlight component overrides
│   ├── content/docs/  # Documentation pages (Markdown)
│   ├── pages/         # Custom Astro pages
│   └── styles/        # Site styling
├── plugins/           # Markdown migration helpers
├── dist/              # Built site (gitignored)
└── astro.config.mjs   # Astro/Starlight configuration
```

## Adding Documentation

1. Create a new `.md` file in `src/content/docs/`
2. Add front matter with at least a title:
   ```yaml
   ---
   title: Your Page Title
   ---
   ```
3. Write content in Markdown
4. For section landing pages, add sidebar metadata:
   ```yaml
   sidebar:
     label: Overview
     order: 0
   ```
5. Add interactive JSX examples using:
   ````markdown
   ```jsx
   function Example() {
     return <div>Hello World</div>
   }
   ```
   ````

## Deployment

The site is deployed to GitHub Pages by `.github/workflows/deploy-docs.yml` when changes land on `main`.

The deployment pipeline:

1. Installs dependencies in `tko.io/`
2. Builds the site with `bun run build`
3. Uploads `tko.io/dist`
4. Deploys that artifact to GitHub Pages

The custom domain is provided by `public/CNAME`.
