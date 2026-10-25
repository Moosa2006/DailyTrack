const hits = new Map()

export function rateLimit({ windowMs = 15 * 60 * 1000, max = 20 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`
    const now = Date.now()
    const recent = (hits.get(key) || []).filter((time) => now - time < windowMs)

    if (recent.length >= max) {
      return res.status(429).json({ message: 'Too many attempts. Please try again later.' })
    }

    recent.push(now)
    hits.set(key, recent)

    if (hits.size > 2000) {
      for (const [k, times] of hits.entries()) {
        const valid = times.filter((t) => now - t < windowMs)
        if (valid.length === 0) {
          hits.delete(k)
        } else {
          hits.set(k, valid)
        }
      }
    }

    next()
  }
}
