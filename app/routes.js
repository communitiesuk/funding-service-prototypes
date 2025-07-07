//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const radioButtonRedirect = require('radio-button-redirect')
router.use(radioButtonRedirect)

// Import feature-specific routes
const reportsRoutes = require('./routes/reports')
const sectionsRoutes = require('./routes/sections')
const tasksRoutes = require('./routes/tasks')
const questionsRoutes = require('./routes/questions')

// Use the feature routes
router.use(reportsRoutes)
router.use(sectionsRoutes)
router.use(tasksRoutes)
router.use(questionsRoutes)

// Breadcrumbs helper (kept here as it's used across multiple features)
function buildBreadcrumbs(req, currentPage) {
    const breadcrumbs = []
    const data = req.session.data

    // Always start with Reports (clickable unless we're on reports page itself)
    if (currentPage === 'reports') {
        breadcrumbs.push({ text: "Reports" })
    } else {
        breadcrumbs.push({
            text: "Reports",
            href: "/funding/grant/reports/"
        })
    }

    // Add report name if available and not on reports page
    if (currentPage !== 'reports' && data.reportName) {
        if (currentPage === 'sections') {
            breadcrumbs.push({ text: data.reportName })
        } else {
            breadcrumbs.push({
                text: data.reportName,
                href: "/funding/grant/reports/sections?reportId=" + data.currentReportId
            })
        }
    }

    // Add sections level for questions page
    if (currentPage === 'questions') {
        breadcrumbs.push({
            text: "Sections and tasks",
            href: "/funding/grant/reports/sections?reportId=" + data.currentReportId
        })

        // Add task name as final breadcrumb
        if (data.taskName) {
            breadcrumbs.push({ text: data.taskName })
        }
    }

    return breadcrumbs
}

// Export the breadcrumbs helper so other routes can use it if needed
router.buildBreadcrumbs = buildBreadcrumbs

module.exports = router