---
title: History
description: How Knockout became TKO — from Microsoft's Big Four framework to a modern observable UI library.
---

TKO is the modern successor to Knockout.js, the observable data-binding library created by Steve Sanderson in 2010.

## Origins (2010)

Steve Sanderson created Knockout independently, and the project's success led to him joining Microsoft's ASP.NET team. The core idea — observable values that automatically update the DOM when they change — was borrowed from the MVVM pattern that .NET developers already knew from WPF and Silverlight.

The first release shipped in July 2010. By late that year, Scott Hanselman was interviewing Sanderson about it on Hanselminutes, and Microsoft began featuring it in official ASP.NET documentation.

## The Big Four era (2011-2014)

From 2011 to 2014, Knockout was one of the four dominant JavaScript frameworks alongside Backbone.js, AngularJS, and Ember.js. Every framework comparison article and conference talk of that era included all four.

[ThoughtWorks placed Knockout in their Technology Radar's "Trial" ring](https://www.thoughtworks.com/radar/languages-and-frameworks/angularjs-and-knockout) in October 2012, calling it one of the "front-runners" for building single-page applications.

Knockout [peaked in Stack Overflow question volume](https://stackoverflow.blog/2018/01/11/brutal-lifecycle-javascript-frameworks/) around 2013-2014, and had the highest answer rate (69.6%) of the Big Four — a sign of a mature, well-understood library.

## Microsoft adoption

Microsoft adopted Knockout extensively:

- **Azure Portal** — [described at VS Live 2016](https://learn.microsoft.com/en-us/shows/visual-studio-visual-studio-live-redmond-2016/t15) as "the largest single-page application in the world," with 500+ developers building on Knockout and TypeScript
- **ASP.NET SPA template** — Visual Studio 2013 shipped with Knockout as the default JavaScript framework for new SPA projects
- **Hot Towel** — John Papa's widely-adopted SPA template combined Knockout with Durandal, Breeze, and Bootstrap
- **Office Add-ins** — Knockout was a supported framework for building Excel, Outlook, and Word add-ins

The MVVM pattern felt natural to .NET developers, and the official template support made Knockout the de facto standard for .NET shops doing client-side work from roughly 2012 to 2015.

## Enterprise adoption

Beyond Microsoft, Knockout found deep roots in enterprise:

- **Magento 2 (Adobe Commerce)** — chose Knockout as its frontend binding framework. Every Magento 2 e-commerce site runs Knockout.
- **Oracle JET** — Oracle built their entire enterprise JavaScript UI toolkit on top of Knockout rather than creating their own data-binding layer.
- **Financial services and government** — banks, insurance companies, and government agencies adopted Knockout for compliance-critical applications that are still running today.

Notable adopters included Stack Overflow, Ancestry.com, BMW, TD Ameritrade, Royal Mail, Transport for London, and Bandcamp. Knockout accumulated over [36 million NuGet downloads](https://www.nuget.org/packages/knockoutjs/).

## The React shift (2015-2016)

React changed the framework landscape starting around 2015. Unlike AngularJS — which had Google's continued investment and a full rewrite as Angular 2 — Knockout never received that level of sustained corporate backing for evolution.

The library remained stable and reliable. Applications built on it continued to work. But new projects increasingly chose React, Vue, or Angular 2+, and Knockout gradually fell out of the top-tier framework conversation.

By 2019, the last Knockout 3.x release (v3.5.1) shipped. The library wasn't broken — it just wasn't evolving. Steve Sanderson himself noted that maintaining a framework like Knockout requires a team, and without that sustained investment, the project stalled.

## TKO (2016-present)

TKO started as a monorepo reorganization of Knockout's codebase, breaking the monolithic library into 27 modular packages. The goals:

- **Modernize the tooling** — TypeScript source, ES modules, Bun, Vitest, Biome
- **Keep backwards compatibility** — existing Knockout applications can migrate by swapping a script tag
- **Add modern features** — TSX support, `ko-*` attribute bindings, native providers, strict equality
- **Enable AI-assisted development** — comprehensive test coverage, machine-readable documentation, and tooling designed for autonomous maintenance. The "team" that Sanderson said a framework needs may no longer require humans for every role.

## Why TKO in 2026

The frameworks that replaced Knockout optimized for large teams — elaborate build pipelines, complex state management, steep learning curves justified by organizational coordination. That tradeoff made sense when shipping required dozens of developers.

AI changes the equation. When an AI agent can read, test, modify, and ship code autonomously, the bottleneck shifts from team coordination to iteration speed. The winning framework is the one with the lowest friction: fastest path from idea to working UI, instantly testable, trivially verifiable, easy to modify.

TKO fits this model:

- **Zero build step** — a single HTML file is a complete application
- **Instant feedback** — change an observable, the DOM updates. No reconciliation, no diffing
- **Small surface area** — 27 focused packages, each simple enough for an AI to fully understand
- **Fast verification** — 2700+ tests across three browser engines catch regressions instantly

This is the [dark factory](https://github.com/knockout/tko/blob/main/plans/dark-factory.md) thesis: tooling, tests, and documentation robust enough that AI agents can handle routine maintenance autonomously. The "team" that every framework needs doesn't have to be all-human anymore.

Over 70,000 websites still run Knockout today. TKO gives them — and a new generation of AI-assisted developers — a path forward.
