const db = require('./models')
const { PublicMessage, User } = db


module.exports = socket = (httpServer) => {
  const sio = require('socket.io')(httpServer, {
    cors: {
      // origin: "https://twitter-simple-one.herokuapp.com",
      origin: "*",
      methods: ["GET", "POST"]
    }
  })



  // 公開聊天室
  sio.on('connection', (socket) => { // 建立連線
    console.log('a user connected')

    //如果重新整理
    // if (socket.request._query[user_id]) {
    //   User.findByPk(socket.request._query[user_id])
    //     .then(user => {
    //       user.update({ status: 'online', socketId })
    //         .then(() => {
    //           const showAccount = '@' + user.account
    //           const userData = {
    //             id: user.id,
    //             name: user.name,
    //             avatar: user.avatar,
    //             account: showAccount,
    //             status: user.status,
    //             socketId: user.socketId
    //           }
    //           socket.broadcast.emit('receiveOnline', userData)
    //           socket.emit('receiveOnline', userData)
    //         })
    //     })
    // }

    // 上線事件
    socket.on('sendOnline', (data, err) => {
      const socketId = socket.id
      User.findByPk(data.userId)
        .then(user => {
          user.update({ status: 'online', socketId })
            .then(() => {
              const showAccount = '@' + user.account
              const userData = {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                account: showAccount,
                status: user.status,
                socketId: user.socketId
              }
              socket.broadcast.emit('receiveOnline', userData)
              socket.emit('receiveOnline', userData)
            })
        })
    })

    // 取得線上使用者
    socket.on('getUsers', () => {
      User.findAll({
        where: { status: 'online' }
      })
        .then(user => {
          const onlineUsers = user.map((m) => {
            return {
              id: m.id,
              name: m.name,
              avatar: m.avatar,
              account: '@' + m.account
            }
          })
          socket.emit('receiveUsers', onlineUsers)
        })
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



    // 下線事件（使用者按登出）
    socket.on('sendOffline', (data, err) => {
      User.findByPk(data.userId)
        .then(user => {
          user.update({ status: 'offline', socketId: null })
            .then(() => {
              // const offlineUser = users.filter((item) => {
              //   return item.id != id
              const offlineUser = {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                status: user.status,
                socketId: user.socketId
              }
              socket.broadcast.emit('receiveOffline', offlineUser)
              socket.emit('receiveOffline', offlineUser)
              // io.sockets.emit('receiveOffline', offLineUser)
            })
        })
    })

    // 下線事件（使用者沒按登出，直接關掉瀏覽器）
    // socket.on("disconnect", (reason) => {
    //   console.log(reason) //離線原因
    //   User.findOne({ socketId: socket.id }) //用socketId找誰關掉瀏覽器
    //     .then(user => {
    //       user.update({ status: 'offline', socketId: null })
    //         .then(() => {
    //           const offline = {
    //             id: user.id,
    //             name: user.name,
    //             avatar: user.avatar,
    //             status: user.status,
    //             socketId: user.socketId
    //           }
    //           socket.broadcast.emit('receiveOffline', offline)
    //           socket.emit('receiveOffline', offline)
    //         })
    //     })
    // })
  })
}



