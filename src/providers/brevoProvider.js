import { ENV } from '~/config/environment'
const SibApiV3Sdk = require('@getbrevo/brevo')

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
let apiKey = apiInstance.authentications['apiKey']
apiKey.apiKey = ENV.BREVO_API_KEY

const sendEmail = async (recipient, subject, htmlContent) => {
  let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
  sendSmtpEmail.sender = { email: ENV.ADMIN_EMAIL_ADDRESS, name: ENV.ADMIN_EMAIL_NAME }
  sendSmtpEmail.to = [{ email: recipient }]
  sendSmtpEmail.subject = subject
  sendSmtpEmail.htmlContent = htmlContent
  return apiInstance.sendTransacEmail(sendSmtpEmail)
}

export const brevoProvider = {
  sendEmail
}