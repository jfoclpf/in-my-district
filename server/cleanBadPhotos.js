/* script that runs periodically, and which goes through entries of database
   and checks if pathnames of photos are valid (i.e. photos files exist in server),
   and in case there are entries whose all photos are invalid (inexistent photos)
   the script deletes said entry from the database */

/* eslint prefer-const: "off" */
/* eslint no-var: "off" */

const fs = require('fs')
const path = require('path')
const async = require('async')
const mysql = require('mysql') // module to get info from database
const debug = require('debug')('cleanBadPhotos')
const sqlFormatter = require('sql-formatter')

// directory where the images are stored with respect to present file
var imgDirectory
var db // database connection variable

const DBInfo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'keys', 'serverSecrets.json'), 'utf8')).database
debug(DBInfo)

module.exports = (_imgDirectory) => {
  imgDirectory = _imgDirectory
  cleanBadPhotos()
  setInterval(cleanBadPhotos, 1000 * 60 * 60) // every hour
  return db // to close connection on main script upon graceful shutdown
}

// goes through the db and find inexistanf images, if so, delete them
function cleanBadPhotos () {
  db = mysql.createConnection(DBInfo)

  async.series([
    (next) => {
      db.connect((err) => {
        if (err) {
          console.error('error connecting: ' + err.message)
          next(Error(err))
        } else {
          debug('User ' + DBInfo.user + ' connected successfully to database ' + DBInfo.database + ' at ' + DBInfo.host)
          next()
        }
      })
    },
    (next) => {
      // get all production entries
      const query = `SELECT * FROM ${DBInfo.database}.${DBInfo.db_tables.ocorrencias} WHERE PROD=1 AND uuid!='87332d2a0aa5e634'` // android uuid of the main developer should be ignored
      debug(sqlFormatter.format(query))

      db.query(query, (err, results, fields) => {
        if (err) {
          // error handling code goes here
          debug('Error inserting user data into database: ', err)
          next(Error(err))
        } else {
          // debug('Result from db query is : ', results)
          async.each(results, processDBentry, (err) => {
            if (err) {
              debug('An error occurred')
              next(Error(err))
            } else {
              debug('All entries processed successfully')
              next()
            }
          })
        }
      })
    },
    (next) => {
      db.end((err) => {
        if (err) {
          next(Error(err))
        } else {
          debug('DB connection closed successfully')
          next()
        }
      })
    }
  ],
  (err, results) => {
    if (err) {
      console.log('There was an error: ')
      console.log(err)
      if (db && db.end) {
        console.log('Closing DB connection')
        db.end()
      }
    } else {
      debug('Timer function "cleanBadPhotos" run successfully')
    }
  })
}

function processDBentry (entry, callback) {
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

  if (deleteTableRow) { // delete full entry/table row
    debug('Table row/entry is to be deleted since none of the photos are available: ', entry)
    const query = `DELETE from ${DBInfo.database}.${DBInfo.db_tables.ocorrencias} ` +
      `WHERE table_row_uuid='${entry.table_row_uuid}'`
    debug(sqlFormatter.format(query))

    db.query(query, (err, results, fields) => {
      if (err) {
        debug(`Error deleting entry from table (${err.message}) where table_row_uuid='${entry.table_row_uuid}`)
        callback(Error(err))
      } else {
        debug('Entry deleted successfully')
        callback()
      }
    })
  } else if (Object.keys(photosNotFound).length) {
    debug(`${Object.keys(photosNotFound).toString()} will be removed from row with table_row_uuid=${entry.table_row_uuid}`)

    const query = `UPDATE ${DBInfo.database}.${DBInfo.db_tables.ocorrencias} ` +
      `SET ${db.escape(photosNotFound)}` +
      `WHERE table_row_uuid='${entry.table_row_uuid}'`
    debug(sqlFormatter.format(query), '\n')

    db.query(query, (err, results, fields) => {
      if (err) {
        debug(`Error removing fotos from table row (${err.message}) where table_row_uuid='${entry.table_row_uuid}`)
        callback(Error(err))
      } else {
        debug('Photos removed successfully')
        callback()
      }
    })
  } else {
    // does not do anything
    callback()
  }
}
