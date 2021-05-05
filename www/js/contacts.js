/* Module that deals with the contacts stored in module contacts.js */

/* eslint no-var: off */
/* global app, $ */

app.contacts = (function (thisModule) {

  var municipalities = []
  var numberOfMunicipalities

  var currentMunicipality
  var currentParish

  function init () {
    $.getJSON(cordova.file.applicationDirectory + 'www/json/Municipiosdadosgerias.json', function (data) {
      municipalities = data.d
      numberOfMunicipalities = municipalities.length
      console.log('municipalities: ', municipalities)
      console.log('numberOfMunicipalities: ', numberOfMunicipalities)
    })
  }

  function setMunicipalityWithName (name) {
    const _name = name.trim().toLowerCase()
    for (let i = 0; i < numberOfMunicipalities; i++) {
      if (municipalities[i].entidade.trim().toLowerCase() === _name) {
        currentMunicipality = municipalities[i]
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
      if (municipalities[i].entidade.trim().toLowerCase() === _name) {
        return true
      }
    }
    return false
  }

  function getEmailOfMunicipalityByName (name) {
    const _name = name.trim().toLowerCase()
    for (let i = 0; i < numberOfMunicipalities; i++) {
      if (municipalities[i].entidade.trim().toLowerCase() === _name) {
        return municipalities[i].email
      }
    }
  }

  thisModule.init = init
  thisModule.setMunicipalityWithName = setMunicipalityWithName
  thisModule.setMunicipalityWithObject = setMunicipalityWithObject
  thisModule.setParishWithObject = setParishWithObject
  thisModule.getCurrentMunicipality = getCurrentMunicipality
  thisModule.getCurrentParish = getCurrentParish
  thisModule.isMunicipalityNameValid = isMunicipalityNameValid
  thisModule.getEmailOfMunicipalityByName = getEmailOfMunicipalityByName

  return thisModule
})(app.contacts || {})
