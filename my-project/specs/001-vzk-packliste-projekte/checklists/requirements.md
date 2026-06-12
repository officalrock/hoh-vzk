# Specification Quality Checklist: VZK Packliste & Projektmodus (erweitert)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-06-12
**Updated**: 2026-06-12 (erweitert um US6-US10: Standort, Straßenklasse, Windlast, Auswertmodul, Filterung)
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined (updated for US6-US10)
- [x] Edge cases are identified (updated: Straßenklasse-Fehlerfall, leere Regelplan-Liste, unrealistische Windhoehen)
- [x] Scope is clearly bounded (10 User Stories, M1-M3 Phasen)
- [x] Dependencies and assumptions identified (updated: RSA-21-Datenstruktur in regelplaene.json, Straßenklasse-Datenquelle, Windlast-Integration)

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria (23 FRs, von Packliste über Straßenklasse bis Regelplan-Filterung)
- [x] User scenarios cover primary flows (Katalog-Picking, Regelplan-Import, Projektmodus, Auswertmodul, Regelplan-Finder)
- [x] Feature meets measurable outcomes defined in Success Criteria (11 SCs: Usability, Data Integrity, Correctness/RSA21)
- [x] No implementation details leak into specification

## Scope & Phasing

This expansion contains 10 User Stories grouped into 3 phases:

**Phase M1 (MVP – Core Packliste)**: US1-US4
- Packliste aus Katalog + Regelplan
- Wunschtext-Fix
- Basis-Export (CSV)
- Effort: 2-3 Wochen (1-2 Entwickler)

**Phase M2 (Standort & Empfehlungen)**: US5-US7
- PDF-Export
- Standortangaben erfassen
- Straßenklasse-Skill + Regelplan-Empfehlung
- Effort: 1-2 Wochen

**Phase M3 (RSA21-Regelwerk & Auswertung)**: US8-US10
- Windlastberechnung integrieren
- Auswertmodul (Regelplan-Finder)
- Automatische Filterung & Ausschlusslogik
- Effort: 2-3 Wochen

**Gesamteffort**: 5-8 Wochen mit 1-2 Entwicklern, oder phasiert auf mehrere Sprints.

## Notes

- **Kritische Abhängigkeiten:**
  - US6-US7 erfordern strukturierte RSA-21-Metadaten in regelplaene.json (Breite/Laenge/Straßenklasse-Anforderungen pro Plan)
  - US8 nutzt bestehenden Code aus lib/windlast.js (Windlast-K1-Klasse-Berechnung)
  - US9-US10 erfordern externe Datenquelle oder Referenztabelle fuer Straßenklasse-Ermittlung

- **Design-Decisions:**
  - Wunschtext bleibt auf 5 Platzhalter-Zeichen (1000-01 bis 1000-05) begrenzt
  - Auswertmodul bevorzugt Sicherheit: ungeeignete Regelplaene werden ausgeschlossen oder explizit gewarnt
  - Alle Daten bleiben lokal (localStorage) — kein Cloud-Sync

- **Spec ist bereit für `/speckit.plan`** nach optionaler Phasen-Diskussion mit dem Nutzer.
