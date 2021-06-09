/* Module that deals with the contacts stored in module contacts.js */

/* eslint no-var: off */
/* global app, $ */

app.contacts = (function (thisModule) {
  var currentMunicipality = {}
  var currentParish = {}

  function init () {
  }

  function setMunicipality (municipality) {
    $.ajax({
      url: app.main.urls.geoApi.ptApi + '/municipio',
      data: {
        nome: municipality
      },
      dataType: 'json',
      type: 'GET',
      async: true,
      crossDomain: true
    }).done(function (data) {
      console.log('municipio: ', data)
      currentMunicipality = data
    }).fail(function (err) {
      console.error(`Could not obtain data for ${municipality}`, err)
      currentMunicipality = null
    })
  }

  function setParish (parish, municipality) {
    $.ajax({
      url: app.main.urls.geoApi.ptApi + '/freguesia',
      data: {
        nome: parish,
        municipio: municipality
      },
      dataType: 'json',
      type: 'GET',
      async: true,
      crossDomain: true
    }).done(function (data) {
      console.log('freguesia: ', data)
      currentParish = data
    }).fail(function (err) {
      console.error(`Could not obtain data for ${parish} in ${municipality}`, err)
      currentParish = null
    })
  }

  function getCurrentMunicipality () {
    return currentMunicipality
  }

  function getCurrentParish () {
    return currentParish
  }

  thisModule.init = init
  thisModule.setMunicipality = setMunicipality
  thisModule.setParish = setParish
  thisModule.getCurrentMunicipality = getCurrentMunicipality
  thisModule.getCurrentParish = getCurrentParish

  return thisModule
})(app.contacts || {})
