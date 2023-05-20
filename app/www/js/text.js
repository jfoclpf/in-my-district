/* global $ */

import * as form from './form.js'
import * as contacts from './contacts.js'
import * as photos from './photos.js'
import * as functions from './functions.js'

// get main message
// parameter <option> may be:
// 'body': main body for the email message
// 'cleanBody': main body except last paragraphs with summary nor credits
// 'subject': title/subject for example for email subject
// parameter <dbEntryResultData> is an Object (with keys) returned from server
// after entry is submitted into DB
export function getMainMessage (option, dbEntryResultData) {
  if (option === 'body' || option === 'cleanBody') {
    let message = ''

    const municipality = $('#municipality option:selected').text().trim()
    const parish = $('#parish option:selected').text().trim()

    if ($('#send_to_municipality_checkbox').is(':checked')) {
      message += `${getRandomGreetings()} da Câmara Municipal de ${municipality};<br>`
    }
    if ($('#send_to_parish_checkbox').is(':checked')) {
      message += `${getRandomGreetings()} da Junta de Freguesia de ${parish};<br>`
    }

    message += '<br>'

    if (!functions.isThis_iOS()) {
      message += `Eu, <b>${$('#name').val().trim()}</b>, ` +
      `detentor do <b>${$('#id_type').val()}</b> com o número <b>${$('#id_number').val()}</b>, ` +
      `com o Número de Identificação Fiscal (NIF) <b>${$('#nif').val()}</b> ` +
      `e com residência em <b>${$('#address').val().trim()}, ${$('#postal_code').val()}, ${$('#address_city').val().trim()}</b>, `
    }

    message += 'venho por este meio comunicar a V. Exas. a seguinte anomalia e irregularidade, ' +
      'para que a mesma seja resolvida pelos serviços de V. Exas o mais rapidamente quanto possível.<br><br>' +

      `No passado dia <b>${$.datepicker.formatDate("dd' de 'MM' de 'yy", $('#date').datepicker('getDate'))}</b>` +
      ($('#time').val() ? ' pelas <b>' + $('#time').val() + '</b>' : '') + // optional
      `, na <b>${$('#street').val().trim()}, ${municipality}</b>, ` +
      (contacts.getCurrentParish() ? `na freguesia de <b>${parish}</b>, ` : '') + // optional
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
      ' ' + ((photos.getPhotosUriOnFileSystem().length === 1) ? 'da fotografia anexa' : 'das fotografias anexas') +
      ' ' + 'à presente mensagem eletrónica.<br><br>' +

      getRegards() + '<br><br>'

    if (option === 'body') {
      // resumo no final da mensagem
      message += '__________________________<br><br>' +
      `Resumo do ${anomaly2TypeOfAnomaly === 'anomaly2-report' ? 'relato' : 'pedido'}<br><br>` +
      `<b>Anomalia:</b> ${$('#anomaly1 option:selected').text()}, ${$('#anomaly2 option:selected').text()}<br>` +
      `<b>Morada:</b> ${$('#street').val().trim()}${$('#street_number').val() ? ', n. ' + $('#street_number').val() : ''}, ${parish}, ${municipality}<br>` +
      '<b>Hiper-ligação com informação do local exato:</b> ' +
      `https://nomeubairro.app/ocorrencia/?uuid=${dbEntryResultData.table_row_uuid} <br><br>` +
      `<b>Detectada em</b>: ${$.datepicker.formatDate("dd' de 'MM' de 'yy", $('#date').datepicker('getDate'))}, ${$('#time').val()}<br><br>`

      if (dbEntryResultData) {
        message += '__________________________<br><br>' +
        `${getRandomGreetings()}, queiram por favor clicar nas seguintes ligações quando solucionarem a presente ocorrência<br><br>`
        if (dbEntryResultData.chave_confirmacao_ocorrencia_resolvida_por_municipio) {
          message += 'Município resolveu: ' +
          'https://servidor.nomeubairro.app/resolvido/municipio/' +
          `${dbEntryResultData.table_row_uuid}/${dbEntryResultData.chave_confirmacao_ocorrencia_resolvida_por_municipio}` +
          '<br><br>'
        }
        if (dbEntryResultData.chave_confirmacao_ocorrencia_resolvida_por_freguesia) {
          message += 'Freguesia resolveu: ' +
          'https://servidor.nomeubairro.app/resolvido/freguesia/' +
          `${dbEntryResultData.table_row_uuid}/${dbEntryResultData.chave_confirmacao_ocorrencia_resolvida_por_freguesia}` +
          '<br><br>'
        }
      }

      // credits
      message += 'Mensagem gerada pela aplicação No Meu Bairro! (https://nomeubairro.app)<br>'
    }

    return message
  } else if (option === 'subject') {
    const address = form.getFullAddress()
    return `Anomalia com ${$('#anomaly1 option:selected').text()} (${$('#anomaly2 option:selected').text()}) na ${address}`
  } else {
    console.error('Error in getMainMessage(option) wth option=' + option)
  }
}

// called by historic module
export function getReminderMessage (occurrence) {
  const text = `${getRandomGreetings()} do Municipio de ${occurrence.data_concelho} e da Junta de Freguesia de ${occurrence.data_freguesia}<br><br>` +
    `No seguimento da anomalia já enviada anteriormente a V. Exas. relacionada com ${occurrence.anomaly1}, mais precisamente com ${occurrence.anomaly2} ` +
    `na ${occurrence.data_local}${occurrence.data_num_porta ? ' junto ao n. ' + occurrence.data_num_porta : ''}, ${occurrence.data_concelho}, ` +
    `no dia ${(new Date(occurrence.data_data)).toLocaleDateString('pt-PT')} às ${occurrence.data_hora.slice(0, 5)}, ` +
    'vinha por este meio inquirir V. Exas. sobre o estado do processo respetivo, considerando que já decorreram ' +
    `${Math.round(((new Date()) - new Date(occurrence.data_data)) / (1000 * 60 * 60 * 24))} dias desde a data da ocorrência.<br><br>` +
    `Fico a aguardar resposta de V. Exas.<br><br>${getRegards()}`

  return text
}

function getRandomGreetings () {
  const greetingsArray = [
    'Excelentíssimos senhores',
    'Prezados senhores',
    'Caros senhores',
    'Ex.mos Senhores'
  ]

  return greetingsArray[Math.floor(Math.random() * greetingsArray.length)]
}

// best regards
// Andrey
export function getRegards () {
  // gets a random regard
  const regards = [
    'Agradecendo antecipadamente a atenção de V. Ex.as, apresento os meus melhores cumprimentos',
    'Com os melhores cumprimentos',
    'Com os meus melhores cumprimentos',
    'Melhores cumprimentos',
    'Apresentando os meus melhores cumprimentos',
    'Atenciosamente',
    'Atentamente',
    'Respeitosamente'
  ]

  const regard = regards[Math.floor(Math.random() * regards.length)]

  let msgEnd
  if (!functions.isThis_iOS()) {
    // full name
    const Name = $('#name').val()
    // gets first and last name
    const ShortName = Name.split(' ')[0] + ' ' + Name.split(' ')[(Name.split(' ')).length - 1]

    msgEnd = regard + ',<br>' + ShortName
  } else {
    msgEnd = regard
  }

  return msgEnd
}
