//  LOCALIZATION/GPS/Contacts

/* eslint no-var: off */
/* global app, $ */

app.localization = (function (thisModule) {
  var Latitude, Longitude

  function loadMapsApi () {
    if (!navigator.onLine) {
      console.log('Device Navigator not online')
    } else {
      console.log('Device Navigator is online')
      getGeolocation()
    }
  }

  // botão get address by GPS (Atualizar)
  $('#getCurrentAddresBtn').click(function () {
    getGeolocation()
    app.functions.updateDateAndTime()
  })

  /* Geo location functions */
  function getGeolocation () {
    // detect if has Internet AND if the GoogleMaps API is loaded
    if (navigator.onLine) {
      GPSLoadingOnFields(true) // truns on loading icon on the fields
      var options = { timeout: 30000, enableHighAccuracy: true }
      navigator.geolocation.getCurrentPosition(getPosition, PositionError, options)
    } else {
      PositionError()
    }
  }

  function getPosition (position) {
    var latitude = position.coords.latitude
    Latitude = latitude
    var longitude = position.coords.longitude
    Longitude = longitude
    console.log('latitude, longitude: ', latitude, longitude)
    getLocale(latitude, longitude) // Pass the latitude and longitude to get address.
  }

  // to be used from outside of this module
  function getCoordinates () {
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
    GPSLoadingOnFields(false)
  }

  function getLocale (latitude, longitude) {
    // makes two parallel async GET requests
    Promise.allSettled([
      $.ajax({
        url: app.main.urls.geoApi.nominatimReverse,
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
        url: app.main.urls.geoApi.ptApi + '/gps',
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
        console.error(app.main.urls.geoApi.nominatimReverse + ' returns empty')
        GPSLoadingOnFields(false)
        PositionError()
      } else {
        var addressFromGeoPtApi
        // from app.main.urls.geoApi.ptApi
        if (res[1].status !== 'fulfilled') {
          // this happens when user is not in Portugal
          console.warn(app.main.urls.geoApi.ptApi + ' returns empty')
        } else {
          addressFromGeoPtApi = res[1].value
        }

        const addressFromOSM = res[0].value.address
        console.log('getLocale: ', addressFromOSM, addressFromGeoPtApi)
        fillFormWithAddress(addressFromOSM, addressFromGeoPtApi)
      }
    })
  }

  function fillFormWithAddress (addressFromOSM, addressFromGeoPtApi) {
    if (addressFromOSM) {
      if (addressFromOSM.road) {
        $('#street').val(addressFromOSM.road) // nome da rua/avenida/etc.
      }
      if (addressFromOSM.house_number) {
        $('#street_number').val(addressFromOSM.house_number)
      }
    }

    if (addressFromGeoPtApi) {
      if (addressFromGeoPtApi.concelho) {
        $('#municipality').val(addressFromGeoPtApi.concelho.trim().toLowerCase())
          .trigger('change', [true]) // triger with parameter, true to refer addressFromAPI
      }
      if (addressFromGeoPtApi.freguesia) {
        $('#parish').val(addressFromGeoPtApi.freguesia.trim().toLowerCase())
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

    GPSLoadingOnFields(false)
  }

  // removes the loading gif from input fields
  function GPSLoadingOnFields (bool) {
    if (bool) {
      $('#municipality, #parish, #street, #street_number').addClass('loading')
    } else {
      $('#municipality, #parish, #street, #street_number').removeClass('loading')
      $('#municipality, #parish, #street, #street_number').trigger('input')
    }
  }

  // converts latitude, longitude coordinates from Degrees Minutes Second (DMS) to Decimal Degrees (DD)
  // the input string of the DMS is on the format "52/1,0/1,376693/10000"
  function convertDMSStringInfoToDD (gpsString, direction) {
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

  /* === Public methods to be returned === */
  thisModule.loadMapsApi = loadMapsApi
  thisModule.getGeolocation = getGeolocation
  thisModule.getPosition = getPosition
  thisModule.getCoordinates = getCoordinates
  thisModule.convertDMSStringInfoToDD = convertDMSStringInfoToDD

  return thisModule
})(app.localization || {})
