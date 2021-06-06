/* Module that deals with the contacts stored in module contacts.js */

/* eslint no-var: off */
/* global app, $ */

app.contacts = (function (thisModule) {

  var municipalities = [] // array of objects, ex: {"nome":"Abrantes", "freguesias":[ "Bemposta", etc.] }
  var numberOfMunicipalities

  var currentMunicipality = {}
  var currentParish = {}

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
      numberOfMunicipalities = data.length
    }).fail(function (err) {
      console.err('Error fetching from ' + url, err)
    })
  }

  function setMunicipalityWithName (name) {
    const _name = name.trim().toLowerCase()
    for (let i = 0; i < numberOfMunicipalities; i++) {
      if (municipalities[i].nome.trim().toLowerCase() === _name) {
        // get details of selected municipality
        const url = app.main.urls.geoApi.ptApi + '/municipio'
        $.ajax({
          url: url,
          data: {
            nome: municipalities[i].nome
          },
          dataType: 'json',
          type: 'GET',
          async: true,
          crossDomain: true
        }).done(function (data) {
          currentMunicipality = data
          currentMunicipality.nome = municipalities[i].nome
          currentMunicipality.freguesias = municipalities[i].freguesias
          console.log('Municipality info fetched: ', currentMunicipality)
        }).fail(function (err) {
          console.err('Error fetching from ' + url, err)
        })
        return true
      }
    }
    return false
  }

  function setMunicipalityWithObject (municipalityObj) {
    currentMunicipality = municipalityObj
  }

  function setParishWithObject (parishObj) {
    currentParish = parishObj
  }

  function getCurrentMunicipality () {
    return currentMunicipality
  }

  function getCurrentParish () {
    return currentParish
  }

  function isMunicipalityNameValid (name) {
    const _name = name.trim().toLowerCase()
    for (let i = 0; i < numberOfMunicipalities; i++) {
      if (municipalities[i].nome.trim().toLowerCase() === _name) {
        return true
      }
    }
    return false
  }


  thisModule.init = init
  thisModule.setMunicipalityWithName = setMunicipalityWithName
  thisModule.setMunicipalityWithObject = setMunicipalityWithObject
  thisModule.setParishWithObject = setParishWithObject
  thisModule.getCurrentMunicipality = getCurrentMunicipality
  thisModule.getCurrentParish = getCurrentParish
  thisModule.isMunicipalityNameValid = isMunicipalityNameValid

  return thisModule
})(app.contacts || {})
