/* server app that receives occurences from the users
and stores it in the dabatase */

/* eslint no-prototype-builtins: "off" */

const fs = require('fs')
const path = require('path')
const express = require('express')
const { engine } = require('express-handlebars')
const async = require('async')
const bodyParser = require('body-parser')
const cors = require('cors')
const mysql = require('mysql') // module to get info from database
const debug = require('debug')('server:main')
const sqlFormatter = require('sql-formatter')

const configs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'keys-configs', 'configs.json'), 'utf8')
)
debug(configs)

const serverUrlOrigin = configs.server.url.scheme + '://' + configs.server.url.host // eslint-disable-line no-unused-vars
const websiteUrlOrigin = configs.website.scheme + '://' + configs.website.host

const DBInfo = configs.server.mysql
const serverInfo = configs.server

// paths
const submissionsUrlPath = serverInfo.url.paths.submissions // to upload anew or update the data of an occurence
const requestHistoricUrlPath = serverInfo.url.paths.requestHistoric
const solvedOccurrenceUrlPath = serverInfo.url.paths.solvedOccurrence // for the link municipalities and parishes use to declare occurrence as resolved
const mainServerPort = serverInfo.mainServerPort

// upload of images/photos
const photosUploadUrlPath = serverInfo.url.paths.photosUpload
const photosServerPort = serverInfo.photosServerPort
const photosDirectoryFullPath = path.join(__dirname, serverInfo.photosDirectory)

DBInfo.connectionLimit = 20 // for pooling
const dBPoolConnections = mysql.createPool(DBInfo)

const app = express()

app.use(bodyParser.json())
app.use(cors())

app.engine('.hbs', engine({ extname: '.hbs' }))
app.set('view engine', '.hbs')
app.set('views', './views')

app.get('/', function (req, res) {
  res.status(200).send('Server online')
})

// to upload anew or update the data of an occurrence
app.post(submissionsUrlPath, function (req, res) {
  // object got from POST
  const serverCommand = req.body.serverCommand || req.body.dbCommand // dbCommand for backward compatibility
  debug('serverCommand is ', serverCommand)
  const databaseObj = req.body.databaseObj
  debug('with databaseObj: ', databaseObj)

  if (!serverCommand || !databaseObj) {
    debug('Bad request')
    res.status(501).json({ error: 'property serverCommand or databaseObj of request does not exist' })
    return // leave now
  }

  debug('\nInserting user data into ' +
                'database table ' + DBInfo.database + '->' + DBInfo.db_tables.ocorrencias)

  let query
  let returnedData = {}
  switch (serverCommand) {
    case 'submitNewEntryToDB': { // (new entry in table) builds sql query to insert user data
      databaseObj.table_row_uuid = generateUuid()
      databaseObj.chave_confirmacao_ocorrencia_resolvida_por_op = generateUuid().slice(0, 8) // get some random key

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
    }
    case 'setSolvedOccurrenceStatus': {
      // when the user sets the occurrence as resolved, user has priority over parish or municipalitiy setting occurence as solved
      const bIsSolved = databaseObj.ocorrencia_resolvida
      query = `UPDATE ${DBInfo.db_tables.ocorrencias} ` +
              `SET ${mysql.escape({ ocorrencia_resolvida: bIsSolved, ocorrencia_resolvida_por_op: bIsSolved })} ` +
              `WHERE uuid=${mysql.escape(databaseObj.uuid)} AND table_row_uuid=${mysql.escape(databaseObj.table_row_uuid)}`
      break
    }
    case 'setEntryInDbAsDeletedByAdmin': {
      // (update) when field 'deleted_by_admin' is present in the request (client) it means just an update of a previous existing entry/line
      query = `UPDATE ${DBInfo.db_tables.ocorrencias} SET deleted_by_admin=1 ` +
              `WHERE uuid=${mysql.escape(databaseObj.uuid)} AND table_row_uuid=${mysql.escape(databaseObj.table_row_uuid)}`
      break
    }
    case 'setEntryInDbAsDeletedByUser': {
      // (update) when field 'deleted_by_admin' is present in the request (client) it means just an update of a previous existing entry/line
      query = `UPDATE ${DBInfo.db_tables.ocorrencias} SET deleted_by_user=1 ` +
              `WHERE uuid=${mysql.escape(databaseObj.uuid)} AND table_row_uuid=${mysql.escape(databaseObj.table_row_uuid)}`
      break
    }
    default: {
      console.error('Bad request on dbCommand: ' + serverCommand)
      res.status(501).json({ error: `POST dbCommand ${serverCommand} does not exist` })
      return // leave now
    }
  }

  debug(sqlFormatter.format(query))

  dBPoolConnections.query(query, function (err, results, fields) {
    if (err) {
      console.error('Error inserting user data into database: ', err)
      res.status(500).json({ error: 'Error inserting user data into database' })
    } else {
      debug('User data successfully added into ' +
            'database table ' + DBInfo.database + '->' + DBInfo.db_tables.ocorrencias + '\n\n')
      debug('Result from db query is : ', results)
      res.json(returnedData)
    }
  })
})

