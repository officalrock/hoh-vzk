# Feature Specification: VZK Packliste & Projektmodus

**Feature Branch**: `001-vzk-packliste-projekte`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Verkehrszeichenkatalog durchsuchbar mit Packliste, Regelplan-Material in Packliste, Landingpage mit Projektmodus vs. allgemeine Ansicht, Wunschtext-Vorschau auf Zusatzzeichen reparieren"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Packliste aus Katalog befuellen (Priority: P1)

Ein Anwender durchsucht den Verkehrszeichenkatalog (988 Zeichen), findet ein benoetigtes Zeichen ueber Suche oder Kategorie-Filter und fuegt es mit gewuenschter Stueckzahl zur Packliste hinzu. Die Packliste ist jederzeit einsehbar, Positionen koennen geaendert oder entfernt werden.

**Why this priority**: Die Packliste ist das zentrale neue Feature; ohne sie fehlt der Mehrwert gegenueber einem reinen Nachschlagewerk. Nutzer koennen sofort mit dem Katalog arbeiten, ohne Regelplaene zu benoetigen.

**Independent Test**: Katalog oeffnen, Zeichen 274-30 suchen, 3 Stueck zur Packliste hinzufuegen, Packliste oeffnen, Menge auf 5 aendern, Position entfernen — alles ohne Regelplan-Bezug testbar.

**Acceptance Scenarios**:

1. **Given** der Katalog ist geoeffnet, **When** der Nutzer auf das "+"-Symbol eines Zeichens klickt, **Then** wird das Zeichen mit Stueckzahl 1 zur Packliste hinzugefuegt und ein visuelles Feedback (Badge/Counter) zeigt die aktuelle Anzahl.
2. **Given** ein Zeichen ist bereits in der Packliste, **When** der Nutzer dasselbe Zeichen erneut hinzufuegt, **Then** erhoecht sich die Stueckzahl um 1 (kein Duplikat-Eintrag).
3. **Given** die Packliste enthaelt mehrere Positionen, **When** der Nutzer die Packliste oeffnet, **Then** sieht er alle Positionen mit Bezeichnung, Zeichennummer, Bild-Vorschau und Stueckzahl.
4. **Given** eine Position in der Packliste, **When** der Nutzer die Stueckzahl auf 0 setzt oder "Entfernen" klickt, **Then** wird die Position aus der Packliste geloescht.

---

### User Story 2 - Regelplan-Material in Packliste uebernehmen (Priority: P1)

Ein Anwender oeffnet einen Regelplan (z. B. B I/1) und uebernimmt dessen gesamtes Material — Verkehrszeichen und Sperrmaterial — in die Packliste. Zeichen, die im Regelplan mehrfach vorkommen (z. B. 2x Zeichen 123), werden mit der korrekten Stueckzahl addiert. Bereits vorhandene Packlisten-Positionen werden aufaddiert, nicht dupliziert.

**Why this priority**: Gleichwertig mit US1 — Regelplaene sind der primaere Arbeitskontext der Zielgruppe. Die Kombination aus manuellem Katalog-Picken und Regelplan-Uebernahme ist der Kern-Workflow.

**Independent Test**: Regelplan BI-1 oeffnen, "Material in Packliste uebernehmen" klicken, pruefen dass alle Zeichen und Sperrmaterialien mit korrekten Mengen in der Packliste erscheinen. Zweiten Regelplan hinzufuegen und pruefen, dass Mengen korrekt aufsummiert werden.

**Acceptance Scenarios**:

1. **Given** ein Regelplan mit material.zeichen [{nummer: "123", anzahl: 1}, {nummer: "274", anzahl: 2}], **When** der Nutzer "Alles in Packliste" klickt, **Then** erscheinen Zeichen 123 (1x) und 274 (2x) in der Packliste.
2. **Given** die Packliste enthaelt bereits 3x Zeichen 274, **When** der Nutzer einen Regelplan mit 2x Zeichen 274 uebernimmt, **Then** zeigt die Packliste 5x Zeichen 274.
3. **Given** ein Regelplan mit Sperrmaterial (Leitbaken, Warnleuchten), **When** der Nutzer das Material uebernimmt, **Then** erscheinen auch Sperrmaterial-Positionen in der Packliste mit Name, Einheit und Stueckzahl.
4. **Given** ein Regelplan mit mehrfach vorkommendem identischem Zeichen (z. B. 2 Eintraege fuer Zeichen 605), **When** das Material uebernommen wird, **Then** werden die Stueckzahlen beider Eintraege korrekt addiert.

