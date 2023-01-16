/* eslint camelcase: off */
/* global cordova, $, device */

import * as appSecrets from './appSecrets.js'

// to run on startup
// add functions related with respective plugins
export function addFunctionsToPlugins () {
  cordova.plugins.email.adaptPhotoInfoForEmailAttachment = function (path, index) {
    if (isThisAndroid()) {
      // see: https://www.npmjs.com/package/cordova-plugin-email-composer#attach-files-from-the-internal-app-file-system
      return path.replace(cordova.file.applicationStorageDirectory, 'app://')
    } else if (isThis_iOS()) {
      // in ios uses base64 string, remove header and add file name
      return `base64:photo${index + 1}.jpg//` + path.split(',').pop()
    } else {
      return path
    }
  }
}

// Tell if current user is an authorized Admin
// Admins have special permissions, like erasing occurrences
// UUID for debug and release are different and thus both should be considered
// To know UUID in dev console check the variable device.uuid
export function isCurrentUserAnAdmin () {
  const adminDevicesUuids = appSecrets.adminDevicesUuids
  return (typeof adminDevicesUuids !== 'undefined') && adminDevicesUuids.includes(device.uuid)
}

// limpar a mensagem para o email, remove HTML tags,
// pois o mailto não aceita HTML tags, apenas texto simples
export function clean_message (message) {
  var temp = message
  temp = temp.replace(/<b\s*\/?>/mg, '')
  temp = temp.replace(/<\/b\s*\/?>/mg, '')
  temp = temp.replace(/<br\s*\/?>/mg, '\n')
  return temp
}

// add zeros to numbers, ex: pad(7, 3)="007"
export function pad (num, size) {
  var s = num + ''
  while (s.length < size) s = '0' + s
  return s
}

// Will remove all falsy values: undefined, null, 0, false, NaN and "" (empty string)
export function cleanArray (actual) {
  var newArray = []
  for (var i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i])
    }
  }
  return newArray
}

// initializes date and time with current date and time
export function updateDateAndTime () {
  var date = new Date()
  $('#date').datepicker('setDate', date)
  var currentTime = pad(date.getHours(), 2) + ':' + pad(date.getMinutes(), 2)
  $('#time').val(currentTime)
}

export function clearCache () {
  // clear cache, important, ex: otherwise the images get messed if loaded again
  window.CacheClear(function (result) {
    console.debug('cache cleared:' + result)
  },
  function (err) {
    console.debug('cache cleared error:' + err)
  })
}

export function isThisAndroid () {
  return device.platform.toLowerCase() === 'android'
}

export function isThis_iOS () {
  return device.platform === 'iOS'
}

export function adaptURItoAndroid (imgUR) {
  if (!isThisAndroid() || !imgUR) {
    return imgUR
  }

  // the string is of the type "/path/to/dest"
  if (!imgUR.includes('://')) {
    return 'file://' + imgUR
  } else {
    // it does include some protocol blabla://
    // replace by file://
    return 'file://' + imgUR.split('://')[1]
  }
}

export function setDebugValues () {
  $('#anomalies').val('bicicletas')
}

export function isNonEmptyString (str) {
  return str && typeof str === 'string'
}