// to fetch information from occurrences from database
app.get(requestHistoricUrlPath, function (req, res) {
  debug('Getting History')
  debug(req.query)

  const uuid = req.query.uuid // device UUID
  const occurrenceUuid = req.query.occurrence_uuid

  debug('\nGetting entries from' +
    'database table ' + DBInfo.database + '->' + DBInfo.db_tables.ocorrencias)

  // not all fields should be public, other fields like name and email
  // are sensitive and confirmation keys are secret
  const fieldsArr = ['table_row_uuid', 'uuid', 'foto1', 'foto2', 'foto3', 'foto4',
    'data_data', 'data_hora', 'data_concelho', 'data_freguesia', 'data_local',
    'data_num_porta', 'data_coord_latit', 'data_coord_long', 'anomaly1', 'anomaly2',
    'anomaly_code', 'email_concelho', 'email_freguesia', 'ocorrencia_resolvida',
    'ocorrencia_resolvida_por_op', 'ocorrencia_resolvida_por_municipio',
    'ocorrencia_resolvida_por_freguesia', 'ocorrencia_resolvida_por_utilizadores_adicionais']

  let query = `SELECT ${mysql.escapeId(fieldsArr)} FROM ${DBInfo.database}.${DBInfo.db_tables.ocorrencias} `

  if (uuid) { // user device uuid
    // get the all entries for a specific user (ex: to generate historic for user)
    query += `WHERE uuid=${mysql.escape(uuid)} AND deleted_by_admin=0 AND deleted_by_user=0 AND deleted_by_sys=0 ` +
             'ORDER BY data_data ASC'
  } else if (occurrenceUuid) {
    // returns only single specific occurrence by its table_row_uuid (occurrence uuid)
    query += `WHERE table_row_uuid=${mysql.escape(occurrenceUuid)}`
  } else if (Object.keys(req.query).some(el => fieldsArr.includes(el))) {
    // test if any of the url query parameters keys are in the fieldsArr list
    query += 'WHERE '
    for (const queryKey in req.query) {
      if (req.query.hasOwnProperty(queryKey) && fieldsArr.includes(queryKey)) {
        query += `${mysql.escapeId(queryKey)}=${mysql.escape(req.query[queryKey])} AND `
      }
    }
    query += 'PROD=1 AND deleted_by_admin=0 AND deleted_by_user=0 AND deleted_by_sys=0 ' +
             'ORDER BY data_data ASC'
  } else if (Object.keys(req.query).length === 0) {
    // get all unsolved production entries for all users except admin (ex: to generate a map of all entries)
    query += 'WHERE PROD=1 AND deleted_by_admin=0 AND deleted_by_user=0 AND deleted_by_sys=0 AND ocorrencia_resolvida=0 ' +
             `ORDER BY ${DBInfo.db_tables.ocorrencias}.uuid  ASC, ${DBInfo.db_tables.ocorrencias}.data_data ASC`
  } else {
    res.status(400).json({ error: 'Error on the query parameters' })
    return
  }

  debug(sqlFormatter.format(query))

  dBPoolConnections.query(query, function (err, results, fields) {
    if (err) {
      // error handling code goes here
      console.error('Error fetching info from database: ', err)
      res.status(500).json({ error: 'Error fetching info from database' })
    } else {
      debug('Entries from db query: ', results.length)
      res.json(results)
    }
  })
})

