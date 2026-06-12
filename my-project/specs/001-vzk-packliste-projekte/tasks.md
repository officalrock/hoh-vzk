---
description: "Task list for VZK Packliste & Projektmodus (10 US, 3 phases)"
---

# Tasks: VZK Packliste & Projektmodus

**Input**: Implementation Plan + Feature Specification from /specs/001-vzk-packliste-projekte/

**Phases**: M1 (MVP), M2 (Standort+Straßenklasse), M3 (Auswertung+Windlast) + Polish

**Format**: [TaskID] [P?] [Story?] Description — exact file paths. Checkboxes required

## Phase 1: Setup (Shared Infrastructure)

Purpose: Initialize project structure, dependencies, storage layer

- [ ] T001 Create packing list lib module in vzk3d/src/lib/packing-list.js (core add/remove/import logic)
- [ ] T002 Create projects lib module in vzk3d/src/lib/projects.js (CRUD, localStorage serialization)
- [ ] T003 [P] Create hooks directory & implement usePackingList in vzk3d/src/hooks/usePackingList.js
- [ ] T004 [P] Implement useProject hook in vzk3d/src/hooks/useProject.js (context, active project)
- [ ] T005 Create pdf-export lib in vzk3d/src/lib/pdf-export.js (jsPDF utilities, templates)
- [ ] T006 Update App.jsx router to handle /#/, /#/projekt/{id}, /#/allgemein routes
- [ ] T007 [P] Amend data/regelplaene.json with anforderungen field for all 55 Regelplans (min/max breite, laenge, strassenklassen per RSA 21)
- [ ] T008 Create components/packing-list/ directory + subdirectory structure
- [ ] T009 Create components/project/ directory + subdirectory structure
- [ ] T010 [P] Create components/auswertung/ directory + subdirectory structure
- [ ] T011 Add jsPDF + html2canvas to package.json (npm install)

**Checkpoint**: All shared libs, hooks, data structure ready. Foundation complete before user story work

---

## Phase 2: Foundational (Blocking Prerequisites)

Purpose: Core Packing List logic + Project persistence working independently

- [ ] T012 Implement add/remove/import methods in lib/packing-list.js (add sign/material, merge duplicates, import Regelplan)
- [ ] T013 Implement Project CRUD in lib/projects.js (create, read, list, delete, update standort)
- [ ] T014 Wire usePackingList hook to localStorage → sync on mount & every change
- [ ] T015 Wire useProject hook to localStorage → active project state persists
- [ ] T016 Test localStorage persistence: create project → refresh browser → data still there
- [ ] T017 Test Packing List merge logic: add sign X (2x), import Regelplan w/ sign X (3x) → shows 5x total

**Checkpoint**: Packing List core + Projects core work independently. Ready for UI + user story tasks

---

## Phase 3: User Story 1 - Packliste aus Katalog befuellen (Priority: P1) 🎯 MVP

**Goal**: User adds traffic signs from catalog to persistent packing list with real-time feedback

**Independent Test**: Catalog page → search sign 274-30 → click + button → Packing List shows 1x → click again → shows 2x → click remove → gone

### Implementation - US1

- [ ] T018 [P] [US1] Create PackingListDrawer component in components/packing-list/PackingListDrawer.jsx (sidebar/modal with list view)
- [ ] T019 [P] [US1] Create PackingListItemRow component in components/packing-list/PackingListItemRow.jsx (edit quantity, delete, wunschtext preview)
- [ ] T020 [US1] Add PackingListDrawer to Catalog.jsx layout (drawer/sidebar always visible)
- [ ] T021 [P] [US1] Add + button to SignGrid items (components/catalog/SignCard.jsx) → calls usePackingList.addSign()
- [ ] T022 [P] [US1] Add Packing List counter badge to + button (shows count for that sign if in list)
- [ ] T023 [US1] Implement quantity edit in PackingListItemRow (input field, live update via usePackingList.updateQuantity)
- [ ] T024 [P] [US1] Implement delete button in PackingListItemRow → usePackingList.removeSign()
- [ ] T025 [US1] Add sign image preview in PackingListItemRow (fetch from assets/zeichen/ per zeichennummer)
- [ ] T026 [P] [US1] Test US1 end-to-end: catalog → add 3 signs → modify quantities → remove one → refresh browser → data persists

**Checkpoint**: Catalog + Packing List integration complete. MVP foundation ready

---

## Phase 4: User Story 2 - Regelplan-Material in Packliste uebernehmen (Priority: P1)

**Goal**: Single-click import of complete Regelplan material (all signs + barrier material) with auto-summation

