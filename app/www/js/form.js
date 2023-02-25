/* eslint camelcase: off */
/* global cordova, $, L, leafletImage */

import * as main from './main.js'
import * as variables from './variables.js'
import * as contacts from './contacts.js'
import * as functions from './functions.js'
import * as personalInfo from './personalInfo.js'
import * as localization from './localization.js'
import * as photos from './photos.js'
import { readFile } from './file.js'

// array of municipalities with parishes, ex: {"nome":"Abrantes", "freguesias":[ "Bemposta", etc.] }
let municipalities = []
let mainFormMap
let anomalyMapMarker // map marker referring to the place where the anomaly is located

export function init () {
  // loading spinner on
  GPSLoadingOnFields(true)

  initPullToRefresh()

  Promise.allSettled([
    $.ajax({
      url: variables.urls.geoApi.ptApi + '/municipios/freguesias',
      dataType: 'json',
      type: 'GET',
      async: true,
      crossDomain: true
    }),
    localization.getGeolocation(), // get GPS coordinates and addresses (municipality, parish, street and street number)
    functions.updateDateAndTime()
  ])
    .then((results) => {
      if (results[0].status === 'fulfilled') {
        municipalities = results[0].value
        console.success('municipalities and parishes fetched')

        $('#municipality').empty()
        $.each(municipalities, function (key, val) {
          $('#municipality').append(`<option value="${val.nome.trim().toLowerCase()}">${val.nome.trim()}</option>`)
        })

        if (results[1].status === 'fulfilled') {
          localization.fillFormWithAddress(results[1].value.addressFromOSM, results[1].value.addressFromGeoApiPt)
        }
        initMainFormMap()
      } else {
        console.error('Error obtaining municipios and freguesias from ' + variables.urls.geoApi.ptApi)
        InternetError()
      }
    })
    .catch(function (err) {
      InternetError()
      console.error(err)
    })
    .finally(() => {
      GPSLoadingOnFields(false)
    })
}

function InternetError () {
  $.jAlert({
    title: 'Erro na obtenção dos municípios e juntas de freguesia!',
    theme: 'red',
    content: 'Confirme se tem acesso à Internet. Poderá também ser uma anomalia com o servidor desta APP.'
  })
}

/* ********************************************************************** */
/* ******************* FORM FIELDS FETCHING FUNCTIONS ******************* */
export function getDateYYYY_MM_DD () {
  // returns format YYYY-MM-DD
  return $.datepicker.formatDate("yy'-'mm'-'dd", $('#date').datepicker('getDate'))
}

export function getTimeHH_MM () {
  return $('#time').val()
}

export function getFullAddress () {
  let fullAddress

  const streetNumber = getStreetNumber()
  if (streetNumber) {
    fullAddress = `${getStreetName()} n. ${streetNumber}, ${getMunicipality()}`
  } else {
    fullAddress = `${getStreetName()}, ${getMunicipality()}`
  }

  if (contacts.getCurrentParish()) {
    fullAddress += `, na freguesia ${getParish()}`
  }

  return fullAddress
}

export function getMunicipality () {
  return $('#municipality option:selected').text().trim() || ''
}

export function getParish () {
  return $('#parish option:selected').text().trim() || ''
}

export function getStreetName () {
  return $('#street').val() || ''
}

export function getStreetNumber () {
  return $('#street_number').val() || ''
}

