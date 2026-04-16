#!/usr/bin/env bash
# Install Bun in CI containers without apt-get.
# Reads version from .tool-versions, verifies SHA256 checksum.
# Usage: bash tools/install-bun.sh
set -euo pipefail

version=$(grep '^bun ' .tool-versions | awk '{print $2}')
asset="bun-linux-x64.zip"
base_url="https://github.com/oven-sh/bun/releases/download/bun-v${version}"

curl -fsSL -o /tmp/bun.zip "${base_url}/${asset}"
curl -fsSL -o /tmp/SHASUMS256.txt "${base_url}/SHASUMS256.txt"

expected=$(grep "$asset" /tmp/SHASUMS256.txt | awk '{print $1}')
actual=$(sha256sum /tmp/bun.zip | awk '{print $1}')

if [ "$expected" != "$actual" ]; then
  echo "Checksum mismatch for $asset" >&2
  echo "  expected: $expected" >&2
  echo "  actual:   $actual" >&2
  exit 1
fi

python3 -c "import zipfile; zipfile.ZipFile('/tmp/bun.zip').extractall('/tmp')"
mv /tmp/bun-linux-x64/bun /usr/local/bin/
chmod +x /usr/local/bin/bun
ln -sf /usr/local/bin/bun /usr/local/bin/bunx

echo "Installed bun v${version} (checksum verified)"
