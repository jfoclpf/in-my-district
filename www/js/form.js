/* eslint no-var: off */
/* eslint camelcase: off */

/* global app, cordova, $, L, leafletImage, DEBUG */
app.form = (function (thisModule) {
  // array of municipalities with parishes, ex: {"nome":"Abrantes", "freguesias":[ "Bemposta", etc.] }
  var municipalities = []
  var mainFormMap
  var anomalyMapMarker // map marker referring to the place where the anomaly is located

  function init () {
    const url = app.main.urls.geoApi.ptApi + '/municipios/freguesias'
    $.ajax({
      url: url,
      dataType: 'json',
      type: 'GET',
      async: true,
      crossDomain: true
    }).done(function (data) {
      municipalities = data

      $('#municipality').empty()
      $.each(municipalities, function (key, val) {
        $('#municipality').append(`<option value="${val.nome.trim().toLowerCase()}">${val.nome.trim()}</option>`)
      })
    }).fail(function (err) {
      InternetError()
      console.error('Error fetching from ' + url, err)
    })

    GPSLoadingOnFields(true)
    // this is used to get address on form
    app.localization.getGeolocation((err) => {
      GPSLoadingOnFields(false)
      initMainFormMap()
      if (err) {
        console.error(err)
      }
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
  function getDateYYYY_MM_DD () {
    // returns format YYYY-MM-DD
    return $.datepicker.formatDate("yy'-'mm'-'dd", $('#date').datepicker('getDate'))
  }

  function getTimeHH_MM () {
    return $('#time').val()
  }

  function getFullAddress () {
    var fullAddress

    const streetNumber = getStreetNumber()
    if (streetNumber) {
      fullAddress = `${getStreetName()} n. ${streetNumber}, ${getMunicipality()}`
    } else {
      fullAddress = `${getStreetName()}, ${getMunicipality()}`
    }

    if (app.contacts.getCurrentParish()) {
      fullAddress += `, na freguesia ${getParish()}`
    }

    return fullAddress
  }

  function getMunicipality () {
    return $('#municipality option:selected').text().trim() || ''
  }

  function getParish () {
    return $('#parish option:selected').text().trim() || ''
  }

  function getStreetName () {
    return $('#street').val() || ''
  }

  function getStreetNumber () {
    return $('#street_number').val() || ''
  }

  /* ********************************************************************** */
  /* ******************* IS FORM CORRECTLY FILLED  ************************ */
  // returns true if all the fields and inputs in the form are filled in and ready to write the message
  function isMessageReady () {
    if (DEBUG) {
      return true
    }

    var to_break = false // this is true when one mandatory form field is empty or invalid
    var invalidPersonalInfo = false // at least one field of personal info is not filled or it is invalid
    var countEmptyFields = 0 // numer of invalid or empty mandatory user form fields
    var error_string = ''

    // loops through mandatory fields
    $('.mandatory').each(function () {
      var val = $(this).val()
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
          'os seus dados de identificação necessitam de ser fornecidos, ' +
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
    var Name = $('#name').val()
    if (!app.personalInfo.isFullNameOK(Name) && !DEBUG) {
      $.jAlert({
        title: 'Erro no nome!',
        theme: 'red',
        content: 'Insira o nome completo.'
      })
      return false
    }

    if (!app.personalInfo.isPostalCodeOK() && !DEBUG) {
      $.jAlert({
        title: 'Erro no Código Postal!',
        theme: 'red',
        content: 'Insira o Código Postal no formato XXXX-XXX'
      })
      return false
    }

    // from here the inputs are correctly written
    if (app.photos.getPhotosUriOnFileSystem().length === 0) {
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
      var text = $(this).val()
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
  $('#addImg_1, #addImg_2, #addImg_3, #addImg_4').click(function () {
    // get id, for example #remImg_2
    var id = $(this).attr('id')
    console.log('photo id: ' + id)
    // gets the number of the element, by obtaining the last character of the id
    var num = id[id.length - 1]

    var callback = function (imgNmbr) {
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
          onClick: function () { app.photos.getPhoto(num, 'camera', callback) }
        },
        {
          text: '<i class="fa fa-folder" aria-hidden="true"></i>',
          theme: 'green',
          class: 'ja_button_with_icon',
          onClick: function () { app.photos.getPhoto(num, 'library', callback) }
        }
      ]
    })
  })

  // buttons "Remove Image"
  $('#remImg_1, #remImg_2, #remImg_3, #remImg_4').click(function () {
    // get id, for example #remImg_2
    var id = $(this).attr('id')
    // gets the number of the element, by obtaining the last character of the id
    var num = id[id.length - 1]

    app.photos.removeImage('myImg_' + num, num)
    $(this).hide()

    $('#addImg_' + num).html('<i class="fa fa-plus"></i>')

    updateImgContainers()
  })

  function updateImgContainers () {
    var numberOfContainers = $('#image_selector .img-container').length
    var hasShownButton = false
    for (var i = 0; i < numberOfContainers; i++) {
      console.log(i)
      var $this = $('#image_selector .img-container').eq(i)
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

  // botão get address by GPS (Atualizar)
  $('#getCurrentAddresBtn').click(function () {
    GPSLoadingOnFields(true)
    app.localization.getGeolocation((err, coordinates) => {
      GPSLoadingOnFields(false)
      if (err) {
        console.error(err)
      } else {
        updatesFormMapToNewCoordinates(coordinates.latitude, coordinates.longitude)
      }
    })
    app.functions.updateDateAndTime()
  })

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
  $('#municipality').change(function (event, addressFromAPI) {
    const municipality = $(this).val().trim().toLowerCase()
    app.contacts.setMunicipality(municipality)

    $.each(municipalities, function (key, val) {
      if (val.nome.trim().toLowerCase() === municipality) {
        $('#parish').empty()
        $.each(val.freguesias, function (key2, parish) {
          $('#parish').append(`<option value="${parish.trim().toLowerCase()}">${parish.trim()}</option>`)
        })

        // does not trigger parish select, if address was got from an API, because API will also set parish
        if (!addressFromAPI) {
          $('#parish').change() // trigers event
        }
        return false // break loop, since the municipality was already found
      }
    })
  })

  $('#parish').change(function (event) {
    const parish = $(this).val().trim().toLowerCase()
    const municipality = $('#municipality').val().trim().toLowerCase()
    app.contacts.setParish(parish, municipality)
  })

  $('#street').on('input', function () {
    if ($(this).val() === '' && !DEBUG) {
      $(this).css('border-color', 'red')
    } else {
      $(this).css('border-color', '')
    }
  })

  function initMainFormMap (callback) {
    // get coordinates for the map center
    var currentLocation = app.localization.getCoordinates() // current position of user
    var latitude, longitude
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

    const mapIcon = L.icon({
      iconUrl: cordova.file.applicationDirectory + 'www/img/map_icon.png',
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
      app.localization.getAddressForForm(newCoord.lat, newCoord.lng)
    })

    setInterval(function () {
      mainFormMap.invalidateSize()
    }, 500)
  }

  function updatesFormMapToNewCoordinates (latitude, longitude) {
    mainFormMap.panTo(new L.LatLng(latitude, longitude))
    anomalyMapMarker.setLatLng(new L.LatLng(latitude, longitude))
  }

  function getScreenshotFromMap (callback) {
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
  function GPSLoadingOnFields (bool) {
    if (bool) {
      $('#municipality, #parish, #street, #street_number').addClass('loading')
    } else {
      $('#municipality, #parish, #street, #street_number').removeClass('loading')
      $('#municipality, #parish, #street, #street_number').trigger('input')
    }
  }

  thisModule.init = init
  /* === Public methods to be returned === */
  /* === Form field fetching functions === */
  thisModule.getDateYYYY_MM_DD = getDateYYYY_MM_DD
  thisModule.getTimeHH_MM = getTimeHH_MM
  thisModule.getFullAddress = getFullAddress
  thisModule.getMunicipality = getMunicipality
  thisModule.getParish = getParish
  thisModule.getStreetName = getStreetName
  thisModule.getStreetNumber = getStreetNumber
  thisModule.initMainFormMap = initMainFormMap
  thisModule.getScreenshotFromMap = getScreenshotFromMap
  thisModule.GPSLoadingOnFields = GPSLoadingOnFields
  /* ======================================== */
  thisModule.isMessageReady = isMessageReady

  return thisModule
})(app.form || {})