/* ********************************************************************** */
/* ******************* IS FORM CORRECTLY FILLED  ************************ */
// returns true if all the fields and inputs in the form are filled in and ready to write the message
export function isMessageReady () {
  if (main.DEBUG) {
    return true
  }

  let to_break = false // this is true when one mandatory form field is empty or invalid
  let invalidPersonalInfo = false // at least one field of personal info is not filled or it is invalid
  let countEmptyFields = 0 // numer of invalid or empty mandatory user form fields
  let error_string = ''

  // loops through mandatory fields
  $('.mandatory').each(function () {
    const val = $(this).val()
    if (val == null || val === undefined || val === '' || (val).length === 0 || (val).replace(/^\s+|\s+$/g, '').length === 0) {
      console.log('Error on #' + $(this).attr('id'))
      error_string += '- ' + $(this).attr('name') + '<br>'
      countEmptyFields++
      to_break = true // at elast one element invalid, main function should return false
      if ($(this).hasClass('personal_info')) {
        invalidPersonalInfo = true
      }
    }
  })

  console.log('#generate_message goes', to_break)
  if (to_break) {
    let jAlertErrMsg = ''

    if (invalidPersonalInfo) {
      jAlertErrMsg += 'Ao abrigo da alínea b) do artigo 102.º do Código do Procedimento Administrativo, ' +
        'os seus dados de identificação necessitam de ser fornecidos (em <b>Menu Principal &ndash;> Os meus dados</b>), ' +
        'para que possa submeter esta ocorrência junto de uma autoridade pública.<br><br>'
    }
    if (countEmptyFields === 1) {
      jAlertErrMsg += `Preencha o seguinte campo obrigatório:<br>${error_string}`
    } else {
      jAlertErrMsg += `Preencha os seguintes campos obrigatórios:<br>${error_string}`
    }
    $.jAlert({
      title: 'Erro!',
      theme: 'red',
      content: jAlertErrMsg
    })
    return false
  }

  // detects if the name is correctly filled in
  const Name = $('#name').val()
  if (!personalInfo.isFullNameOK(Name) && !main.DEBUG) {
    $.jAlert({
      title: 'Erro no nome!',
      theme: 'red',
      content: 'Insira o nome completo.'
    })
    return false
  }

  if (!personalInfo.isPostalCodeOK() && !main.DEBUG) {
    $.jAlert({
      title: 'Erro no Código Postal!',
      theme: 'red',
      content: 'Insira o Código Postal no formato XXXX-XXX'
    })
    return false
  }

  // from here the inputs are correctly written
  if (photos.getPhotosUriOnFileSystem().length === 0) {
    $.jAlert({
      title: 'Erro nas fotos!',
      theme: 'red',
      content: 'Adicione pelo menos uma foto da ocorrência'
    })
    return false
  }

  return true
}

/* ************** GENERAL FORM HANDLERS ******************* */
// removes leading and trailing spaces on every text field "on focus out"
$(':text').each(function (index) {
  $(this).focusout(function () {
    let text = $(this).val()
    text = $.trim(text)
    text = text.replace(/\s\s+/g, ' ') // removes consecutive spaces in-between
    $(this).val(text)
  })
})

/* *************************************************************************** */
/* ********************* MAIN FORM HANDLERS ********************************** */

/* ********************************************************************** */
/* *********************** IMAGES/PHOTOS ******************************** */
// buttons "Add Image"
$('#addImg_1, #addImg_2, #addImg_3, #addImg_4').on('click', function () {
  // get id, for example #remImg_2
  const id = $(this).attr('id')
  console.log('photo id: ' + id)
  // gets the number of the element, by obtaining the last character of the id
  const num = id[id.length - 1]

  const callback = function (imgNmbr) {
    // hides "Adds image" button
    $('#' + 'addImg_' + imgNmbr).html('<i class="fa fa-edit"></i>')
    $('#' + 'remImg_' + imgNmbr).show()
    updateImgContainers()
  }

  $.jAlert({
    theme: 'dark_blue',
    class: 'ja_300px',
    content: '<b>Método de obtenção da foto:</b>',
    btns: [
      {
        text: '<i class="fa fa-camera" aria-hidden="true"></i>',
        theme: 'green',
        class: 'ja_button_with_icon',
        onClick: function () { photos.getPhoto(num, 'camera', callback) }
      },
      {
        text: '<i class="fa fa-folder" aria-hidden="true"></i>',
        theme: 'green',
        class: 'ja_button_with_icon',
        onClick: function () { photos.getPhoto(num, 'library', callback) }
      }
    ]
  })
})

// buttons "Remove Image"
$('#remImg_1, #remImg_2, #remImg_3, #remImg_4').on('click', function () {
  // get id, for example #remImg_2
  const id = $(this).attr('id')
  // gets the number of the element, by obtaining the last character of the id
  const num = id[id.length - 1]

  photos.removeImage('myImg_' + num, num)
  $(this).hide()

  $('#addImg_' + num).html('<i class="fa fa-plus"></i>')

  updateImgContainers()
})

function updateImgContainers () {
  const numberOfContainers = $('#image_selector .img-container').length
  let hasShownButton = false
  for (let i = 0; i < numberOfContainers; i++) {
    console.log(i)
    const $this = $('#image_selector .img-container').eq(i)
    if (!$this.find('img').attr('src')) {
      if (!hasShownButton) {
        console.log('show')
        $this.show()
        hasShownButton = true
      } else {
        $this.hide()
      }
    }
  }
}

