/* global $, cordova, Camera */

import * as file from './file.js'
import * as form from './form.js'
import * as functions from './functions.js'
import * as localization from './localization.js'
import { readFile } from './file.js'

// get Photo function
// type depends if the photo is got from camera or the photo library

let photosAsBase64 = [] // array with photos info for email attachment (fileUri in android and base64 in iOS)
let photosUriOnFileSystem = [] // photos URI always on file system (file uri in android and iOS)
let photoWithGPS = [] // 'synced' or 'unsynced'

// imgNmbr may only be Number 1, 2, 3 or 4
export function getPhoto (imgNmbr, type, callback) {
  console.log('%c ========== GETTING PHOTO ========== ', 'background: yellow; color: blue')
  if (![1, 2, 3, 4].includes(imgNmbr)) {
    throw Error('imgNmbr must be Number 1, 2, 3 or 4')
  }

  if (functions.isThisAndroid()) {
    // ensure Android has enough camera/media permissions to advance
    const permissions = cordova.plugins.permissions
    permissions.checkPermission(permissions.CAMERA, function (status) {
      if (!status.hasPermission) {
        console.log('No permission to access CAMERA. Requesting...')
        permissions.requestPermission(permissions.CAMERA,
          function (status) {
            if (!status.hasPermission) {
              errorGrantingCameraPermission()
            } else {
              startingCamera(imgNmbr, type, callback)
            }
          }, function () {
            errorGrantingCameraPermission()
          })
      } else {
        startingCamera(imgNmbr, type, callback)
      }
    })
  } else {
    startingCamera(imgNmbr, type, callback)
  }
}

function errorGrantingCameraPermission () {
  console.error('Erro na permissão para aceder à Câmera')
  window.alert('Erro na permissão para aceder à Câmera')
}

function startingCamera (imgNmbr, type, callback) {
  console.log('Has permission to use CAMERA')

  // store for the case when the app reboots, see function onAppResumeAfterReboot
  window.localStorage.setItem('isUserUsingCamera', JSON.stringify(true))
  window.localStorage.setItem('userCapturingPhotoNumber', imgNmbr.toString())
  window.localStorage.setItem('userCapturingPhotoType', type)

  const options = setCameraOptions(type)

  console.log('starting navigator.camera.getPicture')
  navigator.camera.getPicture(function (result) {
    console.log('cameraSuccess init')
    console.log('%c Camera Success', 'color: green; font-weight:bold')
    window.localStorage.setItem('isUserUsingCamera', JSON.stringify(false))
    cameraSuccess(result, imgNmbr, type, callback)
  },
  function cameraError (error) {
    console.error('Não foi possível obter fotografia:', error)
  }, options)
}

