/* server app that receives occurences from the users
and stores it in the dabatase */

/* eslint prefer-const: "off" */
/* eslint no-var: "off" */
/* eslint no-prototype-builtins: "off" */

const submissionsUrl = /.*\/serverapp$/ // to upload anew or update the data of an occurence
const requestHistoricUrl = /.*\/serverapp_get_historic$/
const commonPort = 3045
const imgUploadUrl = /.*\/serverapp_img_upload$/
const imgUploadUrlPort = 3046

const fs = require('fs')
const path = require('path')
const express = require('express')
const async = require('async')
const bodyParser = require('body-parser')
const cors = require('cors')
const mysql = require('mysql') // module to get info from database
const debug = require('debug')('server:main')
const sqlFormatter = require('sql-formatter')

const DBInfo = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'keys', 'serverSecrets.json'), 'utf8'))
  .database

debug(DBInfo)

const app = express()
var db1, db2

app.use(bodyParser.json())
app.use(cors())

app.get('/', function (req, res) {
  res.status(200).send('Server online')
})

// to upload anew or update the data of an occurence
app.post(submissionsUrl, function (req, res) {
  db1 = mysql.createConnection(DBInfo)
  // object got from POST
  var serverCommand = req.body.serverCommand || req.body.dbCommand // dbCommand for backward compatibility
  debug('serverCommand is ', serverCommand)
  var databaseObj = req.body.databaseObj
  debug('with databaseObj: ', databaseObj)

  if (!serverCommand || !databaseObj) {
    debug('Bad request')
    res.status(501).send('property serverCommand or databaseObj of reqquest does not exist')
    return // leave now
  }

  debug('\nInserting user data into ' +
                'database table ' + DBInfo.database + '->' + DBInfo.db_tables.ocorrencias)

  var query
  switch (serverCommand) {
    case 'submitNewEntryToDB': // (new entry in table) builds sql query to insert user data
      databaseObj.table_row_uuid = generateUuid()
      query = `INSERT INTO ${DBInfo.db_tables.ocorrencias} SET ${db1.escape(databaseObj)}`
      break
    case 'setSolvedOccurrenceStatus':
      // (update) when field 'ocorrencia_resolvida' is present in the request (client) it means just an update of a previous existing entry/line
      query = `UPDATE ${DBInfo.db_tables.ocorrencias} SET ocorrencia_resolvida=${db1.escape(databaseObj.ocorrencia_resolvida)} ` +
              `WHERE PROD=${db1.escape(databaseObj.PROD)} AND uuid=${db1.escape(databaseObj.uuid)} ` +
              `AND foto1=${db1.escape(databaseObj.foto1)}`
      break
    case 'setEntryAsDeletedInDatabase':
      // (update) when field 'deleted_by_admin' is present in the request (client) it means just an update of a previous existing entry/line
      query = `UPDATE ${DBInfo.db_tables.ocorrencias} SET deleted_by_admin=${db1.escape(databaseObj.deleted_by_admin)} ` +
              `WHERE PROD=${db1.escape(databaseObj.PROD)} AND uuid=${db1.escape(databaseObj.uuid)} ` +
              `AND foto1=${db1.escape(databaseObj.foto1)}`
      break
    default:
      debug('Bad request on dbCommand: ' + serverCommand)
      res.status(501).send(`dbCommand ${serverCommand} does not exist`)
      return // leave now
  }

  debug(sqlFormatter.format(query))

  async.series([
    function (next) {
      db1.connect(function (err) {
        if (err) {
          console.error('error connecting: ' + err.stack)
          res.status(501).send(JSON.stringify(err))
          next(Error(err))
        } else {
          debug('User ' + DBInfo.user + ' connected successfully to database ' + DBInfo.database + ' at ' + DBInfo.host)
          next()
        }
      })
    },
    function (next) {
      db1.query(query, function (err, results, fields) {
        if (err) {
          // error handling code goes here
          debug('Error inserting user data into database: ', err)
          res.status(501).send(JSON.stringify(err))
          next(Error(err))
        } else {
          debug('User data successfully added into ' +
                'database table ' + DBInfo.database + '->' + DBInfo.db_tables.ocorrencias + '\n\n')
          debug('Result from db query is : ', results)
          res.send(results)
          next()
        }
      })
    },
    function (next) {
      db1.end(function (err) {
        if (err) {
          next(Error(err))
        } else {
          next()
        }
      })
    }
  ],
  function (err, results) {
    if (err) {
      console.error('There was an error: ', err)
      db1.end()
    } else {
      debug('Submission successfully')
    }
    db1 = null
  })
})

