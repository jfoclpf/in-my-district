// LOCALIZATION/GPS module

/* global $ */

import * as main from './main.js'

var Latitude, Longitude

// Get GPS coordinates and then get address
export function getGeolocation (callback) {
  // detect if has Internet AND if the GoogleMaps API is loaded
  if (navigator.onLine) {
    var options = { timeout: 30000, enableHighAccuracy: true }
    navigator.geolocation.getCurrentPosition(function (position) {
      getAddressForForm(position.coords.latitude, position.coords.longitude, callback) // get address from coordinates
    },
    PositionError, options)
  } else {
    PositionError()
    callback(Error('position error'))
  }
}

// to be used from outside of this module
export function getCoordinates () {
  var coordinates = {
    latitude: Latitude,
    longitude: Longitude
  }
  return coordinates
}

function PositionError () {
  $.jAlert({
    title: 'Erro na obtenção do local da ocorrência!',
    theme: 'red',
    content: 'Confirme se tem o GPS ligado e autorizado, e se tem acesso à Internet. Caso contrário pode introduzir manualmente o Concelho, Local (rua, travessa, etc.) e número de porta da ocorrência.'
  })
}

// get address from coordinates and fill address in the main form fields
export function getAddressForForm (latitude, longitude, mainCallback) {
  console.log(`latitude, longitude: ${latitude}, ${longitude}`)
  Latitude = latitude
  Longitude = longitude

  const callback = function (err, res) {
    if (typeof mainCallback === 'function') {
      mainCallback(err, res)
    }
  }

  // makes two parallel async GET requests
  Promise.allSettled([
    $.ajax({
      url: main.urls.geoApi.nominatimReverse,
      data: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        namedetails: 1,
        'accept-language': 'pt'
      },
      dataType: 'json',
      type: 'GET',
      async: true,
      crossDomain: true
    }),
    $.ajax({
      url: main.urls.geoApi.ptApi + '/gps',
      data: {
        lat: latitude,
        lon: longitude
      },
      dataType: 'json',
      type: 'GET',
      async: true,
      crossDomain: true
    })
  ]).then(function (res) {
    // from app.main.urls.geoApi.nominatimReverse
    if (res[0].status !== 'fulfilled') {
      PositionError()
      callback(Error(main.urls.geoApi.nominatimReverse + ' returns empty'))
    } else {
      var addressFromGeoApiPt
      // from app.main.urls.geoApi.ptApi
      if (res[1].status !== 'fulfilled') {
        // this happens when user is not in Portugal
        console.warn(main.urls.geoApi.ptApi + ' returns empty')
      } else {
        addressFromGeoApiPt = res[1].value
      }

      const addressFromOSM = res[0].value.address
      console.log('getAddressForForm: ', addressFromOSM, addressFromGeoApiPt)
      fillFormWithAddress(addressFromOSM, addressFromGeoApiPt)
      callback(null, { latitude, longitude })
    }
  }).catch((err) => {
    callback(Error(err))
  })
}

function fillFormWithAddress (addressFromOSM, addressFromGeoApiPt) {
  if (addressFromOSM) {
    $('#street').val(addressFromOSM.road || '') // nome da rua/avenida/etc.
    $('#street_number').val(addressFromOSM.house_number || '')
  }

  if (addressFromGeoApiPt) {
    if (addressFromGeoApiPt.concelho) {
      $('#municipality').val(addressFromGeoApiPt.concelho.trim().toLowerCase())
        .trigger('change', [true]) // triger with parameter, true to refer addressFromAPI
    }
    if (addressFromGeoApiPt.freguesia) {
      $('#parish').val(addressFromGeoApiPt.freguesia.trim().toLowerCase())
        .trigger('change')
    }
  } else if (addressFromOSM) {
    if (addressFromOSM.municipality) {
      $('#municipality').val(addressFromOSM.municipality.trim().toLowerCase())
    } else if (addressFromOSM.city) {
      $('#municipality').val(addressFromOSM.city.trim().toLowerCase())
    } else if (addressFromOSM.town) {
      $('#municipality').val(addressFromOSM.town.trim().toLowerCase())
    }
  }

  // if nothing was found for municipality on APIs, simply select first element
  if (!$('#municipality').val()) {
    $('#municipality').val($('#municipality option:first').val()).trigger('change')
  }
}

// converts latitude, longitude coordinates from Degrees Minutes Second (DMS) to Decimal Degrees (DD)
// the input string of the DMS is on the format "52/1,0/1,376693/10000"
export function convertDMSStringInfoToDD (gpsString, direction) {
  var i, temp
  var values = []

  var gpsArray = gpsString.split(',')

  for (i = 0; i < gpsArray.length; i++) {
    // if the value is presented in ratio, example "376693/10000"
    temp = gpsArray[i].split('/')
    if (temp[1]) {
      values[i] = parseFloat(temp[0]) / parseFloat(temp[1])
    } else {
      values[i] = parseFloat(gpsArray[i])
    }
  }

  var deg = values[0]
  var min = values[1]
  var sec = values[2]

  var dd = deg + min / 60 + sec / (60 * 60)

  if (direction === 'S' || direction === 'W') {
    dd = dd * -1
  } // Don't do anything for N or E
  return dd
}
