#!/usr/bin/env python3
"""Install Bun in CI containers without apt-get.
Reads version from .tool-versions, verifies SHA256, extracts with zipfile.
No external dependencies — uses only Python stdlib."""

import hashlib, io, os, stat, sys, urllib.request, zipfile

version = None
with open('.tool-versions') as f:
    for line in f:
        if line.startswith('bun '):
            version = line.split()[1]
            break

if not version:
    sys.exit('bun version not found in .tool-versions')

base = f'https://github.com/oven-sh/bun/releases/download/bun-v{version}'
asset = 'bun-linux-x64.zip'

print(f'Downloading bun v{version}...')
zip_data = urllib.request.urlopen(f'{base}/{asset}').read()
shasums = urllib.request.urlopen(f'{base}/SHASUMS256.txt').read().decode()

expected = next(l.split()[0] for l in shasums.splitlines() if asset in l)
actual = hashlib.sha256(zip_data).hexdigest()

if expected != actual:
    sys.exit(f'Checksum mismatch: expected {expected}, got {actual}')

with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
    bun = zf.read('bun-linux-x64/bun')

dest = '/usr/local/bin/bun'
with open(dest, 'wb') as f:
    f.write(bun)
os.chmod(dest, stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)
os.symlink(dest, '/usr/local/bin/bunx') if not os.path.exists('/usr/local/bin/bunx') else None

print(f'Installed bun v{version} (SHA256 verified)')
