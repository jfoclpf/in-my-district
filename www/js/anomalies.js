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
    $.getJSON('../json/anomalies.json', function (data) {
      anomalies = data
      $.each(data, function (key, val) {
        $('#anomaly1').append(`<option value="${val.description}">${val.description}</option>`)
      })

      $('#anomaly1').change(function () {
        const selectedMainAnomaly = $(this).find('option:selected').val()
        $('#anomaly2').empty()
        $.each(data, function (index, val) {
          if (val.description === selectedMainAnomaly) {
            $.each(val.list, function (index2, val2) {
              $('#anomaly2').append(`<option value="${val2}">${val2}</option>`)
            })
            return false // breaks loop
          }
        })
      }).change()
    })
  }

  function getSelectedMainAnomaly () {
    return $('#anomaly1').val()
  }

  function getSelectedSecondaryAnomaly () {
    return $('#anomaly2').val()
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
  thisModule.getSelectedMainAnomaly = getSelectedMainAnomaly
  thisModule.getSelectedSecondaryAnomaly = getSelectedSecondaryAnomaly
  thisModule.getShortDescription = getShortDescription
  thisModule.getDescription = getDescription

  return thisModule
})(app.anomalies || {})
