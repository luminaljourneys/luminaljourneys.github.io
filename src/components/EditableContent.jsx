/**
 * EditableContent.jsx — Luminal Journeys
 * Drop-in wrapper for any text element. In view mode it renders exactly
 * like the original element. In edit mode it shows a pencil icon and
 * opens the EditPanel drawer on click.
 *
 * Collaborative locking: when another editor has this section open,
 * a "Pending by [Name]" badge appears and clicking is blocked.
 * The overlay is rendered INSIDE the Tag (not outside) to avoid
 * invalid HTML nesting (e.g. <span> wrapping <h1>).
 */

import { useState } from 'react'
import { useEditMode } from '../context/EditModeContext'
import { useEditableContent } from '../hooks/useEditableContent'
import { useEditingLock } from '../hooks/useEditingLock'
import EditPanel from './EditPanel'
import PencilIcon from './PencilIcon'

export default function EditableContent({
  contentKey,
  fallback,
  tag: Tag = 'span',
  className,
  style,
  ...rest
}) {
  const { isEditMode }                    = useEditMode()
  const { content, history, saveContent } = useEditableContent(contentKey, fallback)
  const { lock, isLockedByMe, acquireLock, releaseLock } = useEditingLock(contentKey)
  const [panelOpen, setPanelOpen]         = useState(false)

  const isLockedByOther = !!lock && !isLockedByMe

  // ── View mode — zero overhead ─────────────────────────────────────────────
  if (!isEditMode) {
    // While content is null (Firestore fetch in-flight), render the tag with
    // visibility:hidden so layout space is reserved but no text is visible.
    // This eliminates the flash of stale hardcoded fallback text on page load.
    if (content === null) {
      return <Tag className={className} style={{ ...style, visibility: 'hidden' }} {...rest}>&nbsp;</Tag>
    }
    return <Tag className={className} style={style} {...rest}>{content}</Tag>
  }

  const handleOpen = () => {
    if (isLockedByOther) return
    setPanelOpen(true)
    acquireLock()
  }

  const handleClose = () => {
    setPanelOpen(false)
    releaseLock()
  }

  const handleSave = async (newText, editor) => {
    await saveContent(newText, editor)
    releaseLock()
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  // The overlay is a child of Tag (not a wrapper around it) to keep valid HTML.
  // Tag gets position:relative so the absolutely-positioned badge stays anchored.
  return (
    <>
      <Tag
        className={`${className ?? ''} ec-editable${isLockedByOther ? ' ec-locked' : ''}`.trim()}
        style={{
          ...style,
          cursor:   isLockedByOther ? 'not-allowed' : 'pointer',
          opacity:  isLockedByOther ? 0.65 : 1,
          position: 'relative',   // anchors the lock badge
        }}
        title={isLockedByOther
          ? `Being edited by ${lock.lockedBy?.displayName ?? 'another editor'}`
          : 'Click to edit'}
        onClick={handleOpen}
        {...rest}
      >
        {!isLockedByOther && (
          <span className="ec-edit-hint" aria-hidden="true">
            <PencilIcon size={11} />
          </span>
        )}
        {content}
        {isLockedByOther && (
          <LockBadge name={lock.lockedBy?.displayName ?? 'Another editor'} />
        )}
      </Tag>

      {panelOpen && (
        <EditPanel
          contentKey={contentKey}
          currentText={content}
          history={history}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </>
  )
}

// ── Lock Badge — floats above the element, anchored via position:absolute ─────
function LockBadge({ name }) {
  return (
    <span
      aria-live="polite"
      style={{
        position:      'absolute',
        top:           '-1.6rem',
        left:          0,
        zIndex:        9000,
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '0.3rem',
        background:    'rgba(191,138,62,0.93)',
        color:         '#fff',
        fontSize:      '0.68rem',
        fontFamily:    "'DM Mono', monospace",
        fontWeight:    600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        padding:       '0.22rem 0.5rem',
        borderRadius:  '0.35rem',
        whiteSpace:    'nowrap',
        boxShadow:     '0 2px 8px rgba(0,0,0,0.18)',
        pointerEvents: 'none',
      }}
    >
      <span style={{ fontSize: '0.6rem' }}>✏</span>
      Pending · {name}
    </span>
  )
}
