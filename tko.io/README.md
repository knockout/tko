# TKO Documentation Site

This is the documentation website for TKO, built with 11ty (Eleventy).

## Development

```bash
# Install dependencies
bun install

# Start local development server
bun run dev

# Build for production
bun run build
```

The site will be available at http://localhost:8080/

## Features

- Written in Markdown
- Interactive JSX examples using esbuild-wasm
- Examples are written in code blocks and automatically transformed into editable textareas with live preview
- Styled with the classic TKO theme

## Structure

```
tko.io/
├── src/
│   ├── _layouts/      # Page layouts (Nunjucks)
│   ├── _includes/     # Reusable components
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript (example system)
│   ├── docs/          # Documentation pages (Markdown)
│   └── index.md       # Homepage
├── _site/             # Built site (gitignored)
└── .eleventy.js       # 11ty configuration
```

## Adding Documentation

1. Create a new `.md` file in `src/docs/`
2. Add front matter with layout and title:
   ```yaml
   ---
   layout: base.njk
   title: Your Page Title
   ---
   ```
3. Write content in Markdown
4. Add interactive JSX examples using:
   ````markdown
   ```jsx
   function Example() {
     return <div>Hello World</div>
   }
   ```
   ````

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.
