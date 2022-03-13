/* script used by npm version CLI (see package.json) to update the android version code
   in the package.json file according to cordova rule. Done originally for the F-Droid
   see: https://gitlab.com/fdroid/rfp/-/issues/1813#note_644665525
   and https://cordova.apache.org/docs/en/10.x/guide/platforms/android/#setting-the-version-code */

const fs = require('fs')
const path = require('path')
const semver = require('semver')

const commandLineArgs = require('command-line-args')
const optionDefinitions = [{ name: 'version', alias: 'v', type: String }]
const options = commandLineArgs(optionDefinitions)

if (!options.version) {
  console.error('Error: Version must be defined with -v')
  process.exitCode = 1
} else if (!semver.valid(options.version)) {
  console.error(`Error: Version ${options.version} is an invalid semver`)
  process.exitCode = 1
} else {
  const packageJsonFile = path.join('__dirname', '..', 'package.json')
  const packageJsonObj = JSON.parse(fs.readFileSync(packageJsonFile))
  const v = options.version

  const versionCode = semver.major(v) * 10000 + semver.minor(v) * 100 + semver.patch(v)
  packageJsonObj['android-version-code'] = versionCode
  fs.writeFileSync(packageJsonFile, JSON.stringify(packageJsonObj, null, 2))
}
