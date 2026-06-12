import React, { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../../utils/assetPath';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import './intro-splash.css';

const SESSION_KEY = 'vzk-intro-shown';
const TARGET_SECONDS = 2; // Zielspielzeit: Animation auf 2s zeitraffen.

// Endgerät abfragen: schmaler Viewport ODER Hochformat -> Mobil-Clip (9:16).
function isMobileDevice() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return (
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(orientation: portrait)').matches
  );
}

function alreadyShown() {
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
}

/**
 * Vorgeschalteter Splash-Screen beim App-Aufruf: spielt eine 3D-Datenstrom-
 * Animation und blendet danach in die App über. Wählt je nach Endgerät die
 * passende Auflösung (16:9 Web / 9:16 Mobil). Einmal pro Tab/Session.
 */
export function IntroSplash({ onDone }) {
  const reduceMotion = usePrefersReducedMotion();
  const [src] = useState(() =>
    assetUrl(isMobileDevice() ? 'intro/intro-mobile.mp4' : 'intro/intro-web.mp4')
  );
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
    setLeaving(true);
    // Kurze Fade-out-Phase, dann unmount.
    setTimeout(() => onDone?.(), 450);
  };

  // Reduced-Motion: Animation überspringen.
  useEffect(() => {
    if (reduceMotion) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // Sicherheitsnetz: falls Video gar nicht lädt/startet, nach 3 s weiter.
  useEffect(() => {
    const t = setTimeout(finish, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animation auf TARGET_SECONDS zeitraffen (gleiche Bilder, schneller).
  const handleMeta = (e) => {
    const vid = e.currentTarget;
    if (vid.duration > 0) {
      vid.playbackRate = Math.min(vid.duration / TARGET_SECONDS, 16);
    }
  };

  // Harte Längen-Garantie: spätestens TARGET_SECONDS nach Start beenden,
  // auch falls der Browser playbackRate nicht in Echtzeit umsetzt.
  const handlePlay = () => {
    setTimeout(finish, TARGET_SECONDS * 1000 + 150);
  };

  if (reduceMotion) return null;

  return (
    <div
      className={`intro-splash${leaving ? ' intro-splash--leaving' : ''}`}
      onClick={finish}
      role="button"
      aria-label="Intro überspringen"
      tabIndex={0}
    >
      <video
        className="intro-splash__video"
        src={src}
        autoPlay
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={handleMeta}
        onPlay={handlePlay}
        onEnded={finish}
        onError={finish}
      />
      <span className="intro-splash__skip">Überspringen</span>
    </div>
  );
}

IntroSplash.shouldShow = () => !alreadyShown();

export default IntroSplash;
