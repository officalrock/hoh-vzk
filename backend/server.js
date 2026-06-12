/**
 * VZK Straßenklasse-API — Express-Backend.
 *
 * Endpoint:
 *   POST /api/street-class   { stadt, strasse } → { klasse, quelle, ref?, highway? }
 *   GET  /health             → { ok: true }
 *
 * Der Endpoint ist fuer den App-Nutzer transparent: das Frontend ruft ihn auf,
 * Datenquelle (OSM Overpass) bleibt serverseitig. Bei Fehler/Timeout liefert er
 * klasse:null → Frontend bietet manuelle Auswahl an (Offline-First-Fallback).
 */

import express from 'express';
import cors from 'cors';
import { ermittleStrassenklasse, STRASSENKLASSEN } from './street-class.js';

const app = express();
const PORT = process.env.PORT || 8787;

// CORS: nur erlaubte Origins (Frontend). Per Env konfigurierbar.
const ALLOWED = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(cors({ origin: ALLOWED }));
app.use(express.json({ limit: '4kb' }));

// Einfaches Rate-Limit (In-Memory, pro IP) gegen Overpass-Missbrauch.
const treffer = new Map();
const FENSTER_MS = 60_000;
const MAX_PRO_FENSTER = 30;
app.use((req, res, next) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const eintrag = treffer.get(ip) || { count: 0, start: now };
  if (now - eintrag.start > FENSTER_MS) {
    eintrag.count = 0;
    eintrag.start = now;
  }
  eintrag.count++;
  treffer.set(ip, eintrag);
  if (eintrag.count > MAX_PRO_FENSTER) {
    return res.status(429).json({ klasse: null, error: 'rate limit' });
  }
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true, klassen: STRASSENKLASSEN }));

app.post('/api/street-class', async (req, res) => {
  const { stadt, strasse } = req.body || {};
  const ergebnis = await ermittleStrassenklasse(stadt, strasse);
  // Klasse-Resultat immer 200; null signalisiert Frontend den Fallback.
  res.json(ergebnis);
});

app.listen(PORT, () => {
  console.log(`VZK Straßenklasse-API läuft auf http://localhost:${PORT}`);
  console.log(`Erlaubte Origins: ${ALLOWED.join(', ')}`);
});
