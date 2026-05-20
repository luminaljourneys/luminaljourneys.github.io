/**
 * EditableContent.jsx — Luminal Journeys
 * Drop-in wrapper for any text element. In view mode it renders exactly
 * like the original element. In edit mode it shows a pencil icon and
 * opens the EditPanel drawer on click.
 *
 * Collaborative locking: when another editor has this section open,
 * a "Pending by [Name]" overlay appears and clicking is blocked.
 *
 * Usage:
 *   <EditableContent
 *     contentKey="hero.tagline"
 *     fallback="Integrative Health · Private Practice"
 *     tag="span"
 *     style={{ color: '#bf8a3e' }}
 *   />
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

  // ── View mode — zero overhead, renders exactly like original ──────────────
  if (!isEditMode) {
    return <Tag className={className} style={style} {...rest}>{content}</Tag>
  }

  // ── Open panel ────────────────────────────────────────────────────────────
  const handleOpen = () => {
    if (isLockedByOther) return  // blocked — another editor has this section
    setPanelOpen(true)
    acquireLock()
  }

  // ── Close panel ───────────────────────────────────────────────────────────
  const handleClose = () => {
    setPanelOpen(false)
    releaseLock()
  }

  const handleSave = async (newText, editor) => {
    await saveContent(newText, editor)
    releaseLock()
  }

  // ── Edit mode — dashed outline + pencil hint + lock overlay ───────────────
  return (
    <>
      {/* Wrapper gives us a relative positioning context for the lock overlay */}
      <span
        style={{ position: 'relative', display: 'inline' }}
        className="ec-lock-wrapper"
      >
        <Tag
          className={`${className ?? ''} ec-editable${isLockedByOther ? ' ec-locked' : ''}`.trim()}
          style={{
            ...style,
            cursor: isLockedByOther ? 'not-allowed' : 'pointer',
            opacity: isLockedByOther ? 0.6 : 1,
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
        </Tag>

        {/* Lock overlay — shown when another editor has this section open */}
        {isLockedByOther && (
          <LockOverlay editorName={lock.lockedBy?.displayName ?? 'Another editor'} />
        )}
      </span>

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

// ── Lock Overlay ──────────────────────────────────────────────────────────────
function LockOverlay({ editorName }) {
  return (
    <span
      aria-live="polite"
      style={{
        position:   'absolute',
        top:        0,
        left:       0,
        right:      0,
        bottom:     0,
        zIndex:     9000,
        display:    'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        pointerEvents: 'none',
      }}
    >
      <span style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '0.35rem',
        background:     'rgba(191, 138, 62, 0.92)',  // amber
        color:          '#fff',
        fontSize:       '0.7rem',
        fontFamily:     "'DM Mono', monospace",
        fontWeight:     600,
        letterSpacing:  '0.04em',
        textTransform:  'uppercase',
        padding:        '0.25rem 0.55rem',
        borderRadius:   '0.4rem',
        whiteSpace:     'nowrap',
        boxShadow:      '0 2px 8px rgba(0,0,0,0.18)',
        backdropFilter: 'blur(4px)',
        marginTop:      '-1.5rem',  // float above the element
      }}>
        <span style={{ fontSize: '0.65rem' }}>✏</span>
        Pending · {editorName}
      </span>
    </span>
  )
}
