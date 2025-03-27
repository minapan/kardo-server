import passport from 'passport'
import GoogleStrategy from 'passport-google-oauth20'
import { ObjectId } from 'mongodb'
import { userModel } from '~/models/userModel'
import { GET_DB } from '~/config/mongodb'

const ggAuth = () => {
  passport.use(new GoogleStrategy.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/v1/users/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await userModel.findOrCreateGoogleUser(profile)
      done(null, user)
    } catch (err) {
      done(err, null)
    }
  }))

  passport.serializeUser((user, done) => done(null, user._id))
  passport.deserializeUser(async (id, done) => {
    const user = await GET_DB().collection(userModel.USER_COLLECTION_NAME).findOne({ _id: new ObjectId(id) })
    done(null, user)
  })

  return passport
}

export const passportProvider = { ggAuth }