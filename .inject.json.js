#!/usr/bin/env node

/**
 * Inject properties from one JSON file into another.
 */
const fs = require('fs')

const [src, ...dests] = process.argv.slice(2)

dests.forEach(dest =>
  fs.writeFileSync(dest,
    JSON.stringify(
      Object.assign(
        JSON.parse(fs.readFileSync(dest)),
        JSON.parse(fs.readFileSync(src))
      ), null, 2
    )
  )
)
