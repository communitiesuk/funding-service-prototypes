const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const ReportsDataManager = require('../data/ReportsDataManager')

// Reports index page
// GET /funding/grant/reports
router.get('/funding/grant/reports', function (req, res) {
    const dataManager = new ReportsDataManager(req.session.data);
    
    // Set default grant name if not already set
    if (!req.session.data.grantName) {
        req.session.data.grantName = "Sample Grant Name"
    }

    // Clear any cached data that might be stale (keeping this for compatibility)
    delete req.session.data.currentReportId
    delete req.session.data.currentReportName
    delete req.session.data.reportName
    delete req.session.data.currentSections
    delete req.session.data.currentSectionId
    delete req.session.data.currentSectionName
    delete req.session.data.currentUnassignedTasks

    console.log('Reports index - Current reports in session:')
    if (req.session.data.reports) {
        req.session.data.reports.forEach((report, index) => {
            console.log(`Report ${index + 1}: ${report.reportName} (ID: ${report.id})`)
        })
    } else {
        console.log('No reports found in session')
    }

    res.render('funding/grant/reports/index')
})

// New report form
// GET /funding/grant/reports/new
router.get('/funding/grant/reports/new', function (req, res) {
    const templateData = {
        grantName: req.session.data.grantName || 'Sample Grant Name'
    };
    
    res.render('funding/grant/reports/add/index', templateData);
})

// Create new report  
// POST /funding/grant/reports
router.post('/funding/grant/reports', function (req, res) {
    const dataManager = new ReportsDataManager(req.session.data);
    
    // Set grant name if not already set
    if (!req.session.data.grantName) {
        req.session.data.grantName = "Sample Grant Name"
    }

    // Create new report using data manager
    const newReport = dataManager.addReport({
        reportName: req.body.reportName
    });

    // Set to show we have reports
    req.session.data.setupReport = 'yes'

    res.redirect('/funding/grant/reports?setupReport=yes')
})

// View specific report (redirects to sections)
// GET /funding/grant/reports/:reportId
router.get('/funding/grant/reports/:reportId', function (req, res) {
    const reportId = req.params.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    // Validate report exists
    if (!dataManager.getReport(reportId)) {
        return res.redirect('/funding/grant/reports');
    }

    // Redirect to sections page for this report
    res.redirect('/funding/grant/reports/' + reportId + '/sections');
})

// Delete report
// DELETE /funding/grant/reports/:reportId (using GET for prototype compatibility)
router.get('/funding/grant/reports/:reportId/delete', function (req, res) {
    const reportId = req.params.reportId
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.deleteReport(reportId);

    // If no reports left, reset setupReport
    if (req.session.data.reports.length === 0) {
        req.session.data.setupReport = undefined
    }

    res.redirect('/funding/grant/reports')
})

// Edit report page
// GET /funding/grant/reports/:reportId/edit
router.get('/funding/grant/reports/:reportId/edit', function (req, res) {
    const reportId = req.params.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    const currentReport = dataManager.getReport(reportId);
    if (!currentReport) {
        return res.redirect('/funding/grant/reports');
    }

    const templateData = {
        currentReportId: reportId,
        currentReportName: currentReport.reportName,
        grantName: req.session.data.grantName || 'Sample Grant Name'
    };

    res.render('funding/grant/reports/edit/index', templateData);
})

// Update report
// PUT /funding/grant/reports/:reportId (using POST for prototype compatibility)
router.post('/funding/grant/reports/:reportId/update', function (req, res) {
    const reportId = req.params.reportId;
    const newReportName = req.body.reportName;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.updateReport(reportId, {
        reportName: newReportName
    });

    res.redirect('/funding/grant/reports');
})

// BACKWARD COMPATIBILITY ROUTES
// These handle old URLs and redirect to new structure

// Old: /funding/grant/reports/
router.get('/funding/grant/reports/', function (req, res) {
    res.redirect('/funding/grant/reports');
})

// Old: /funding/grant/reports/delete/:id
router.get('/funding/grant/reports/delete/:id', function (req, res) {
    res.redirect('/funding/grant/reports/' + req.params.id + '/delete');
})

// Old: /funding/grant/reports/edit/?reportId=123
router.get('/funding/grant/reports/edit/', function (req, res) {
    const reportId = req.query.reportId;
    if (reportId) {
        res.redirect('/funding/grant/reports/' + reportId + '/edit');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

// Old: /funding/grant/reports/edit/update
router.post('/funding/grant/reports/edit/update', function (req, res) {
    const reportId = req.body.reportId;
    if (reportId) {
        // Forward the form data to the new route
        res.redirect(307, '/funding/grant/reports/' + reportId + '/update');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

module.exports = router