import { MongoClient, ServerApiVersion } from 'mongodb'
import { ENV } from './environment'

const MONGODB_URI = ENV.MONGODB_URI
const MONGODB_DATABASE = ENV.DATABASE_NAME
// Variable to hold the database instance
let trelloDbInstance = null

// Create a new MongoClient instance with specific server API version and options
const client = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

/**
 * Connects to the MongoDB database and initializes the database instance.
 */
export const CONNECT_DB = async () => {
  await client.connect()
  trelloDbInstance = client.db(MONGODB_DATABASE)
}

/**
 * Retrieves the initialized database instance.
 * @returns {Db} - The database instance.
 * @throws {Error} - If the database instance is not initialized.
 */
export const GET_DB = () => {
  if (!trelloDbInstance) throw new Error('You must connect to DB first')
  return trelloDbInstance
}

export const CLOSE_DB = async () => {
  await client.close()
}
