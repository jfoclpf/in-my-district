/* global cordova, $ */

import * as map from './map.js'
import * as historic from './historic.js'
import * as variables from './variables.js'
import * as functions from './functions.js'

export function init () {
  $('#sidebarCollapse').on('click', function (e) {
    toggleSidebar()
    return false
  })

  $('#content').on('click', function () {
    if ($('#sidebar').hasClass('active')) {
      toggleSidebar(false)
      // breaks the event chain
      return false
    }
  })

  // opens http links with system browser
  $('a[href]').on('click', function (event) {
    const href = $(this).attr('href')
    if (href.startsWith('https://') || href.startsWith('http://')) {
      event.preventDefault()

      cordova.InAppBrowser.open(href, '_system')
    }
  })

  // in iOS we will not request personnal data to user, see issue #57
  if (functions.isThis_iOS()) {
    $('#personal_data_show').hide()
    $('#playstore_evaluation_link').hide()
  } else {
    $('#personal_data_show').on('click', function () {
      showSection('personal_data')
      toggleSidebar(false)
    })
  }

  $('#historic_show').on('click', function () {
    historic.updateHistoric()
    showSection('historic')
    toggleSidebar(false)
  })

  $('#map_section_show').on('click', function () {
    showSection('map_section')
    toggleSidebar(false)

    // this must be here on the last line,
    // because `$('#map_view_select').val()` returns null before Sidebar is hidden
    map.tryToShowMap($('#map_view_select').val())
  })

  $('#form_show').on('click', function () {
    showSection('main_form')
    toggleSidebar(false)
  })

  $('#privacy_policy_shows').on('click', function () {
    showSection('privacy_policy')
    toggleSidebar(false)
  })

  $('#playstore_evaluation_link').on('click', function () {
    cordova.InAppBrowser.open(variables.urls.appStores.playStore, '_system')
  })
}

export function showSection (sectionId) {
  $('.section').not('#' + sectionId).hide()
  $('#' + sectionId).show()

  // when the user clicks on the map section on the sidebar, shows different header
  if (sectionId === 'map_section') {
    $('#header_title').hide()
    $('#header_for_map').show()
  } else {
    $('#header_title').show()
    $('#header_for_map').hide()
  }

  // hides sidebar
  $('#sidebar').toggleClass('active', false)
}

// staus undefined - togle sidebar
// status true     - activates/shows sidebar
// status false    - deactivates/hides sidebar
export function toggleSidebar (status) {
  if (typeof status !== 'boolean') {
    $('#sidebar').toggleClass('active')
  } else if (status) {
    $('#sidebar').addClass('active')
  } else {
    $('#sidebar').removeClass('active')
  }

  if ($('#sidebar').hasClass('active')) {
    $('#content').stop(true, true).fadeTo(200, 0.3, () => { $(this).find('*').prop('disabled', true) })
  } else {
    $('#content').stop(true, true).fadeTo(200, 1, () => { $(this).find('*').prop('disabled', false) })
  }

  // for touch screens detects when the user slides the sidebar with the finger
  (function () {
    let ts
    const wrapper = document.getElementsByClassName('wrapper')[0]

    wrapper.addEventListener('touchstart', function (e) {
      if ($('#sidebar').hasClass('active')) {
        ts = e.changedTouches[0].clientX
      }
    }, { passive: true })

    wrapper.addEventListener('touchend', function (e) {
      if ($('#sidebar').hasClass('active')) {
        const te = e.changedTouches[0].clientX
        if (ts > te + 5) {
          // console.log('slided left')
          toggleSidebar(false)
        } else if (ts < te - 5) {
          // console.log('slided right')
        }
      }
    }, { passive: true })

    wrapper.addEventListener('touchmove', function (e) {
      if ($('#sidebar').hasClass('active')) {
        e.stopImmediatePropagation()
      }
    }, { passive: false })
  }())

  // breaks the event chain
  return false
}
