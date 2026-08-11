//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

// Add your filters here

const filters = {}

/* ------------------------------------------------------------------
  keep the following line to return your filters to the app
------------------------------------------------------------------ */

const separateThousandsWithComma = input => {
  let amount = Math.round(Number(input) * 100) / 100
  if (amount % 1 !== 0) {
    amount = amount.toFixed(2)
  }
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

filters.currency = (number, prefix) => {
  if (!prefix) {
    prefix = '£'
  }
  return prefix + separateThousandsWithComma(number)
}

filters.lowerCase = str => {
  return str.toLowerCase()
}

filters.upperCase = str => {
  return str.toUpperCase()
}

filters.titleCase = str => {
  return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase() })
}

filters.toMonth = function (month) {
  if (!isNaN(month)) {
    const monthIndex = month - 1
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    // Return month name
    return months[monthIndex]
  }
}

// Add the filters using the addFilter function
Object.entries(filters).forEach(([name, fn]) => addFilter(name, fn))