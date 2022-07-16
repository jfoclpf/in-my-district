/* Generates JS file from keys-configs/credentials.js to www/js/ directory.
This is used because the dir keys-configs/ is not git tracked as it contains secret/sensible information */

const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')

const twoSpaces = '  ' // for log indentation

module.exports = function (context) {
  console.log(`${context.hook} : ${path.relative(context.opts.projectRoot, context.scriptLocation)}`)

  var appDir = context.opts.projectRoot

  // fetch config JSON file to generate Javascript files
  const configs = JSON.parse(
    fs.readFileSync(path.join(appDir, '..', 'keys-configs', 'configs.json'), 'utf8')
  )

  // generate www/js/appSecrets.js
  var jsFileContent =
    `export const adminDevicesUuids = ${JSON.stringify(configs.adminDevicesUuids)} // eslint-disable-line\n`
  generateFile(appDir, path.join(appDir, 'www', 'js', 'appSecrets.js'), jsFileContent)

  // generate www/js/variables.js
  jsFileContent =
    `export const variables = ${JSON.stringify(configs.adminDevicesUuids)} // eslint-disable-line\n`
  generateFile(appDir, path.join(appDir, 'www', 'js', 'variables.js'), jsFileContent)

  // just copy file
  copyFile(
    appDir,
    path.join(appDir, '..', 'commons', 'json', 'anomalies.json'),
    path.join(appDir, 'www', 'json', 'anomalies.json')
  )
}

function generateFile (appDir, fileDestFullPath, jsFileContent) {
  fs.writeFileSync(fileDestFullPath, jsFileContent)
  console.log(`${twoSpaces}File generated: ${path.relative(appDir, fileDestFullPath)}`)
}

function copyFile (appDir, fileOriginFullPath, fileDestFullPath) {
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
