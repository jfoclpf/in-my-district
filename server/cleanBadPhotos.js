/* script that runs periodically, and which goes through entries of database
   and checks if pathnames of photos are valid (i.e. photos files exist in server),
   and in case there are entries whose all photos are invalid (inexistent photos)
   the script marks the entry field `deleted_by_sys` as true */

/* eslint prefer-const: "off" */
/* eslint no-var: "off" */

const fs = require('fs')
const path = require('path')
const async = require('async')
const mysql = require('mysql') // module to get info from database
const debug = require('debug')('cleanBadPhotos')
const sqlFormatter = require('sql-formatter')

var imgDirectory // directory where the images are stored with respect to present file
var DBInfo
var dBPoolConnections // database connection variable

module.exports.init = (data) => {
  imgDirectory = data.imgDirectory
  DBInfo = data.DBInfo
  dBPoolConnections = data.dBPoolConnections

  cleanBadPhotos()
  setInterval(cleanBadPhotos, 1000 * 60 * 60) // every hour
}

// goes through the db and find inexistanf images, if so, delete them
function cleanBadPhotos () {
  // get all production entries
  const query = `SELECT * FROM ${DBInfo.database}.${DBInfo.db_tables.ocorrencias} WHERE PROD=1`
  debug(sqlFormatter.format(query))

  dBPoolConnections.query(query, (err, results, fields) => {
    if (err) {
      // error handling code goes here
      console.error('cleanBadPhotos: Error connecting or querying to database: ', err)
    } else {
      // debug('Result from db query is : ', results)
      async.each(results, processDBentry, (err) => {
        if (err) {
          console.error('cleanBadPhotos: An error occurred:', err)
        } else {
          debug('All entries processed successfully')
        }
      })
    }
  })
}

function processDBentry (entry, mainCallback) {
  var photoArray = [entry.foto1, entry.foto2, entry.foto3, entry.foto4]

  var deleteTableRow = true
  const photosNotFound = {}
  for (var i = 0; i < photoArray.length; i++) {
    if (photoArray[i]) {
      const fileName = path.join(imgDirectory, photoArray[i])
      if (fs.existsSync(fileName)) {
        deleteTableRow = false
      } else {
        debug(`foto${i + 1} (${photoArray[i]}) of table_row_uuid=${entry.table_row_uuid} does not exist`)
        photosNotFound[`foto${i + 1}`] = ''
      }
    }
  }

  dBPoolConnections.getConnection((err, connection) => {
    if (err) {
      mainCallback(Error('Error getting connection'))
      return
    }

    async.series([
      (callback) => {
        const query = `UPDATE ${DBInfo.database}.${DBInfo.db_tables.ocorrencias} ` +
          `SET ${mysql.escape({ deleted_by_sys: Number(deleteTableRow) })} ` +
          `WHERE table_row_uuid='${entry.table_row_uuid}'`

        connection.query(query, (err, results, fields) => {
          if (err) {
            console.error(`cleanBadPhotos: Error marking entry as deleted from table where table_row_uuid='${entry.table_row_uuid}': ${err.message}`)
            console.error('cleanBadPhotos: SQL that triggered error:\n' + sqlFormatter.format(query))
            callback(Error(err))
          } else {
            debug(`Entry ${entry.table_row_uuid} marked as ${deleteTableRow ? '' : 'NOT '}deleted`)
            callback()
          }
        })
      },
      (callback) => {
        // if entry is not to be marked as deleted and some of the photos don't exist in disk
        if (!deleteTableRow && Object.keys(photosNotFound).length) {
          debug(`${Object.keys(photosNotFound).toString()} will be removed from row with table_row_uuid=${entry.table_row_uuid}`)

          const query = `UPDATE ${DBInfo.database}.${DBInfo.db_tables.ocorrencias} ` +
            `SET ${mysql.escape(photosNotFound)} ` +
            `WHERE table_row_uuid='${entry.table_row_uuid}'`

          connection.query(query, (err, results, fields) => {
            if (err) {
              console.error(`cleanBadPhotos: Error removing fotos from table row (${err.message}) where table_row_uuid='${entry.table_row_uuid}`)
              console.error('cleanBadPhotos: SQL that triggered error:\n' + sqlFormatter.format(query))
              callback(Error(err))
            } else {
              debug(`Photos ${JSON.stringify(Object.keys(photosNotFound))} removed successfully from table entry ${entry.table_row_uuid}`)
              callback()
            }
          })
        } else {
          // does not do anything else
          callback()
        }
      }], (err) => {
      connection.release()
      if (err) {
        mainCallback(Error(err))
      } else {
        mainCallback()
      }
    })
  })
}