---

### User Story 3 - Landingpage mit Projektmodus (Priority: P2)

Beim Oeffnen der App sieht der Nutzer eine Landingpage, auf der er waehlen kann zwischen: (a) ein bestehendes Projekt oeffnen oder ein neues Projekt anlegen, oder (b) die allgemeine Ansicht nutzen (Katalog/Regelplaene ohne Projektkontext). Ein Projekt buendelt eine eigene Packliste mit einem Namen und optionalen Metadaten (Baustellenbezeichnung, Datum). Mehrere Projekte koennen nebeneinander existieren.

**Why this priority**: Gibt der App Struktur fuer den realen Einsatz — ein Anwender arbeitet an mehreren Baustellen gleichzeitig und braucht getrennte Packlisten.

**Independent Test**: App oeffnen, "Neues Projekt" waehlen, Namen eingeben, Projekt wird angelegt. Zurueck zur Landingpage, zweites Projekt anlegen. Zwischen Projekten wechseln und pruefen, dass jedes seine eigene Packliste hat.

**Acceptance Scenarios**:

1. **Given** die App wird geoeffnet, **When** die Landingpage geladen ist, **Then** sieht der Nutzer die Optionen "Neues Projekt", eine Liste vorhandener Projekte und "Allgemeine Ansicht".
2. **Given** der Nutzer waehlt "Neues Projekt", **When** er einen Projektnamen eingibt und bestaetigt, **Then** wird ein leeres Projekt mit eigener Packliste angelegt und der Nutzer landet im Katalog/Dashboard.
3. **Given** zwei Projekte existieren, **When** der Nutzer zwischen ihnen wechselt, **Then** zeigt die Packliste jeweils nur die zum aktiven Projekt gehoerenden Positionen.
4. **Given** der Nutzer waehlt "Allgemeine Ansicht", **When** er den Katalog und Regelplaene nutzt, **Then** steht eine projektunabhaengige Packliste zur Verfuegung (ohne Projektkontext).

---

### User Story 4 - Wunschtext-Vorschau auf Zusatzzeichen (Priority: P2)

Wenn ein Nutzer auf einem Platzhalter-Zusatzzeichen (1000-01 bis 1000-05) einen Beschriftungstext eingibt, MUSS dieser Text in der 2D-Vorschau und im 3D-Modell des Zeichens sichtbar dargestellt werden. Aktuell wird nur der Platzhalter angezeigt.

**Why this priority**: Bestehender Bug, der das Nutzererlebnis deutlich beeintraechtigt — Anwender koennen nicht pruefen, ob ihr Wunschtext korrekt aussieht, bevor sie das Material bestellen.

**Independent Test**: Zeichen 1000-01 oeffnen, Wunschtext "Zufahrt Baustellenverkehr frei" eingeben, speichern. Die Vorschau (2D-Bild und 3D-Szene) MUSS den eingegebenen Text anzeigen, nicht den Platzhalter.

**Acceptance Scenarios**:

1. **Given** der Nutzer ist auf der Detailseite von Zeichen 1000-01, **When** er den Wunschtext "Zufahrt frei" eingibt und speichert, **Then** wird "Zufahrt frei" als Beschriftung auf der 2D-Vorschau des Zeichens dargestellt.
2. **Given** ein gespeicherter Wunschtext existiert, **When** der Nutzer die 3D-Ansicht des Zeichens oeffnet, **Then** zeigt das 3D-Modell den Wunschtext statt des Platzhalters.
3. **Given** ein Wunschtext wurde gespeichert, **When** der Nutzer den Text aendert und erneut speichert, **Then** aktualisiert sich die Vorschau sofort mit dem neuen Text.
4. **Given** ein Wunschtext-Zeichen in der Packliste, **When** der Nutzer die Packliste oeffnet, **Then** wird der Wunschtext neben der Zeichenbezeichnung angezeigt.

---

### User Story 5 - Packliste exportieren & als PDF speichern (Priority: P2)

Der Nutzer kann die gesamte Packliste (Verkehrszeichen + Sperrmaterial) als uebersichtliche Liste drucken, als CSV exportieren oder als PDF-Dokument speichern. Bei Projekten erscheint der Projektname, die Standortangaben (Stadt, Straße, Hausnummernbereich) und das Erstellungsdatum im PDF.