function cameraSuccess (result, imgNmbr, type, callback) {
  // checks if plugin cordova-plugin-camera-with-exif is available
  // sometimes this plugin has bugs, but it allows to check GPS coordinates of photo
  let isCameraWithExifInfoAvailable, thisResult, imageUri
  try {
    // convert JSON string to JSON Object
    thisResult = JSON.parse(result)
    imageUri = thisResult.filename
    isCameraWithExifInfoAvailable = true
    console.log('Using plugin: cordova-plugin-camera-with-exif')
  } catch (e) {
    imageUri = result
    isCameraWithExifInfoAvailable = false
    console.log('Using plugin: cordova-plugin-camera')
  }

  console.log('ImageUri a) ' + imageUri)

  // adds "file://" at the begining if missing as requested by Android systems
  // see: https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/
  if (functions.isThisAndroid()) {
    imageUri = functions.adaptURItoAndroid(imageUri)
    console.log('ImageUri b) ' + imageUri)
  }

  photosUriOnFileSystem[imgNmbr - 1] = imageUri
  storePhotosArrays('photosUriOnFileSystem')

  if (functions.isThisAndroid()) {
    // resizeImage plugin is just working on android
    console.log('Resizing photo...')
    resizeImage(imageUri, function (resizedImgUri, err) {
      console.log('Photo resized')
      const imgToShowUri = !err ? resizedImgUri : imageUri

      console.log('Getting file content of Photo...')
      readFile(imgToShowUri, { format: 'dataURL' })
        .then((dataURL) => {
          console.log('Got File content of Photo')
          form.displayImage(dataURL, imgNmbr)
          photosAsBase64[imgNmbr - 1] = dataURL
          storePhotosArrays('photosAsBase64')
        })
        .catch((err) => {
          console.error(err)
        })
        .finally(() => {
          callback(imgNmbr)
        })
    })
  } else if (functions.isThis_iOS()) {
    // in iOS the photos to be attached must also be stored as dataURL
    readFile(imageUri, { format: 'dataURL' })
      .then((dataURL) => {
        form.displayImage(dataURL, imgNmbr)
        photosAsBase64[imgNmbr - 1] = dataURL
        storePhotosArrays('photosAsBase64')
      })
      .catch((err) => {
        console.error(err)
      })
      .finally(() => {
        callback(imgNmbr)
      })
  } else {
    window.alert('This APP only works in Android or iOS')
  }

  if (type === 'camera') {
    // photo comes from the camera, thus the device GPS already coincides with the photo
    photoWithGPS[imgNmbr - 1] = 'synced'
  } else if (
    isCameraWithExifInfoAvailable &&
    type === 'library' &&
    thisResult.json_metadata &&
    thisResult.json_metadata !== '{}'
  ) {
    // if user selects a photo from the library
    // it gets, when available on the photo the EXIF information
    // the date, time and GPS information, to fill in the form
    // convert json_metadata JSON string to JSON Object
    const metadata = JSON.parse(thisResult.json_metadata)

    console.log('Metadata from photo obtained')
    console.log(metadata)

    // if the selected photo has EXIF date info, assigns photo date and time automatically to form
    let dateToForm

    // gets date and time from EXIF
    if (metadata.datetime) {
      dateToForm = getDateFromString(metadata.datetime)
    } else {
      // when there is no EXIF information, tries to get date and time from file name
      dateToForm = getDateFromFileName(imageUri)
    }

    if (dateToForm) {
      $('#date').datepicker('setDate', dateToForm)
      const currentTime = functions.pad(dateToForm.getHours(), 2) + ':' + functions.pad(dateToForm.getMinutes(), 2)
      $('#time').val(currentTime)
    }

    // if the photo EXIF info has GPS information
    if (
      metadata.gpsLatitude &&
      metadata.gpsLatitudeRef &&
      metadata.gpsLongitude &&
      metadata.gpsLongitudeRef
    ) {
      const lat = localization.convertDMSStringInfoToDD(metadata.gpsLatitude, metadata.gpsLatitudeRef)
      const lon = localization.convertDMSStringInfoToDD(metadata.gpsLongitude, metadata.gpsLongitudeRef)

      console.log('Coordinates fetched from photo: ', lat, lon)
      if (Number(lat) && Number(lon)) {
        form.GPSLoadingOnFields(true)
        localization.getAddressFromCoordinates(lat, lon, (err, res) => {
          form.GPSLoadingOnFields(false)
          if (!err) {
            localization.fillFormWithAddress(res.addressFromOSM, res.addressFromGeoApiPt)
          }
        })
      }
      photoWithGPS[imgNmbr - 1] = 'synced'
    } else {
      photoWithGPS[imgNmbr - 1] = 'unsynced'
    }
  } else {
    // photo was got from library and it has no GPS info
    photoWithGPS[imgNmbr - 1] = 'unsynced'
  }
}

// this function is called after app reboots while the user is taking a photo,
// normally it happens on devices with low memory RAM
export function onAppResumeAfterReboot (imageUri) {
  // restore arrays with photo information
  restorePhotosArrays()
  console.log('photosAsBase64: ', photosAsBase64)

  for (let i = 0; i < photosAsBase64.length; i++) {
    if (photosAsBase64[i]) {
      form.displayImage(photosAsBase64[i], i + 1)
    }
  }

  const imgNmbr = parseInt(window.localStorage.getItem('userCapturingPhotoNumber')) || 1
  const type = window.localStorage.getItem('userCapturingPhotoType') || ''

  // add photo that was pending
  cameraSuccess(imageUri, imgNmbr, type, function (imgNmbr) {
    console.log(`Photo ${imgNmbr} added`)
  })
}

// camera plugin options
function setCameraOptions (type) {
  let srcType
  if (type === 'camera') {
    srcType = Camera.PictureSourceType.CAMERA
  } else if (type === 'library') {
    srcType = Camera.PictureSourceType.PHOTOLIBRARY
  } else {
    console.log('getPhoto error')
    return
  }

  const options = {
    // Some common settings are 20, 50, and 100
    quality: 50, // do not increase, otherwise the email plugin cannot attach photo due to photo file size
    destinationType: Camera.DestinationType.FILE_URI,
    // In this app, dynamically set the picture source, Camera or photo gallery
    targetWidth: 1200,
    targetHeight: 1600,
    sourceType: srcType,
    encodingType: Camera.EncodingType.JPEG,
    mediaType: Camera.MediaType.PICTURE,
    allowEdit: false,
    correctOrientation: true // Corrects Android orientation quirks
  }
  return options
}

