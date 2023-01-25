const mysql = require('mysql')
const async = require('async')
const sqlFormatter = require('sql-formatter')
const debug = require('debug')('server:occurrences:solvedOccurrence')

module.exports = ({ DBInfo, dBPoolConnections, websiteUrlOrigin }) => (req, res) => {
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
}