**Why this priority**: Notwendig fuer den realen Workflow — Packlisten muessen an Lieferanten/Bauleitung weitergegeben werden. PDF ist das Standardformat. Gleiches gilt fuer Regelplaene.

**Independent Test**: Packliste mit Projektangaben befuellen, "PDF Export" klicken, PDF herunterladen und pruefen, dass Projektname, Standort und alle Positionen enthalten sind.

**Acceptance Scenarios**:

1. **Given** eine Packliste mit Verkehrszeichen und Sperrmaterial, **When** der Nutzer "CSV Export" waehlt, **Then** wird eine CSV-Datei mit Spalten (Zeichennummer, Bezeichnung, Stueckzahl, ggf. Wunschtext) heruntergeladen.
2. **Given** eine Packliste im Projektkontext mit Stadt/Straße/Bereich, **When** der Nutzer "PDF Export" waehlt, **Then** wird ein PDF mit Kopf (Projektname, Standort, Datum) und allen Positionen erzeugt.
3. **Given** ein Regelplan geoeffnet, **When** der Nutzer "Regelplan als PDF exportieren" waehlt, **Then** wird das Regelplan-Blatt (Bild + Materialien) als PDF heruntergeladen.

---

### User Story 6 - Standortangaben erfassen & speichern (Priority: P2)

Der Nutzer kann beim Anlegen oder Bearbeiten eines Projekts zusätzlich zum Projektnamen folgende Daten eingeben: Bauvorhaben-Stadt, Straße, Hausnummernbereich (von-bis). Diese Daten werden mit dem Projekt gespeichert und in Packlisten/Regelplan-PDFs angezeigt. Sie dienen auch als Eingabe für die Straßenklasse-Ermittlung und Regelplan-Empfehlung.

**Why this priority**: Kern-Metadaten fuer jeden Baustelleneinsatz. Ohne diese kann das System keine sinnvollen Regelplan-Vorschlaege machen.

**Independent Test**: Neues Projekt anlegen, Felder "Stadt", "Straße", "Hausnummern von-bis" ausfuellen und speichern. Daten sind in der Projektansicht sichtbar und werden mit PDF-Export uebernommen.

**Acceptance Scenarios**:

1. **Given** der Nutzer legt ein neues Projekt an, **When** er Stadt, Straße und Hausnummernbereich eingibt und speichert, **Then** werden diese Angaben mit dem Projekt gespeichert.
2. **Given** ein Projekt mit Standortangaben, **When** der Nutzer die Packliste als PDF exportiert, **Then** erscheint der Standort in der PDF-Kopfzeile.
3. **Given** ein Projekt, **When** der Nutzer die Standortangaben nachtraeglich aendert, **Then** werden die neuen Werte sofort gespeichert und in zukuenftigen Exporten verwendet.

---

### User Story 7 - Skill: Straßenklasse-Ermittlung & Regelplan-Empfehlung (Priority: P2)

Auf Basis der eingegebenen Straße (Name + Stadt) verfuegt das System ueber einen Skill, der die Straßenklasse ermittelt (Gemeindestraße, Kreisstraße, Bundesstraße) und darauf aufbauend passende Regelplaene empfiehlt. Die Empfehlung wird dem Nutzer als eine nach Straßenklasse gefilterte Regelplan-Liste praesentiert, sodass er nicht manuell durch alle 55 Regelplaene blaettern muss.

**Why this priority**: Zeit-Ersparnisse fuer den Nutzer — mit Straßenklasse sind ~80% der Regelplan-Vorauswahl erledigt. Deutlicher Mehrwert gegenueber der aktuellen manuellen Suche.

**Independent Test**: Projekt mit Stadt "Berlin", Straße "Unter den Linden" erstellen. System ermittelt "Bundesstraße" und schlaegt Regelplaene aus Teil C (Landstraße) vor; der Nutzer sieht nur die 2-3 relevanten Plaene statt aller 55.

**Acceptance Scenarios**:

