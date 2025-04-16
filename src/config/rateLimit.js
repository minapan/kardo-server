import { rateLimit } from 'express-rate-limit'

export const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  handler: (req, res) => res.status(429).json({ message: 'Too many requests from your IP, please try again later' })
})

export const authLimiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 15,
  handler: (req, res) => res.status(429).json({ message: 'Too many requests from your IP, please wait a few minutes before trying again' })
})