---
title: Honeycomb
description: Count virtual DOM comparisons against observable updates on a dense interactive board.
sidebar:
  order: 1
---

# Honeycomb

This example contrasts two mental models:

- `Virtual DOM comparisons`: reconsider the visible board to discover what changed.
- `Observable updates`: notify only the local cells affected by the interaction.

Hover shows a single local update. Click shows a burst of local updates.

<div style="margin: 1.5rem 0; border: 1px solid var(--sl-color-hairline); border-radius: 1rem; overflow: hidden;">
  <iframe
    src="/examples/honeycomb.html"
    title="Honeycomb example"
    style="display:block; width: 100%; height: min(78vh, 900px); border: 0; background: #0b1420;"
    loading="lazy"
  ></iframe>
</div>

[Open the example directly](/examples/honeycomb.html)
