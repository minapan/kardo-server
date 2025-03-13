import { ENV } from '~/config/environment'

export const WHITELIST_DOMAINS = [
  'https://trello-web-murex-iota.vercel.app',
  `${ENV.CLIENT_URL_PROD}`
]

export const CLIENT_URL = (ENV.BUILD_MODE === 'dev') ? ENV.CLIENT_URL_DEV : ENV.CLIENT_URL_PROD

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 12

export const INVITATION_TYPES = {
  BOARD_INVITATION: 'BOARD_INVITATION'
}

export const BOARD_INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
}