---
title: odoom
description: A tiny WebGL corridor crawler with an observable HUD and controls.
sidebar:
  order: 2
---

# odoom

`odoom` is a deliberately small experiment: WebGL handles the corridor view, while TKO observables drive the HUD, controls, minimap, and gameplay counters.

It is not a full Doom clone. It is a compact example of using observables as the state layer around a fast rendering surface.

<div style="margin: 1.5rem 0; border: 1px solid var(--sl-color-hairline); border-radius: 1rem; overflow: hidden;">
  <iframe
    src="/examples/odoom.html"
    title="odoom example"
    style="display:block; width: 100%; height: min(82vh, 960px); border: 0; background: #05070d;"
    loading="lazy"
  ></iframe>
</div>

[Open the example directly](/examples/odoom.html)
