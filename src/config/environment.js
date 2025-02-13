import 'dotenv/config'

export const ENV = {
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_NAME: process.env.MONGODB_DATABASE,
  APP_HOST: process.env.APP_HOST,
  APP_PORT: process.env.APP_PORT,
  BUILD_MODE: process.env.BUILD_MODE
}
