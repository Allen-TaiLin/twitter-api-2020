const express = require('express')
const router = express.Router()
const passport = require('../config/passport')
const authenticated = passport.authenticate('jwt', { session: false })
const userController = require('../controllers/api/userController')
const adminController = require('../controllers/api/adminController')


const authenticatedAdmin = (req, res, next) => {
  if (req.user) {
    if (req.user.role) {
      return next()
    }
    return res.json({ status: 'error', message: 'permission denied' })
  } else {
    return res.json({ status: 'error', message: 'permission denied' })
  }
}

// user
router.post('/users', userController.signUp)
router.post('/signin', authenticated, userController.signIn)
router.get('/users/:id', authenticated, userController.getUser)
router.get('/users/:id/tweets', authenticated, userController.getUserTweets)
router.get('/users/:id/replied_tweets', authenticated, userController.getUserReplies)
// admin
// JWT signin
router.post('/admin/signin', adminController.signIn)
// // 註冊
// router.get('/admin/users', adminController.getUsers)
// // 全部推文資料
// router.get('/admin/tweets', authenticatedAdmin, adminController.getTweets)
// // 刪除一筆推文
// router.delete('/admin/tweets/:id', authenticatedAdmin, adminController.deleteTweet)

module.exports = router