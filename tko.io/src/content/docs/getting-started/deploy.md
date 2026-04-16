---
title: Deploy in Seconds
description: Deploy a TKO app to static hosting — no build step required.
---

A TKO app can be as simple as a single HTML file. No bundler, no server runtime, no build step — just upload to any static hosting provider and you're live.

## The simplest deploy

Save this as `index.html`:

```html
<!doctype html>
<html>
  <body>
    <div id="app">
      <input data-bind="textInput: name" />
      <p>Hello, <strong data-bind="text: name"></strong>.</p>
    </div>
    <script type="module">
      import ko from 'https://esm.run/@tko/build.reference'
      ko.applyBindings({ name: ko.observable('TKO') }, document.getElementById('app'))
    </script>
  </body>
</html>
```

Upload that single file to any of the platforms below. That's it — a live, reactive web UI.

## GitHub Pages

Free, deploys from a git push.

1. Create a repo and add your `index.html`
2. Go to **Settings → Pages → Source** and select your branch
3. Your site is live at `https://username.github.io/repo/`

Or use the `gh` CLI:

```sh
gh repo create my-app --public --clone
# add index.html
git add index.html && git commit -m "init" && git push
gh browse --settings  # enable Pages under Settings → Pages
```

## Cloudflare Pages

Free tier, global CDN, automatic HTTPS.

1. Push your files to a GitHub or GitLab repo
2. Connect the repo at [dash.cloudflare.com](https://dash.cloudflare.com) → **Pages → Create**
3. No build command needed — just set the output directory to `/` (or wherever your HTML lives)

Or deploy directly from the CLI:

```sh
npx wrangler pages deploy . --project-name my-app
```

## Google Cloud Storage

Good for projects already on GCP.

```sh
gcloud storage buckets create gs://my-app.example.com
gcloud storage buckets update gs://my-app.example.com --web-main-page-suffix=index.html
gcloud storage cp index.html gs://my-app.example.com/
```

Add a load balancer or use [Firebase Hosting](https://firebase.google.com/docs/hosting) for automatic HTTPS and CDN.

## Firebase Hosting

Free tier, automatic HTTPS, global CDN.

```sh
npm install -g firebase-tools
firebase init hosting  # select your project, set public dir to "."
firebase deploy
```

## Netlify

Free tier, drag-and-drop or git-based deploys.

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag your project folder onto the page
3. Live in seconds

Or via CLI:

```sh
npx netlify-cli deploy --dir . --prod
```

## Why this works

TKO loads from a CDN (`esm.run` or `jsdelivr`). Your app is just HTML + the browser's ES module loader. No server-side rendering, no Node.js, no build artifacts. The entire deploy is one file.

As your app grows you can add a bundler, but you don't *have* to. Many production TKO apps are a handful of HTML files and a CSS stylesheet.
