/* eslint no-var: off */
/* eslint camelcase: "off" */
/* global app, device, $, CryptoComm, DEBUG */

app.dbServerLink = (function (thisModule) {
  const uploadImagesUrl = app.main.urls.databaseServer.uploadImages
  const uploadOccurenceUrl = app.main.urls.databaseServer.uploadOccurence

  function submitNewEntryToDB () {
    const carPlate = app.form.getCarPlate()
    const dateYYYY_MM_DD = app.form.getDateYYYY_MM_DD()
    const timeHH_MM = app.form.getTimeHH_MM()
    const municipality = app.form.getMunicipality()

    // generates file names array for images
    const randomString = getRandomString(10) // serves to uniquely identify the filenames
    var imgFileNames = []
    var imagesArray = app.photos.getPhotosUriOnFileSystem()
    var numberOfImages = imagesArray.length
    for (let i = 0; i < 4; i++) {
      if (i < numberOfImages) {
        const fileName = `${DEBUG ? 'debug_' : ''}${carPlate}_n${i + 1}_${dateYYYY_MM_DD}_${timeHH_MM}_${municipality}_${randomString}.jpg`
        imgFileNames.push(fileName)
      } else {
        imgFileNames.push('')
      }
    }

    var databaseObj = {
      PROD: !DEBUG ? 1 : 0,
      uuid: device.uuid,
      foto1: imgFileNames[0],
      foto2: imgFileNames[1],
      foto3: imgFileNames[2],
      foto4: imgFileNames[3],
      carro_matricula: app.form.getCarPlate(),
      carro_marca: app.form.getCarMake(),
      carro_modelo: app.form.getCarModel(),
      data_data: app.form.getDateYYYY_MM_DD(),
      data_hora: app.form.getTimeHH_MM(),
      data_concelho: app.form.getMunicipality(),
      data_freguesia: app.form.getParish(),
      data_local: app.form.getStreetName(),
      data_num_porta: app.form.getStreetNumber(),
      data_coord_latit: app.localization.getCoordinates().latitude,
      data_coord_long: app.localization.getCoordinates().longitude,
      anomaly1: app.anomalies.getSelectedMainAnomaly(),
      anomaly2: app.anomalies.getSelectedSecondaryAnomaly(),
      autoridade: app.form.getAuthority()
    }

    $.ajax({
      url: uploadOccurenceUrl,
      type: 'POST',
      data: JSON.stringify({ dbCommand: 'submitNewEntryToDB', databaseObj: databaseObj }),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      crossDomain: true,
      success: function (data) {
        console.success('Values inserted into database with success.')
        console.log('Returned:', data)
        // upload all photos
        for (let i = 0; i < imagesArray.length; i++) {
          app.file.uploadFileToServer(imagesArray[i], imgFileNames[i], uploadImagesUrl,
            (err) => {
              if (err) {
                console.error(err)
              } else {
                console.success(`File ${imgFileNames[i]} uploaded`)
              }
            })
        }
      },
      error: function (error) {
        console.error(`There was an error submitting the following object into the database: ${error.responseText}`, databaseObj)
        console.error(error)
      }
    })
  }

  // generate random string
  function getRandomString (length) {
    var result = ''
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var charactersLength = characters.length
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  }

  // for a certain occurence it sets that it was dealt, or not, by authority
  function setProcessedByAuthorityStatus (occurence, status, callback) {
    var databaseObj = Object.assign({}, occurence) // cloning Object

    databaseObj.processada_por_autoridade = status ? 1 : 0

    $.ajax({
      url: uploadOccurenceUrl,
      type: 'POST',
      data: JSON.stringify({ dbCommand: 'setProcessedByAuthorityStatus', databaseObj: databaseObj }),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      crossDomain: true,
      success: function (data) {
        console.success('Status of processed by authority updated in database with success.')
        console.log(databaseObj)
        console.log('Returned:', data)
        if (typeof callback === 'function') { callback() }
      },
      error: function (error) {
        console.error(`There was an error submitting the following object into the database: ${error.responseText}`, databaseObj)
        console.error(error)
        if (typeof callback === 'function') { callback(error) }
      }
    })
  }

  function setEntryAsDeletedInDatabase (dbEntry, callback) {
    var databaseObj = Object.assign({}, dbEntry) // cloning Object
    databaseObj.deleted_by_admin = 1

    $.ajax({
      url: uploadOccurenceUrl,
      type: 'POST',
      data: JSON.stringify({ dbCommand: 'setEntryAsDeletedInDatabase', databaseObj: databaseObj }),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      crossDomain: true,
      success: function (data) {
        console.success('Status of deleted_by_admin set to 1 in database with success.')
        console.log(databaseObj)
        console.log('Returned:', data)
        if (typeof callback === 'function') { callback() }
      },
      error: function (error) {
        console.error(`There was an error submitting the following object into the database: ${error.responseText}`, databaseObj)
        console.error(error)
        if (typeof callback === 'function') { callback(error) }
      }
    })
  }

  function getAjaxHttpHeaderKeys () {
    if (typeof CryptoComm === 'function') {
      const values = CryptoComm()
      var ajaxHeaders = {
        'x-key-v1': values.v1,
        'x-key-v2': values.v2,
        'x-key-v3': values.v3
      }
      return ajaxHeaders
    } else {
      return {}
    }
  }

  thisModule.submitNewEntryToDB = submitNewEntryToDB
  thisModule.setProcessedByAuthorityStatus = setProcessedByAuthorityStatus
  thisModule.setEntryAsDeletedInDatabase = setEntryAsDeletedInDatabase
  thisModule.getAjaxHttpHeaderKeys = getAjaxHttpHeaderKeys

  return thisModule
})(app.dbServerLink || {})
