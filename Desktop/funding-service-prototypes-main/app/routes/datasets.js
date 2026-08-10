const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.get('/clear-test-data', function (req, res) {
  req.session.data = {}
  res.redirect(req.headers.referer || '/')
})

module.exports = router
