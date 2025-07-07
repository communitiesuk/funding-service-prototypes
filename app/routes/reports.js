const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const ReportsDataManager = require('../data/ReportsDataManager')

// Reports index page
router.get('/funding/grant/reports/', function (req, res) {
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

// Create new report
router.post('/funding/grant/reports/', function (req, res) {
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

    res.redirect('/funding/grant/reports/?setupReport=yes')
})

// Delete report
router.get('/funding/grant/reports/delete/:id', function (req, res) {
    const reportId = req.params.id
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.deleteReport(reportId);

    // If no reports left, reset setupReport
    if (req.session.data.reports.length === 0) {
        req.session.data.setupReport = undefined
    }

    res.redirect('/funding/grant/reports/')
})

// Edit report page
router.get('/funding/grant/reports/edit/', function (req, res) {
    const reportId = req.query.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    const currentReport = dataManager.getReport(reportId);
    if (!currentReport) {
        return res.redirect('/funding/grant/reports/');
    }

    const templateData = {
        currentReportId: reportId,
        currentReportName: currentReport.reportName,
        grantName: req.session.data.grantName || 'Sample Grant Name'
    };

    res.render('funding/grant/reports/edit/index', templateData);
})

// Update report
router.post('/funding/grant/reports/edit/update', function (req, res) {
    const reportId = req.body.reportId;
    const newReportName = req.body.reportName;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.updateReport(reportId, {
        reportName: newReportName
    });

    res.redirect('/funding/grant/reports/');
})

module.exports = router