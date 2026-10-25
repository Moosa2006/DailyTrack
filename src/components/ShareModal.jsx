import { useState } from 'react'
import Modal from './Modal'
import { useToast } from './Toast'

export default function ShareModal({ completion, onClose }) {
  const [copied, setCopied] = useState(false)
  const toast = useToast()
  const shareText = `I finished ${completion}% of my DailyTrack habits today.`

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast('Copied to clipboard', 'success')
    } catch {
      toast('Could not copy. Select the text instead.', 'error')
    }
  }

  const handleShare = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: 'DailyTrack',
        text: shareText,
      })
    } catch {
      // user cancelled
    }
  }

  return (
    <Modal title="Share this day" onClose={onClose}>
      <p className="border border-line bg-paper px-3 py-3 text-ink">{shareText}</p>
      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={handleCopyToClipboard}
          className="w-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
        >
          {copied ? 'Copied' : 'Copy text'}
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            type="button"
            onClick={handleShare}
            className="w-full border border-line px-4 py-2 text-sm"
          >
            Share via device
          </button>
        )}
      </div>
    </Modal>
  )
}
