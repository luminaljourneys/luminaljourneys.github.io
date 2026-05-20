/**
 * collections.js — Luminal Journeys
 * Single source of truth for all Firestore collection/document names.
 *
 * VITE_ENV=staging   → reads/writes staging collections  (default for local dev)
 * VITE_ENV=production → reads/writes production collections
 *
 * Publish = batch-copy every staging collection → production counterpart.
 */

export const ENV        = import.meta.env.VITE_ENV ?? 'staging'
export const IS_STAGING = ENV !== 'production'

// ── Text content edits (EditableContent) ─────────────────────────────────────
export const CONTENT_COLL      = `content_edits_${ENV}`
export const CONTENT_PROD_COLL = 'content_edits_production'

// ── Intake form config (single Firestore doc) ────────────────────────────────
export const FORM_CONFIG_COLL = 'site_config'
export const FORM_CONFIG_DOC  = `form_${ENV}`
export const FORM_PROD_DOC    = 'form_production'

// ── Dynamic pages ────────────────────────────────────────────────────────────
export const PAGES_COLL      = `pages_${ENV}`
export const PAGES_PROD_COLL = 'pages_production'

// ── Publish audit log ─────────────────────────────────────────────────────────
export const PUBLISH_COLL = 'publish_history'

// ── Site meta (last saved, authorized editors) ────────────────────────────────
export const SITE_CONFIG_COLL      = 'site_config'
export const SITE_META_DOC         = 'meta'
export const AUTHORIZED_EDITORS_DOC = 'authorized_editors'

// ── Collaborative notes ───────────────────────────────────────────────────────
export const NOTES_COLL = 'page_notes'

// ── Editing locks (real-time presence / conflict prevention) ──────────────────
// One doc per contentKey. Auto-expires after LOCK_TTL_MS if editor disconnects.
export const LOCKS_COLL  = 'editing_locks'
export const LOCK_TTL_MS = 3 * 60 * 1000  // 3 minutes
