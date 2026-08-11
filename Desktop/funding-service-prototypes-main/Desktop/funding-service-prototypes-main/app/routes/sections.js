const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const ReportsDataManager = require('../data/ReportsDataManager')

// Sections page
router.get('/funding/grant/reports/sections', function (req, res) {
    const reportId = req.query.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    // Validate report exists
    if (!dataManager.getReport(reportId)) {
        return res.redirect('/funding/grant/reports/');
    }

    // Handle cancel parameter - redirect to clear URL
    if (req.query.cancel === 'true') {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
    }

    // Build template data (always fresh!)
    const templateData = dataManager.buildTemplateData(reportId, { 
        includeSections: true 
    });

    // Add confirmation states if present in query
    if (req.query.deleteConfirm === 'true') {
        templateData.deleteConfirm = true;
        templateData.deleteSectionId = req.query.deleteSectionId;
        templateData.deleteSectionName = req.query.deleteSectionName;
    }

    if (req.query.taskDeleteConfirm === 'true') {
        templateData.taskDeleteConfirm = true;
        templateData.deleteTaskId = req.query.deleteTaskId;
        templateData.deleteTaskSectionId = req.query.deleteTaskSectionId;
        templateData.deleteTaskName = req.query.deleteTaskName;
    }

    res.render('funding/grant/reports/sections', templateData);
});

// Add section page
router.get('/funding/grant/reports/add/section/', function (req, res) {
    const reportId = req.query.reportId
    const dataManager = new ReportsDataManager(req.session.data);

    // Validate report exists
    const report = dataManager.getReport(reportId);
    if (!report) {
        return res.redirect('/funding/grant/reports/')
    }

    // Store current report context
    req.session.data.currentReportId = reportId;
    req.session.data.reportName = report.reportName;

    // Clear any existing sectionName from session
    delete req.session.data.sectionName
    
    res.render('funding/grant/reports/add/section/index')
})

// Add section
router.post('/funding/grant/reports/add/section/another', function (req, res) {
    const reportId = req.session.data.currentReportId
    const dataManager = new ReportsDataManager(req.session.data);

    const newSection = dataManager.addSection(reportId, {
        sectionName: req.body.sectionName
    });

    // Clear form data
    delete req.session.data.sectionName;
    delete req.session.data.returnToAfterSection;

    if (newSection) {
        res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
    } else {
        res.redirect('/funding/grant/reports/');
    }
})

// "Add sections" link to set currentReportId
router.get('/funding/grant/reports/add/section/:reportId', function (req, res) {
    // Set which report we're adding sections to
    req.session.data.currentReportId = req.params.reportId
    // Clear any existing sectionName
    delete req.session.data.sectionName
    res.redirect('/funding/grant/reports/add/section/')
})

// Delete section
router.get('/funding/grant/reports/sections/delete/:sectionId', function (req, res) {
    const sectionId = req.params.sectionId;
    const reportId = req.query.reportId;
    const confirm = req.query.confirm;
    const dataManager = new ReportsDataManager(req.session.data);

    if (confirm === 'yes') {
        dataManager.deleteSection(reportId, sectionId);
    }
    
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
});

// Move section up
router.get('/funding/grant/reports/sections/move-up/:sectionId', function (req, res) {
    const sectionId = req.params.sectionId;
    const reportId = req.query.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveSectionUp(reportId, sectionId);
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
});

// Move section down
router.get('/funding/grant/reports/sections/move-down/:sectionId', function (req, res) {
    const sectionId = req.params.sectionId;
    const reportId = req.query.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveSectionDown(reportId, sectionId);
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
});

// Edit section page
router.get('/funding/grant/reports/edit/section/', function (req, res) {
    const sectionId = req.query.sectionId;
    const reportId = req.query.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    const currentReport = dataManager.getReport(reportId);
    const currentSection = dataManager.getSection(reportId, sectionId);
    
    if (!currentReport || !currentSection) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
    }

    const templateData = {
        currentSectionId: sectionId,
        currentReportId: reportId,
        currentSectionName: currentSection.sectionName,
        reportName: currentReport.reportName,
        grantName: req.session.data.grantName || 'Sample Grant Name'
    };

    res.render('funding/grant/reports/edit/section/index', templateData);
})

// Update section
router.post('/funding/grant/reports/edit/section/update', function (req, res) {
    const sectionId = req.body.sectionId;
    const reportId = req.body.reportId;
    const newSectionName = req.body.sectionName;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.updateSection(reportId, sectionId, {
        sectionName: newSectionName
    });

    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
})

module.exports = router