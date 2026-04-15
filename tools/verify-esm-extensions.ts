#!/usr/bin/env bun
/**
 * Verify all relative imports in ESM dist files have .js extensions.
 * Run after `bun run build` to catch regressions.
 */
import { Glob } from 'bun'

const BAD_IMPORT = /from\s+['"]\.\.?\/[^'"]+?(?<!\.js)['"]/g

let failures = 0

for (const pattern of ['packages/*/dist/**/*.{js,mjs}', 'builds/*/dist/**/*.{js,mjs}']) {
  const glob = new Glob(pattern)
  for await (const file of glob.scan('.')) {
    const content = await Bun.file(file).text()
    const matches = content.match(BAD_IMPORT)
    if (matches) {
      for (const m of matches) {
        console.error(`${file}: extensionless import ${m}`)
        failures++
      }
    }
  }
}

if (failures) {
  console.error(`\n${failures} extensionless ESM import(s) found. Run \`bun run build\` to fix.`)
  process.exit(1)
} else {
  console.log('All ESM dist imports have .js extensions.')
}
