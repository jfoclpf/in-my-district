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

const DBInfo = JSON.parse(fs.readFileSync('DBcredentials.json', 'utf8'))
debug(DBInfo)

const app = express()

app.use(bodyParser.json())
app.use(cors())

// to upload anew or update the data of an occurence
app.post(submissionsUrl, function (req, res) {
  var db = mysql.createConnection(DBInfo)
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
      query = `INSERT INTO ${DBInfo.db_tables.ocorrencias} SET ${db.escape(databaseObj)}`
      break
    case 'setSolvedOccurrenceStatus':
      // (update) when field 'ocorrencia_resolvida' is present in the request (client) it means just an update of a previous existing entry/line
      query = `UPDATE ${DBInfo.db_tables.ocorrencias} SET ocorrencia_resolvida=${db.escape(databaseObj.ocorrencia_resolvida)} ` +
              `WHERE PROD=${db.escape(databaseObj.PROD)} AND uuid=${db.escape(databaseObj.uuid)} ` +
              `AND foto1=${db.escape(databaseObj.foto1)}`
      break
    case 'setEntryAsDeletedInDatabase':
      // (update) when field 'deleted_by_admin' is present in the request (client) it means just an update of a previous existing entry/line
      query = `UPDATE ${DBInfo.db_tables.ocorrencias} SET deleted_by_admin=${db.escape(databaseObj.deleted_by_admin)} ` +
              `WHERE PROD=${db.escape(databaseObj.PROD)} AND uuid=${db.escape(databaseObj.uuid)} ` +
              `AND foto1=${db.escape(databaseObj.foto1)}`
      break
    default:
      debug('Bad request on dbCommand: ' + serverCommand)
      res.status(501).send(`dbCommand ${serverCommand} does not exist`)
      return // leave now
  }

  debug(sqlFormatter.format(query))

  async.series([
    function (next) {
      db.connect(function (err) {
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
      db.query(query, function (err, results, fields) {
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
      db.end(function (err) {
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
      console.log('There was an error: ')
      console.log(err)
    } else {
      debug('Submission successfully')
    }
  })
})

app.get(requestHistoricUrl, function (req, res) {
  debug('Getting History')
  var db = mysql.createConnection(DBInfo)

  const uuid = req.query.uuid

  const userAgent = req.get('user-agent')
  if (userAgent !== 'APP/com.in.my.district') {
    res.send('')
    return
  }

  debug('\nGetting entries from' +
    'database table ' + DBInfo.database + '->' + DBInfo.db_tables.ocorrencias)

  var query
  if (uuid) {
    // get the all entries for a specific user (ex: to generate historic for user)
    query = `SELECT * FROM ${DBInfo.db_tables.ocorrencias} WHERE uuid=${db.escape(uuid)} AND deleted_by_admin=0 ORDER BY data_data ASC`
  } else {
    // get all production entries for all users except admin (ex: to generate a map of all entries)
    query = `SELECT * FROM ${DBInfo.db_tables.ocorrencias} WHERE PROD=1 AND uuid!='87332d2a0aa5e634' AND deleted_by_admin=0 ` +
      `ORDER BY ${DBInfo.db_tables.ocorrencias}.uuid  ASC, ${DBInfo.db_tables.ocorrencias}.data_data ASC`
  }

  debug(sqlFormatter.format(query))

  async.series([
    function (next) {
      db.connect(function (err) {
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
      db.query(query, function (err, results, fields) {
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
      db.end(function (err) {
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
      console.log('There was an error: ')
      console.log(err)
    } else {
      debug('Request successfully')
    }
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
app2.use(bodyParser.json())
app2.use(bodyParser.urlencoded({ extended: true }))

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

app.listen(commonPort, () => console.log(`Request server listening on port ${commonPort}!`))
app2.listen(imgUploadUrlPort, () => console.log(`File upload server listening on port ${imgUploadUrlPort}!`))

console.log('Initializing timers to cleanup database')
// directory where the images are stored with respect to present file
const imgDirectory = path.join(__dirname, 'uploadedImages')
require(path.join(__dirname, 'cleanBadPhotos'))(imgDirectory)
require(path.join(__dirname, 'removeDuplicates'))(imgDirectory)