/* ********************************************************************** */
/* ********************* UPDATE LOCALE BUTTON *************************** */

// botão Atualizar (Refresh)
$('#getCurrentAddresBtn').on('click', function () {
  spinnerOnButton(true)
  GPSLoadingOnFields(true)

  Promise.allSettled([
    new Promise((resolve, reject) => {
      localization.getGeolocation()
        .then((res) => {
          updatesFormMapToNewCoordinates(res.latitude, res.longitude)
          localization.fillFormWithAddress(res.addressFromOSM, res.addressFromGeoApiPt)
        })
        .catch((err) => {
          console.error('Error on localization.getGeolocation()')
          if (err) {
            console.error(err)
          }
        })
        .finally(() => resolve())
    }),
    functions.updateDateAndTime()
  ])
    .finally(() => {
      GPSLoadingOnFields(false)
      spinnerOnButton(false)
    })
})

/* spinner */
function spinnerOnButton (flag) {
  if (flag) {
    $('#getCurrentAddresBtn').removeClass('btn btn-primary').addClass('spinner-border text-primary')
  } else {
    $('#getCurrentAddresBtn').removeClass('spinner-border text-primary').addClass('btn btn-primary')
  }
}

/* ********************************************************************** */
/* ********************* DATE OF OCCURRENCE ***************************** */
$.datepicker.setDefaults({
  dateFormat: 'dd-mm-yy',
  dayNamesMin: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  monthNames: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
})
$('#date').datepicker()

/* ********************************************************************** */
/* ********************* LOCAL OF OCCURRENCE **************************** */
// when the select of municipalities is changed, updates the select of parishes
$('#municipality').on('change', function (event, addressFromGeoApiPt) {
  if (!$(this).val()) {
    return
  }

  const municipality = $(this).val().trim().toLowerCase()
  contacts.setMunicipality(municipality)

  $.each(municipalities, function (key, val) {
    if (val.nome.trim().toLowerCase() === municipality) {
      $('#parish').empty()
      $.each(val.freguesias, function (key2, parish) {
        $('#parish').append(`<option value="${parish.trim().toLowerCase()}">${parish.trim()}</option>`)
      })

      return false // break loop, since the municipality was already found
    }
  })

  // does not trigger parish select, if address was got from an GEO API PT, because it will also set parish
  // see module localization, function fillFormWithAddress
  if (!addressFromGeoApiPt) {
    $('#parish').trigger('change') // trigers event
  }
})

$('#parish').on('change', function (event) {
  const parish = $(this).val().trim().toLowerCase()
  const municipality = $('#municipality').val().trim().toLowerCase()

  contacts.setParish(parish, municipality, function (err, parishData) {
    if (!err) {
      // if selected parish has no email address,
      // in form message options force checkboxs to just send to municipality
      if (!parishData.email) {
        $('#send_to_municipality_checkbox').prop('checked', true).prop('disabled', true)
        $('#send_to_parish_checkbox').prop('checked', false).prop('disabled', true)
        // checks now if this is a blocked municipality
      } else if (main.blockedMunicipalities.map(el => el.toLowerCase()).includes(municipality)) {
        $('#send_to_municipality_checkbox').prop('checked', false).prop('disabled', true)
        $('#send_to_parish_checkbox').prop('checked', true).prop('disabled', true)
      } else {
        $('#send_to_municipality_checkbox').prop('disabled', false)
        $('#send_to_parish_checkbox').prop('disabled', false)
      }
    }
  })
})

$('#street').on('input', function () {
  if ($(this).val() === '' && !main.DEBUG) {
    $(this).css('border-color', 'red')
  } else {
    $(this).css('border-color', '')
  }
})

