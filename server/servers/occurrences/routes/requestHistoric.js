// to fetch information from occurrences from database

/* eslint no-prototype-builtins: "off" */

const mysql = require('mysql')
const sqlFormatter = require('sql-formatter')
const debug = require('debug')('server:occurrences:requestHistoric')

module.exports = ({ DBInfo, dBPoolConnections }) => (req, res) => {
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
}
