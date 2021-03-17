const express = require('express')

const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const cors = require('cors')
const helpers = require('./_helpers')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const session = require('express-session')
const passport = require('./config/passport')
const flash = require('connect-flash')
const app = express()
const httpServer = require('http').createServer(app)
const io = require('socket.io')(httpServer, {
  cors: {
    // origin: "https://twitter-simple-one.herokuapp.com",
    origin: "*",
    methods: ["GET", "POST"]
  }
})
// setup session
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
})

// cors 的預設為全開放
app.use(cors())

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
// app.use(bodyParser.urlencoded({ extended: true }))  // setup bodyParser
// app.use(bodyParser.json())
app.use(express.static('public'))
app.use(methodOverride('_method'))
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use('/upload', express.static(__dirname + '/upload'))

// 設定CORS、把 req.flash 放到 res.locals 裡面
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", '*')
  res.header("Access-Control-Allow-Credentials", true)
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json')
  res.locals.success_messages = req.flash('success_messages')
  res.locals.error_messages = req.flash('error_messages')
  res.locals.user = helpers.getUser(req)
  next()
})

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next)
})

const port = process.env.PORT || 3000
httpServer.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`)
})


require('./socket')(io)

// 引入 routes 並將 app 傳進去，讓 routes 可以用 app 這個物件來指定路由
require('./routes')(app)  // 把 passport 傳入 routes
module.exports = app