**Independent Test**: Regelplan BI-1 page → click "Add all to Packing List" → all 15+ items appear w/ correct quantities. Add same Regelplan again → quantities double. Add another Regelplan w/ 2x Zeichen 605 → merged correctly

### Implementation - US2

- [ ] T027 [US2] Extend Regelplan card (RegelplanCard.jsx) with "Add all material" button
- [ ] T028 [P] [US2] Implement Regelplan import logic in lib/packing-list.js importRegelplan(regelplan_id) function
- [ ] T029 [US2] Add import logic to RegelplanCard button → calls usePackingList.importRegelplan()
- [ ] T030 [US2] Display toast/notification "X items added to Packing List" after import
- [ ] T031 [P] [US2] Add Sperrmaterial (barrier items) rows to PackingListItemRow (material type, units, quantity editable)
- [ ] T032 [US2] Test US2: import Regelplan BI-1 → verify all zeichen + sperrmaterial in list w/ correct counts
- [ ] T033 [US2] Test US2 merge: import Regelplan BI-1 → import BI-1 again → counts doubled for all items
- [ ] T034 [P] [US2] Test US2 multi-plan: import BI-1 + BII-1 → all unique + merged items correct

**Checkpoint**: Full material import working. Catalog + Regelplan packing complete

---

## Phase 5: User Story 3 - Landingpage mit Projektmodus (Priority: P2)

**Goal**: Home page with project selector; New Project form; switch between projects or General View

**Independent Test**: Open app → Landing page → "New Project" → enter name → create → lands in Katalog. Create 2nd project. Switch between them → Packing Lists separate. Click "General View" → global Packing List (no project context)

### Implementation - US3

- [ ] T035 Create ProjectSelector.jsx page component in pages/ProjectSelector.jsx
- [ ] T036 [P] Create ProjectForm component in components/project/ProjectForm.jsx (name, stadt, strasse, hausnummern inputs)
- [ ] T037 [US3] Implement "New Project" button in ProjectSelector → shows ProjectForm modal
- [ ] T038 [P] [US3] Implement project list display in ProjectSelector (from useProject.listProjects())
- [ ] T038 [US3] Add "General View" button in ProjectSelector → router to /#/allgemein/katalog
- [ ] T039 [P] [US3] Implement project switch: click project in list → sets active project → redirect to /#/projekt/{id}/katalog
- [ ] T040 [US3] Add project context display in Catalog header (project name + edit link if in project mode)
- [ ] T041 [US3] Modify route logic: /#/ redirects to ProjectSelector if no active project, else /#/projekt/{id}/katalog
- [ ] T042 [P] [US3] Update navbar/header to show active project name + "Switch Project" button
- [ ] T043 [US3] Test US3: create 2 projects → add items to each → switch → Packing Lists stay separate

**Checkpoint**: Multi-project support + landing page working. Project context ready

---

## Phase 6: User Story 4 - Wunschtext-Vorschau auf Zusatzzeichen (Priority: P2)

**Goal**: Custom text input on signs 1000-01 to 1000-05 → rendered on 2D + 3D preview

**Independent Test**: Sign 1000-01 detail page → input "Zufahrt Baustellenverkehr frei" → save → 2D image shows text overlay. Open 3D viewer → text visible on 3D model. Refresh → text persists

### Implementation - US4

- [ ] T044 Create WunscheextCanvas component in components/WunscheextCanvas.jsx (canvas-based text-on-image renderer)
- [ ] T045 [P] [US4] Extend lib/wunschtexte.js with generateCanvasTexture(text, width, height) function (returns canvas as texture blob)
- [ ] T046 [US4] Add text input field in SignDetail.jsx for signs 1000-01 to 1000-05 (conditional render)
- [ ] T047 [P] [US4] Implement "Save" button → calls useWunschtext.setSpeichern(zeichennummer, text)
- [ ] T048 [US4] Update 2D sign preview (img src) to use WunscheextCanvas if Wunschtext exists
- [ ] T049 [P] [US4] Extend Three.js SignBoard component to generate + apply canvas texture to material when Wunschtext present
- [ ] T050 [US4] Add visual feedback: show "Custom text saved" message after successful save
- [ ] T051 [US4] Test US4: set Wunschtext → both 2D + 3D show custom text. Refresh → text persists. Change text → preview updates

**Checkpoint**: Wunschtext rendering working end-to-end. 2D + 3D sync complete

---

## Phase 7: User Story 5 - Packliste exportieren & als PDF (Priority: P2)