1. **Given** ein Projekt mit Stadt und Straße, **When** der Nutzer auf "Empfohlene Regelplaene basierend auf Straßenklasse" klickt, **Then** werden die Regelplaene nach ermittelter Straßenklasse gefiltert angezeigt (max. 5-10 Treffer).
2. **Given** eine Straße kann nicht eindeutig klassifiziert werden, **When** das System die Straße abfragt, **Then** zeigt es eine Warnung und bietet manuelle Auswahl (Gemeindestraße / Kreisstraße / Bundesstraße).
3. **Given** der Nutzer nutzt die Regelplan-Empfehlung, **When** er einen Plan in die Packliste uebernimmt, **Then** wird dieser zusammen mit den Projektdaten (Stadt, Straße) verbucht.

---

### User Story 8 - Windlastberechnung in Packliste integrieren (Priority: P2)

Die Windlastberechnung aus dem bestehenden MaterialBuilder wird in die Packliste integriert. Der Nutzer kann fuer Sperrmaterial (Leitbaken, Warnleuchten, Absperrtafeln) einen Aufstellort (innerorts / außerorts) und Aufstellhöhe angeben. Die Packliste berechnet dann automatisch Windlast (kN/m²), Windmoment (Nm) und erforderliche Fussplatten-Anzahl (K1-Klasse) pro Material-Position.

**Why this priority**: Der Windlast-Skill ist in der RSA 21 essentiell — ohne ihn ist die Packliste unvollstaendig. Der Code existiert bereits, muss nur integriert werden.

**Independent Test**: Packliste mit Leitbaken erstellen, Aufstellort "außerorts" waehlen, Aufstellhoehe 2.5m eingeben. System berechnet Windmoment und Fussplatten-Anzahl korrekt (pruefen gegen manuelle Berechnung mit RSA 21).

**Acceptance Scenarios**:

1. **Given** ein Sperrmaterial (z.B. Leitbake) in der Packliste, **When** der Nutzer den Aufstellort auf "außerorts" aendert, **Then** wird die Windlast automatisch neu berechnet (0.42 kN/m² statt 0.25).
2. **Given** ein Material mit errechneter Windlast, **When** der Nutzer die Aufstellhoehe aendert, **Then** wird das Windmoment (Nm) und damit die erforderliche Fussplatten-Anzahl neu berechnet.
3. **Given** eine Packliste mit Windlast-Berechnungen, **When** der Nutzer "PDF Export" waehlt, **Then** sind die Windmomente und Fussplatten-Anzahlen in der PDF enthalten.

---

### User Story 9 - Auswertmodul fuer RSA 21 Rahmenbedingungen (Priority: P1)

Ein neues Modul "Auswertung" oder "Regelplan-Finder" ermoeglicht es dem Nutzer, die Rahmenbedingungen seiner individuellen Baustelle anzugeben und erhält dann eine Empfehlung, welche Regelplaene aufgrund der RSA 21 in Frage kommen. Eingaben sind: Restfahrbahnbreite(n), geschaetzte Laenge des Baubereichs, Straßenklasse (automatisch ermittelt oder manuell gewaehlt), optional Verkehrsstärke/Belastungsklasse. Die App filtert dann Regelplaene, die diese Bedingungen erfuellen, und schloesst Regelplaene aus, die nicht passen.

**Why this priority**: Das ist der Kern-Mehrwert gegenueber einem reinen Katalog. Der Nutzer kann auf Basis der RSA-21-Logik handeln, nicht raten.

**Independent Test**: Auswertmodul oeffnen, Restfahrbahnbreite "3.2m" eingeben, Laenge "100m", Straßenklasse "Gemeindestraße". System schlaegt Regelplaene vor, deren Vorgaben diese Breite unterstuetzen, und schliesst z.B. solche aus, die Breite > 3.5m erfordern.

**Acceptance Scenarios**:

1. **Given** der Nutzer oeffnet das Auswertmodul, **When** er Restfahrbahnbreite 3.0m, Laenge 80m, Straßenklasse "Kreisstraße" eingibt, **Then** werden nur Regelplaene angezeigt, deren Breiten- und Laengen-Anforderungen erfüllt sind.
2. **Given** mehrere Regelplaene passen, **When** sie angezeigt werden, **Then** werden sie nach Straßenklasse und Breite sortiert und mit einer Hinweis-Badge gekennzeichnet (z.B. "✓ Paßt" vs. "✗ Breite zu schmal").
3. **Given** kein Regelplan passt exakt, **When** der Nutzer die Parameter aendert, **Then** aktualisiert sich die Liste in Echtzeit (< 1 Sekunde).
4. **Given** ein geeigneter Regelplan wurde gefunden, **When** der Nutzer "In mein Projekt uebernehmen" klickt, **Then** wird das Material des Regelplans in die Packliste des Projekts uebernommen.