// link for the municipality or parish authorities to click to mark occurence as resolved
app.get(solvedOccurrenceUrlPath + '/:authority?/:table_row_uuid?/:key?', function (req, res) {
  const authority = req.params.authority
  const tableRowUuid = req.params.table_row_uuid
  const key = req.params.key

  if (
    (authority !== 'freguesia' && authority !== 'municipio') ||
    !tableRowUuid ||
    !key
  ) {
    debug('Error: not enough info or wrong authority. ' + JSON.stringify({ authority, tableRowUuid, key }))
    res.status(501).send('Erro no pedido')
    return
  }

  dBPoolConnections.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to DB', err)
      res.status(501).send('Erro na ligação à base de dados')
      return
    }

    let whoSolvedOk
    let entry

    async.series([
      (callback) => {
        const query = `SELECT * FROM ${DBInfo.db_tables.ocorrencias} WHERE ${mysql.escape({ table_row_uuid: tableRowUuid })}`
        debug(sqlFormatter.format(query))

        connection.query(query, (err, results, fields) => {
          if (err) {
            console.error('Error querying to DB', err)
            callback(Error('ERR_DB_CONNECT'))
          } else if (results.length !== 1) {
            callback(Error('INVALID_ENTRY_UUID'))
          } else {
            entry = results[0]
            debug(`Entry ${entry.table_row_uuid} fetched`)
            if (
              authority === 'freguesia' &&
              entry.chave_confirmacao_ocorrencia_resolvida_por_freguesia === key
            ) {
              whoSolvedOk = 'parish'
              callback()
            } else if (
              authority === 'municipio' &&
              entry.chave_confirmacao_ocorrencia_resolvida_por_municipio === key
            ) {
              whoSolvedOk = 'municipality'
              callback()
            } else {
              callback(Error('WRONG_KEY'))
            }
          }
        })
      },
      (callback) => {
        let solvedObj2Db
        if (whoSolvedOk === 'parish') {
          solvedObj2Db = { ocorrencia_resolvida_por_freguesia: 1 }
        } else if (whoSolvedOk === 'municipality') {
          solvedObj2Db = { ocorrencia_resolvida_por_municipio: 1 }
        } else {
          callback(Error('unknown whoSolvedOk: ' + solvedObj2Db))
          return
        }

        const query = `UPDATE ${DBInfo.database}.${DBInfo.db_tables.ocorrencias} ` +
          `SET ${mysql.escape(solvedObj2Db)} ` +
          `WHERE table_row_uuid='${entry.table_row_uuid}'`

        debug(sqlFormatter.format(query))

        connection.query(query, (err, results, fields) => {
          if (err) {
            console.error(err)
            callback(Error('ERR_DB_CONNECT'))
          } else {
            debug(`Entry ${entry.table_row_uuid} marked as solved by ${whoSolvedOk}`)
            callback()
          }
        })
      }], (err) => {
      connection.release()
      if (err) {
        if (err.message === 'ERR_DB_CONNECT') {
          res.status(501).send('Ocorreu um erro na ligação à base de dados')
        } else if (err.message === 'INVALID_ENTRY_UUID') {
          res.status(501).send('Ocorreu um erro: identificador da ocorrência inválido')
        } else {
          res.status(501).send('Ocorreu um erro')
        }
      } else {
        res.type('text/html').render('home', {
          layout: false,
          websiteUrlOrigin,
          data: `<a href="${websiteUrlOrigin}/ocorrencia/?uuid=${entry.table_row_uuid}">Ocorrência</a> marcada como resolvida.<br>` +
                'Muito obrigados pela participação!'
        })
      }
    })
  })
})

function generateUuid () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/* ############################################################################################## */
/* ############################################################################################## */

const server = app.listen(mainServerPort, () => console.log(`Request server listening on port ${mainServerPort}!`))

// server for uploading files to main server's disk
const server2 = require(path.join(__dirname, 'photosUpload'))
  .init({ photosUploadUrlPath, photosServerPort, photosDirectoryFullPath })

console.log('Initializing timers to cleanup database')
// directory where the images are stored with respect to present file
require(path.join(__dirname, 'cleanBadPhotos'))
  .init({ photosDirectoryFullPath, DBInfo, dBPoolConnections })
require(path.join(__dirname, 'removeDuplicates'))
  .init({ photosDirectoryFullPath, DBInfo, dBPoolConnections })

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
