import DailyNote from '../models/DailyNote.js'
import { isDateOnly } from '../utils/date.js'

export const getDailyNote = async (req, res) => {
  try {
    const userId = req.user.id
    const { date } = req.params

    if (!isDateOnly(date)) {
      return res.status(400).json({ message: 'A valid date (YYYY-MM-DD) is required' })
    }

    const note = await DailyNote.findOne({ userId, date }).lean()

    if (!note) {
      return res.json({
        date,
        content: '',
        updatedAt: null,
        exists: false,
      })
    }

    res.json({
      date: note.date,
      content: note.content || '',
      updatedAt: note.updatedAt,
      exists: true,
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' })
  }
}

export const saveDailyNote = async (req, res) => {
  try {
    const userId = req.user.id
    const { date } = req.params

    if (!isDateOnly(date)) {
      return res.status(400).json({ message: 'A valid date (YYYY-MM-DD) is required' })
    }

    const content = String(req.body.content || '').slice(0, 10000)

    const note = await DailyNote.findOneAndUpdate(
      { userId, date },
      { userId, date, content },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    )

    res.json({
      date: note.date,
      content: note.content || '',
      updatedAt: note.updatedAt,
      exists: true,
      message: 'Note saved successfully',
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' })
  }
}