---

### User Story 10 - Automatische Regelplan-Filterung & Ausschlusslogik (Priority: P1)

Das System implementiert eine Ausschlusslogik basierend auf RSA-21-Vorgaben: Regelplaene werden automatisch als "nicht geeignet" markiert oder ausgeblendet, wenn eine der folgenden Bedingungen verletzt ist:
- Restfahrbahnbreite außerhalb der im Regelplan definierten Grenzen
- Geschaetzte Baustellenlaenge außerhalb der Grenzen
- Straßenklasse passt nicht (z.B. Ein-Richtungs-Regelplan fuer Bundesstraße auf Gemeindestraße nicht geeignet)
- Erforderliche Mindest-Restbreite nicht erreichbar

Der Nutzer sieht eine Liste mit gruenen Haekchen (geeignet), gelben Warnungen (mit Vorbehalt geeignet) und roten Kreuzen (nicht geeignet).

**Why this priority**: Safeguard gegen Nutzer-Fehler — ein falscher Regelplan kann zu Verkehrsunfaellen fuehren. Die App muss explizit warnen.

**Independent Test**: Auswertmodul mit Restbreite 2.0m aufrufen. Regelplan B III/1 (benoetigt 2.75m) wird mit rotes Kreuz "Breite zu schmal" angezeigt und ist nicht wahlbar.

**Acceptance Scenarios**:

1. **Given** ein Regelplan verlangt Mindest-Restbreite 2.75m, **When** der Nutzer 2.0m eingibt, **Then** wird dieser Regelplan mit rotes Kreuz + Warnung "Breite nicht ausreichend" angezeigt und ist nicht anwahlbar.
2. **Given** ein Regelplan passt auf die Laenge, aber nicht auf die Breite, **When** der Nutzer auf die Warnung klickt, **Then** sieht er eine Erklaerung mit konkreten Werten ("Plan erfordert ≥ 2.75m, Sie haben 2.0m").
3. **Given** der Nutzer versucht einen ausgeschlossenen Regelplan zu waehlen, **When** er auf den Plan klickt, **Then** wird eine Modal-Warnung angezeigt: "Dieser Regelplan erfullt Ihre Rahmenbedingungen nicht. Fortfahren?"

---

### Edge Cases

- Was passiert, wenn der Nutzer ein Zeichen zur Packliste hinzufuegt, das in keinem Regelplan vorkommt? → Wird als Einzelposition gefuehrt.
- Was passiert, wenn der Nutzer denselben Regelplan zweimal in die Packliste uebernimmt? → Mengen werden erneut addiert (der Nutzer entscheidet bewusst).
- Was passiert, wenn ein Wunschtext sehr lang ist (>100 Zeichen)? → Text wird auf dem Zeichen umgebrochen oder bei Ueberlauf abgeschnitten mit visueller Warnung.
- Was passiert, wenn localStorage voll ist? → Warnung an den Nutzer, aelteste Projekte archivieren.
- Was passiert, wenn der Nutzer ein Projekt loescht? → Bestaetigung erforderlich, Packliste wird unwiderruflich entfernt.
- Was passiert, wenn eine Straße nicht eindeutig klassifiziert werden kann? → Nutzer wird aufgefordert, die Klasse manuell zu waehlen (Gemeindestraße / Kreisstraße / Bundesstraße).
- Was passiert, wenn kein Regelplan die eingegebenen Rahmenbedingungen erfuellt? → System zeigt eine leere Liste mit Empfehlung "Bitte erhoehen Sie die verfuegbare Restbreite oder verringern Sie die Laenge".
- Was passiert, wenn die eingegebene Aufstellhoehe unrealistisch ist (z.B. 6.0m)? → Warnung: "Ungewöhnliche Höhe, bitte pruefen".
- Was passiert beim Windlast-Export, wenn fuer ein Sperrmaterial kein Aufstellort definiert wurde? → Default auf "innerorts" oder Warnung "Aufstellort erforderlich".

## Requirements *(mandatory)*

### Functional Requirements

