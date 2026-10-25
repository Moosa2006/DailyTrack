import { useEffect } from 'react'

export default function Modal({ title, onClose, children, labelledBy = 'modal-title' }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-xs sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto border border-line bg-raised p-6 shadow-md sm:rounded-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={labelledBy} className="font-display text-xl text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted hover:text-ink"
            aria-label="Close dialog"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
