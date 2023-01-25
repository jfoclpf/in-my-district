const async = require('async')

module.exports = function (signal, server, server2, dBPoolConnections) {
  console.log(`Received signal ${signal}. Closing http servers and db connections`)

  try {
    async.parallel([
      (callback) => {
        // closeAllConnections() is only available after Node v18.02
        if (server.closeAllConnections) {
          server.closeAllConnections()
          console.log('Main server closed')
          callback()
        } else {
          server.close(() => {
            console.log('Main server closed')
            callback()
          })
        }
      },
      (callback) => {
        // closeAllConnections() is only available after Node v18.02
        if (server2.closeAllConnections) {
          server2.closeAllConnections()
          console.log('Photos server closed')
          callback()
        } else {
          server2.close(() => {
            console.log('Photos server closed')
            callback()
          })
        }
      },
      (callback) => {
        dBPoolConnections.end((err) => {
          if (err) {
            callback(Error('Error on closing db pool of connections' + JSON.stringify(err)))
          } else {
            console.log('DB pool of connections closed successfully')
            callback()
          }
        })
      }
    ],
    function (err, results) {
      if (err) {
        console.error('Error on closing servers or db connections', err)
        setTimeout(() => process.exit(1), 5000)
      } else {
        console.log('Grecefully exited, servers and DB connections closed for main script')
        setTimeout(() => process.exit(0), 1000)
      }
    })
  } catch (err) {
    console.error('Error on exiting', err)
    setTimeout(() => process.exit(1), 500)
  }
}
