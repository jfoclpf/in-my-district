/***********************************************************************/
/* When the user clicks on the Map section on the left panel, the user
   should see a map of all complaints previously submitted by all users
   These complaints are anonymously stored in the database             */

/* eslint no-prototype-builtins: off */
/* global device, cordova, $, performance, L */

import * as main from './main.js'
import * as variables from './variables.js'
import * as functions from './functions.js'
import * as localization from './localization.js'
import * as dbServerLink from './dbServerLink.js'
import * as anomaliesMod from './anomalies.js'

var map
var markersGroups // groups of markers, by type of anomaly
var allDbEntries // all entries fetched from database
var anomalies // object with all the possible anomalies
var isMapInitiated = false

export function init () {
  // populate select box to select map view, i.e, filter ocurrences/drops in the map
  markersGroups = {
    all: { select: 'Todas (por resolver)' },
    mine: { select: 'As que eu denunciei' }
  }

  // populates markersGroups yet with type of anomalies
  anomalies = anomaliesMod.getAnomalies()
  for (const anomaly of anomalies) {
    const anomaly1Code = anomaly.topicCode // ex: "PA", "AAU", etc.
    markersGroups[anomaly1Code] = {}
    markersGroups[anomaly1Code].select = anomaly.topic
  }

  // to get all entries to show on the map, it does it in the init in the background
  // after opening the app for faster processing when user clicks on map section
  var tLoadMapInit = performance.now() // to measure performance
  getAllEntries((err) => {
    if (!err) {
      processMapMarkers()
      initializeMap(() => {
        isMapInitiated = true
        console.log('Processing map took ' + Math.round(performance.now() - tLoadMapInit) + ' milliseconds')
      })
    }
  })

  // populates select box
  for (const key in markersGroups) {
    if (markersGroups.hasOwnProperty(key)) {
      $('#map_view_select').append(`<option value="${key}">${markersGroups[key].select}</option>`)
    }
  }

  $('#map_view_select').on('change', function () {
    tryToShowMap(this.value)
  })
}

// does not show map until the DB entries are loaded
export function tryToShowMap (selectOption) {
  if (!isMapInitiated) {
    setTimeout(() => {
      if (isMapInitiated) {
        showMap(selectOption)
      } else {
        tryToShowMap(selectOption)
      }
    }, 500)
  } else {
    showMap(selectOption)
  }
}

// selectOption can be: 'all', 'mine' or the respective legal basis ('passeios', 'na_passadeira', etc.)
function showMap (selectOption) {
  // clears all layers from previous selections
  for (const key in markersGroups) {
    if (
      markersGroups.hasOwnProperty(key) &&
      markersGroups[key].markerClusterGroup &&
      markersGroups[key].markerClusterGroup.getLayers().length
    ) {
      map.removeLayer(markersGroups[key].markerClusterGroup)
    }
  }

  if (
    markersGroups[selectOption] &&
    markersGroups[selectOption].markerClusterGroup.getLayers().length
  ) {
    map.addLayer(markersGroups[selectOption].markerClusterGroup)
  }
}

function initializeMap (callback) {
  // get coordinates for the map center
  var currentLocation = localization.getCoordinates() // current position of user
  var latitude, longitude
  if (currentLocation.latitude && currentLocation.longitude && !main.DEBUG) {
    latitude = currentLocation.latitude
    longitude = currentLocation.longitude
  } else {
    // coordinates of Lisbon
    latitude = 38.736946
    longitude = -9.142685
  }

  const mapOptions = {
    center: [latitude, longitude],
    zoom: 8,
    maxBounds: L.latLngBounds(L.latLng(43.882057, -11.030141), L.latLng(35.942436, -4.104133)),
    zoomControl: false,
    attributionControl: false,
    closePopupOnClick: false
  }

  map = L.map('map', mapOptions)

  // add the OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 6,
    subdomains: ['a', 'b', 'c']
  }).addTo(map)

  setInterval(function () {
    map.invalidateSize()
  }, 500)

  map.on('popupopen', function (e) {
    $('img.photo-in-popup').on('load', function () {
      e.popup.update()
    })
  })

  // when map is loaded
  map.whenReady(function () {
    // adjust height of map_section div, the heigh of map should be the height of content
    // minus the height of header and minus height of a spacer (<hr>)
    var height = window.innerHeight - // screen useful height
      $('#content hr').outerHeight(true) - // spacer between header and lower section
      $('#content .container-fluid.section-head.d-flex.flex-row').outerHeight(true) - // header
      ($('#content').innerWidth() - $('#content').width()) // pading of #content

    $('#map_section').css('height', height + 'px')
    map.invalidateSize()
    callback()
  })
}

