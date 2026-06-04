import React from 'react'
import { Button, Icon } from './ui'

export default function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="my-6 w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 md:p-6"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 id="modal-title" className="text-lg font-extrabold text-slate-950">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <Icon name="x" className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
