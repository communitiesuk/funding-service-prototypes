const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const ReportsDataManager = require('../data/ReportsDataManager')

// List sections for a report
// GET /funding/grant/reports/:reportId/sections
router.get('/funding/grant/reports/:reportId/sections', function (req, res) {
    const reportId = req.params.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    // Validate report exists
    if (!dataManager.getReport(reportId)) {
        return res.redirect('/funding/grant/reports');
    }

    // Handle cancel parameter - redirect to clear URL
    if (req.query.cancel === 'true') {
        return res.redirect('/funding/grant/reports/' + reportId + '/sections');
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

// New section form
// GET /funding/grant/reports/:reportId/sections/new
router.get('/funding/grant/reports/:reportId/sections/new', function (req, res) {
    const reportId = req.params.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    // Validate report exists
    const report = dataManager.getReport(reportId);
    if (!report) {
        return res.redirect('/funding/grant/reports')
    }

    // Store current report context
    req.session.data.currentReportId = reportId;
    req.session.data.reportName = report.reportName;

    // Clear any existing sectionName from session
    delete req.session.data.sectionName
    
    res.render('funding/grant/reports/add/section/index')
})

// Create new section
// POST /funding/grant/reports/:reportId/sections
router.post('/funding/grant/reports/:reportId/sections', function (req, res) {
    const reportId = req.params.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    const newSection = dataManager.addSection(reportId, {
        sectionName: req.body.sectionName
    });

    // Clear form data
    delete req.session.data.sectionName;
    delete req.session.data.returnToAfterSection;

    if (newSection) {
        res.redirect('/funding/grant/reports/' + reportId + '/sections');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

// View specific section (could be used for detailed section view in future)
// GET /funding/grant/reports/:reportId/sections/:sectionId
router.get('/funding/grant/reports/:reportId/sections/:sectionId', function (req, res) {
    const reportId = req.params.reportId;
    const sectionId = req.params.sectionId;
    const dataManager = new ReportsDataManager(req.session.data);

    // For now, redirect to the tasks within this section
    // In future, this could show a detailed section view
    res.redirect('/funding/grant/reports/' + reportId + '/sections/' + sectionId + '/tasks');
})

// Delete section
// DELETE /funding/grant/reports/:reportId/sections/:sectionId (using GET for prototype compatibility)
router.get('/funding/grant/reports/:reportId/sections/:sectionId/delete', function (req, res) {
    const reportId = req.params.reportId;
    const sectionId = req.params.sectionId;
    const confirm = req.query.confirm;
    const dataManager = new ReportsDataManager(req.session.data);

    if (confirm === 'yes') {
        dataManager.deleteSection(reportId, sectionId);
    }
    
    res.redirect('/funding/grant/reports/' + reportId + '/sections');
});

// Move section up
// POST /funding/grant/reports/:reportId/sections/:sectionId/move-up (using GET for prototype compatibility)
router.get('/funding/grant/reports/:reportId/sections/:sectionId/move-up', function (req, res) {
    const reportId = req.params.reportId;
    const sectionId = req.params.sectionId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveSectionUp(reportId, sectionId);
    res.redirect('/funding/grant/reports/' + reportId + '/sections');
});

// Move section down
// POST /funding/grant/reports/:reportId/sections/:sectionId/move-down (using GET for prototype compatibility)
router.get('/funding/grant/reports/:reportId/sections/:sectionId/move-down', function (req, res) {
    const reportId = req.params.reportId;
    const sectionId = req.params.sectionId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveSectionDown(reportId, sectionId);
    res.redirect('/funding/grant/reports/' + reportId + '/sections');
});

// Edit section form
// GET /funding/grant/reports/:reportId/sections/:sectionId/edit
router.get('/funding/grant/reports/:reportId/sections/:sectionId/edit', function (req, res) {
    const reportId = req.params.reportId;
    const sectionId = req.params.sectionId;
    const dataManager = new ReportsDataManager(req.session.data);

    const currentReport = dataManager.getReport(reportId);
    const currentSection = dataManager.getSection(reportId, sectionId);
    
    if (!currentReport || !currentSection) {
        return res.redirect('/funding/grant/reports/' + reportId + '/sections');
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
// PUT /funding/grant/reports/:reportId/sections/:sectionId (using POST for prototype compatibility)
router.post('/funding/grant/reports/:reportId/sections/:sectionId/update', function (req, res) {
    const reportId = req.params.reportId;
    const sectionId = req.params.sectionId;
    const newSectionName = req.body.sectionName;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.updateSection(reportId, sectionId, {
        sectionName: newSectionName
    });

    res.redirect('/funding/grant/reports/' + reportId + '/sections');
})

// BACKWARD COMPATIBILITY ROUTES
// These handle old URLs and redirect to new structure

// Old: /funding/grant/reports/sections?reportId=123
router.get('/funding/grant/reports/sections', function (req, res) {
    const reportId = req.query.reportId;
    if (reportId) {
        res.redirect('/funding/grant/reports/' + reportId + '/sections');
    } else {
        res.redirect('/funding/grant/reports');
    }
});

// Old: /funding/grant/reports/add/section/?reportId=123
router.get('/funding/grant/reports/add/section/', function (req, res) {
    const reportId = req.query.reportId;
    if (reportId) {
        res.redirect('/funding/grant/reports/' + reportId + '/sections/new');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

// Old: /funding/grant/reports/add/section/another
router.post('/funding/grant/reports/add/section/another', function (req, res) {
    const reportId = req.session.data.currentReportId;
    if (reportId) {
        // Forward the form data to the new route
        res.redirect(307, '/funding/grant/reports/' + reportId + '/sections');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

// Old: /funding/grant/reports/add/section/:reportId
router.get('/funding/grant/reports/add/section/:reportId', function (req, res) {
    res.redirect('/funding/grant/reports/' + req.params.reportId + '/sections/new');
})

// Old: /funding/grant/reports/sections/delete/:sectionId?reportId=123
router.get('/funding/grant/reports/sections/delete/:sectionId', function (req, res) {
    const reportId = req.query.reportId;
    const sectionId = req.params.sectionId;
    const confirm = req.query.confirm;
    
    if (reportId) {
        let redirectUrl = '/funding/grant/reports/' + reportId + '/sections/' + sectionId + '/delete';
        if (confirm) {
            redirectUrl += '?confirm=' + confirm;
        }
        res.redirect(redirectUrl);
    } else {
        res.redirect('/funding/grant/reports');
    }
});

// Old: /funding/grant/reports/sections/move-up/:sectionId?reportId=123
router.get('/funding/grant/reports/sections/move-up/:sectionId', function (req, res) {
    const reportId = req.query.reportId;
    const sectionId = req.params.sectionId;
    
    if (reportId) {
        res.redirect('/funding/grant/reports/' + reportId + '/sections/' + sectionId + '/move-up');
    } else {
        res.redirect('/funding/grant/reports');
    }
});

// Old: /funding/grant/reports/sections/move-down/:sectionId?reportId=123
router.get('/funding/grant/reports/sections/move-down/:sectionId', function (req, res) {
    const reportId = req.query.reportId;
    const sectionId = req.params.sectionId;
    
    if (reportId) {
        res.redirect('/funding/grant/reports/' + reportId + '/sections/' + sectionId + '/move-down');
    } else {
        res.redirect('/funding/grant/reports');
    }
});

// Old: /funding/grant/reports/edit/section/?sectionId=456&reportId=123
router.get('/funding/grant/reports/edit/section/', function (req, res) {
    const reportId = req.query.reportId;
    const sectionId = req.query.sectionId;
    
    if (reportId && sectionId) {
        res.redirect('/funding/grant/reports/' + reportId + '/sections/' + sectionId + '/edit');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

// Old: /funding/grant/reports/edit/section/update
router.post('/funding/grant/reports/edit/section/update', function (req, res) {
    const reportId = req.body.reportId;
    const sectionId = req.body.sectionId;
    
    if (reportId && sectionId) {
        // Forward the form data to the new route
        res.redirect(307, '/funding/grant/reports/' + reportId + '/sections/' + sectionId + '/update');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

module.exports = router