**Packliste & Material (US1-US2)**
- **FR-001**: Das System MUSS eine persistente Packliste bereitstellen, in der Verkehrszeichen mit Stueckzahl gespeichert werden.
- **FR-002**: Das System MUSS beim Hinzufuegen eines bereits vorhandenen Zeichens die Stueckzahl erhoehen, nicht duplizieren.
- **FR-003**: Das System MUSS Material aus Regelplaenen (Zeichen + Sperrmaterial) als Gesamtpaket in die Packliste uebernehmen koennen.
- **FR-004**: Das System MUSS mehrfach vorkommende Zeichen innerhalb eines Regelplans korrekt aufsummieren.

**Projekte & Landingpage (US3)**
- **FR-005**: Das System MUSS mehrere unabhaengige Projekte mit jeweils eigener Packliste unterstuetzen.
- **FR-006**: Das System MUSS auf der Landingpage die Wahl zwischen Projektmodus und allgemeiner Ansicht ermoeglichen.

**Wunschtext (US4)**
- **FR-007**: Das System MUSS eingegebene Wunschtexte auf Zusatzzeichen (1000-01 bis 1000-05) in der 2D-Vorschau und 3D-Ansicht darstellen.

**Export & Speicherung (US5)**
- **FR-008**: Das System MUSS die Packliste als CSV exportieren koennen.
- **FR-009**: Das System MUSS die Packliste und Regelplaene als PDF-Dokument exportieren koennen.
- **FR-010**: PDF-Exporte von Packlisten MUESSEN Projektname, Standortangaben (Stadt, Straße, Hausnummernbereich) und Erstellungsdatum enthalten.

**Standortangaben (US6)**
- **FR-011**: Das System MUSS beim Anlegen/Bearbeiten eines Projekts Eingabefelder fuer Stadt, Straße und Hausnummernbereich bereitstellen.
- **FR-012**: Standortangaben MUESSEN mit dem Projekt gespeichert und in allen PDF-Exporten angezeigt werden.

**Skill: Straßenklasse-Ermittlung (US7)**
- **FR-013**: Das System MUSS auf Basis von Stadt und Straße die Straßenklasse ermitteln (Gemeindestraße, Kreisstraße, Bundesstraße).
- **FR-014**: Das System MUSS basierend auf ermittelter Straßenklasse eine gefilterte Regelplan-Liste anzeigen (relevante Plaene priorisieren).

**Windlastberechnung (US8)**
- **FR-015**: Das System MUSS fuer jedes Sperrmaterial Aufstellort (innerorts/außerorts) und Aufstellhoehe abfragen und Windlast berechnen.
- **FR-016**: Das System MUSS Windmoment (Nm) und erforderliche Fussplatten-Anzahl (K1-Klasse) pro Sperrmaterial automatisch berechnen.
- **FR-017**: Windlast-Berechnungen MUESSEN im PDF-Export sichtbar sein.

**Auswertmodul & Regelplan-Finder (US9-US10)**
- **FR-018**: Das System MUSS ein Modul "Auswertung" / "Regelplan-Finder" bereitstellen, in dem der Nutzer Rahmenbedingungen (Restbreite, Laenge, Straßenklasse) eingibt.
- **FR-019**: Das System MUSS basierend auf RSA-21-Vorgaben automatisch ermitteln, welche Regelplaene die Bedingungen erfuellen und welche nicht.
- **FR-020**: Regelplaene MUESSEN mit Status-Badges gekennzeichnet werden ("✓ Geeignet", "⚠ Mit Vorbehalt", "✗ Nicht geeignet").
- **FR-021**: Das System MUSS Regelplaene mit unerfuellten Bedingungen (z.B. Breite zu schmal) ausblenden oder als nicht wahlbar kennzeichnen.
- **FR-022**: Das System MUSS bei Auswahl eines ungeeigneten Regelplans eine Modal-Warnung mit Erklaerung anzeigen.

**Persistenz (alle User Stories)**
- **FR-023**: Alle Daten (Projekte, Packlisten, Wunschtexte, Standortangaben) MUESSEN lokal im Browser (localStorage) persistiert werden — kein Server erforderlich.

### Key Entities

