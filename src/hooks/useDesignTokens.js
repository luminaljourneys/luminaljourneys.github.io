/**
 * useDesignTokens.js — Luminal Journeys
 * Loads typography design tokens (sizes + colors) from Firestore and applies
 * them as CSS custom properties in real time.
 *
 * Firestore path: site_config/design_tokens_staging  (admin / staging)
 *                 site_config/design_tokens_production (production)
 *
 * The Publish flow in usePublish.js copies staging → production,
 * matching the same pattern as content_edits and pages.
 *
 * Used in two places:
 *  1. App.jsx — DesignTokenProvider mounts once at the root so all pages
 *               inherit the typography + color settings automatically.
 *  2. DesignTab.jsx — reactive + save for the admin panel UI.
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { SITE_CONFIG_COLL, DESIGN_TOKENS_DOC } from '../lib/collections';
import { defaultPtValues, defaultColors, applyDesignTokens } from '../lib/designDefaults';

export function useDesignTokens() {
  const [ptValues, setPtValues] = useState(defaultPtValues);
  const [colors,   setColors]   = useState(defaultColors);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    const ref = doc(db, SITE_CONFIG_COLL, DESIGN_TOKENS_DOC);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data       = snap.exists() ? snap.data() : {};
        const typography = data.typography ?? {};
        const savedColors = data.colors   ?? {};
        const mergedPt    = { ...defaultPtValues(), ...typography };
        const mergedColors = { ...defaultColors(), ...savedColors };
        setPtValues(mergedPt);
        setColors(mergedColors);
        applyDesignTokens(mergedPt, mergedColors);
        setLoading(false);
      },
      () => {
        // Firestore unavailable — apply defaults silently
        applyDesignTokens(defaultPtValues(), defaultColors());
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  /**
   * saveTokens(newPtValues, newColors)
   * Persists to Firestore. onSnapshot updates ptValues/colors automatically.
   */
  const saveTokens = async (newPtValues, newColors) => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, SITE_CONFIG_COLL, DESIGN_TOKENS_DOC),
        {
          typography: newPtValues,
          colors:     newColors,
          updatedAt:  serverTimestamp(),
        },
        { merge: true }
      );
    } finally {
      setSaving(false);
    }
  };

  return { ptValues, colors, saveTokens, loading, saving };
}
