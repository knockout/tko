import fs from 'node:fs';
import path from 'node:path';

const docsRoot = path.resolve(process.cwd(), 'src/content/docs');
const manualAliases = new Map([
  ['components/component-overview', '/components/'],
  ['component-overview', '/components/']
]);

function walkDocs(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDocs(fullPath, files);
    } else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeRoute(route) {
  if (route === 'index') return '/';
  const normalized = route.replace(/\/index$/, '').replace(/^\/+|\/+$/g, '').toLowerCase();
  return normalized ? `/${normalized}/` : '/';
}

function createDocMaps() {
  const sourceToUrl = new Map();
  const basenameToUrls = new Map();

  for (const fullPath of walkDocs(docsRoot)) {
    const relPath = path.relative(docsRoot, fullPath).replace(/\\/g, '/');
    const route = relPath.replace(/\.(md|mdx)$/i, '');
    const url = normalizeRoute(route);
    const aliases = new Set([route, route.toLowerCase()]);

    if (route.endsWith('/index')) {
      aliases.add(route.slice(0, -'/index'.length));
      aliases.add(route.slice(0, -'/index'.length).toLowerCase());
    }

    for (const alias of aliases) {
      sourceToUrl.set(alias, url);
    }

    const basename = path.posix.basename(route.replace(/\/index$/, ''));
    if (!basenameToUrls.has(basename)) basenameToUrls.set(basename, new Set());
    basenameToUrls.get(basename).add(url);
    const lowercaseBasename = basename.toLowerCase();
    if (!basenameToUrls.has(lowercaseBasename)) basenameToUrls.set(lowercaseBasename, new Set());
    basenameToUrls.get(lowercaseBasename).add(url);
  }

  return { sourceToUrl, basenameToUrls };
}

const { sourceToUrl, basenameToUrls } = createDocMaps();

for (const [alias, url] of manualAliases) {
  sourceToUrl.set(alias, url);
  sourceToUrl.set(alias.toLowerCase(), url);
  const basename = path.posix.basename(alias);
  if (!basenameToUrls.has(basename)) basenameToUrls.set(basename, new Set());
  basenameToUrls.get(basename).add(url);
  const lowercaseBasename = basename.toLowerCase();
  if (!basenameToUrls.has(lowercaseBasename)) basenameToUrls.set(lowercaseBasename, new Set());
  basenameToUrls.get(lowercaseBasename).add(url);
}

function visit(node, fn) {
  fn(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) visit(child, fn);
  }
}

function nodeText(node) {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (!Array.isArray(node.children)) return '';
  return node.children.map(nodeText).join('');
}

function splitLinkTarget(target) {
  const hashIndex = target.indexOf('#');
  if (hashIndex === -1) return { pathname: target, hash: '' };
  return {
    pathname: target.slice(0, hashIndex),
    hash: target.slice(hashIndex)
  };
}

function isExternalLink(target) {
  return /^(?:[a-z]+:)?\/\//i.test(target) || /^(?:mailto|javascript):/i.test(target);
}

function stripKnownExtension(target) {
  return target.replace(/\.(?:md|mdx|html?)$/i, '');
}

function resolveDocLink(target, filePath) {
  if (!target || target.startsWith('#') || isExternalLink(target)) return target;

  const { pathname, hash } = splitLinkTarget(target);
  if (!pathname) return target;

  let cleanPath = decodeURI(pathname).trim();
  if (!cleanPath) return target;

  if (cleanPath.startsWith('/docs/')) cleanPath = cleanPath.slice('/docs/'.length);
  if (cleanPath.startsWith('/')) {
    const absoluteCandidate = stripKnownExtension(cleanPath.slice(1));
    const absoluteMatch = sourceToUrl.get(absoluteCandidate) || sourceToUrl.get(absoluteCandidate.toLowerCase());
    return absoluteMatch ? `${absoluteMatch}${hash}` : target;
  }

  const relSource = path.relative(docsRoot, filePath).replace(/\\/g, '/');
  const currentDir = path.posix.dirname(relSource);
  const baseCandidate = stripKnownExtension(cleanPath);
  const directCandidate = path.posix.normalize(path.posix.join(currentDir, baseCandidate));
  const directMatch = sourceToUrl.get(directCandidate) || sourceToUrl.get(directCandidate.toLowerCase());
  if (directMatch) return `${directMatch}${hash}`;

  const basename = path.posix.basename(baseCandidate);
  const basenameMatches = basenameToUrls.get(basename) || basenameToUrls.get(basename.toLowerCase());
  if (basenameMatches?.size === 1) {
    return `${[...basenameMatches][0]}${hash}`;
  }

  return target;
}

function parseLegacyExample(value) {
  const sections = new Map();
  let currentKey = null;

  for (const line of value.split('\n')) {
    const sectionMatch = line.match(/^([a-zA-Z]+):\s+\|-\s*$/);
    if (sectionMatch) {
      currentKey = sectionMatch[1].toLowerCase();
      sections.set(currentKey, []);
      continue;
    }

    if (!currentKey) continue;
    sections.get(currentKey).push(line.replace(/^\t/, '').replace(/^  /, ''));
  }

  return sections;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderLegacyExample(value) {
  const sections = parseLegacyExample(value);
  const html = sections.get('html')?.join('\n').trim();
  const javascript = sections.get('javascript')?.join('\n').trim();

  if (!html && !javascript) return null;

  const blocks = [];
  if (html) {
    blocks.push(
      `<div class="legacy-example__panel"><div class="legacy-example__label">HTML</div><pre><code class="language-html">${escapeHtml(html)}</code></pre></div>`
    );
  }
  if (javascript) {
    blocks.push(
      `<div class="legacy-example__panel"><div class="legacy-example__label">JavaScript</div><pre><code class="language-js">${escapeHtml(javascript)}</code></pre></div>`
    );
  }

  return `<div class="legacy-example">${blocks.join('')}</div>`;
}

export default function legacyDocs() {
  return (tree, file) => {
    const filePath = file.history?.[0];
    if (!filePath) return;

    if (Array.isArray(tree.children)) {
      tree.children = tree.children.filter((node, index, nodes) => {
        const text = nodeText(node).trim();
        if (text === '{:toc}') return false;
        if (
          node.type === 'list' &&
          text === '[Table of contents injected here]' &&
          nodeText(nodes[index + 1]).trim() === '{:toc}'
        ) {
          return false;
        }
        return true;
      });
    }

    visit(tree, (node) => {
      if (node.type === 'link' && typeof node.url === 'string') {
        node.url = resolveDocLink(node.url, filePath);
      }

      if (node.type === 'code' && node.lang === 'example') {
        const html = renderLegacyExample(node.value);
        if (html) {
          node.type = 'html';
          node.value = html;
          delete node.lang;
          delete node.meta;
        }
      }
    });
  };
}
