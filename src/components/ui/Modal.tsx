import type { PropsWithChildren } from "react";

export function Modal({ title, onClose, children }: PropsWithChildren<{ title: string; onClose: () => void }>) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header"><h2>{title}</h2><button className="icon-btn" onClick={onClose}>×</button></div>
        {children}
      </div>
    </div>
  );
}
