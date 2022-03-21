/* script that runs periodically, and which goes through entries of database
   and checks for entries' duplicates. It does it by checking if photos are exactly the same
   even if they have different names. If two entries have exactly the same photos (same file JPG data content),
   and if they are from the same user, the older entry is considered a duplicate and it is deleted */

/* eslint prefer-const: "off" */
/* eslint no-var: "off" */

const fs = require('fs')
const path = require('path')
const async = require('async')
const mysql = require('mysql') // module to get info from database
const debug = require('debug')('removeDuplicates')
const sqlFormatter = require('sql-formatter')

// directory where the images are stored with respect to present file
var imgDirectory
var db // database connection variable

const DBInfo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'keys', 'serverSecrets.json'), 'utf8')).database
debug(DBInfo)

module.exports = (_imgDirectory) => {
  imgDirectory = _imgDirectory
  removeDuplicates()
  setInterval(removeDuplicates, 1000 * 60 * 70) // every hour plus 70 minutes
}

// goes through the db and find inexistanf images, if so, delete them
function removeDuplicates () {
  // get all production entries grouped by uuid and then for each uuid ordered by date
  var query = `SELECT * FROM ${DBInfo.db_tables.ocorrencias} WHERE PROD=1 AND uuid!='87332d2a0aa5e634' ` +
    `ORDER BY ${DBInfo.db_tables.ocorrencias}.uuid  ASC, ${DBInfo.db_tables.ocorrencias}.data_data ASC`

  debug(sqlFormatter.format(query))

  db = mysql.createConnection(DBInfo)

  async.series([
    (next) => {
      db.connect((err) => {
        if (err) {
          console.error('error connecting: ' + err.stack)
          next(Error(err))
        } else {
          debug('User ' + DBInfo.user + ' connected successfully to database ' + DBInfo.database + ' at ' + DBInfo.host)
          next()
        }
      })
    },
    (next) => {
      db.query(query, (err, results, fields) => {
        if (err) {
          // error handling code goes here
          debug('Error inserting user data into database: ', err)
          next(Error(err))
        } else {
          // debug('Result from db query is : ', results)
          const entriesToBeDeleted = getEntriesToBeDeleted(results)
          async.each(entriesToBeDeleted, deleteEntry, (err) => {
            if (err) {
              debug('An error occurred')
              next(Error(err))
            } else {
              debug('All entriesToBeDeleted processed successfully')
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
      debug('Timer function "removeDuplicates" run successfully')
    }
  })
}

// repeated entries normally are inserted consecutively in the database
// that is, when an user submits twice the same entry
function getEntriesToBeDeleted (results) {
  var output = []
  // due to the mysql query, results are already grouped by uuid, and then ordered by date
  for (var i = 1; i < results.length; i++) {
    // previous entry
    const previousA = results[i - 1].data_hora
    const previousB = results[i - 1].data_freguesia
    const previousC = results[i - 1].uuid
    const previousD = results[i - 1].anomaly_code
    const previousPhotos = [results[i - 1].foto1, results[i - 1].foto2, results[i - 1].foto3, results[i - 1].foto4]
    // current entry
    const currentA = results[i].data_hora
    const currentB = results[i].data_freguesia
    const currentC = results[i].uuid
    const currentD = results[i].anomaly_code
    const currentPhotos = [results[i].foto1, results[i].foto2, results[i].foto3, results[i].foto4]

    if (previousA === currentA &&
        previousB === currentB &&
        previousC === currentC &&
        previousD === currentD) {
      // check if photo1 is the same
      if (fs.existsSync(previousPhotos[0]) && fs.existsSync(currentPhotos[0]) &&
          areTwoPhotosEqual(previousPhotos[0], currentPhotos[0])) {
        output.push(results[i - 1])
      }
    }
  }

  return output
}

// check if two photos are equal (have same jpg content)
function areTwoPhotosEqual (photoA, photoB) {
  if (photoA && photoB) {
    var photoABuffer = fs.readFileSync(path.join(imgDirectory, photoA))
    var photoBBuffer = fs.readFileSync(path.join(imgDirectory, photoB))
    return photoABuffer.equals(photoBBuffer)
  } else {
    return false
  }
}

function deleteEntry (entry, callback) {
  debug('Entry is to be deleted: ', entry)
  const query = `DELETE from ${DBInfo.db_tables.ocorrencias} ` +
    `WHERE uuid='${entry.uuid}' AND foto1='${entry.foto1}' ` +
    `AND data_concelho='${entry.data_concelho}' AND data_freguesia='${entry.data_freguesia}'`
  debug(sqlFormatter.format(query))

  db.query(query, (err, results, fields) => {
    if (err) {
      // error handling code goes here
      debug('Error deleting entry from database: ', err)
      callback(Error(err))
    } else {
      debug('Entry in database deleted successfully')
      // delete files from server corresponding to entry
      const photoArray = [entry.foto1, entry.foto2, entry.foto3, entry.foto4]
      for (var i = 0; i < photoArray.length; i++) {
        if (photoArray[i]) {
          const filePath = path.join(imgDirectory, photoArray[i])
          fs.unlink(filePath, (err) => {
            if (err) {
              debug(`Could not delete file ${filePath}`)
            } else {
              debug(`File deleted successfully: ${filePath}`)
            }
          })
        }
      }
      callback()
    }
  })
}
