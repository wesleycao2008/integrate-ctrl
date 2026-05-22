# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — Install dependencies.
- `npm run dev` — Start the esbuild dev server with watch and live reload.
- `npm run build` — Production build. Outputs static files to `dist/`.

There are no test or lint commands configured in this project.

## Architecture

This is a **React 18 SPA** built with a **custom esbuild setup** (see `scripts/build.mjs`). It bundles `src/main.tsx` and copies `index.html` to `dist/`. CSS is processed via PostCSS with Tailwind and Autoprefixer using `esbuild-style-plugin`.

**Routing:** Uses `react-router` with `HashRouter`. Only one route (`/`) is defined in `src/App.tsx`.

**UI Stack:** Built on **shadcn/ui** primitives installed in `src/components/ui/`. Styling is Tailwind CSS with a dark-themed shadcn variable system in `src/shadcn.css`. The app renders with a dark slate theme (`bg-slate-950`, `text-slate-50`).

**State:** Local React state only (`useState`, `useMemo`). No global state store is actively used despite Zustand being a dependency.

**Data:** All data is mock/demo data. There are no API calls or backend integrations. Panels generate random data via local `createMock*()` functions.

**Language:** The entire UI is in **Chinese**. This is a monitoring dashboard for distributed photovoltaic (solar) power control command disaggregation (分布式光伏控制指令解聚合).

**Feature Structure:** The app follows a feature-based folder structure. The single feature module is at `src/features/distributed-pv/`:
- `DistributedPvDashboard.tsx` — Tab container with 6 tabs.
- `components/` — Six panel components, one per tab:
  1. `AggregationTrackingPanel` — Power tracking charts
  2. `MultiObjectiveWeightsPanel` — FAHP weight configuration
  3. `InverterCommandsPanel` — Inverter command tables/charts
  4. `LSTMCorrectionPanel` — LSTM model error monitoring
  5. `CommandDispatchStatusPanel` — Command dispatch timeline
  6. `ResponseCapabilityPanel` — Response capability assessment (with sub-tabs)

**Path Alias:** `@/*` maps to `./src/*` in both `tsconfig.json` and the esbuild config.

**Deployment:** The `dist/` folder contains static files suitable for any static host (Vercel, Cloudflare Pages, Netlify, GitHub Pages, or a traditional server). Do not deploy the root `index.html` directly — always use the files in `dist/`.
