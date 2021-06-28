/* eslint no-var: off */
/* eslint camelcase: off */

/* global app, $, DEBUG */

app.form = (function (thisModule) {
  // array of municipalities with parishes, ex: {"nome":"Abrantes", "freguesias":[ "Bemposta", etc.] }
  var municipalities = []

  function init (callback) {
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
      callback()
    }).fail(function (err) {
      console.error('Error fetching from ' + url, err)
      InternetError()
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

    var to_break = false
    var error_string = ''
    var count = 0

    // loops through mandatory fields
    $('.mandatory').each(function () {
      var val = $(this).val()
      if (val == null || val === undefined || val === '' || (val).length === 0 || (val).replace(/^\s+|\s+$/g, '').length === 0) {
        console.log('Error on #' + $(this).attr('id'))
        error_string += '- ' + $(this).attr('name') + '<br>'
        count++
        to_break = true
      }
    })

    console.log('#generate_message goes', to_break)
    if (to_break) {
      if (count === 1) {
        $.jAlert({
          title: 'Erro!',
          theme: 'red',
          content: 'Preencha o seguinte campo obrigatório:<br>' + error_string
        })
      } else {
        $.jAlert({
          title: 'Erro!',
          theme: 'red',
          content: 'Preencha os seguintes campos obrigatórios:<br>' + error_string
        })
      }
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
  /* ======================================== */
  thisModule.isMessageReady = isMessageReady

  return thisModule
})(app.form || {})
