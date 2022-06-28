/* eslint no-var: off */
/* eslint camelcase: "off" */
/* global app, device, $, DEBUG */

app.dbServerLink = (function (thisModule) {
  const uploadImagesUrl = app.main.urls.databaseServer.uploadImages
  const uploadOccurenceUrl = app.main.urls.databaseServer.uploadOccurence

  function submitNewEntryToDB (callback1, callback2) {
    const dateYYYY_MM_DD = app.form.getDateYYYY_MM_DD()
    const timeHH_MM = app.form.getTimeHH_MM()
    const municipality = app.form.getMunicipality()
    const freguesia = app.form.getParish()

    // generates file names array for images
    const randomString = getRandomString(10) // serves to uniquely identify the filenames
    var imgFileNames = []
    var imagesArray = app.photos.getPhotosUriOnFileSystem()
    var numberOfImages = imagesArray.length
    for (let i = 0; i < 4; i++) {
      if (i < numberOfImages) {
        const fileName = `${DEBUG ? 'debug_' : ''}n${i + 1}_${dateYYYY_MM_DD}_${timeHH_MM}_${municipality}_${freguesia}_${randomString}.jpg`
        const sanitizedFilename = app.file.sanitizeFilename(fileName)
        imgFileNames.push(sanitizedFilename)
      } else {
        imgFileNames.push('')
      }
    }

    const localization = app.localization.getCoordinates()
    if (!localization.latitude || !localization.longitude) {
      callback1(Error('There was an error getting localization'))
      callback2(Error('There was an error getting localization'))
      return
    }

    var databaseObj = {
      PROD: !DEBUG ? 1 : 0,
      uuid: device.uuid,
      foto1: imgFileNames[0],
      foto2: imgFileNames[1],
      foto3: imgFileNames[2],
      foto4: imgFileNames[3],
      data_data: app.form.getDateYYYY_MM_DD(),
      data_hora: app.form.getTimeHH_MM(),
      data_concelho: municipality,
      data_freguesia: freguesia,
      data_local: app.form.getStreetName(),
      data_num_porta: app.form.getStreetNumber(),
      data_coord_latit: localization.latitude,
      data_coord_long: localization.longitude,
      anomaly1: app.anomalies.getSelectedMainAnomaly(),
      anomaly2: app.anomalies.getSelectedSecondaryAnomaly(),
      anomaly_code: app.anomalies.getAnomalyCode(),
      email_concelho: app.form.bSendToMunicipality() ? app.contacts.getCurrentMunicipality().email : null,
      email_freguesia: app.form.bSendToParish() ? app.contacts.getCurrentParish().email : null
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
        // first callback called right now, do not wait for the upload of photos due to performance
        callback1(null, data)

        // upload all photos
        const deferred = []
        for (let i = 0; i < imagesArray.length; i++) {
          deferred[i] = $.Deferred();
          (function (_i) {
            app.file.uploadFileToServer(imagesArray[_i], imgFileNames[_i], uploadImagesUrl,
              (err) => {
                if (err) {
                  console.error(err)
                  deferred[_i].reject()
                } else {
                  console.success(`File ${imgFileNames[_i]} uploaded`)
                  deferred[_i].resolve()
                }
              })
          })(i)
        }

        $.when.apply(this, deferred)
          .then(
            function () {
              console.log('All photos uplodead successfully')
              callback2()
            },
            function () {
              callback2(Error('There was some error uploading photos'))
            }
          )
      },
      error: function (err) {
        console.error(`There was an error submitting the following object into the database: ${err.responseText}`, err, databaseObj)
        callback1(Error(err))
        callback2(Error(err))
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
  function setSolvedOccurrenceStatus (occurence, status, callback) {
    var databaseObj = Object.assign({}, occurence) // cloning Object

    databaseObj.ocorrencia_resolvida = status ? 1 : 0

    $.ajax({
      url: uploadOccurenceUrl,
      type: 'POST',
      data: JSON.stringify({ dbCommand: 'setSolvedOccurrenceStatus', databaseObj: databaseObj }),
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

  function setEntryInDbAsDeleted (dbEntry, deleter, callback) {
    var databaseObj = Object.assign({}, dbEntry) // cloning Object

    let dbCommand
    if (deleter === 'admin') {
      dbCommand = 'setEntryInDbAsDeletedByAdmin'
    } else if (deleter === 'user') {
      dbCommand = 'setEntryInDbAsDeletedByUser'
    } else {
      console.error('Unknown deleter: ' + deleter)
      return
    }

    $.ajax({
      url: uploadOccurenceUrl,
      type: 'POST',
      data: JSON.stringify({ dbCommand: dbCommand, databaseObj: databaseObj }),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      crossDomain: true,
      success: function (data) {
        console.success(`Status of deleted_by_${deleter} set to 1 in database with success`)
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

  thisModule.submitNewEntryToDB = submitNewEntryToDB
  thisModule.setSolvedOccurrenceStatus = setSolvedOccurrenceStatus
  thisModule.setEntryInDbAsDeleted = setEntryInDbAsDeleted

  return thisModule
})(app.dbServerLink || {})