// store arrays with Photo information
function storePhotosArrays (arrayName) {
  switch (arrayName) {
    case 'photosUriOnFileSystem':
      window.localStorage.setItem(arrayName, JSON.stringify(photosUriOnFileSystem))
      break
    case 'photosAsBase64':
      window.localStorage.setItem(arrayName, JSON.stringify(photosAsBase64))
      break
    case 'photoWithGPS':
      window.localStorage.setItem(arrayName, JSON.stringify(photoWithGPS))
      break
    case 'ALL':
      window.localStorage.setItem('photosUriOnFileSystem', JSON.stringify(photosUriOnFileSystem))
      window.localStorage.setItem('photosAsBase64', JSON.stringify(photosAsBase64))
      window.localStorage.setItem('photoWithGPS', JSON.stringify(photoWithGPS))
      break
    default:
      throw Error('Invalid option ' + arrayName)
  }
}

function restorePhotosArrays () {
  photosUriOnFileSystem = JSON.parse(window.localStorage.getItem('photosUriOnFileSystem'))
  photosAsBase64 = JSON.parse(window.localStorage.getItem('photosAsBase64'))
  photoWithGPS = JSON.parse(window.localStorage.getItem('photoWithGPS'))
}

// tries to get date from file name
// some smartphones set the name of the photo using the date and time
function getDateFromFileName (fileURI) {
  console.log('getDateFromFileName', fileURI)

  // date yearmonthday
  let n = fileURI.search(/[2][0][0-9][0-9](1[0-2]|0[1-9])([0][1-9]|[1,2][0-9]|3[0,1])/)
  const year = fileURI.substr(n, 4)
  const month = fileURI.substr(n + 4, 2)
  const day = fileURI.substr(n + 6, 2)

  // hourminutes
  const newstring = fileURI.substring(0, n) + fileURI.substring(n + 8)
  n = newstring.search(/[0,1,2][0-9][0-5][0-9]/)
  const hour = newstring.substr(n, 2)
  const minute = newstring.substr(n + 2, 2)

  // checks if photo date (except hour and minutes) is valid
  if (!isValidDate(year, month, day)) {
    return false
  }

  // if valid create date object
  let photoDate = new Date(year, month - 1, day)

  // if hours and minutes are valid, get them also
  if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
    photoDate = new Date(year, month - 1, day, hour, minute)
  }

  const today = new Date()
  // compare if photo date is earlier than today
  if (photoDate.getTime() >= today.getTime()) {
    return false
  }

  return photoDate
}

function getDateFromString (dateString) {
  // the dateString comes in format "2017:11:12 12:53:55"
  // and one needs to have: new Date('2017', '11' - 1, '12', '12', '53', '55')

  console.log('getDateFromString', dateString)

  const dateStr = dateString.split(' ')[0]
  const timeStr = dateString.split(' ')[1]

  const date = dateStr.split(':')
  const time = timeStr.split(':')

  // checks if date (except hour and minutes) is valid
  if (!isValidDate(date[0], date[1], date[2])) {
    return false
  }

  const dateForm = new Date(date[0], date[1] - 1, date[2], time[0], time[1], time[2])
  console.log(dateForm)

  return dateForm
}

// checks if date is valid, ex: 30 of February is invalid
function isValidDate (year, month, day) {
  const date = new Date(year, month - 1, day)
  return date && (date.getMonth() + 1) === month
}

export function removeImage (num) {
  photosUriOnFileSystem[num - 1] = ''
  photosAsBase64[num - 1] = ''
  photoWithGPS[num - 1] = ''
  storePhotosArrays('ALL')
}

function resizeImage (imageUri, callback) {
  file.resizeImage(imageUri, function (resizedImageUri, err) {
    if (err) {
      // could not resize image
      callback(imageUri, Error(err))
    }
    // return resized image
    callback(resizedImageUri)
  })
}

export function getPhotosForEmailAttachment () {
  // removes empty values from photosAsBase64, concatenating valid indexes, ex: [1, null, 2, null] will be [1, 2]
  return functions.cleanArray(photosAsBase64)
}

export function getPhotosUriOnFileSystem () {
  // removes empty values from photosUriOnFileSystem, concatenating valid indexes, ex: [1, null, 2, null] will be [1, 2]
  return functions.cleanArray(photosUriOnFileSystem)
}
