/* eslint camelcase: off */

/* eslint no-var: off */
/* global $, cordova */

var DEBUG = true

var app = {}

app.main = (function (thisModule) {
  var wasInit

  thisModule.urls = {
    databaseServer: {
      uploadImages: 'https://in-my-district.joaopimentel.com/serverapp_img_upload', // used to upload an image
      requestImage: 'https://in-my-district.joaopimentel.com/image_server', // folder where all the images are stored
      uploadOccurence: 'https://in-my-district.joaopimentel.com/serverapp', // to upload anew or update the data of an occurence
      requestHistoric: 'https://in-my-district.joaopimentel.com/serverapp_get_historic' // to request all historic ocurrences of current user
    },
    androidApps: {
      thisApp: 'https://play.google.com/store/apps/details?id=com.in.my.district'
    },
    geoApi: {
      nominatimReverse: 'https://nominatim.openstreetmap.org/reverse',
      ptApi: 'https://geoptapi.org' // check https://www.geoptapi.org/
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
      console.warn('IsDebug plugin unavailable or not working', err)
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
    app.contacts.init()
    app.functions.addFunctionsToPlugins()

    // information stored in variable window.localStorage
    app.personalInfo.loadsPersonalInfo()

    // populates HTML select according to the information on anomalies.js file
    app.anomalies.populatesAnomaliesSelect((err) => {
      if (err) {
        console.error(err)
      } else {
        app.map.init()
      }
    })

    app.functions.updateDateAndTime()

    $('input.mandatory').each(function () {
      if (!DEBUG && $(this).val() === '') {
        $(this).css('border-color', 'red')
      }
    })

    if (DEBUG) {
      app.functions.setDebugValues()
    }

    if (!DEBUG) {
      requestUserAppEvaluation()
      initialWelcomePopup()
    }
  }

  // ##############################################################################################################
  // ##############################################################################################################

  function onOnline () {
    app.form.GPSLoadingOnFields(true)
    // this is used to get address on form
    app.localization.getGeolocation((err) => {
      app.form.GPSLoadingOnFields(false)
      if (err) {
        console.error(err)
      }
    })
  }

  function onResume () {
    console.log('onResume')
  }

  function initialWelcomePopup () {
    if (JSON.parse(window.localStorage.getItem('didUserAlreadySeeWelcomePopup'))) {
      return
    }

    const msg = 'Bem-vindo! Ao abrigo da alínea b) do art.º 102.º do Código do Procedimento Administrativo, ' +
      'terá de se identificar para proceder a uma denúncia. ' +
      '<b>Não guardamos, não enviamos nem processamos os seus dados pessoais.</b><br><br>' +
      'Esta APP ocupa um espaço residual (cerca de 2mb, semelhante a uma foto) no seu dispositivo. ' +
      'Não funciona em pano de fundo nem consome quaisquer recursos quando não é usada.\n' +
      'Desinstalar esta APP não lhe resolverá qualquer problema de espaço ou recursos. ' +
      'Contudo a APP pode ser sempre útil para qualquer ocasião.'

    $.jAlert({
      content: msg,
      theme: 'dark_blue',
      closeBtn: false,
      btns: [
        {
          text: 'Compreendo',
          theme: 'green',
          class: 'jButtonAlert',
          onClick: function () {
            window.localStorage.setItem('didUserAlreadySeeWelcomePopup', 'true')
          }
        }
      ]
    })
  }

  // request user to evaluate this app on Play Store
  function requestUserAppEvaluation () {
    if (JSON.parse(window.localStorage.getItem('didUserAlreadyClickedToEvaluatedApp'))) {
      return
    }

    const minimumOccurencesToRequestUserToEvaluteApp = 5
    app.historic.requestNumberOfHistoricOccurrences(
      (err, result) => {
        if (err) {
          console.error('error getting minimumOccurences', err)
          return
        }

        if (result > minimumOccurencesToRequestUserToEvaluteApp) {
          var msg = 'Reparámos que tem usado esta APP, que é gratuita, de código aberto e sem publicidade. Fizemo-lo dentro do espírito de serviço público.<br><br>' +
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

  // when user clicks "gerar texto"
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

  // botão de enviar email
  $('#send_email_btn').click(function () {
    // it popups the alerts according to needed fields
    if (app.form.isMessageReady()) {
      sendEMailMessage()
    }
  })

  function sendEMailMessage () {
    app.dbServerLink.submitNewEntryToDB()

    var imagesArray = app.photos.getPhotosForEmailAttachment()
    // console.log(JSON.stringify(imagesArray, 0, 3))
    const attachments = imagesArray.map((path, i) => cordova.plugins.email.adaptPhotoInfoForEmailAttachment(path, i))
    console.log(JSON.stringify(attachments, 0, 3))

    // fetch screenshot of form's map
    app.form.getScreenshotFromMap(function (err, res) {
      if (err) {
        console.error(err)
      } else {
        attachments.push(res)
      }

      var emailTo
      if (app.contacts.getCurrentParish() && app.contacts.getCurrentParish().email) {
        emailTo = [app.contacts.getCurrentMunicipality().email, app.contacts.getCurrentParish().email]
      } else {
        emailTo = app.contacts.getCurrentMunicipality().email
      }

      cordova.plugins.email.open({
        to: emailTo, // email addresses for TO field
        attachments: attachments,
        subject: app.text.getMainMessage('subject'), // subject of the email
        body: app.text.getMainMessage('body'), // email body (for HTML, set isHtml to true)
        isHtml: true // indicats if the body is HTML or plain text
      })
    })
  }

  thisModule.sendEMailMessage = sendEMailMessage

  return thisModule
})({})
