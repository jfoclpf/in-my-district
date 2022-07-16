/* Module that deals with the contacts stored in module contacts.js */

/* global $ */

import * as variables from './variables.js'

var currentMunicipality = {}
var currentParish = {}

export function init () {
}

export function setMunicipality (municipality) {
  $.ajax({
    url: variables.urls.geoApi.ptApi + '/municipio',
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

export function setParish (parish, municipality, callback) {
  $.ajax({
    url: variables.urls.geoApi.ptApi + '/freguesia',
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
    callback(null, data)
  }).fail(function (err) {
    console.error(`Could not obtain data for ${parish} in ${municipality}`, err)
    currentParish = null
    callback(Error(err))
  })
}

export function getCurrentMunicipality () {
  return currentMunicipality
}

export function getCurrentParish () {
  return currentParish
}

export function hasCurrentParishAnEmail () {
  return currentParish && currentParish.email
}
