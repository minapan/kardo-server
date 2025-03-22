import leoProfanity from 'leo-profanity'
import { VIE_BADWORDS } from './constants'
import { cloneDeep } from 'lodash'

leoProfanity.loadDictionary('en')
leoProfanity.add(VIE_BADWORDS)

export const isBadWord = (text) => leoProfanity.check(text)
export const cleanText = (text) => leoProfanity.clean(text)

/**
 * Checks and cleans profanity, preserving the input structure
 * @param {Object} input - The input to check for profanity
 * @param {string} [replacement='*'] - The character to replace profane words with
 * @returns {Object} - The cleaned with the same structure as the input
 */
export const checkAndCleanProfanity = (input, replacement = '*') => {
  // Return input as-is if it's not an object or is null
  if (!input || typeof input !== 'object') {
    return cleanText(input)
  }

  // Deep clone the input using lodash to avoid mutating the original
  const result = cloneDeep(input)

  // Iterate through all keys in the object
  Object.keys(result).forEach((key) => {
    const value = result[key]

    // If the value is a string, check and clean profanity
    if (typeof value === 'string') {
      if (leoProfanity.check(value)) {
        result[key] = leoProfanity.clean(value, replacement)
      }
    }
    // If the value is an object or array, recursively process it
    else if (typeof value === 'object' && value !== null) {
      result[key] = checkAndCleanProfanity(value, replacement)
    }
    // Skip other types (number, boolean, etc.)
  })

  return result
}
