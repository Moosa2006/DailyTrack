import { useEffect, useRef, useState } from 'react'
import { getDailyNote, saveDailyNote } from '../services/api'
import { useToast } from './Toast'
import { addDays, formatDisplayDate, isToday, localDateString } from '../utils/date'

const noteDraftKey = (date) => `dailytrack-note-draft-${date}`

export default function DailyNotesView({ initialDate }) {
  const [selectedDate, setSelectedDate] = useState(initialDate || localDateString())
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSaved, setLastSaved] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [error, setError] = useState('')

  const dateInputRef = useRef(null)
  const debounceTimerRef = useRef(null)
  const latestContentRef = useRef(content)
  const toast = useToast()

  latestContentRef.current = content

  // Load note for date
  useEffect(() => {
    let isCancelled = false
    const fetchNote = async () => {
      setLoading(true)
      setError('')
      setHasUnsavedChanges(false)
      try {
        const data = await getDailyNote(selectedDate)
        if (isCancelled) return

        let noteText = data.content || ''
        // Check for local unsaved draft
        const localDraft = localStorage.getItem(noteDraftKey(selectedDate))
        if (localDraft !== null && localDraft !== noteText) {
          noteText = localDraft
          setHasUnsavedChanges(true)
        }

        setContent(noteText)
        setLastSaved(data.updatedAt ? new Date(data.updatedAt) : null)
        setSyncStatus(data.exists ? 'saved' : 'idle')
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load note')
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchNote()

    return () => {
      isCancelled = true
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [selectedDate])

  // Explicit Save
  const handleSave = async (explicitText) => {
    const textToSave = explicitText !== undefined ? explicitText : latestContentRef.current
    setSyncStatus('saving')
    try {
      const data = await saveDailyNote(selectedDate, textToSave)
      setLastSaved(new Date(data.updatedAt || Date.now()))
      setSyncStatus('saved')
      setHasUnsavedChanges(false)
      localStorage.removeItem(noteDraftKey(selectedDate))
      toast('Note saved', 'success')
      setTimeout(() => setSyncStatus('idle'), 2500)
    } catch (err) {
      setSyncStatus('error')
      toast(err.message || 'Could not save note', 'error')
    }
  }

  // Handle typing with debounced autosave
  const handleContentChange = (e) => {
    const nextVal = e.target.value
    setContent(nextVal)
    setHasUnsavedChanges(true)
    localStorage.setItem(noteDraftKey(selectedDate), nextVal)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      handleSave(nextVal)
    }, 800)
  }

  const formatLastSavedTime = (dateObj) => {
    if (!dateObj) return null
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <section className="space-y-6">
      {/* Date Header & Navigation */}
      <div className="border border-line bg-raised p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="border border-line bg-paper px-2.5 py-1 text-sm font-bold text-ink hover:border-ink transition-colors"
              title="Previous Day"
            >
              &lsaquo;
            </button>
            <h2 className="font-display text-xl font-bold text-ink">
              {formatDisplayDate(selectedDate)}
            </h2>
            <button
              type="button"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="border border-line bg-paper px-2.5 py-1 text-sm font-bold text-ink hover:border-ink transition-colors"
              title="Next Day"
            >
              &rsaquo;
            </button>
            {isToday(selectedDate) ? (
              <span className="border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                Today
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedDate(localDateString())}
                className="border border-line bg-paper px-2 py-0.5 text-xs font-medium text-accent hover:border-accent transition-colors"
              >
                Jump to Today
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="sr-only"
              aria-label="Pick date"
            />
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
              className="border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-ink transition-colors flex items-center gap-1.5"
            >
              <span>📅</span> Select Date
            </button>
            <span className="text-xs text-muted flex items-center gap-1">
              <span>🔒</span> Private note
            </span>
          </div>
        </div>
      </div>

      {/* Main Note Writing Box */}
      <div className="border border-line bg-raised p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">Daily Journal &amp; Notes</h3>
            <p className="text-xs text-muted">
              Record insights, daily reflections, key takeaways, and what you learned today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {syncStatus === 'saving' && (
              <span className="text-xs text-muted flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 animate-ping bg-accent rounded-full" />
                Autosaving…
              </span>
            )}
            {syncStatus === 'saved' && (
              <span className="text-xs text-good font-medium">✓ Saved</span>
            )}
            {hasUnsavedChanges && syncStatus === 'idle' && (
              <span className="text-xs text-warn font-medium flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-warn" />
                Unsaved edits
              </span>
            )}
            {lastSaved && (
              <span className="text-[11px] text-muted">
                Last saved {formatLastSavedTime(lastSaved)}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted">
            <div className="mx-auto h-6 w-6 animate-spin border-2 border-line border-t-accent rounded-full mb-3" />
            <p className="text-sm">Loading note for {selectedDate}…</p>
          </div>
        ) : error ? (
          <div className="border border-bad/30 bg-bad/10 p-4 text-xs text-bad">
            {error}
            <button
              type="button"
              onClick={() => setSelectedDate(selectedDate)}
              className="ml-3 underline font-semibold"
            >
              Retry
            </button>
          </div>
        ) : (
          <div>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="What happened today? What challenges arose, and what are you grateful for? (Supports up to 10,000 characters)"
              maxLength={10000}
              rows={12}
              className="w-full border border-line bg-paper p-4 text-sm text-ink placeholder:text-muted/60 focus:border-accent font-sans leading-relaxed resize-y"
            />

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <span className="text-xs text-muted">
                {content.length.toLocaleString()} / 10,000 characters
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={syncStatus === 'saving'}
                  className="bg-ink px-5 py-2 text-xs font-semibold text-paper shadow-xs transition-colors hover:bg-ink/90 disabled:opacity-50"
                >
                  {syncStatus === 'saving' ? 'Saving…' : 'Save Note Now'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
