/* server app that receives occurences from the users
and stores it in the dabatase */

/* eslint no-prototype-builtins: "off" */

const fs = require('fs')
const path = require('path')
const mysql = require('mysql') // module to get info from database
const debug = require('debug')('server:main')

const configs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'keys-configs', 'configs.json'), 'utf8')
)
debug(configs)

const DBInfo = configs.server.mysql
const serverInfo = configs.server

// directory where photos are stored
serverInfo.photosDirectoryFullPath = path.join(__dirname, serverInfo.photosDirectory)
const photosDirectoryFullPath = serverInfo.photosDirectoryFullPath

DBInfo.connectionLimit = 20 // for pooling
const dBPoolConnections = mysql.createPool(DBInfo)

// main server to deal with occurrences
const server = require(path.join(__dirname, 'servers', 'occurrences', 'index'))({ configs, dBPoolConnections })

// server to download/upload photos
const server2 = require(path.join(__dirname, 'servers', 'photos', 'index'))(serverInfo)

console.log('Initializing timers to cleanup database')
require(path.join(__dirname, 'routines', 'cleanBadPhotos'))({ photosDirectoryFullPath, DBInfo, dBPoolConnections })
require(path.join(__dirname, 'routines', 'removeDuplicates'))({ photosDirectoryFullPath, DBInfo, dBPoolConnections })

// gracefully exiting upon CTRL-C or when PM2 stops the process
const shutdownServer = require(path.join(__dirname, 'utils', 'shutdownServer.js'))
process.on('SIGINT', (signal) => shutdownServer(signal, server, server2, dBPoolConnections))
process.on('SIGTERM', (signal) => shutdownServer(signal, server, server2, dBPoolConnections))
