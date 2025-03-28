import { GoogleGenerativeAI } from '@google/generative-ai'
import { ENV } from '~/config/environment'


const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY)

const getSummary = async (description) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const prompt = `Summarize this text into a concise sentence (under 50 words) in the same language as the input:\n\n${description}`
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    throw new Error('Failed to generate summary: ' + error.message)
  }
}

export const geminiProvider = { getSummary }