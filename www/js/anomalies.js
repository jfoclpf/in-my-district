/* eslint camelcase: off */

/* eslint no-var: off */
/* global app, cordova, $ */

app.anomalies = (function (thisModule) {
  var anomalies = {}

  function getAnomalies () {
    return anomalies
  }

  function populatesAnomaliesSelect (callback) {
    $.getJSON(cordova.file.applicationDirectory + 'www/json/anomalies.json', function (data) {
      // filter out comments, check anomalies.json
      anomalies = data.filter((el) => {
        return !Object.keys(el).find(el2 => el2.startsWith('__comment'))
      })

      // then for every element, sort its list, check anomalies.json
      anomalies.forEach((el) => {
        el.list.sort((a, b) => {
          // first sort by type, and then sort by description
          if (a.type > b.type) {
            return 1
          } else if (a.type < b.type) {
            return -1
          } else if (a.desc > b.desc) {
            return 1
          } else if (a.desc < b.desc) {
            return -1
          } else {
            return 0
          }
        })
      })

      anomalies.forEach(function (val) {
        $('#anomaly1').append(`<option value="${val.topic}">${val.topic}</option>`)
      })

      $('#anomaly1').on('change', function () {
        const selectedMainAnomaly = $(this).find('option:selected').val()
        $('#anomaly2').empty()

        anomalies.forEach(function (val) {
          if (val.topic === selectedMainAnomaly) {
            let isThereRequest = false
            let isThereReport = false

            val.list.forEach(function (val2) {
              if (val2.type === 'request') {
                if (!isThereRequest) {
                  $('#anomaly2').append('<optgroup id="anomaly2-request" label="Pedido"></optgroup>')
                  isThereRequest = true
                }
                $('#anomaly2-request').append(`<option value="${val2.code}">${val2.desc}</option>`)
              } else if (val2.type === 'report') {
                if (!isThereReport) {
                  $('#anomaly2').append('<optgroup id="anomaly2-report" label="Relato"></optgroup>')
                  isThereReport = true
                }
                $('#anomaly2-report').append(`<option value="${val2.code}">${val2.desc}</option>`)
              } else {
                throw Error('type of anomaly can be either request or report')
              }
            })
          }
        })
      }).trigger('change')

      callback()
    }).fail(function (err) {
      callback(Error(err))
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
