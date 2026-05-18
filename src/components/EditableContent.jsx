/**
 * EditableContent.jsx — Luminal Journeys
 * Drop-in wrapper for any text element. In view mode it renders exactly
 * like the original element. In edit mode it shows a pencil icon and
 * opens the EditPanel drawer on click.
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
  const [panelOpen, setPanelOpen]         = useState(false)

  // ── View mode — zero overhead, renders exactly like original ──
  if (!isEditMode) {
    return <Tag className={className} style={style} {...rest}>{content}</Tag>
  }

  // ── Edit mode — dashed outline + pencil hint + click to open panel ──
  return (
    <>
      <Tag
        className={`${className ?? ''} ec-editable`.trim()}
        style={{ ...style, cursor: 'pointer' }}
        title="Click to edit"
        onClick={() => setPanelOpen(true)}
        {...rest}
      >
        <span className="ec-edit-hint" aria-hidden="true">
          <PencilIcon size={11} />
        </span>
        {content}
      </Tag>

      {panelOpen && (
        <EditPanel
          contentKey={contentKey}
          currentText={content}
          history={history}
          onSave={saveContent}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  )
}
