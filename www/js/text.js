/* eslint camelcase: off */

/* eslint no-var: off */
/* global app, $ */

app.text = (function (thisModule) {
  // main message
  function getMainMessage (option) {
    if (option === 'body') {
      const municipality = $('#municipality option:selected').text().trim()
      const parish = $('#parish option:selected').text().trim()

      var msgInit = `${getRandomGreetings()} da Câmara Municipal de ${municipality};`
      if (app.contacts.getCurrentParish()) {
        msgInit += `<br>${getRandomGreetings()} da Junta de Freguesia de ${parish};`
      }

      var msg1 = `Eu, <b>${$('#name').val().trim()}</b>, ` +
        `com o <b>${$('#id_type').val()}</b> com o número <b>${$('#id_number').val()}</b> ` +
        `e com residência em <b>${$('#address').val().trim()}, ${$('#postal_code').val()}, ${$('#address_city').val().trim()}</b>, ` +
        'venho por este meio comunicar a V. Exas. a seguinte anomalia e irregularidade, ' +
        'para que a mesma seja resolvida pelos serviços de V. Exas o mais rapidamente quanto possível.'

      var msg2 = `No passado dia <b>${$.datepicker.formatDate("dd' de 'MM' de 'yy", $('#date').datepicker('getDate'))}</b>` +
        ($('#time').val() ? ' pelas <b>' + $('#time').val() + '</b>' : '') + // optional
        `, na <b>${$('#street').val().trim()}, ${municipality}</b>, ` +
        (app.contacts.getCurrentParish() ? `na freguesia de <b>${parish}</b>, ` : '') + // optional
        ($('#street_number').val()
          ? `aproximadamente junto à porta com o <b>número ${$('#street_number').val().trim()}</b>, `
          : '') + // optional
        `deparei-me com o seguinte problema relacionado com <b>${$('#anomaly1 option:selected').text()}: ${$('#anomaly2 option:selected').text()}</b>.`

      var msg3 = 'Pode-se comprovar esta situação através' +
        ' ' + ((app.photos.getPhotosUriOnFileSystem().length === 1) ? 'da fotografia anexa' : 'das fotografias anexas') +
        ' ' + 'à presente mensagem eletrónica. ' +
        'Juro pela minha honra que a informação supra citada é verídica.'

      var message = msgInit + '<br><br>' + msg1 + '<br><br>' + msg2 + '<br><br>' + msg3 + '<br><br>' + getRegards() + '<br>'

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
    var text = `${getRandomGreetings()} da ${occurrence.autoridade}<br><br>` +
      `No seguimento da anamoalia já enviada anteriormente a V. Exas. relacionada com ${occurrence.anomaly1}, mais precisamente com ${occurrence.anomaly2} ` +
      `na ${occurrence.data_local} n. ${occurrence.data_num_porta}, ${occurrence.data_concelho}, no dia ${(new Date(occurrence.data_data)).toLocaleDateString('pt-PT')} às ${occurrence.data_hora.slice(0, 5)}, ` +
      `vinha por este meio inquirir V. Exas. sobre o estado do processo respetivo, considerando que já decorreram ${Math.round(((new Date()) - new Date(occurrence.data_data)) / (1000 * 60 * 60 * 24))} dias desde a data da ocorrência.<br><br>` +
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
