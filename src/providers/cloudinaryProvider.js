import cloudinary from 'cloudinary'
import streamifier from 'streamifier'
import { ENV } from '~/config/environment'

const cloudinaryV2 = cloudinary.v2

cloudinaryV2.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET
})

const streamUpload = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryV2.uploader.upload_stream(
      { folder: folderName },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    streamifier.createReadStream(fileBuffer).pipe(uploadStream)
  })
}

export const cloudinaryProvider = { streamUpload }