function getAllEntries (callback) {
  const requestHistoricUrl = variables.urls.databaseServer.requestHistoric

  // because there's parameter uuid, it gets all entries with PROD=1
  $.ajax({
    url: requestHistoricUrl,
    type: 'GET',
    crossDomain: true,
    success: function (data) {
      if (data && data.length) {
        console.log('Data for map obtained from database with success. Returned: ', data)
        allDbEntries = data
        callback()
      } else {
        const errMessage = 'There was an error getting the data, data fetched but is empty'
        console.error(errMessage)
        callback(errMessage)
      }
    },
    error: function (error) {
      console.error('There was an error getting all the entries')
      console.error(error)
      callback(error)
    }
  })
}

function processMapMarkers () {
  const getPhotosUrl = variables.urls.databaseServer.getPhotos

  // create an array for each type of occurence
  for (const key in markersGroups) {
    if (markersGroups.hasOwnProperty(key)) {
      markersGroups[key].markerClusterGroup = L.markerClusterGroup(
        { disableClusteringAtZoom: 12, spiderfyOnMaxZoom: false }
      )
    }
  }

  // Sort markers and infowindows to the map
  const isCurrentUserAnAdmin = functions.isCurrentUserAnAdmin()
  const dbEntriesLength = allDbEntries.length

  const mapIcons = {}
  for (const anomaly of anomalies) {
    const topicCode = anomaly.topicCode
    const mapIcon = L.icon({
      iconUrl: `${cordova.file.applicationDirectory}www/img/map-icons/${topicCode}.png`,
      iconSize: [50, 50],
      iconAnchor: [25, 50]
    })
    mapIcons[topicCode] = mapIcon
  }

  for (let i = 0; i < dbEntriesLength; i++) {
    const el = allDbEntries[i]
    const topicCode = el.anomaly_code.match(/[a-zA-Z]+/)[0] // ex: "PA", "AAU", etc.

    const marker = L.marker(
      [el.data_coord_latit, el.data_coord_long],
      { icon: mapIcons[topicCode] }
    )

    let htmlInfoContent =
      '<div style="width:200px">' +
        `<b>Ocorrência</b>: ${el.anomaly1} - ${el.anomaly2}<br>` +
        `<b>Local</b>: ${el.data_local} n. ${el.data_num_porta}, ${el.data_concelho}<br>` +
        `<b>Data</b>: ${(new Date(el.data_data)).toLocaleDateString('pt-PT')} às ${el.data_hora.slice(0, 5)}<br>` +
        `<b>Município</b>: ${el.data_concelho}<br>` +
        `<b>Freguesia</b>: ${el.data_freguesia}<br>`

    for (var photoIndex = 1; photoIndex <= 4; photoIndex++) {
      if (el['foto' + photoIndex]) {
        const photoUrl = getPhotosUrl + '/' + el['foto' + photoIndex]
        htmlInfoContent += `<img class="photo-in-popup" width="200px" src="${photoUrl}">`
      }
    }

    htmlInfoContent += '</div>'

    // an admin is able to mark an entry in the db as deleted
    if (isCurrentUserAnAdmin) {
      htmlInfoContent += '<hr><b>Opções de administrador</b><br><br>' +
        `<button type="button" class="btn btn-primary btn-sm m-1" onclick="app.map.setEntryInDbAsDeletedByAdmin('${encodeURIComponent(JSON.stringify(el))}')"><i class="fa fa-trash"></i></button><br><br>`
    }

    const popup = L.popup({ closeOnClick: false, autoClose: false, autoPan: true, maxHeight: 400 })
      .setContent(htmlInfoContent)

    marker.bindPopup(popup)

    if (markersGroups[topicCode]) {
      markersGroups[topicCode].markerClusterGroup.addLayer(marker)
    }
    if (el.uuid === device.uuid) {
      markersGroups.mine.markerClusterGroup.addLayer(marker)
    }
    markersGroups.all.markerClusterGroup.addLayer(marker)
  }
}

export function setEntryInDbAsDeletedByAdmin (dbElement) {
  dbElement = JSON.parse(decodeURIComponent(dbElement))

  if (functions.isCurrentUserAnAdmin()) {
    dbServerLink.setEntryInDbAsDeleted(dbElement, 'admin', (err) => {
      if (!err) {
        window.alert('Entrada marcada como apagada')
      } else {
        window.alert('Erro a tentar marcar entrada como apagada\n\n' + JSON.stringify(err, {}, 2))
      }
    })
  }
}