export function initMainFormMap (callback) {
  // get coordinates for the map center
  const currentLocation = localization.getCoordinates() // current position of user
  let latitude, longitude
  if (currentLocation.latitude && currentLocation.longitude) {
    latitude = currentLocation.latitude
    longitude = currentLocation.longitude
  } else {
    // coordinates of Lisbon
    latitude = 38.736946
    longitude = -9.142685
  }

  const mapOptions = {
    center: [latitude, longitude],
    zoom: 18,
    zoomControl: false,
    attributionControl: false,
    closePopupOnClick: false
  }

  mainFormMap = L.map('main_form_map', mapOptions)

  // add the OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 6,
    subdomains: ['a', 'b', 'c']
  }).addTo(mainFormMap)

  readFile(cordova.file.applicationDirectory + 'www/img/map_icon.png', { format: 'dataURL' })
    .then((dataURL) => {
      const mapIcon = L.icon({
        iconUrl: dataURL,
        iconSize: [80, 80],
        iconAnchor: [40, 80]
      })

      anomalyMapMarker = L.marker([latitude, longitude], {
        draggable: true,
        autoPan: true,
        icon: mapIcon
      }).addTo(mainFormMap)

      anomalyMapMarker.on('moveend', function (e) {
        const newCoord = e.target.getLatLng()
        // get address from coordinates and fill address in the main form fields
        localization.getAddressFromCoordinates(newCoord.lat, newCoord.lng, (err, res) => {
          if (!err) {
            localization.fillFormWithAddress(res.addressFromOSM, res.addressFromGeoApiPt)
          }
        })
      })

      setInterval(function () {
        mainFormMap.invalidateSize()
      }, 500)
    })
    .catch((err) => {
      console.error(err)
    })
}

export function updatesFormMapToNewCoordinates (latitude, longitude) {
  mainFormMap.panTo(new L.LatLng(latitude, longitude))
  anomalyMapMarker.setLatLng(new L.LatLng(latitude, longitude))
}

export function getScreenshotFromMap (callback) {
  leafletImage(mainFormMap, function (err, canvas) {
    if (err) {
      callback(Error(`Error on leafletImage: ${err}`))
    } else {
      // see https://github.com/katzer/cordova-plugin-email-composer#attach-base64-encoded-content
      callback(null, canvas.toDataURL().replace(/^data:image\/png;base64,/, 'base64:local.png//'))
    }
  })
}

// removes the loading gif from input fields
export function GPSLoadingOnFields (bool) {
  if (bool) {
    $('#municipality, #parish, #street, #street_number').addClass('loading')
  } else {
    $('#municipality, #parish, #street, #street_number').removeClass('loading')
    $('#municipality, #parish, #street, #street_number').trigger('input')
  }
}

/* ********************************************************************** */
/* ********************* MESSAGE OPTIONS **************************** */
// the user must send the message to the municipality, to the perish or both

$('#send_to_municipality_checkbox').on('change', function () {
  if (!this.checked && !$('#send_to_parish_checkbox').is(':checked')) {
    $('#send_to_parish_checkbox').prop('checked', true)
  }
})
$('#send_to_parish_checkbox').on('change', function () {
  if (!this.checked && !$('#send_to_municipality_checkbox').is(':checked')) {
    $('#send_to_municipality_checkbox').prop('checked', true)
  }
})

export function bSendToMunicipality () {
  return $('#send_to_municipality_checkbox').is(':checked')
}

export function bSendToParish () {
  return $('#send_to_parish_checkbox').is(':checked')
}

/* **************************************************************************** */
/* ********************* PULL TO REFRESH FUNCTIONS **************************** */
function initPullToRefresh () {
  const pStart = { x: 0, y: 0 }
  const pStop = { x: 0, y: 0 }

  function swipeStart (e) {
    if (typeof e.targetTouches !== 'undefined') {
      const touch = e.targetTouches[0]
      pStart.x = touch.screenX
      pStart.y = touch.screenY
    } else {
      pStart.x = e.screenX
      pStart.y = e.screenY
    }
  }

  function swipeEnd (e) {
    if (typeof e.changedTouches !== 'undefined') {
      const touch = e.changedTouches[0]
      pStop.x = touch.screenX
      pStop.y = touch.screenY
    } else {
      pStop.x = e.screenX
      pStop.y = e.screenY
    }

    swipeCheck()
  }

  function swipeCheck () {
    const changeY = pStart.y - pStop.y
    const changeX = pStart.x - pStop.x
    if (isPullDown(changeY, changeX)) {
      // user has pulled to refresh
      $('#getCurrentAddresBtn').click()
    }
  }

  function isPullDown (dY, dX) {
    // methods of checking slope, length, direction of line created by swipe action
    return (
      dY < 0 &&
      ((Math.abs(dX) <= 100 && Math.abs(dY) >= 300) ||
        (Math.abs(dX) / Math.abs(dY) <= 0.3 && dY >= 60))
    )
  }

  document.addEventListener(
    'touchstart',
    function (e) {
      swipeStart(e)
    },
    false
  )
  document.addEventListener(
    'touchend',
    function (e) {
      swipeEnd(e)
    },
    false
  )
}
