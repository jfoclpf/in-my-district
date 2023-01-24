const async = require('async')

module.exports = function (signal, server, server2, dBPoolConnections) {
  console.log(`Received signal ${signal}. Closing http servers and db connections`)

  try {
    async.parallel([
      (callback) => {
        server.close(() => {
          console.log('Main server closed')
          callback()
        })
      },
      (callback) => {
        server2.close(() => {
          console.log('Server for photos upload closed')
          callback()
        })
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
        process.exitCode = 0
      }
    })
  } catch (err) {
    console.error('Error on exiting', err)
    setTimeout(() => process.exit(1), 500)
  }
}
