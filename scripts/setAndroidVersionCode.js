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
