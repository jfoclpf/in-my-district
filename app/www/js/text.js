/* eslint camelcase: off */

/* eslint no-var: off */
/* global app, $ */

app.text = (function (thisModule) {
  // get main message
  // parameter option may be:
  // 'body': main body for the email message
  // 'cleanBody': main body except last paragraphs with summary nor credits
  // 'subject': title/subject for example for email subject
  function getMainMessage (option) {
    if (option === 'body' || option === 'cleanBody') {
      var message = ''

      const municipality = $('#municipality option:selected').text().trim()
      const parish = $('#parish option:selected').text().trim()

      if ($('#send_to_municipality_checkbox').is(':checked')) {
        message += `${getRandomGreetings()} da Câmara Municipal de ${municipality};<br>`
      }
      if ($('#send_to_parish_checkbox').is(':checked')) {
        message += `${getRandomGreetings()} da Junta de Freguesia de ${parish};<br>`
      }

      message += '<br>' +

        `Eu, <b>${$('#name').val().trim()}</b>, ` +
        `detentor do <b>${$('#id_type').val()}</b> com o número <b>${$('#id_number').val()}</b>, ` +
        `com o Número de Identificação Fiscal (NIF) <b>${$('#nif').val()}</b> ` +
        `e com residência em <b>${$('#address').val().trim()}, ${$('#postal_code').val()}, ${$('#address_city').val().trim()}</b>, ` +
        'venho por este meio comunicar a V. Exas. a seguinte anomalia e irregularidade, ' +
        'para que a mesma seja resolvida pelos serviços de V. Exas o mais rapidamente quanto possível.<br><br>' +

        `No passado dia <b>${$.datepicker.formatDate("dd' de 'MM' de 'yy", $('#date').datepicker('getDate'))}</b>` +
        ($('#time').val() ? ' pelas <b>' + $('#time').val() + '</b>' : '') + // optional
        `, na <b>${$('#street').val().trim()}, ${municipality}</b>, ` +
        (app.contacts.getCurrentParish() ? `na freguesia de <b>${parish}</b>, ` : '') + // optional
        ($('#street_number').val()
          ? `aproximadamente junto à porta com o <b>número ${$('#street_number').val().trim()}</b>, `
          : '') + // optional
        `deparei-me com uma anomalia relacionada com <b>${$('#anomaly1 option:selected').text()}</b>, `

      // change the text according to the anomaly type, a report or a request
      // the select uses 2 <optgroup>, one for report and another for request
      const anomaly2TypeOfAnomaly = $('#anomaly2 option:selected').parent().prop('id')
      const anomaly2SelectedText = $('#anomaly2 option:selected').text()
      if (anomaly2TypeOfAnomaly === 'anomaly2-report') {
        message += `mais precisamente com <b>${anomaly2SelectedText}</b>.`
      } else if (anomaly2TypeOfAnomaly === 'anomaly2-request') {
        message += `e por conseguinte venho assim requerer <b>${anomaly2SelectedText}</b>.`
      } else {
        throw Error('anomaly2 Type of anomaly can be either report or request')
      }

      message += '<br><br>' +
        'Pode-se comprovar esta situação através' +
        ' ' + ((app.photos.getPhotosUriOnFileSystem().length === 1) ? 'da fotografia anexa' : 'das fotografias anexas') +
        ' ' + 'à presente mensagem eletrónica.<br><br>' +

        getRegards() + '<br><br>'

      if (option === 'body') {
        // resumo no final da mensagem
        message += '__________________________<br><br>' +
        `<b>Anomalia:</b> ${$('#anomaly1 option:selected').text()}, ${$('#anomaly2 option:selected').text()}<br>` +
        `<b>Morada:</b> ${$('#street').val().trim()}${$('#street_number').val() ? ', n. ' + $('#street_number').val() : ''}, ${parish}, ${municipality}<br>` +
        // The 6th decimal digit of latitude and longitude gives a precision of about 10cm, enough for this type of use
        // see: https://gis.stackexchange.com/a/8674/182228
        '<b>Local exato:</b> ' +
        `https://osm.org/?mlat=${
          app.localization.getCoordinates().latitude.toFixed(6)
        }&mlon=${
          app.localization.getCoordinates().longitude.toFixed(6)
        }&zoom=18 <br>` +
        `<b>Datectada em</b>: ${$.datepicker.formatDate("dd' de 'MM' de 'yy", $('#date').datepicker('getDate'))}, ${$('#time').val()}<br><br>`

        // credits
        message += 'Mensagem gerada pela aplicação No Meu Bairro! (https://nomeubairro.app)<br>'
      }

      return message
    } else if (option === 'subject') {
      const address = app.form.getFullAddress()
      return `Anomalia com ${$('#anomaly1 option:selected').text()} (${$('#anomaly2 option:selected').text()}) na ${address}`
    } else {
      console.error('Error in getMainMessage(option) wth option=' + option)
    }
  }

  // called by historic module
  function getReminderMessage (occurrence) {
    var text = `${getRandomGreetings()} do Municipio de ${occurrence.data_concelho} e da Junta de Freguesia de ${occurrence.data_freguesia}<br><br>` +
      `No seguimento da anamoalia já enviada anteriormente a V. Exas. relacionada com ${occurrence.anomaly1}, mais precisamente com ${occurrence.anomaly2} ` +
      `na ${occurrence.data_local}${occurrence.data_num_porta ? ' junto ao n. ' + occurrence.data_num_porta : ''}, ${occurrence.data_concelho}, ` +
      `no dia ${(new Date(occurrence.data_data)).toLocaleDateString('pt-PT')} às ${occurrence.data_hora.slice(0, 5)}, ` +
      'vinha por este meio inquirir V. Exas. sobre o estado do processo respetivo, considerando que já decorreram ' +
      `${Math.round(((new Date()) - new Date(occurrence.data_data)) / (1000 * 60 * 60 * 24))} dias desde a data da ocorrência.<br><br>` +
      `Fico a aguardar resposta de V. Exas.<br><br>${getRegards()}`

    return text
  }

  function getRandomGreetings () {
    var greetingsInitial = [
      'Excelentíssimos senhores',
      'Prezados senhores',
      'Caros senhores',
      'Ex.mos Senhores'
    ]

    return greetingsInitial[Math.floor(Math.random() * greetingsInitial.length)]
  }

  // best regards
  // Andrey
  function getRegards () {
    // gets a random regard
    var regards = [
      'Agradecendo antecipadamente a atenção de V. Ex.as, apresento os meus melhores cumprimentos',
      'Com os melhores cumprimentos',
      'Com os meus melhores cumprimentos',
      'Melhores cumprimentos',
      'Apresentando os meus melhores cumprimentos',
      'Atenciosamente',
      'Atentamente',
      'Respeitosamente'
    ]

    var regard = regards[Math.floor(Math.random() * regards.length)]

    // full name
    var Name = $('#name').val()
    // gets first and last name
    var ShortName = Name.split(' ')[0] + ' ' + Name.split(' ')[(Name.split(' ')).length - 1]

    var msgEnd = regard + ',<br>' + ShortName

    return msgEnd
  }

  /* === Public methods to be returned === */
  thisModule.getMainMessage = getMainMessage
  thisModule.getReminderMessage = getReminderMessage
  thisModule.getRegards = getRegards

  return thisModule
})(app.text || {})
