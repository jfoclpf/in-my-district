/* eslint camelcase: off */

/* eslint no-var: off */
/* global app, $ */

app.anomalies = (function (thisModule) {
  // campos "description" e "law_article" devem ser condicentes gramaticalmente com a mensagem que será gerada
  // exemplo: "a viatura encontrava-se estacionada" + description + ", em violação" + law_article

  var anomalies = {}

  function getAnomalies () {
    return anomalies
  }

  function populatesAnomaliesSelect () {
    var keys = []
    for (var key in anomalies) {
      if (Object.prototype.hasOwnProperty.call(anomalies, key)) {
        keys.push(key)
      }
    }

    $('#anomalies').append('<option></option>')
    for (var i = 0; i < keys.length; i++) {
      key = keys[i]
      $('#anomalies').append(`<option value="${key}">${anomalies[key].select}</option>`)
    }
  }

  function getSelectedAnomaly () {
    return $('#anomalies').val()
  }

  function getShortDescription (code) {
    for (const key in anomalies) {
      if (key === code) {
        return anomalies[key].select
      }
    }
  }

  function getDescription (code) {
    for (const key in anomalies) {
      if (key === code) {
        return anomalies[key].description
      }
    }
  }

  /* === Public methods to be returned === */
  thisModule.getAnomalies = getAnomalies
  thisModule.populatesAnomaliesSelect = populatesAnomaliesSelect
  thisModule.getSelectedAnomaly = getSelectedAnomaly
  thisModule.getShortDescription = getShortDescription
  thisModule.getDescription = getDescription

  return thisModule
})(app.anomalies || {})