app.get(requestHistoricUrl, function (req, res) {
  debug('Getting History')
  db2 = mysql.createConnection(DBInfo)

  const uuid = req.query.uuid
  const occurrenceUuid = req.query.occurrence_uuid

  debug('\nGetting entries from' +
    'database table ' + DBInfo.database + '->' + DBInfo.db_tables.ocorrencias)

  var query
  if (uuid) { // user device uuid
    // get the all entries for a specific user (ex: to generate historic for user)
    query = `SELECT * FROM ${DBInfo.db_tables.ocorrencias} WHERE uuid=${db2.escape(uuid)} AND deleted_by_admin=0 ORDER BY data_data ASC`
  } else if (occurrenceUuid) {
    // returns only single specific occurrence by its table_row_uuid (occurrence uuid)
    query = `SELECT * FROM ${DBInfo.db_tables.ocorrencias} WHERE table_row_uuid=${db2.escape(occurrenceUuid)}`
  } else {
    // get all production entries for all users except admin (ex: to generate a map of all entries)
    query = `SELECT * FROM ${DBInfo.db_tables.ocorrencias} WHERE PROD=1 AND uuid!='87332d2a0aa5e634' AND deleted_by_admin=0 ` +
      `ORDER BY ${DBInfo.db_tables.ocorrencias}.uuid  ASC, ${DBInfo.db_tables.ocorrencias}.data_data ASC`
  }

  debug(sqlFormatter.format(query))

  async.series([
    function (next) {
      db2.connect(function (err) {
        if (err) {
          console.error('error connecting: ' + err.stack)
          res.status(501).send(JSON.stringify(err))
          next(Error(err))
        } else {
          debug('User ' + DBInfo.user + ' connected successfully to database ' + DBInfo.database + ' at ' + DBInfo.host)
          next()
        }
      })
    },
    function (next) {
      db2.query(query, function (err, results, fields) {
        if (err) {
          // error handling code goes here
          debug('Error inserting user data into database: ', err)
          res.status(501).send(JSON.stringify(err))
          next(Error(err))
        } else {
          debug('Entries from db query: ', results.length)
          res.send(results)
          next()
        }
      })
    },
    function (next) {
      db2.end(function (err) {
        if (err) {
          next(Error(err))
        } else {
          next()
        }
      })
    }
  ],
  function (err, results) {
    if (err) {
      console.error('There was an error: ', err)
      db2.end()
    } else {
      debug('Request successfully')
    }
    db2 = null
  })
})

/* ############################################################################################## */
/* ############################################################################################## */
// app2 is used for uploading files (images of cars illegaly parked)

const fileUpload = require('express-fileupload')
const debugFileTransfer = require('debug')('server:file-transfer')
const app2 = express()

// enable files upload
app2.use(fileUpload({ createParentPath: true, debug: debugFileTransfer.enabled }))
app2.use(cors())
app2.use(bodyParser.json({ limit: '50mb' }))
app2.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

app2.post(imgUploadUrl, async (req, res) => {
  debugFileTransfer('Getting files')
  try {
    if (!req.files) {
      debugFileTransfer('No files')
      res.status(400).send({
        status: false,
        message: 'No file uploaded'
      })
    } else {
      // Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
      debugFileTransfer('Fetching files:')
      debugFileTransfer(req.files)
      const img = req.files.file
      // Use the mv() method to place the file in upload directory (i.e. "uploads")
      img.mv('./uploadedImages/' + img.name)

      // send response
      res.status(200).send({
        status: true,
        message: 'File is uploaded',
        data: {
          name: img.name,
          mimetype: img.mimetype,
          size: img.size
        }
      })
    }
  } catch (err) {
    debugFileTransfer('Error on requesting files:', err)
    res.status(500).send(err)
  }
})

function generateUuid () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0
    var v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/* ############################################################################################## */
/* ############################################################################################## */

const server = app.listen(commonPort, () => console.log(`Request server listening on port ${commonPort}!`))
const server2 = app2.listen(imgUploadUrlPort, () => console.log(`File upload server listening on port ${imgUploadUrlPort}!`))

// gracefully exiting upon CTRL-C or when PM2 stops the process
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)
function gracefulShutdown (signal) {
  console.log(`Received signal ${signal}. Closing http servers and db connections`)

  try {
    server.close()
    server2.close()
    async.parallel([function (callback) {
      if (db1) {
        db1.end(function (err) {
          if (err) {
            callback(Error(err))
          } else {
            callback()
          }
        })
      } else { // connection not active
        callback()
      }
    }, function (callback) {
      if (db2) {
        db2.end(function (err) {
          if (err) {
            callback(Error(err))
          } else {
            callback()
          }
        })
      } else { // connection not active
        callback()
      }
    }],
    function (err, results) {
      if (err) {
        console.error('Error on closing db connections', err)
        setTimeout(() => process.exit(1), 500)
      } else {
        console.log('Grecefully exited, servers and db connections closed')
        setTimeout(() => process.exit(0), 500)
      }
    })
  } catch (err) {
    console.error('Error on exiting', err)
    setTimeout(() => process.exit(1), 500)
  }
}

console.log('Initializing timers to cleanup database')
// directory where the images are stored with respect to present file
const imgDirectory = path.join(__dirname, 'uploadedImages')
require(path.join(__dirname, 'cleanBadPhotos'))(imgDirectory)
require(path.join(__dirname, 'removeDuplicates'))(imgDirectory)