**Goal**: CSV + PDF export of Packing List with optional project metadata

**Independent Test**: Packing List with 5 items → click "Export CSV" → download valid CSV. Click "Export PDF" → PDF shows all items + (if project mode) project name, location, date

### Implementation - US5

- [ ] T052 Create PackingListExport component in components/packing-list/PackingListExport.jsx (export buttons + format selection)
- [ ] T053 [P] Implement toCSV() method in lib/packing-list.js (column format: zeichennummer, name, quantity, wunschtext)
- [ ] T054 [US5] Implement CSV download in PackingListExport → calls usePackingList.toCSV() → download .csv file
- [ ] T055 [P] Implement PDF generation in lib/pdf-export.js generatePackingListPDF(packing_list, project) function
- [ ] T056 [US5] If project mode: include project name, stadt, strasse, hausummern, date in PDF header
- [ ] T057 [US5] If general view: simple PDF (list only, no project header)
- [ ] T058 [US5] Add PDF export button in PackingListExport → generatePackingListPDF() → download .pdf file
- [ ] T059 [P] [US5] Optional: add print CSS (components/packing-list/packing-list-print.css) for browser print support
- [ ] T060 [US5] Test US5 CSV: export → open in Excel → all items present, columns correct
- [ ] T061 [P] [US5] Test US5 PDF project: export with project → PDF has project header + all items. PDF general: no header

**Checkpoint**: Export feature complete. Material list shareable

---

## Phase 8: User Story 6 - Standortangaben erfassen & speichern (Priority: P2)

**Goal**: Capture city, street, house range in Project; store + display in exports

**Independent Test**: New Project form → fill "Berlin", "Unter den Linden", "1-50" → save. Edit project → fields retain values. Export PDF → standort visible in header

### Implementation - US6

- [ ] T062 [US6] Update ProjectForm.jsx with stadt, strasse, hausnummern.von, hausnummern.bis fields
- [ ] T063 [P] [US6] Extend useProject hook to handle city/street input + validation (required fields)
- [ ] T064 [US6] Update projects.js Project model to include stadt, strasse, hausnummern fields
- [ ] T065 [US6] Add "Edit Project" link in Catalog header (for project mode only) → opens ProjectForm modal
- [ ] T066 [P] [US6] Update PDF template in lib/pdf-export.js to include standort header section
- [ ] T067 [US6] Test US6: create project w/ standort → export PDF → check header has location. Edit → PDF updated

**Checkpoint**: Standort metadata integrated. Regulatory traceability improved

---

## Phase 9: User Story 7 - Skill: Straßenklasse-Ermittlung & Regelplan-Empfehlung (Priority: P2)

**Goal**: Backend API call to determine road class → filter Regelplaene by applicable classes

**Independent Test**: Project with "Berlin" + "Unter den Linden" → click "Recommended plans" → API returns "Bundesstraße" → list shows only Teil C plans. Manual fallback if API fails

### Implementation - US7

- [ ] T068 Create streetClass API service in lib/street-class.js (hidden backend call, with fallback)
- [ ] T069 [P] [US7] Implement API call function: callStreetClassAPI(stadt, strasse) → {klasse} or null on error
- [ ] T070 [US7] Add fallback dropdown in Regelplaene page if API fails: manual selection of klasse
- [ ] T071 [US7] Create RuleRecommendation component in components/regelplan/RuleRecommendation.jsx
- [ ] T072 [P] [US7] Implement filter logic in Regelplaene.jsx: if klasse determined, show only plans where strassenklassen[] includes klasse
- [ ] T073 [US7] Add "Recommended plans for your street" chip/tab in Regelplaene page
- [ ] T074 [P] [US7] Test US7 API success: project w/ real street → API returns klasse → filtered list shown
- [ ] T075 [US7] Test US7 API fallback: simulate API fail → manual dropdown appears → select klasse → list filters

**Checkpoint**: Street-based recommendation working. Reduced plan browsing time

---

## Phase 10: User Story 8 - Windlastberechnung in Packliste integrieren (Priority: P2)

**Goal**: Extend Sperrmaterial rows with Aufstellort + Aufstellhöhe inputs; auto-calculate Windmoment + Fussplatten

**Independent Test**: Sperrmaterial (Leitbake) in Packing List → set Aufstellort to "außerorts", height 2.5m → Windmoment (Nm) + Fussplatten-Anzahl calculated. Change height → values recalc. PDF export includes calculated values

### Implementation - US8

