const fs = require('fs')
const path = require('path')

const roots = ['builds', 'packages']
const versions = new Set()

for (const root of roots) {
  for (const name of fs.readdirSync(root)) {
    const packageJson = path.join(root, name, 'package.json')
    if (!fs.existsSync(packageJson)) continue

    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'))
    if (pkg.private) continue

    versions.add(pkg.version)
  }
}

if (versions.size !== 1) {
  console.error(`Expected one public package version, found: ${[...versions].sort().join(', ')}`)
  process.exit(1)
}

process.stdout.write([...versions][0])
