/**
 * useFormConfig.js — Luminal Journeys
 * Reads and writes the intake form configuration from Firestore.
 * Falls back to DEFAULT_FIELDS if no doc exists yet (first-run safe).
 *
 * Data shape stored in Firestore:
 *   site_config / form_staging  (or form_production)
 *   {
 *     steps:  [{ id, title, description }],
 *     fields: [{ id, step, type, name, label, placeholder, required,
 *                halfWidth, deletable, order, options: [] }]
 *   }
 */

import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { FORM_CONFIG_COLL, FORM_CONFIG_DOC } from '../lib/collections'

// ── Default steps ─────────────────────────────────────────────────────────────
export const DEFAULT_STEPS = [
  { id: 'step-0', title: 'Personal Info',  description: "Let's start with the basics — tell us who you are." },
  { id: 'step-1', title: 'Contact Info',   description: "How can we reach you? We'll use this to confirm your appointment." },
  { id: 'step-2', title: 'About You',      description: 'A little more about you so we can prepare.' },
]

// ── Default fields (mirrors the original hardcoded IntakePage) ───────────────
export const DEFAULT_FIELDS = [
  // Step 0 — Personal Info
  { id: 'f-firstName',       step: 0, type: 'text',     name: 'firstName',       label: 'First Name',                    placeholder: 'First name',                                                 required: true,  halfWidth: true,  deletable: false, order: 1, options: [] },
  { id: 'f-lastName',        step: 0, type: 'text',     name: 'lastName',        label: 'Last Name',                     placeholder: 'Last name',                                                  required: true,  halfWidth: true,  deletable: false, order: 2, options: [] },
  { id: 'f-preferredName',   step: 0, type: 'text',     name: 'preferredName',   label: 'Preferred Name',                placeholder: 'What should we call you?',                                   required: false, halfWidth: false, deletable: true,  order: 3, options: [] },
  { id: 'f-dateOfBirth',     step: 0, type: 'date',     name: 'dateOfBirth',     label: 'Date of Birth',                 placeholder: '',                                                           required: true,  halfWidth: false, deletable: false, order: 4, options: [] },
  { id: 'f-pronouns',        step: 0, type: 'select',   name: 'pronouns',        label: 'Pronouns',                      placeholder: 'Select pronouns',                                            required: false, halfWidth: false, deletable: true,  order: 5, options: ['She / Her', 'He / Him', 'They / Them', 'Ze / Zir', 'Prefer not to say', 'Not listed'] },
  // Step 1 — Contact Info
  { id: 'f-email',           step: 1, type: 'email',    name: 'email',           label: 'Email Address',                 placeholder: 'your@email.com',                                             required: true,  halfWidth: false, deletable: false, order: 1, options: [] },
  { id: 'f-phone',           step: 1, type: 'tel',      name: 'phone',           label: 'Phone Number',                  placeholder: '+1 (555) 000-0000',                                          required: false, halfWidth: false, deletable: true,  order: 2, options: [] },
  { id: 'f-address',         step: 1, type: 'text',     name: 'address',         label: 'Street Address',                placeholder: '123 Main St',                                                required: false, halfWidth: false, deletable: true,  order: 3, options: [] },
  { id: 'f-city',            step: 1, type: 'text',     name: 'city',            label: 'City',                          placeholder: 'City',                                                       required: false, halfWidth: true,  deletable: true,  order: 4, options: [] },
  { id: 'f-state',           step: 1, type: 'text',     name: 'state',           label: 'State',                         placeholder: 'ST',                                                         required: false, halfWidth: true,  deletable: true,  order: 5, options: [] },
  { id: 'f-zip',             step: 1, type: 'text',     name: 'zip',             label: 'ZIP Code',                      placeholder: '00000',                                                      required: false, halfWidth: true,  deletable: true,  order: 6, options: [] },
  { id: 'f-prefContact',     step: 1, type: 'radio',    name: 'preferredContact',label: 'Preferred Contact Method',      placeholder: '',                                                           required: false, halfWidth: false, deletable: true,  order: 7, options: ['email', 'phone', 'text'] },
  // Step 2 — About You
  { id: 'f-primaryGoal',     step: 2, type: 'select',   name: 'primaryGoal',     label: 'Primary Goal',                  placeholder: 'Select your primary goal',                                   required: true,  halfWidth: false, deletable: false, order: 1, options: ['Stress & Anxiety Management', 'Hormonal Balance', 'Sleep Improvement', 'Energy & Vitality', 'Digestive Health', 'Chronic Pain Management', 'Mental Clarity & Focus', 'General Wellness', 'Other'] },
  { id: 'f-hearAboutUs',     step: 2, type: 'select',   name: 'hearAboutUs',     label: 'How did you hear about us?',    placeholder: 'Select an option',                                           required: false, halfWidth: false, deletable: true,  order: 2, options: ['Friend or Family', 'Google Search', 'Social Media', 'Healthcare Provider Referral', 'Online Advertisement', 'Other'] },
  { id: 'f-additionalNotes', step: 2, type: 'textarea', name: 'additionalNotes', label: "Anything else you'd like us to know?", placeholder: 'Share anything that might help us prepare for your visit...', required: false, halfWidth: false, deletable: true, order: 3, options: [] },
]

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useFormConfig() {
  const [fields,  setFields]  = useState(DEFAULT_FIELDS)
  const [steps,   setSteps]   = useState(DEFAULT_STEPS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, FORM_CONFIG_COLL, FORM_CONFIG_DOC))
        if (!cancelled && snap.exists()) {
          const data = snap.data()
          if (data.fields?.length) setFields(data.fields)
          if (data.steps?.length)  setSteps(data.steps)
        }
      } catch (e) {
        console.warn('[useFormConfig] Using defaults.', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [])

  // ── Persist to Firestore ──────────────────────────────────────────────────
  const saveConfig = async (newFields, newSteps) => {
    const f = newFields ?? fields
    const s = newSteps  ?? steps
    await setDoc(doc(db, FORM_CONFIG_COLL, FORM_CONFIG_DOC), {
      fields: f, steps: s, updatedAt: serverTimestamp(),
    })
    if (newFields) setFields(newFields)
    if (newSteps)  setSteps(newSteps)
  }

  // ── Field CRUD ────────────────────────────────────────────────────────────
  const addField = async (partial) => {
    const stepFields = fields.filter(f => f.step === partial.step)
    const maxOrder   = stepFields.length ? Math.max(...stepFields.map(f => f.order)) : 0
    const field = { id: `f-${Date.now()}`, halfWidth: false, deletable: true, options: [], order: maxOrder + 1, ...partial }
    const updated = [...fields, field]
    await saveConfig(updated, null)
    return field
  }

  const deleteField = async (fieldId) => saveConfig(fields.filter(f => f.id !== fieldId), null)

  const updateField = async (fieldId, changes) =>
    saveConfig(fields.map(f => f.id === fieldId ? { ...f, ...changes } : f), null)

  const reorderField = async (fieldId, direction) => {
    const field      = fields.find(f => f.id === fieldId)
    if (!field) return
    const stepFields = fields.filter(f => f.step === field.step).sort((a, b) => a.order - b.order)
    const idx        = stepFields.findIndex(f => f.id === fieldId)
    const swapIdx    = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= stepFields.length) return
    const swap    = stepFields[swapIdx]
    const updated = fields.map(f => {
      if (f.id === fieldId) return { ...f, order: swap.order }
      if (f.id === swap.id) return { ...f, order: field.order }
      return f
    })
    await saveConfig(updated, null)
  }

  // ── Step CRUD ─────────────────────────────────────────────────────────────
  const addStep = async (title, description = '') => {
    const id      = `step-${Date.now()}`
    const updated = [...steps, { id, title, description }]
    await saveConfig(null, updated)
    return { id, title, description }
  }

  const updateStep = async (stepId, changes) =>
    saveConfig(null, steps.map(s => s.id === stepId ? { ...s, ...changes } : s))

  const deleteStep = async (stepIndex) => {
    // Remove the step and re-number remaining steps; remove fields in that step
    const updatedSteps  = steps.filter((_, i) => i !== stepIndex)
    const updatedFields = fields
      .filter(f => f.step !== stepIndex)
      .map(f => ({ ...f, step: f.step > stepIndex ? f.step - 1 : f.step }))
    await saveConfig(updatedFields, updatedSteps)
  }

  return { fields, steps, loading, addField, deleteField, updateField, reorderField, addStep, updateStep, deleteStep, saveConfig }
}