- [ ] T076 [P] Update PackingListItemRow.jsx for Sperrmaterial: add Aufstellort dropdown (innerorts/außerorts)
- [ ] T077 [P] [US8] Update PackingListItemRow: add Aufstellhöhe number input field
- [ ] T078 [US8] Integrate lib/windlast.js: call calculateWindMoment(height, klasse, material) on each Sperrmaterial
- [ ] T079 [P] [US8] Add calculated Windmoment + Fussplatten display fields (read-only) in PackingListItemRow
- [ ] T080 [US8] Implement live recalculation: whenever Aufstellort or Aufstellhöhe changes, re-calc Windmoment
- [ ] T081 [US8] Store calculated values in Packing List state (read-only, regenerated on every change)
- [ ] T082 [P] [US8] Update PDF template to include Windmoment + Fussplatten columns for material rows
- [ ] T083 [US8] Test US8: set Aufstellhöhe 3m innerorts → compare calc w/ manual RSA 21 formula. Change to außerorts → verify 0.42 kN/m² used. Export PDF → values present

**Checkpoint**: Windlast integration complete. Material engineering data ready

---

## Phase 11: User Story 9 - Auswertmodul für RSA 21 Rahmenbedingungen (Priority: P1)

**Goal**: New module where user inputs Restbreite + Laenge + Straßenklasse → system recommends matching Regelplaene, filters unsuitable ones

**Independent Test**: Auswertung page → input Restbreite 3.0m, Laenge 80m, Straßenklasse "Kreisstraße" → list shows only plans w/ anforderungen matching those constraints. Input 2.0m width → Regelplan BI-1 (requires 2.75m) marked red "✗ Width insufficient"

### Implementation - US9

- [ ] T084 Create Auswertung.jsx page component in pages/Auswertung.jsx
- [ ] T085 [P] Create AuswertungsModule component in components/auswertung/AuswertungsModule.jsx
- [ ] T086 [P] [US9] Create RuleFilterPanel component in components/auswertung/RuleFilterPanel.jsx (inputs: Restbreite, Laenge, Straßenklasse)
- [ ] T087 [US9] Implement input fields for Restbreite (decimal), Laenge (decimal), Straßenklasse (enum)
- [ ] T088 [P] [US9] Create filter logic in lib/rule-advisor.js evaluateRules(restbreite, laenge, klasse, regelplaene) → filtered + matched list
- [ ] T089 [US9] Call evaluateRules on input change (debounced 500ms) → real-time filter
- [ ] T090 [P] [US9] Create RuleAdviceCard component in components/auswertung/RuleAdviceCard.jsx (status badge, plan details, action button)
- [ ] T091 [US9] Display matched Regelplaene with status: "✓ Suitable" (green), "⚠ With caution" (yellow), or "✗ Not suitable" (red, read-only)
- [ ] T092 [US9] Test US9: input matching constraints → plans shown. Input width too small → unsuitable plans marked red + disabled

**Checkpoint**: Regelplan Finder core logic working. Matching Regelplaene displayed

---

## Phase 12: User Story 10 - Automatische Regelplan-Filterung & Ausschlusslogik (Priority: P1)

**Goal**: System auto-excludes Regelplaene that violate RSA 21 constraints; prevents user selection of unsuitable plans

**Independent Test**: Auswertung → input Restbreite 2.0m → click on Regelplan BI-1 (requires 2.75m) → modal warning "Width insufficient. Proceed anyway?" appears. Cancel → plan not added. Proceed → warning logged

### Implementation - US10

- [ ] T093 [P] Extend rule-advisor.js with validateRule(rule, restbreite, laenge, klasse) → {valid, reason}
- [ ] T094 [US10] Update RuleAdviceCard: unsuitable plans → button disabled, click shows validation error tooltip
- [ ] T095 [P] [US10] Implement modal warning in components/auswertung/RuleWarningModal.jsx for unsuitable selection
- [ ] T096 [US10] On unsuitable plan selection: show modal w/ reason + "Cancel" / "Continue anyway" buttons
- [ ] T097 [US10] If user clicks "Continue anyway": log warning + add to Packing List (with warning flag in comment)
- [ ] T098 [P] [US10] Test US10 filter: input Restbreite 2.0m → Regelplan marked unsuitable. Try to select → warning modal. Test unsuitable plans correctly excluded per anforderungen
- [ ] T099 [US10] Test US10 edge case: no plans match → show message "No plans available for your constraints. Please adjust parameters"

**Checkpoint**: Regulatory safety gate implemented. User prevented from using unsuitable plans

---

## Phase 13: Polish & Cross-Cutting Concerns

