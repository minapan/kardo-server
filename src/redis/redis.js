/* eslint-disable no-unexpected-multiline */
/* eslint-disable no-console */
import { createClient } from 'redis'
import { ENV } from '~/config/environment'

const client = createClient({
  username: 'default',
  password: ENV.REDIS_PASSWORD,
  socket: {
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT
  }
})

const CONNECT_REDIS = async () => {
  client.on('error', err => console.log('Redis Client Error', err))

  await client.connect()
  console.log('Connected to Redis')
  return client
}

const DISCONNECT_REDIS = async () => {
  await client.disconnect()
}

const SET_REDIS = async (key, value) => {
  const res = await client.set(key, value)
  return res
}

const SETEX_REDIS = async (key, seconds, value) => {
  const res = await client.setEx(key, seconds, value)
  return res
}

const GET_REDIS = async (key) => {
  const res = await client.get(key)
  return res
}

const DEL_REDIS = async (key) => {
  const res = await client.del(key)
  return res
}

const MULTI_REDIS = async (key, seconds, value) => {
  const multi = client.multi()
  multi.setEx(key, seconds, value)
  const res = await multi.exec()
  return res
}

export { CONNECT_REDIS, DISCONNECT_REDIS, SET_REDIS, GET_REDIS, DEL_REDIS, SETEX_REDIS, MULTI_REDIS }

