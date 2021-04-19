/* eslint camelcase: off */

/* eslint no-unused-vars: "off" */
/* global app, $, cordova, device, pdf, Blob, atob, FileTransfer, AUTHENTICATION_WITH_IN_APP_BROWSER */

app.authentication = (function (thisModule) {
  var inAppBrowserRef
  var isAuthenticationWindowClosed = true
  var leftAppToSignPdf = false
  var jAlertOnAppResume

  function startAuthenticationWithSystemBrowser () {
    leftAppToSignPdf = false
    savePDF()
  }

  // this function is not yet fully funcional
  function startAuthenticationWithInAppBrowser () {
    if (!AUTHENTICATION_WITH_IN_APP_BROWSER) {
      return
    }

    if (isAuthenticationWindowClosed) {
      loadAuthentication()
    }

    console.log('inAppBrowserRef: ', inAppBrowserRef)
    if (inAppBrowserRef) {
      savePDF()
    } else {
      authenticationError()
    }
  }

  function loadAuthentication () {
    if (!AUTHENTICATION_WITH_IN_APP_BROWSER) {
      return
    }

    console.log('loadAuthentication()')

    var url = app.main.urls.Chave_Movel_Digital.assinar_pdf

    var target = '_blank'
    var options = 'hidden=yes,' +
      'footer=yes,' +
      'beforeload=yes' +
      'zoom=no,' +
      'toolbarcolor=#3C5DBC'

    inAppBrowserRef = cordova.InAppBrowser.open(url, target, options)
    inAppBrowserRef.addEventListener('beforeload', beforeLoadCallbackFunction)
    inAppBrowserRef.addEventListener('loadstart', loadStartCallbackFunction)
    inAppBrowserRef.addEventListener('loadstop', loadedCallbackFunction)
    inAppBrowserRef.addEventListener('loaderror', authenticationError)
    inAppBrowserRef.addEventListener('exit', authenticationExit)
  }

  function beforeLoadCallbackFunction (params, callback) {
    if (params.url.match('DigitalSignConfirmTan.aspx')) {
      cordova.InAppBrowser.open(params.url, '_system')
    } else {
      // Default handling:
      callback(params.url)
    }
  }

  function loadStartCallbackFunction (event) {
    console.log('%c ========== loadstart ========== ', 'background: yellow; color: blue')
    console.log(event.url)

    if (event.url.split('/').pop() === 'DigitalSignConfirmTan.aspx') {
      console.log(event)
    }
  }

  function loadedCallbackFunction (event) {
    console.log('%c ========== loadstop ========== ', 'background: yellow; color: blue')
    // console.log(event.url)

    isAuthenticationWindowClosed = false

    inAppBrowserRef.insertCSS({ code: '.header,.logo,language-container,.footer{display: none !important}' })

    $.ajax({
      type: 'GET',
      url: cordova.file.applicationDirectory + 'www/js/authBrowserJSCode.js',
      dataType: 'text',
      success: function (JScodeRes) {
        // altera o texto quando refere o Documento para assinar
        var JScode = JScodeRes +
          `(function(){
             var textEl = document.getElementById('MainContent_lblTitleChooseDoc');
             if(textEl){
               textEl.innerHTML = 'Escolha o documento PDF na pasta <i>Downloads</i> para assinar digitalmente';
             }
           })();`

        inAppBrowserRef.executeScript(
          { code: JScode },
          function () {
            console.log('authBrowserJSCode.js Inserted Succesfully into inApp Browser Window')
          })
      },
      error: function () {
        console.error('Ajax Error')
      }
    })
  }

  function downloadPdfFile (args) {
    console.log('downloadPdfFile')
    /* on construction */
  }

  function authenticationError () {
    $.jAlert({
      title: 'Erro na obtenção da autenticação!',
      theme: 'red',
      content: 'Confirme se tem acesso à Internet. Poderá sempre enviar a ocorrência às autoridades sem a autenticação da Chave Móvel Digital.'
    })
  }

  function authenticationExit () {
    console.log('Authentication Window closed')
    isAuthenticationWindowClosed = true
  }

  function savePDF () {
    var options = {
      documentSize: 'A4',
      type: 'base64'
    }

    var pdfhtml = '<html><body style="font-size:120%">' + app.text.getMainMessage('body')

    var imagesArray = app.photos.getPhotosUriOnFileSystem()
    for (var i = 0; i < imagesArray.length; i++) {
      pdfhtml += '<br><br>'
      pdfhtml += '<img src="' + imagesArray[i] + '" width="320">'
    }

    pdfhtml += '<br><br>' + app.text.getExtraAuthenticationHTMLText()
    pdfhtml += '</body></html>'

    pdf.fromData(pdfhtml, options)
      .then(function (base64) {
        // To define the type of the Blob
        const res = getPdfFilePath()
        if (res) {
          console.log('getPdfFilePath() returns: ', res)
          savebase64AsPDF(res.folderpath, res.fileName, base64, 'application/pdf')
        } else {
          console.error('Error getting pdf filename')
          window.alert('Houve um erro a tentar guardar o PDF. Plataforma não suportada')
        }
      })
      .catch((err) => {
        console.error('Error while creating pdf: ', err)
        window.alert('Houve um erro na geração do PDF')
      })
  }

  function getPdfFilePath (callback) {
    // folderpath/fileName
    var folderpath
    var fileName

    // get fileName
    var carPlate = app.form.getCarPlate()
    if (carPlate && !app.functions.isThis_iOS()) {
      fileName = carPlate
    } else {
      var rightNow = new Date()
      fileName = rightNow.toISOString().slice(0, 10)
    }

    fileName = fileName + '_Denuncia_Estacionamento' + '.pdf'

    // now get folderpath
    if (app.functions.isThisAndroid()) {
      if (parseFloat(device.version) >= 10) {
        folderpath = cordova.file.cacheDirectory
      } else {
        folderpath = cordova.file.externalRootDirectory + 'Download/' // file:///storage/emulated/0/Download/
      }
      return { folderpath, fileName }
    } else if (app.functions.isThis_iOS()) {
      folderpath = cordova.file.documentsDirectory
      return { folderpath, fileName }
    } else {
      return null
    }
  }

  // these two function got from here: https://ourcodeworld.com/articles/read/230/how-to-save-a-pdf-from-a-base64-string-on-the-device-with-cordova
  /**
   * Convert a base64 string in a Blob according to the data and contentType.
   *
   * @param b64Data {String} Pure base64 string without contentType
   * @param contentType {String} the content type of the file i.e (application/pdf - text/plain)
   * @param sliceSize {Int} SliceSize to process the byteCharacters
   * @see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
   * @return Blob
   */
  function b64toBlob (b64Data, contentType, sliceSize) {
    contentType = contentType || ''
    sliceSize = sliceSize || 512

    var byteCharacters = atob(b64Data)
    var byteArrays = []

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize)

      var byteNumbers = new Array(slice.length)
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }

      var byteArray = new Uint8Array(byteNumbers)

      byteArrays.push(byteArray)
    }

    var blob = new Blob(byteArrays, { type: contentType })
    return blob
  }

  /**
   * Create a PDF file according to its database64 content only.
   *
   * @param folderpath {String} The folder where the file will be created
   * @param filename {String} The name of the file that will be created
   * @param content {Base64 String} Important : The content can't contain the following string (data:application/pdf;base64). Only the base64 string is expected.
   */
  function savebase64AsPDF (folderpath, filename, content, contentType) {
    var onerror = function (err, message) {
      leftAppToSignPdf = false
      console.error(err)
      window.alert(`Não foi possível salvar o ficheiro na pasta "${folderpath}". ${message}`)
    }
    // Convert the base64 string in a Blob
    var DataBlob = b64toBlob(content, contentType)

    console.log('Starting to write the file')

    window.resolveLocalFileSystemURL(folderpath, function (dir) {
      console.log('Access to the directory granted succesfully: ' + folderpath)
      dir.getFile(filename, { create: true, exclusive: false }, function (file) {
        console.log('File created succesfully.')
        file.createWriter(function (fileWriter) {
          console.log('Writing content to file')

          fileWriter.onwriteend = function () {
            console.success('Successful file write')
            showSavedPdfFileInfo(folderpath, filename)
          }

          fileWriter.onerror = (err) => { onerror(err, 'Erro ao tentar escrever no ficheiro!') }

          fileWriter.write(DataBlob)
        }, (err) => { onerror(err, 'Erro ao tentar escrever no ficheiro!') })
      }, (err) => { onerror(err, 'Erro ao tentar criar o ficheiro!') })
    }, (err) => { onerror(err, 'Erro ao tentar procurar a pasta!') })
  }

  function showSavedPdfFileInfo (folderpath, filename) {
    console.log('PDF fullpath: ' + folderpath + filename)

    if (AUTHENTICATION_WITH_IN_APP_BROWSER) {
      inAppBrowserRef.hide()
    }

    var deviceSpecificMessage

    // for Android 10 and above, we need to use social sharing plugin to save the pdf
    // see https://github.com/jfoclpf/form-for-parking-violation/issues/89
    if (app.functions.isThisAndroid() && parseFloat(device.version) >= 10 && Boolean(window.plugins.socialsharing)) {
      const message = 'Guarde o ficheiro PDF com a denúncia num local à sua escolha.<br><br>' +
        '<span style="font-size:80%">Caso queira guardar no seu sistema de ficheiros Android e não consiga, use a "APP para guardar PDF" que encontra no menu principal.</span>'

      $.jAlert({
        content: message,
        theme: 'dark_blue',
        btns: [{
          text: 'Avançar',
          theme: 'green',
          class: 'jButtonAlert',
          onClick: function () {
            window.plugins.socialsharing.shareWithOptions({
              message: 'PDF para Denúncia de Estacionamento',
              subject: filename,
              files: [folderpath + filename]
            },
            (res) => {
              console.log('Share completed', res)
              // tries to find the app name with which the pdf file was shared/downloaded
              $.getJSON(cordova.file.applicationDirectory + 'www/js/res/google-app-ids.json', (data) => {
                var msg = 'Recorde-se do local onde guardou o ficheiro PDF'

                // res.app is on the form "ComponentInfo{com.synology.DSfile/com.synology.DSfile.MainActivity}"
                var appId = res.app.match(/\{([^)]+)\}/)
                if (appId) {
                  appId = appId[1]
                  if (appId.includes('/')) {
                    appId = appId.split('/')[0]
                  }
                }

                for (const key in data) {
                  if (appId === data[key].package_name) {
                    msg += ' usando a aplicação ' + data[key].name
                    break
                  }
                }
                msg += '. Caso contrário ou caso tenha cancelado o processo, saia deste diálogo e tente novamente.'

                showPDFInfoDialog(msg)
              })
            })
          }
        }]
      })
    } else {
      deviceSpecificMessage = 'Foi criado o ficheiro PDF<br><span style="color:orange"><b>' + filename + '</b></span><br>'
      if (app.functions.isThisAndroid()) {
        deviceSpecificMessage += 'na pasta <i>Downloads</i> ou <i>Documentos/Downloads</i> com a sua denúncia.'
      } else if (app.functions.isThis_iOS()) {
        deviceSpecificMessage += 'com a sua denúncia na pasta respetiva desta Aplicação no "Meu iPhone".'
      }
      showPDFInfoDialog(deviceSpecificMessage)
    }
  }

  function showPDFInfoDialog (deviceSpecificMessage) {
    var msg = deviceSpecificMessage + '<br><br>' +
      'Abrir-se-á de seguida uma janela para assinar o PDF fazendo uso da sua Chave Móvel Digital. No processo, garanta que coloca a assinatura visível no documento.<br><br>' +
      'Após assinar o PDF com a sua Chave Móvel Digital, guarde esse PDF digitalmente assinado e depois regresse novamente a esta APP.<br><br>' +
      '<span style="font-size:80%">Nota: Por vezes o envio de SMS da Chave Móvel Digital não funciona. A responsabilidade por tal falha <b>não é nossa</b>, é dos serviços do Cartão de Cidadão. ' +
      'No caso de não receber o SMS, experimente usar a APP da Chave Móvel Digital cuja ligação encontra no menu principal desta APP.</span>'

    $.jAlert({
      title: 'Criação de ficheiro PDF',
      content: msg,
      theme: 'dark_blue',
      btns: [{
        text: 'Avançar',
        theme: 'green',
        class: 'jButtonAlert',
        onClick: function () {
          if (AUTHENTICATION_WITH_IN_APP_BROWSER) {
            // tries to use internal browser plugin to sign the pdf document
            inAppBrowserRef.show()
          } else {
            cordova.InAppBrowser.open(app.main.urls.Chave_Movel_Digital.assinar_pdf, '_system')
            leftAppToSignPdf = true
          }
        }
      }]
    })
  }

  // depois de sair da APP para assinar o PDF na página do Estado, regressa novamente à APP e corre esta função
  function onAppResume () {
    if (AUTHENTICATION_WITH_IN_APP_BROWSER) {
      return
    }

    console.log('leftAppToSignPdf:', leftAppToSignPdf)
    // if the PDF file was not just recently created, leave
    if (!leftAppToSignPdf) {
      return
    }

    // if the alert is already open, don't do anything
    if (jAlertOnAppResume && $.jAlert('current') && jAlertOnAppResume.content === $.jAlert('current').content) {
      console.log('jAlert window already open, don\'t open a new one')
      return
    }

    jAlertOnAppResume = $.jAlert({
      title: 'PDF digitalmente assinado?',
      content: 'Consegiu assinar o PDF com sucesso, fazendo uso da sua Chave Móvel Digital?',
      theme: 'dark_blue',
      onClose: function () {
        leftAppToSignPdf = false
      },
      btns: [
        {
          text: 'Sim',
          theme: 'green',
          class: 'jButtonAlert',
          onClick: function () {
            $.jAlert({
              title: 'Envio do PDF digitalmente assinado',
              content: 'Abrir-se-á de seguida a sua APP de email onde terá apenas que anexar o PDF digitalmente assinado. Garanta que anexa apenas o PDF que está digitalmente assinado.',
              theme: 'dark_blue',
              btns: [
                {
                  text: 'Avançar',
                  theme: 'green',
                  class: 'jButtonAlert',
                  onClick: sendMailMessageWithCMD // CMD -> Chave Móvel Digital
                }
              ]
            })
          }
        },
        {
          text: 'Não, mas quero tentar novamente',
          theme: 'green',
          closeAlert: false,
          class: 'jButtonAlert',
          onClick: function () {
            leftAppToSignPdf = false
            // Opens in the system's default web browser
            cordova.InAppBrowser.open(app.main.urls.Chave_Movel_Digital.assinar_pdf, '_system')
          }
        },
        {
          text: 'Não, mas quero enviar sem Chave Móvel Digital',
          theme: 'green',
          class: 'jButtonAlert',
          onClick: function () {
            app.main.sendMailMessageWithoutCMD() // CMD -> Chave Móvel Digital
            leftAppToSignPdf = false
          }
        }
      ]
    })
  }

  function sendMailMessageWithCMD () {
    app.dbServerLink.submitNewEntryToDB()

    cordova.plugins.email.open({
      to: app.contactsFunctions.getEmailOfCurrentSelectedAuthority(), // email addresses for TO field
      subject: app.text.getMailMessageWithCMD('subject'), // subject of the email
      body: app.text.getMailMessageWithCMD('body'), // email body (for HTML, set isHtml to true)
      isHtml: true // indicats if the body is HTML or plain text
    }, function () {
      console.log('email view dismissed')
      leftAppToSignPdf = false
    }, this)
  }

  /* === Public methods to be returned === */
  thisModule.startAuthenticationWithInAppBrowser = startAuthenticationWithInAppBrowser
  thisModule.startAuthenticationWithSystemBrowser = startAuthenticationWithSystemBrowser
  thisModule.onAppResume = onAppResume

  return thisModule
})(app.authentication || {})
