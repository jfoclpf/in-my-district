// main server for dealing with occurrences

const path = require('path')
const express = require('express')
const { engine } = require('express-handlebars')
const bodyParser = require('body-parser')
const cors = require('cors')

module.exports = ({ configs, dBPoolConnections }) => {
  const serverUrlOrigin = configs.server.url.scheme + '://' + configs.server.url.host // eslint-disable-line no-unused-vars
  const websiteUrlOrigin = configs.website.scheme + '://' + configs.website.host

  const DBInfo = configs.server.mysql
  const serverInfo = configs.server

  // paths
  const submissionsUrlPath = serverInfo.url.paths.submissions // to upload anew or update the data of an occurence
  const requestHistoricUrlPath = serverInfo.url.paths.requestHistoric
  const solvedOccurrenceUrlPath = serverInfo.url.paths.solvedOccurrence // for the link municipalities and parishes use to declare occurrence as resolved
  const mainServerPort = serverInfo.mainServerPort

  const app = express()

  app.use(bodyParser.json())
  app.use(cors())

  app.engine('.hbs', engine({ extname: '.hbs' }))
  app.set('view engine', '.hbs')
  app.set('views', './views')

  app.get('/', function (req, res) {
    res.status(200).send('Server online')
  })

  // Load Express routes
  const routesDir = path.join(__dirname, 'routes')

  // to upload anew or update the data of an occurrence
  app.post(submissionsUrlPath, require(path.join(routesDir, 'submissions'))({ DBInfo, dBPoolConnections }))

  // to fetch information from occurrences from database
  app.get(requestHistoricUrlPath, require(path.join(routesDir, 'requestHistoric'))({ DBInfo, dBPoolConnections }))

  // link for the municipality or parish authorities to click to mark occurence as resolved
  app.get(
    solvedOccurrenceUrlPath + '/:authority?/:table_row_uuid?/:key?',
    require(path.join(routesDir, 'solvedOccurrence'))({ DBInfo, dBPoolConnections, websiteUrlOrigin })
  )

  // main server for dealing with occurrences
  const server = app.listen(mainServerPort, () => {
    console.log(`Request server listening on port ${mainServerPort}!`)
    if (process.send) {
      process.send('ready') // trigger to PM2 that app is ready
    }
  })

  return server
}