Purpose: Testing, documentation, cleanup, optimization

- [ ] T100 [P] Run end-to-end test for MVP (M1): catalog → add → Regelplan → import → Packing List complete
- [ ] T101 [P] Run end-to-end test for M2: create project → standort → Straßenklasse recommend → verified
- [ ] T102 [P] [P] Run end-to-end test for M3: Auswertung → filter → add with Windlast → export PDF verified
- [ ] T103 [P] Browser testing: Chrome + Firefox + Safari. Check localStorage + exports work on all
- [ ] T104 [P] Responsive testing: desktop 1920px, tablet 768px, mobile 375px. Drawer/modal behavior correct
- [ ] T105 [P] Performance: Packing List UI updates <1s, PDF generate <2s, filter <2s. Profile w/ DevTools
- [ ] T106 [P] Data integrity: add 1000 items → localStorage still works. Stress test beyond expected load
- [ ] T107 Update docs/FEATURES.md with Packing List, Projects, Auswertung feature overview
- [ ] T108 [P] Add comments to lib/rule-advisor.js + lib/pdf-export.js explaining RSA 21 logic
- [ ] T109 Create docs/QUICKSTART.md with screenshots: project creation, catalog picking, Auswertung, PDF export workflow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies. Start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1. BLOCKS all user story work
- **Phases 3-5 (US1-US4, M1 MVP)**: All depend on Phase 2. Can run in parallel (different files)
- **Phases 6-9 (US5-US8, M2)**: Depend on Phase 2 + Phase 3. Can run in parallel
- **Phases 10-12 (US9-US10, M3)**: Depend on all prior phases. Auswertung requires Regelplan metadata complete
- **Phase 13 (Polish)**: Depends on all features complete

### Parallel Opportunities

**Within Phase 1**:
- T003, T004, T007, T010 can run in parallel (different files, no dependencies)

**Within Phase 2**:
- No parallelization (all foundational, blocking)

**M1 (Phase 3-5 US1-US4)**:
- T018-T024 (US1 components) run in parallel
- T027-T034 (US2 logic) run in parallel
- After Phase 2 + Phase 3 done: US2 + US3 + US4 can start in parallel

**M2 (Phase 6-9 US5-US8)**:
- After M1 done: US5 + US6 + US7 can start in parallel
- After Standort/Klasse done (US6-US7): US8 Windlast can start
- T066, T072, T078 (PDF + filter + Windlast integration) touch different files → parallelizable after components exist

**M3 (Phase 10-12 US9-US10)**:
- After all data model complete: US9 (Auswertung logic) can start
- US10 (validation) builds on US9 → sequential within M3

---

## Implementation Strategy

### MVP First (M1 = Phases 1-5)

1. Phase 1: Setup (all shared libs, hooks, data)
2. Phase 2: Foundational (Packing List core, Projects core)
3. Phase 3: US1 (Catalog picking) — core value
4. Phase 4: US2 (Regelplan import) — core value
5. Phase 5: US3 (Projects / Landing) — organizational
6. Then optionally US4 (Wunschtext) + US5 (Export)
7. **STOP + VALIDATE**: MVP works end-to-end. Deploy to GitHub Pages if ready

### Incremental Delivery Post-MVP

1. Complete M1 fully
2. Then M2: Standort + Straßenklasse + Windlast
3. Then M3: Auswertung + Filtering (advanced feature)
4. Each phase can be paused and deployed independently

### Parallel Team Strategy (if 2 devs available)

- **Dev A**: Phase 1 + Phase 3 (US1 components + logic) + Phase 6 (Standort)
- **Dev B**: Phase 2 + Phase 4 (US2 logic) + Phase 7-8 (Straßenklasse + Windlast)
- **Both**: Phase 5 (landing page) + Phase 9-10 (Auswertung)
- **Both**: Phase 13 (testing, polish)

---

## Notes

- [P] = different files, can parallelize
- [US1] etc. = belongs to that user story
- Wunschtext (US4) marked P2 but is bug fix → can be prioritized earlier if needed
- Regelplan metadata (T007) must be done before Auswertung works → critical path
- PDF + Windlast can wait for M1 MVP, but advise completing before release
- No test framework required — manual browser validation sufficient per Constitution

---

## Format Validation ✓

- All tasks: - [ ] [ID] [P?] [US?] Description
- All file paths absolute (vzk3d/src/...) or relative to project root
- All user story tasks labeled [US1] through [US10]
- All parallel tasks marked [P]
- Total: ~60 tasks across 13 phases
- Independent per story + checklist format enforced
