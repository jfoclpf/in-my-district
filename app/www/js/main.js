/* global $, cordova, device */

import * as form from './form.js'
import * as sidebar from './sidebar.js'
import * as contacts from './contacts.js'
import * as functions from './functions.js'
import * as personalInfo from './personalInfo.js'
import * as anomalies from './anomalies.js'
import * as localization from './localization.js'
import * as map from './map.js'
import * as historic from './historic.js'
import * as text from './text.js'
import * as dbServerLink from './dbServerLink.js'
import * as photos from './photos.js'
import * as variables from './variables.js'

export let DEBUG = true
export let APPversion

let wasInit

// list of municipalities, for which the APP will NOT allow sending emails
// for exemple in Lisbon, the municipality explicitly rejects issues sent with this APP
export const blockedMunicipalities = [
  'Lisboa'
]

// replaces $(document).ready() which is deprecated
$(function () {
  console.log('DOM is ready')
  wasInit = false
  document.addEventListener('deviceready', onDeviceReady, false)

  sidebar.showSection('main_form')
})

function onDeviceReady () {
  console.log('onDeviceReady() started')
  console.success = (message) => { console.log('%c ' + message, 'color: green; font-weight:bold') }

  document.addEventListener('online', onOnline, false)
  document.addEventListener('resume', onResume, false)

  window.screen.orientation.lock('portrait')

  cordova.plugins.IsDebug.getIsDebug(function (isDebug) {
    // in release mode the app is not debuggable (in chrome), though I want to be sure that DEBUG is always false
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
  cordova.getAppVersion.getVersionNumber(function (version) {
    console.log('APP version is ' + version)
    APPversion = version
    $('.version').text(`${device.platform}, v. ${version}${DEBUG ? 'd' : 'p'}`)
  })

  console.log('init() started')
  wasInit = true

  console.log('DEBUG: ', DEBUG)
  // for the plugin cordova-plugin-inappbrowser
  window.open = cordova.InAppBrowser.open

  form.init()
  sidebar.init()
  contacts.init()
  functions.addFunctionsToPlugins()

  // information stored in variable window.localStorage
  personalInfo.loadsPersonalInfo()

  // populates HTML select according to the information on anomalies.js file
  anomalies.populatesAnomaliesSelect((err) => {
    if (err) {
      console.error(err)
    } else {
      map.init()
    }
  })

  functions.updateDateAndTime()

  $('input.mandatory').each(function () {
    if (!DEBUG && $(this).val() === '') {
      $(this).css('border-color', 'red')
    }
  })

  if (DEBUG) {
    functions.setDebugValues()
  }

  if (!DEBUG) {
    requestUserAppEvaluation()
    initialWelcomePopup()
    // this APP only works with MIUI optimization ON, warn the user about it
    if (device.manufacturer.toLowerCase() === 'xiaomi') {
      xiaomiWarning()
    }
  }
}

// ##############################################################################################################
// ##############################################################################################################

function onOnline () {
  form.GPSLoadingOnFields(true)
  // this is used to get address on form
  localization.getGeolocation()
    .then((res) => {
      form.updatesFormMapToNewCoordinates(res.latitude, res.longitude)
      localization.fillFormWithAddress(res.addressFromOSM, res.addressFromGeoApiPt)
    })
    .catch((err) => {
      console.error('Error on localization.getGeolocation()')
      if (err) {
        console.error(err)
      }
    })
    .finally(() => {
      form.GPSLoadingOnFields(false)
    })
}

function onResume () {
  console.log('onResume')

  // stop loading spinner
  $('#spinner-send_email_btn').hide()
  $('#send_email_btn').show()
}

function initialWelcomePopup () {
  if (JSON.parse(window.localStorage.getItem('didUserAlreadySeeWelcomePopup'))) {
    return
  }

  const msg = 'Bem-vindo! Ao abrigo da alínea b) do art.º 102.º do Código do Procedimento Administrativo, ' +
    'terá de se identificar em <b>Menu Principal &ndash;> Os meus dados</b> para proceder a uma denúncia. ' +
    '<b>Não guardamos, não enviamos nem processamos os seus dados pessoais.</b><br><br>' +
    'Esta APP ocupa um espaço residual (cerca de 2mb, semelhante a uma foto) no seu dispositivo. ' +
    'Não funciona em plano de fundo nem consome quaisquer recursos quando não é usada.\n' +
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
  historic.requestNumberOfHistoricOccurrences(
    (err, result) => {
      if (err) {
        console.error('error getting number of historic occurrences', err)
        return
      }

      if (result > minimumOccurencesToRequestUserToEvaluteApp) {
        const msg = 'Reparámos que tem usado esta APP, que é gratuita, de código aberto e sem publicidade. Fizemo-lo dentro do espírito de serviço público.<br><br>' +
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
                cordova.InAppBrowser.open(variables.urls.appStores.playStore, '_system')
              }
            }
          ]
        })
      }
    })
}

