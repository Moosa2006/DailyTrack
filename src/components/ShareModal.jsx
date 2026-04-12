export default function ShareModal({ completion, onClose }) {
  const shareText = `Today I completed ${completion}% of my daily tasks on DailyTrack! 💪`

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareText)
    alert('Copied to clipboard!')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DailyTrack',
          text: shareText,
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Share Your Achievement</h2>
        
        <div className="bg-gray-700 p-4 rounded mb-4">
          <p className="text-white">{shareText}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCopyToClipboard}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
          >
            📋 Copy to Clipboard
          </button>

          {navigator.share && (
            <button
              onClick={handleShare}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
            >
              🔗 Share
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
