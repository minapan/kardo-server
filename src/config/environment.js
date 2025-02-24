import 'dotenv/config'

export const ENV = {
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_NAME: process.env.DATABASE_NAME,

  BREVO_API_KEY: process.env.BREVO_API_KEY,
  ADMIN_EMAIL_ADDRESS: process.env.ADMIN_EMAIL_ADDRESS,
  ADMIN_EMAIL_NAME: process.env.ADMIN_EMAIL_NAME,

  APP_HOST: process.env.APP_HOST,
  APP_PORT: process.env.APP_PORT,
  BUILD_MODE: process.env.BUILD_MODE,

  CLIENT_URL_DEV: process.env.CLIENT_URL_DEV,
  CLIENT_URL_PROD: process.env.CLIENT_URL_PROD
}
