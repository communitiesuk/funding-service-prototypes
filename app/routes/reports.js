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

    // Handle cancel parameter - redirect to clear URL
    if (req.query.cancel === 'true') {
        return res.redirect('/funding/grant/reports/');
    }

    // Build template data for rendering
    const templateData = {
        grantName: req.session.data.grantName || 'Sample Grant Name'
    };

    // Add confirmation state if present in query
    if (req.query.deleteConfirm === 'true') {
        templateData.deleteConfirm = true;
        templateData.deleteReportId = req.query.deleteReportId;
        templateData.deleteReportName = req.query.deleteReportName;
    }

    console.log('Reports index - Current reports in session:')
    if (req.session.data.reports) {
        req.session.data.reports.forEach((report, index) => {
            console.log(`Report ${index + 1}: ${report.reportName} (ID: ${report.id})`)
        })
    } else {
        console.log('No reports found in session')
    }

    res.render('funding/grant/reports/index', templateData)
})

// Preview report page - UPDATED to include questions data
router.get('/funding/grant/reports/preview', function (req, res) {
    const reportId = req.query.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    // Validate report exists
    const currentReport = dataManager.getReport(reportId);
    if (!currentReport) {
        return res.redirect('/funding/grant/reports/');
    }

    // Build template data with sections and tasks
    const templateData = dataManager.buildTemplateData(reportId, {
        includeSections: true
    });

    // Transform the data structure for the task list pattern
    templateData.previewSections = [];

    // Add unassigned tasks FIRST as a separate section if they exist
    if (currentReport.unassignedTasks && currentReport.unassignedTasks.length > 0) {
        const unassignedTasks = [];

        currentReport.unassignedTasks.forEach(task => {
            unassignedTasks.push({
                title: { text: task.taskName },
                href: "#",
                status: {
                    tag: {
                        text: "Not started",
                        classes: "govuk-tag--grey"
                    }
                },
                questions: task.questions || [] // ADD QUESTIONS DATA
            });
        });

        templateData.previewSections.push({
            heading: "",
            tasks: unassignedTasks
        });
    }

    // Then add sections with their tasks
    if (currentReport.sections && currentReport.sections.length > 0) {
        currentReport.sections.forEach(section => {
            const sectionTasks = [];

            if (section.tasks && section.tasks.length > 0) {
                section.tasks.forEach(task => {
                    sectionTasks.push({
                        title: { text: task.taskName },
                        href: "#", // Could link to actual form if needed
                        status: {
                            tag: {
                                text: "Not started",
                                classes: "govuk-tag--grey"
                            }
                        },
                        questions: task.questions || [] // ADD QUESTIONS DATA
                    });
                });
            } else {
                // Section has no tasks - add a simple text indicator
                sectionTasks.push({
                    title: { text: "There are no tasks in this section" },
                    href: null,
                    status: null,
                    questions: [] // ENSURE QUESTIONS ARRAY EXISTS
                });
            }

            templateData.previewSections.push({
                heading: section.sectionName,
                tasks: sectionTasks
            });
        });
    }

    // If no sections or tasks exist
    if (templateData.previewSections.length === 0) {
        templateData.previewSections.push({
            heading: "No content",
            tasks: [{
                title: { text: "This report has no sections or tasks yet" },
                href: "#",
                status: {
                    tag: {
                        text: "Empty",
                        classes: "govuk-tag--grey"
                    }
                },
                questions: [] // ENSURE QUESTIONS ARRAY EXISTS
            }]
        });
    }

    res.render('funding/grant/reports/preview', templateData);
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

// Delete report - Updated to use confirmation pattern
router.get('/funding/grant/reports/delete/:id', function (req, res) {
    const reportId = req.params.id
    const confirm = req.query.confirm;
    const dataManager = new ReportsDataManager(req.session.data);

    if (confirm === 'yes') {
        dataManager.deleteReport(reportId);

        // If no reports left, reset setupReport
        if (req.session.data.reports.length === 0) {
            req.session.data.setupReport = undefined
        }

        res.redirect('/funding/grant/reports/')
    } else {
        // If no confirmation, redirect back to main page
        res.redirect('/funding/grant/reports/')
    }
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