/* Copies JS file keys-configs/credentials.js to www/js/ directory.
This is used because the dir keys-configs/ is not git tracked as it contains sensible information */

const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')

const twoSpaces = '  ' // for log indentation

module.exports = function (context) {
  console.log(`${context.hook} : ${path.relative(context.opts.projectRoot, context.scriptLocation)}`)

  var appDir = context.opts.projectRoot

  copyFile(
    path.join(appDir, '..', 'keys-configs', 'appSecrets.js'),
    path.join(appDir, 'www', 'js', 'appSecrets.js')
  )

  copyFile(
    path.join(appDir, '..', 'commons', 'json', 'anomalies.json'),
    path.join(appDir, 'www', 'json', 'anomalies.json')
  )

  function copyFile (fileOriginFullPath, fileDestFullPath) {
    try {
      if (fs.existsSync(fileOriginFullPath)) { // file exists
        fse.copySync(fileOriginFullPath, fileDestFullPath)

        const consoleMsg = 'copied ' +
          path.relative(appDir, fileOriginFullPath) + ' -> ' +
          path.relative(appDir, fileDestFullPath)

        console.log(twoSpaces + consoleMsg)
      } else { // file does no exist
        console.log(`${twoSpaces}File ${path.relative(context.opts.projectRoot, fileOriginFullPath)} does not exist, skipping...`)
      }
    } catch (err) {
      console.error(err)
      process.exit(1)
    }
  }
}
