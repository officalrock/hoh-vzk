<!--
Sync Impact Report
==================
Version change: 0.0.0 → 1.0.0
Modified principles: N/A (initial ratification)
Added sections: Core Principles (I–V), Technology Stack, Development Workflow, Governance
Removed sections: none
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ reviewed (Constitution Check aligns)
  - .specify/templates/spec-template.md ✅ reviewed (user stories + requirements compatible)
  - .specify/templates/tasks-template.md ✅ reviewed (phase structure compatible)
Follow-up TODOs: none
-->

# VZK App Constitution

## Core Principles

### I. Offline-First, Zero-Install

The application MUST run entirely in the browser without a backend server
or build step for the end user. Opening `index.html` (or the GitHub Pages
URL) MUST be the only action required. All data MUST be bundled as static
JS/JSON files. No runtime dependency on external APIs or databases is
permitted.

### II. Regulatory Accuracy

Every traffic sign entry, Regelplan, material rule, and distance table
MUST be traceable to the official VzKat or RSA 21. Placeholder data MUST
be clearly marked. When a regulation value is ambiguous, the
conservative (safer) interpretation MUST be used and the source paragraph
documented in a code comment.

### III. Separation of Data and Logic

Sign catalogs (`data-zeichen.js`), Regelplan definitions
(`data-regelplaene.js`), and distance/material rules MUST live in
dedicated data files, never inline in UI or logic code. This enables
non-developers to maintain regulatory content without touching
application logic.

### IV. Progressive Enhancement

New features (3D viewer, PDF export, advanced filtering) MUST be additive
and MUST NOT break the core catalog/Regelplan/material-list workflow.
Each feature MUST degrade gracefully if a browser lacks support (e.g.,
WebGL unavailable). The base HTML/CSS/JS app MUST remain functional
without the React/Three.js layer.

### V. Simplicity Over Abstraction

Prefer plain, readable code over frameworks and indirection. A new
dependency MUST justify itself by solving a problem that cannot be
addressed in fewer than ~50 lines of project code. YAGNI applies:
do not build for hypothetical future requirements.

## Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Core app | Vanilla HTML + CSS + JS | Zero-install, offline-first |
| 3D viewer | React 18 + Vite + Three.js (@react-three/fiber) | Interactive Regelplan visualization |
| Deployment | GitHub Pages (static) | No server cost, simple CI |
| PDF export | Client-side (jsPDF / print CSS) | Offline-first constraint |
| Data format | JS modules / JSON | Importable without build step |

New dependencies MUST be approved in a PR description with rationale
and bundle-size impact.

## Development Workflow

1. **Branch per feature** — work on a descriptive branch; merge via PR.
2. **Manual browser test** — every UI change MUST be verified in at least
   Chrome and Firefox before merge.
3. **Data changes reviewed separately** — regulatory data updates MUST be
   in their own commits/PRs so reviewers can audit values against the
   official RSA 21 / VzKat.
4. **No generated files in PRs** — build artifacts (`dist/`) are produced
   by CI only.

## Governance

This constitution is the authoritative source for project-level
decisions. All PRs and reviews MUST verify compliance with these
principles. Amendments require:

1. A PR updating this file with a clear rationale.
2. Version bump following SemVer (MAJOR for principle removal/redefinition,
   MINOR for new principle/section, PATCH for clarifications).
3. Update of `LAST_AMENDED_DATE`.

Complexity beyond these principles MUST be justified in the PR
description with a concrete problem statement and rejected simpler
alternatives.

**Version**: 1.0.0 | **Ratified**: 2026-06-12 | **Last Amended**: 2026-06-12
