/* eslint camelcase: off */

/* global $, cordova */

var DEBUG = true

var app = {}

app.main = (function (thisModule) {
  var wasInit

  thisModule.urls = {
    databaseServer: {
      uploadImages: '', // used to upload an image
      requestImage: '', // folder where all the images are stored
      uploadOccurence: '', // to upload anew or update the data of an occurence
      requestHistoric: '' // to request all historic ocurrences of current user
    },
    androidApps: {
      thisApp: 'https://play.google.com/store/apps/details?id=com.form.parking.violation'
    },
    openStreetMaps: {
      nominatimReverse: 'https://nominatim.openstreetmap.org/reverse'
    }
  }

  $(document).ready(function () {
    console.log('$(document).ready started')
    wasInit = false
    document.addEventListener('deviceready', onDeviceReady, false)

    app.sidebar.showSection('main_form')
  })

  function onDeviceReady () {
    console.log('onDeviceReady() started')
    console.success = (message) => { console.log('%c ' + message, 'color: green; font-weight:bold') }

    document.addEventListener('online', onOnline, false)
    document.addEventListener('resume', onResume, false)

    window.screen.orientation.lock('portrait')

    cordova.getAppVersion.getVersionNumber(function (version) {
      console.log('APP version is ' + version)
      thisModule.APPversion = version
      $('.version').text('versão ' + version)
    })

    cordova.plugins.IsDebug.getIsDebug(function (isDebug) {
      // in release mode the app is not debuggable (in chrome), thus I may stil want to debug with DEBUG=false
      // but in release mode I want to be sure that DEBUG is always false
      if (!isDebug) { // release mode
        DEBUG = false
        console.log = () => {}
        console.warn = () => {}
        console.error = () => {}
      }
      init()
    }, function (err) {
      console.error(err)
      init()
    })
  }

  // if by any strange reason onDeviceReady doesn't trigger after 5 seconds, load init() anyway
  setTimeout(function () {
    if (!wasInit) {
      init()
    }
  }, 5000)

  // when the page loads (only on smartphone)
  function init () {
    console.log('init() started')
    wasInit = true

    console.log('DEBUG: ', DEBUG)
    // for the plugin cordova-plugin-inappbrowser
    window.open = cordova.InAppBrowser.open

    app.form.init()
    app.sidebar.init()
    app.functions.addFunctionsToPlugins()

    // information stored in variable window.localStorage
    app.personalInfo.loadsPersonalInfo()

    // populates HTML select according to the information on anomalies.js file
    app.anomalies.populatesAnomalies()

    app.functions.updateDateAndTime()

    $('input.mandatory').each(function () {
      if (!DEBUG && $(this).val() === '') {
        $(this).css('border-color', 'red')
      }
    })

    // this is used to get address on form, and for maps section
    app.localization.loadMapsApi()

    // app.map.init()

    if (DEBUG) {
      app.functions.setDebugValues()
    }

    if (!DEBUG) {
      requestUserAppEvaluation()
    }
  }

  // ##############################################################################################################
  // ##############################################################################################################

  function onOnline () {
    app.localization.loadMapsApi()
  }

  function onResume () {
    console.log('onResume')
    app.authentication.onAppResume()
  }

  // request user to evaluate this app on Play Store
  function requestUserAppEvaluation () {
    if (JSON.parse(window.localStorage.getItem('didUserAlreadyClickedToEvaluatedApp'))) {
      return
    }

    const minimumOccurencesToRequestUserToEvaluteApp = 5
    app.historic.requestNumberOfHistoricOccurrences(
      (err, result) => {
        if (!err && result > minimumOccurencesToRequestUserToEvaluteApp) {
          var msg = 'Reparámos que tem usado esta APP, que é gratuita, de código aberto e sem publicidade. Fizemo-lo dentro do espírito de serviço público.<br><br>' +
            'Contudo vários utilizadores movidos por uma lógica vingativa, presumivelmente automobilistas cujas ações foram reportadas, têm dado nota negativa (nota 1) a esta APP na Play Store.<br><br>' +
            'Ajude-nos avaliando o nosso trabalho cívico. Muito obrigados'

          $.jAlert({
            content: msg,
            theme: 'dark_blue',
            btns: [
              {
                text: 'Avaliar na Play Store',
                theme: 'green',
                class: 'jButtonAlert',
                onClick: function () {
                  window.localStorage.setItem('didUserAlreadyClickedToEvaluatedApp', 'true')
                  cordova.InAppBrowser.open(thisModule.urls.androidApps.thisApp, '_system')
                }
              }
            ]
          })
        }
      })
  }

  // when user clicks "generate_email"
  $('#generate_message').click(function () {
    if (!app.form.isMessageReady()) {
      return
    }

    var mainMessage = app.text.getMainMessage('body')
    $('#message').html(mainMessage)
    $('#mail_message').show()

    // scrolls to the generated message
    $('html, body').animate({
      scrollTop: $('#message').offset().top
    }, 1000)
  })

  // botão de gerar email
  $('#send_email_btn').click(function () {
    // it popups the alerts according to needed fields
    if (app.form.isMessageReady()) {
      sendEMailMessage()
    }
  })

  // CMD -> Chave Móvel Digital
  function sendEMailMessage () {
    app.dbServerLink.submitNewEntryToDB()

    var imagesArray = app.photos.getPhotosForEmailAttachment()
    // console.log(JSON.stringify(imagesArray, 0, 3))
    const attachments = imagesArray.map((path, i) => cordova.plugins.email.adaptPhotoInfoForEmailAttachment(path, i))
    console.log(JSON.stringify(attachments, 0, 3))

    cordova.plugins.email.open({
      to: app.contactsFunctions.getEmailOfCurrentSelectedAuthority(), // email addresses for TO field
      attachments: attachments,
      subject: app.text.getMainMessage('subject'), // subject of the email
      body: app.text.getMainMessage('body'), // email body (for HTML, set isHtml to true)
      isHtml: true // indicats if the body is HTML or plain text
    })
  }

  thisModule.sendEMailMessage = sendEMailMessage

  return thisModule
})({})
