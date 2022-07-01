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

DBInfo.connectionLimit = 20 // for pooling
const dBPoolConnections = mysql.createPool(DBInfo)
debug(DBInfo)

const app = express()

app.use(bodyParser.json())
app.use(cors())

app.get('/', function (req, res) {
  res.status(200).send('Server online')
})

// to upload anew or update the data of an occurence
app.post(submissionsUrl, function (req, res) {
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
  var returnedData = {}
  switch (serverCommand) {
    case 'submitNewEntryToDB': // (new entry in table) builds sql query to insert user data
      databaseObj.table_row_uuid = generateUuid()
      databaseObj.chave_confirmacao_ocorrencia_resolvida_por_op = generateUuid().slice(0, 8)

      // just generates confirmation keys if email was indeed sent
      databaseObj.chave_confirmacao_ocorrencia_resolvida_por_municipio =
        databaseObj.email_concelho ? generateUuid().slice(0, 8) : null
      databaseObj.chave_confirmacao_ocorrencia_resolvida_por_freguesia =
        databaseObj.email_freguesia ? generateUuid().slice(0, 8) : null

      returnedData = {
        table_row_uuid: databaseObj.table_row_uuid,
        chave_confirmacao_ocorrencia_resolvida_por_op: databaseObj.chave_confirmacao_ocorrencia_resolvida_por_op,
        chave_confirmacao_ocorrencia_resolvida_por_municipio: databaseObj.chave_confirmacao_ocorrencia_resolvida_por_municipio,
        chave_confirmacao_ocorrencia_resolvida_por_freguesia: databaseObj.chave_confirmacao_ocorrencia_resolvida_por_freguesia
      }

      query = `INSERT INTO ${DBInfo.db_tables.ocorrencias} SET ${mysql.escape(databaseObj)}`
      break
    case 'setSolvedOccurrenceStatus':
      // (update) when field 'ocorrencia_resolvida' is present in the request (client) it means just an update of a previous existing entry/line
      query = `UPDATE ${DBInfo.db_tables.ocorrencias} SET ocorrencia_resolvida=${mysql.escape(databaseObj.ocorrencia_resolvida)} ` +
              `WHERE PROD=${mysql.escape(databaseObj.PROD)} AND uuid=${mysql.escape(databaseObj.uuid)} ` +
              `AND foto1=${mysql.escape(databaseObj.foto1)}`
      break
    case 'setEntryInDbAsDeletedByAdmin':
      // (update) when field 'deleted_by_admin' is present in the request (client) it means just an update of a previous existing entry/line
      query = `UPDATE ${DBInfo.db_tables.ocorrencias} SET deleted_by_admin=1 ` +
              `WHERE uuid=${mysql.escape(databaseObj.uuid)} AND table_row_uuid=${mysql.escape(databaseObj.table_row_uuid)}`
      break
    case 'setEntryInDbAsDeletedByUser':
      // (update) when field 'deleted_by_admin' is present in the request (client) it means just an update of a previous existing entry/line
      query = `UPDATE ${DBInfo.db_tables.ocorrencias} SET deleted_by_user=1 ` +
              `WHERE uuid=${mysql.escape(databaseObj.uuid)} AND table_row_uuid=${mysql.escape(databaseObj.table_row_uuid)}`
      break
    default:
      debug('Bad request on dbCommand: ' + serverCommand)
      res.status(501).send(`dbCommand ${serverCommand} does not exist`)
      return // leave now
  }

  debug(sqlFormatter.format(query))

  dBPoolConnections.query(query, function (err, results, fields) {
    if (err) {
      debug('Error inserting user data into database: ', err)
      res.status(501).send(JSON.stringify(err))
    } else {
      debug('User data successfully added into ' +
            'database table ' + DBInfo.database + '->' + DBInfo.db_tables.ocorrencias + '\n\n')
      debug('Result from db query is : ', results)
      res.send(returnedData)
    }
  })
})

app.get(requestHistoricUrl, function (req, res) {
  debug('Getting History')

  const uuid = req.query.uuid // device UUID
  const occurrenceUuid = req.query.occurrence_uuid

  debug('\nGetting entries from' +
    'database table ' + DBInfo.database + '->' + DBInfo.db_tables.ocorrencias)

  var query
  if (uuid) { // user device uuid
    // get the all entries for a specific user (ex: to generate historic for user)
    query = `SELECT * FROM ${DBInfo.db_tables.ocorrencias} ` +
            `WHERE uuid=${mysql.escape(uuid)} AND deleted_by_admin=0 AND deleted_by_user=0 ` +
            'ORDER BY data_data ASC'
  } else if (occurrenceUuid) {
    // returns only single specific occurrence by its table_row_uuid (occurrence uuid)
    query = `SELECT * FROM ${DBInfo.db_tables.ocorrencias} WHERE table_row_uuid=${mysql.escape(occurrenceUuid)}`
  } else {
    // get all unsolved production entries for all users except admin (ex: to generate a map of all entries)
    query = `SELECT * FROM ${DBInfo.db_tables.ocorrencias} ` +
            'WHERE PROD=1 AND deleted_by_admin=0 AND deleted_by_user=0 AND ocorrencia_resolvida=0 ' +
            `ORDER BY ${DBInfo.db_tables.ocorrencias}.uuid  ASC, ${DBInfo.db_tables.ocorrencias}.data_data ASC`
  }

  debug(sqlFormatter.format(query))

  dBPoolConnections.query(query, function (err, results, fields) {
    if (err) {
      // error handling code goes here
      debug('Error inserting user data into database: ', err)
      res.status(501).send(JSON.stringify(err))
    } else {
      debug('Entries from db query: ', results.length)
      res.send(results)
    }
  })
})

app.get('/resolvido/:authority?/:table_row_uuid?/:key?', function (req, res) {
  const authority = req.params.authority
  const tableRowUuid = req.params.table_row_uuid
  const key = req.params.key

  if (
    (authority !== 'freguesia' && authority !== 'municipio') ||
    !tableRowUuid ||
    !key
  ) {
    res.status(501).send('Wrong request')
  }
  // insert solved into  DB and send email to OP
})

/* ############################################################################################## */
/* ############################################################################################## */
// app2 is used for uploading files

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

console.log('Initializing timers to cleanup database')
// directory where the images are stored with respect to present file
const imgDirectory = path.join(__dirname, 'uploadedImages')
require(path.join(__dirname, 'cleanBadPhotos'))
  .init({ imgDirectory, DBInfo, dBPoolConnections })
require(path.join(__dirname, 'removeDuplicates'))
  .init({ imgDirectory, DBInfo, dBPoolConnections })

// gracefully exiting upon CTRL-C or when PM2 stops the process
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)
function gracefulShutdown (signal) {
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
          console.log('Server for files upload closed')
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
