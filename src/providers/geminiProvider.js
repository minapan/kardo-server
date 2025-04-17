import { GoogleGenerativeAI } from '@google/generative-ai'
import { ENV } from '~/config/environment'


const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY)

const getSummary = async (description) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const prompt = `Summarize the following Trello card description into a single, concise sentence (max 50 words) in the same language, capturing the main task or purpose while preserving key details:\n\n${description}`
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    throw new Error('Failed to generate summary: ' + error.message)
  }
}

export const geminiProvider = { getSummary }