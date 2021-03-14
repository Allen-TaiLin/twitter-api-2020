const db = require('./models')
const { PublicMessage, User, OnlineUser } = db


module.exports = socket = (httpServer) => {
  const sio = require('socket.io')(httpServer, {
    cors: {
      // origin: "https://twitter-simple-one.herokuapp.com",
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  // const users = []  // 目前上線的使用者資料，包含socket.id

  // 公開聊天室
  sio.on('connection', (socket) => { // 建立連線
    console.log('a user connected')

    // 上線事件
    socket.on('sendOnline', (data, err) => {
      const socketId = socket.id
      OnlineUser.create({
        userId: data.userId
      })
      User.findByPk(data.userId)
        .then(user => {
          const userData = {
            id: data.userId,
            name: user.name,
            avatar: user.avatar,
            account: user.account
          }
          // users.push(userData)
          socket.broadcast.emit('receiveOnline', userData)
          socket.emit('receiveOnline', userData)
        })

      // io.sockets.emit('receiveOnline', userData)
    })

    // 取得線上使用者
    socket.on('getUsers', () => {
      OnlineUser.findAll({
        include: User,
        raw: true,
        nest: true
      })
        .then(user => {
          const usersArray = user.map((m) => {
            return {
              id: m.User.id,
              name: m.User.name,
              avatar: m.User.avatar
            }
          })
          socket.emit('receiveUsers', usersArray)
        })
      // const usersArray = users.map((m) => {
      //   return {
      //     id: m.id,
      //     name: m.name,
      //     avatar: m.avatar
      //   }
      // })

    })



    //歷史訊息
    socket.on('messages', (msg, err) => {
      const allMessages = []
      PublicMessage.findAll({
        include: User,
        raw: true,
        nest: true,
        order: [['createdAt', 'ASC']]
      })
        .then((msgs) => {
          if (!msgs) return
          msgs.map(m => {
            const { id, name, avatar } = m.User
            allMessages.push({ text: m.message, userId: id, userName: name, userAvatar: avatar, createdAt: m.createdAt })
          })
          socket.emit('getAllMessages', allMessages) //連上線之後，自己會出現歷史訊息
        })
    })


    // 多人通信
    socket.on('sendPublic', (data, err) => {
      const { text, userId } = data
      const createdAt = new Date()
      //存入資料庫
      PublicMessage.create({
        message: text,
        UserId: userId,
        createdAt,
        updatedAt: createdAt,
      })
      //撈自己的info
      User.findByPk(userId)
        .then((user) => {
          const { name, avatar } = user
          socket.broadcast.emit('receivePublic', { text, userId, userName: name, userAvatar: avatar, createdAt })
          socket.emit('receivePublic', { text, userId, userName: name, userAvatar: avatar, createdAt })
          // io.sockets.emit('receivePublic', { text, userId, userName: user.name, userAvatar: user.avatar, createdAt })
        })
    })



    // 下線事件
    socket.on('sendOffline', (data, err) => {
      const id = data.userId
      const offLineUser = users.filter((item) => {
        return item.id != id
      })
      socket.broadcast.emit('receiveOffline', offLineUser)
      socket.emit('receiveOffline', offLineUser)
      // io.sockets.emit('receiveOffline', offLineUser)
    })

  })


}
