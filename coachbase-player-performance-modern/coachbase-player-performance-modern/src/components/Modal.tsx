import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
export function Modal({ title, onClose, busy = false, children }: { title: string; onClose: () => void; busy?: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close() }, [])
  return <dialog ref={ref} className="modal-card" aria-label={title} onCancel={e => { e.preventDefault(); if (!busy) onClose() }}><div className="modal-head"><h2>{title}</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Close"><X size={20}/></button></div>{children}</dialog>
}