// this APP only works with MIUI optimization ON, warn user about it
function xiaomiWarning () {
  if (JSON.parse(window.localStorage.getItem('didUserAlreadySeeXiaomiWarning'))) {
    return
  }

  const msg = 'Nos dispositivos Xiaomi, a Otimização MIUI tem que estar ativa para o funcionamento desta APP, ' +
    'especificamente para poder anexar fotos. ' +
    'Normalmente esta opção está ativa por defeito e não necessita de realizar qualquer operação.'

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
          window.localStorage.setItem('didUserAlreadySeeXiaomiWarning', 'true')
        }
      }
    ]
  })
}

// when user clicks "gerar texto"
$('#generate_message').on('click', function () {
  if (!form.isMessageReady()) {
    return
  }

  const mainMessage = text.getMainMessage('cleanBody')
  $('#message').html(mainMessage)
  $('#mail_message').show()

  // scrolls to the generated message
  $('html, body').animate({
    scrollTop: $('#message').offset().top
  }, 1000)
})

// botão de enviar email
$('#send_email_btn').on('click', function () {
  // it popups the alerts according to needed fields
  if (form.isMessageReady()) {
    $('#send_email_btn').hide()
    $('#spinner-send_email_btn').show()

    sendEMailMessage()

    setTimeout(() => {
      $('#spinner-send_email_btn').hide()
      $('#send_email_btn').show()
    }, 10000)
  }
})

function sendEMailMessage () {
  let dbEntryResultData
  let attachments

  const submitEntryToDbDefer = $.Deferred()
  const getScreenshotFromMapDefer = $.Deferred()

  dbServerLink.submitNewEntryToDB(
    // callback for DB entry submitted
    function (err, res) {
      if (err) {
        console.error('There was an error submitting entry to database', err)
        window.alert('Erro a inserir dados da ocorrência na base de dados: ' + JSON.stringify(err.message))
        submitEntryToDbDefer.reject()
      } else if (!res) {
        console.error('There was an error submitting entry to database: empty result')
        window.alert('Erro a inserir dados da ocorrência na base de dados: sem retorno de dados')
        submitEntryToDbDefer.reject()
      } else {
        dbEntryResultData = res
        console.success('Entry submited to database with success')
        submitEntryToDbDefer.resolve()
      }
    },
    // callback for upload of photos
    function (err) {
      if (err) {
        console.error('There was an error submitting photos to database', err)
        window.alert('Erro a inserir fotos na base de dados: ' + JSON.stringify(err.message))
      } else {
        console.success('Photos submited to database with success')
      }
    }
  )

  try {
    const imagesArray = photos.getPhotosForEmailAttachment()
    // console.log(JSON.stringify(imagesArray, 0, 3))
    attachments = imagesArray.map((path, i) => cordova.plugins.email.adaptDataUrlForAttachment(path, i))
  } catch (err) {
    console.error('Error gathering attachments', err, attachments)
    window.alert('Erro a obter anexos')
  }

  // fetch screenshot of form's map
  form.getScreenshotFromMap(function (err, res) {
    if (err) {
      console.error('Error on getScreenshotFromMap', err)
      window.alert('Erro a obter imagem do mapa (getScreenshotFromMap)')
      getScreenshotFromMapDefer.reject()
    } else {
      attachments.push(res)
      getScreenshotFromMapDefer.resolve()
    }
  })

  const emailTo = []
  // the system already forces the user to chose at least one of municipality or parish checkbox, anyway double-check
  if (!$('#send_to_municipality_checkbox').is(':checked') && !$('#send_to_parish_checkbox').is(':checked')) {
    window.alert('Erro, email tem de ser enviado pelo menos para municipio ou junta de freguesa')
    return
  }

  if (form.bSendToMunicipality()) {
    emailTo.push(contacts.getCurrentMunicipality().email)
  }
  if (form.bSendToParish()) {
    emailTo.push(contacts.getCurrentParish().email)
  }

  const sendEmail = function () {
    try {
      cordova.plugins.email.open({
        to: emailTo, // email addresses for TO field
        attachments,
        subject: text.getMainMessage('subject'), // subject of the email
        body: text.getMainMessage('body', dbEntryResultData), // email body (for HTML, set isHtml to true)
        isHtml: true // indicats if the body is HTML or plain text
      })
    } catch (err) {
      console.error('Error on cordova.plugins.email', err)
      window.alert('Erro ao abrir a APP de email:\n' + JSON.stringify(err, null, 2))
    }
  }

  $.when(submitEntryToDbDefer, getScreenshotFromMapDefer).then(sendEmail, sendEmail)
}