- **Projekt**: Name, Erstelldatum, Stadt, Straße, Hausnummernbereich (von-bis). Enthaelt genau eine Packliste. Wird lokal gespeichert.
- **Packliste**: Geordnete Sammlung von Packlisten-Positionen. Gehoert zu einem Projekt oder zur allgemeinen Ansicht.
- **Packlisten-Position (Zeichen)**: Zeichennummer, Bezeichnung, Stueckzahl, optionaler Wunschtext. Referenziert einen Eintrag aus zeichen.json.
- **Packlisten-Position (Sperrmaterial)**: Name, Einheit, Stueckzahl, Fussplatten-Faktor, Aufstellort, Aufstellhoehe. Windmoment und erforderliche Fussplatten-Anzahl werden berechnet.
- **Wunschtext**: Freitext-Beschriftung fuer Platzhalter-Zusatzzeichen (1000-01 bis 1000-05), gespeichert pro Zeichen in localStorage.
- **Straßenklasse**: Klassifizierung einer Straße (Gemeindestraße, Kreisstraße, Bundesstraße). Wird automatisch ermittelt oder manuell eingegeben.
- **Rahmenbedingungen (Auswertmodul)**: Restfahrbahnbreite(n), geschaetzte Laenge, Straßenklasse, ggf. Belastungsklasse. Dient der Filterung von Regelplaenen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Usability**
- **SC-001**: Nutzer koennen ein Zeichen in maximal 2 Klicks (Suche + Hinzufuegen) zur Packliste hinzufuegen.
- **SC-002**: Das Uebernehmen eines kompletten Regelplan-Materials in die Packliste erfordert maximal 1 Klick.
- **SC-003**: Wunschtexte auf Zusatzzeichen sind in der Vorschau innerhalb von 1 Sekunde nach dem Speichern sichtbar.
- **SC-004**: Der Wechsel zwischen Projekten dauert unter 1 Sekunde.
- **SC-005**: Das Auswertmodul zeigt gefilterte Regelplan-Vorschlaege innerhalb von 2 Sekunden nach Eingabe der Rahmenbedingungen.

**Data Integrity**
- **SC-006**: Alle Packlisten-Daten ueberleben einen Browser-Neustart ohne Datenverlust.
- **SC-007**: Die exportierte CSV und PDF enthaelt 100% der Packlisten-Positionen mit korrekten Mengenangaben und Windlast-Berechnungen.
- **SC-008**: Standortangaben werden korrekt in allen Projekt-Kontexten und Exporten praesentiert.

**Correctness (RSA 21 Compliance)**
- **SC-009**: Windlast-Berechnungen stimmen zu 100% mit manueller RSA-21-Berechnung ueberein.
- **SC-010**: Regelplan-Filterung schoesst korrekt alle ungeeigneten Plaene aus — kein falscher Regelplan wird als "geeignet" angezeigt.
- **SC-011**: Straßenklasse-Ermittlung ist fuer 90% der eingegebenen Straßen-Stadt-Kombinationen korrekt (oder fordert manuelle Eingabe an).

## Assumptions

**Architecture & Backend**
- Die App laeuft weiterhin rein clientseitig ohne Backend (Offline-First-Prinzip aus der Constitution).
- localStorage ist als Persistenzschicht ausreichend — es wird kein Cloud-Sync benoetigt.

**Data & Regulation**
- Die 988 bestehenden Zeicheneintraege und 55 Regelplaene bleiben die Datenbasis; neue Daten werden separat gepflegt.
- Die RSA-21-Vorgaben fuer Regelplaene (Breiten-, Laengen-Anforderungen) sind als strukturierte Daten in regelplaene.json hinterlegt (oder werden dort ergaenzt).
- Windlast-Berechnung folgt genau der K1-Klasse-Logik aus den bestehenden MaterialBuilder-Funktionen (lib/windlast.js).
- Die Straßenklasse-Ermittlung nutzt eine externe API oder eine lokale Referenzdatenbank (Scope der Implementierung), die Stadt+Straße→Klasse mappen kann.

**3D & UI**
- Die 3D-Ansicht nutzt weiterhin texturierte Planes — keine echten 3D-Schildmodelle erforderlich. Wunschtexte werden als dynamische Textur auf die Planes angewendet.
- Wunschtexte beschraenken sich auf die 5 Platzhalter-Zusatzzeichen (1000-01 bis 1000-05).

**Scope & Prioritization**
- Mobilgeraete-Unterstuetzung ist wuenschenswert, aber nicht primaer — der Haupteinsatz erfolgt auf Desktop-Browsern.
- Das Auswertmodul (US9-US10) priorisiert Sicherheit ueber Komfort: ein ungeeigneter Regelplan sollte nie stilschweigend zugelassen werden.
