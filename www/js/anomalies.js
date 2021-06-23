/* eslint camelcase: off */

/* eslint no-var: off */
/* global app, cordova, $ */

app.anomalies = (function (thisModule) {
  // campos "description" e "law_article" devem ser condicentes gramaticalmente com a mensagem que será gerada
  // exemplo: "a viatura encontrava-se estacionada" + description + ", em violação" + law_article

  var anomalies = {}

  function getAnomalies () {
    return anomalies
  }

  function populatesAnomaliesSelect () {
    $.getJSON(cordova.file.applicationDirectory + 'www/json/anomalies.json', function (data) {
      anomalies = data
      $.each(data, function (key, val) {
        $('#anomaly1').append(`<option value="${val.topic}">${val.topic}</option>`)
      })

      $('#anomaly1').change(function () {
        const selectedMainAnomaly = $(this).find('option:selected').val()
        $('#anomaly2').empty()
        $.each(data, function (index, val) {
          if (val.topic === selectedMainAnomaly) {
            $.each(val.list, function (index2, val2) {
              $('#anomaly2').append(`<option value="${val2.code}">${val2.desc}</option>`)
            })
            return false // breaks loop
          }
        })
      }).change()
    })
  }

  function getSelectedMainAnomaly () {
    return $('#anomaly1 option:selected').text()
  }

  function getSelectedSecondaryAnomaly () {
    return $('#anomaly2 option:selected').text()
  }

  function getAnomalyCode () {
    return $('#anomaly2').val()
  }

  /* === Public methods to be returned === */
  thisModule.getAnomalies = getAnomalies
  thisModule.populatesAnomaliesSelect = populatesAnomaliesSelect
  thisModule.getSelectedMainAnomaly = getSelectedMainAnomaly
  thisModule.getSelectedSecondaryAnomaly = getSelectedSecondaryAnomaly
  thisModule.getAnomalyCode = getAnomalyCode

  return thisModule
})(app.anomalies || {})
