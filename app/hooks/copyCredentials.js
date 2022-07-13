/* Copies JS file keys-configs/credentials.js to www/js/ directory.
This is used because the dir keys-configs/ is not git tracked as it contains sensible information */

const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')

const twoSpaces = '  ' // for log indentation

module.exports = function (context) {
  console.log(`${context.hook} : ${path.relative(context.opts.projectRoot, context.scriptLocation)}`)

  var appDir = context.opts.projectRoot

  // generate Javascript file with array of adminDevicesUuids, taken from config JSON file
  const adminDevicesUuids = JSON.parse(
    fs.readFileSync(path.join(appDir, '..', 'keys-configs', 'configs.json'), 'utf8')
  ).adminDevicesUuids

  const jsFileContent =
    `export const adminDevicesUuids = ${JSON.stringify(adminDevicesUuids)} // eslint-disable-line\n`

  fs.writeFileSync(path.join(appDir, 'www', 'js', 'appSecrets.js'), jsFileContent)
  console.log(`${twoSpaces}File generated: ${path.join('www', 'js', 'appSecrets.js')}`)

  // just copy file
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
