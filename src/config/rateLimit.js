import { rateLimit } from 'express-rate-limit'

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => res.status(429).json({ message: 'Too many requests from your IP, please try again later' })
})

export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  handler: (req, res) => res.status(429).json({ message: 'Too many requests from your IP, please wait a few minutes before trying again' })
})