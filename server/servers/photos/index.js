// server app used to get and upload photos from occurrences

const path = require('path')
const express = require('express')
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser')
const cors = require('cors')
const debug = require('debug')('server:file-transfer')

module.exports = (serverInfo) => {
  const photosUploadUrlPath = serverInfo.url.paths.photosUpload
  const getPhotosUrlPath = serverInfo.url.paths.getPhotos
  const photosServerPort = serverInfo.photosServerPort
  const photosDirectoryFullPath = serverInfo.photosDirectoryFullPath

  const app = express()

  // enable files upload
  app.use(fileUpload({ createParentPath: true, debug: debug.enabled }))
  app.use(cors())
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

  // endpoint to get photos as static content
  app.use(getPhotosUrlPath, express.static(photosDirectoryFullPath))

  // photosUploadUrlPath is defined on /keys-configs/configs.json
  app.post(photosUploadUrlPath, async (req, res) => {
    debug('Getting files')
    try {
      if (!req.files) {
        debug('No files')
        res.status(400).send({
          status: false,
          message: 'No file uploaded'
        })
      } else {
        // Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
        debug('Fetching files:')
        debug(req.files)
        const img = req.files.file
        // Use the mv() method to place the file in upload directory (i.e. "uploads")
        img.mv(path.join(photosDirectoryFullPath, img.name))

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
      debug('Error on requesting files:', err)
      res.status(500).send(err)
    }
  })

  const server = app.listen(
    photosServerPort,
    () => console.log(`Photos server listening on port ${photosServerPort}!`)
  )

  return server
}
