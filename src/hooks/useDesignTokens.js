/**
 * useDesignTokens.js — Luminal Journeys
 * Loads typography design tokens from Firestore (site_config/design_tokens)
 * and applies them as CSS custom properties in real time.
 *
 * Used in two places:
 *  1. App.jsx — one-time boot load so tokens apply to the live site for all visitors
 *  2. DesignTab.jsx — reactive + save for the admin panel UI
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { SITE_CONFIG_COLL } from '../lib/collections';
import { defaultPtValues, applyDesignTokens } from '../lib/designDefaults';

const DESIGN_DOC = 'design_tokens';

export function useDesignTokens() {
  const [ptValues, setPtValues] = useState(defaultPtValues);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    const ref = doc(db, SITE_CONFIG_COLL, DESIGN_DOC);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const typography = snap.exists() ? (snap.data().typography ?? {}) : {};
        const merged = { ...defaultPtValues(), ...typography };
        setPtValues(merged);
        applyDesignTokens(merged);
        setLoading(false);
      },
      () => {
        // Firestore unavailable — apply defaults silently
        applyDesignTokens({});
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  const saveTokens = async (newPtValues) => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, SITE_CONFIG_COLL, DESIGN_DOC),
        { typography: newPtValues, updatedAt: serverTimestamp() },
        { merge: true }
      );
      // onSnapshot will update ptValues automatically
    } finally {
      setSaving(false);
    }
  };

  return { ptValues, saveTokens, loading, saving };
}
