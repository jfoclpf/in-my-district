// to upload anew or update the data of an occurrence

const mysql = require('mysql')
const sqlFormatter = require('sql-formatter')
const debug = require('debug')('server:occurrences:submissions')

module.exports = ({ DBInfo, dBPoolConnections }) => (req, res) => {
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
}

function generateUuid () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
