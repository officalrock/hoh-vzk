export const WUNSCHTEXT_KEY = "vzk-wunschtexte";

const PLATZHALTER = new Set(["1000-01", "1000-02", "1000-03", "1000-04", "1000-05"]);

export function isPlatzhalter(nummer) {
  return PLATZHALTER.has(nummer);
}

export function loadWunschtexte() {
  try {
    return JSON.parse(localStorage.getItem(WUNSCHTEXT_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveWunschtext(nummer, text) {
  const all = loadWunschtexte();
  if (text.trim()) {
    all[nummer] = text.trim();
  } else {
    delete all[nummer];
  }
  localStorage.setItem(WUNSCHTEXT_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("wunschtexte-changed"));
  return all;
}

export function removeWunschtext(nummer) {
  return saveWunschtext(nummer, "");
}
