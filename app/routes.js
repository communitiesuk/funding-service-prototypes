//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const radioButtonRedirect = require('radio-button-redirect')
router.use(radioButtonRedirect)

// Add this line:
const ReportsDataManager = require('./data/ReportsDataManager')

// Breadcrumbs helper
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

// Adding a section - captures which report from URL parameter
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

// Add section to the current report - CONVERTED
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

// Sections page - CONVERTED TO USE DATA MANAGER
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

// Delete section - CONVERTED
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

// Move section up - CONVERTED
router.get('/funding/grant/reports/sections/move-up/:sectionId', function (req, res) {
    const sectionId = req.params.sectionId;
    const reportId = req.query.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveSectionUp(reportId, sectionId);
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
});

// Move section down - CONVERTED
router.get('/funding/grant/reports/sections/move-down/:sectionId', function (req, res) {
    const sectionId = req.params.sectionId;
    const reportId = req.query.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveSectionDown(reportId, sectionId);
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
});

// Add task page - CONVERTED
router.get('/funding/grant/reports/add/task/', function (req, res) {
    const sectionId = req.query.sectionId;
    const reportId = req.query.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    // Validate report exists
    const report = dataManager.getReport(reportId);
    if (!report) {
        return res.redirect('/funding/grant/reports/')
    }

    // Store current context in session for the POST handler
    req.session.data.currentReportId = reportId;
    req.session.data.currentSectionId = sectionId; // Will be undefined for unassigned tasks

    // Build template data with fresh information
    const templateData = dataManager.buildTemplateData(reportId, { 
        sectionId: sectionId 
    });

    // Add the current context to template data
    templateData.currentReportId = reportId;
    templateData.currentSectionId = sectionId;

    res.render('funding/grant/reports/add/task/index', templateData)
})

// Add task - CONVERTED
router.post('/funding/grant/reports/add/task/another', function (req, res) {
    const sectionId = req.session.data.currentSectionId;
    const reportId = req.session.data.currentReportId;
    const dataManager = new ReportsDataManager(req.session.data);

    if (!reportId) {
        return res.redirect('/funding/grant/reports/');
    }

    const newTask = dataManager.addTask(reportId, {
        taskName: req.body.taskName
    }, sectionId);

    // Clear form data
    delete req.session.data.taskName;
    delete req.session.data.currentSectionId;
    delete req.session.data.sectionName;

    if (newTask) {
        res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
    } else {
        res.redirect('/funding/grant/reports/');
    }
})

// Move task up - CONVERTED
router.get('/funding/grant/reports/tasks/move-up/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const sectionId = req.query.sectionId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveTaskUp(reportId, taskId, sectionId);
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
})

// Move task down - CONVERTED
router.get('/funding/grant/reports/tasks/move-down/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const sectionId = req.query.sectionId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveTaskDown(reportId, taskId, sectionId);
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
})

// Move unassigned task up - CONVERTED
router.get('/funding/grant/reports/unassigned-tasks/move-up/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveTaskUp(reportId, taskId); // No sectionId = unassigned
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
})

// Move unassigned task down - CONVERTED
router.get('/funding/grant/reports/unassigned-tasks/move-down/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveTaskDown(reportId, taskId); // No sectionId = unassigned
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
})

// Delete task - CONVERTED
router.get('/funding/grant/reports/tasks/delete/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const sectionId = req.query.sectionId;
    const confirm = req.query.confirm;
    const dataManager = new ReportsDataManager(req.session.data);

    if (confirm === 'yes') {
        dataManager.deleteTask(reportId, taskId, sectionId);
    }
    
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
})

// Delete unassigned task - CONVERTED
router.get('/funding/grant/reports/unassigned-tasks/delete/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const confirm = req.query.confirm;
    const dataManager = new ReportsDataManager(req.session.data);

    if (confirm === 'yes') {
        dataManager.deleteTask(reportId, taskId); // No sectionId = unassigned
    }
    
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
})

// Move task to section - CONVERTED
router.post('/funding/grant/reports/move-task-to-section/move', function (req, res) {
    const taskId = req.body.taskId;
    const reportId = req.body.reportId;
    const currentSectionId = req.body.currentSectionId;
    const sectionChoice = req.body.sectionChoice;
    const newSectionName = req.body.newSectionName;
    const isUnassigned = req.body.isUnassigned === 'true';
    const dataManager = new ReportsDataManager(req.session.data);

    if (!taskId || !reportId || !sectionChoice) {
        return res.redirect('/funding/grant/reports/');
    }

    const fromSectionId = isUnassigned ? null : currentSectionId;
    const success = dataManager.moveTaskToSection(reportId, taskId, fromSectionId, sectionChoice, newSectionName);

    if (success) {
        res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
    } else {
        res.redirect('/funding/grant/reports/');
    }
})

// Show move task to section page - CONVERTED
router.get('/funding/grant/reports/move-task-to-section/', function (req, res) {
    const taskId = req.query.taskId;
    const reportId = req.query.reportId;
    const currentSectionId = req.query.currentSectionId;
    const isUnassigned = req.query.unassigned === 'true';
    const dataManager = new ReportsDataManager(req.session.data);

    if (!taskId || !reportId) {
        return res.redirect('/funding/grant/reports/');
    }

    // Get fresh data from the data manager
    const currentReport = dataManager.getReport(reportId);
    if (!currentReport) {
        return res.redirect('/funding/grant/reports/');
    }

    // Find the task
    const currentTask = dataManager.getTask(reportId, taskId, currentSectionId);
    if (!currentTask) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
    }

    // Get current section name if task is in a section
    let currentSectionName = null;
    if (currentSectionId) {
        const currentSection = dataManager.getSection(reportId, currentSectionId);
        currentSectionName = currentSection?.sectionName;
    }

    // Prepare template data
    const templateData = {
        taskId: taskId,
        reportId: reportId,
        currentSectionId: currentSectionId,
        isUnassigned: isUnassigned,
        taskName: currentTask.taskName,
        reportName: currentReport.reportName,
        currentSectionName: currentSectionName,
        availableSections: currentReport.sections || [],
        grantName: req.session.data.grantName || 'Sample Grant Name'
    };

    res.render('funding/grant/reports/move-task-to-section/index', templateData);
})

// Add question page - CONVERTED
router.get('/funding/grant/reports/add/question/', function (req, res) {
    const taskId = req.query.taskId;
    const sectionId = req.query.sectionId;
    const reportId = req.query.reportId;
    const unassigned = req.query.unassigned === 'true';
    const dataManager = new ReportsDataManager(req.session.data);

    if (!taskId || !reportId) {
        return res.redirect('/funding/grant/reports/');
    }

    // Get fresh task data
    const currentTask = dataManager.getTask(reportId, taskId, sectionId);
    if (!currentTask) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
    }

    // Store current context for form processing
    req.session.data.currentTaskId = taskId;
    req.session.data.currentSectionId = sectionId;
    req.session.data.currentReportId = reportId;
    req.session.data.isUnassignedTask = unassigned;
    req.session.data.taskName = currentTask.taskName;

    // Clear any existing question data from session
    delete req.session.data.questionType;
    delete req.session.data.questionName;

    res.render('funding/grant/reports/add/question/index');
})

// Question type selection
router.post('/funding/grant/reports/add/question/options', function (req, res) {
    // Store the selected question type
    req.session.data.questionType = req.body.questionType;
    res.render('funding/grant/reports/add/question/options');
})

// Add question - CONVERTED
router.post('/funding/grant/reports/add/question/another', function (req, res) {
    const taskId = req.session.data.currentTaskId;
    const sectionId = req.session.data.currentSectionId;
    const reportId = req.session.data.currentReportId;
    const questionName = req.body.questionName;
    const questionType = req.session.data.questionType;
    const isUnassignedTask = req.session.data.isUnassignedTask;
    const dataManager = new ReportsDataManager(req.session.data);

    const newQuestion = dataManager.addQuestion(reportId, taskId, {
        questionName: questionName,
        questionType: questionType
    }, sectionId);

    // Clear form data
    delete req.session.data.questionName;
    delete req.session.data.questionType;
    delete req.session.data.isUnassignedTask;

    // Build redirect URL
    let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId;
    if (isUnassignedTask) {
        redirectUrl += '&unassigned=true';
    } else {
        redirectUrl += '&sectionId=' + sectionId;
    }

    if (newQuestion) {
        res.redirect(redirectUrl);
    } else {
        res.redirect('/funding/grant/reports/');
    }
})

// Questions page - CONVERTED
router.get('/funding/grant/reports/questions', function (req, res) {
    const taskId = req.query.taskId;
    const sectionId = req.query.sectionId;
    const reportId = req.query.reportId;
    const unassigned = req.query.unassigned === 'true';
    const dataManager = new ReportsDataManager(req.session.data);

    if (!taskId || !reportId) {
        return res.redirect('/funding/grant/reports/');
    }

    // Validate task exists
    const currentTask = dataManager.getTask(reportId, taskId, sectionId);
    if (!currentTask) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
    }

    // Handle cancel parameter
    if (req.query.cancel === 'true') {
        let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId;
        if (unassigned) {
            redirectUrl += '&unassigned=true';
        } else {
            redirectUrl += '&sectionId=' + sectionId;
        }
        return res.redirect(redirectUrl);
    }

    // Build template data
    const templateData = dataManager.buildTemplateData(reportId, { 
        taskId: taskId,
        sectionId: sectionId,
        includeSections: true 
    });

    // Add task-specific data
    templateData.currentTaskId = taskId;
    templateData.currentSectionId = sectionId;
    templateData.isUnassignedTask = unassigned;

    // Get section name if not unassigned
    if (!unassigned && sectionId) {
        const currentSection = dataManager.getSection(reportId, sectionId);
        templateData.sectionName = currentSection?.sectionName;
    }

    // Add confirmation states if present in query
    if (req.query.questionDeleteConfirm === 'true') {
        templateData.questionDeleteConfirm = true;
        templateData.deleteQuestionId = req.query.deleteQuestionId;
        templateData.deleteQuestionName = req.query.deleteQuestionName;
    }

    if (req.query.taskDeleteConfirm === 'true') {
        templateData.taskDeleteConfirm = true;
        templateData.deleteTaskId = req.query.deleteTaskId;
        templateData.deleteTaskName = req.query.deleteTaskName;
    }

    res.render('funding/grant/reports/questions', templateData);
})

// Move question up - CONVERTED
router.get('/funding/grant/reports/questions/move-up/:questionId', function (req, res) {
    const questionId = req.params.questionId;
    const taskId = req.query.taskId;
    const sectionId = req.query.sectionId;
    const reportId = req.query.reportId;
    const unassigned = req.query.unassigned === 'true';
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveQuestionUp(reportId, taskId, questionId, sectionId);

    let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId;
    if (unassigned) {
        redirectUrl += '&unassigned=true';
    } else {
        redirectUrl += '&sectionId=' + sectionId;
    }
    res.redirect(redirectUrl);
})

// Move question down - CONVERTED
router.get('/funding/grant/reports/questions/move-down/:questionId', function (req, res) {
    const questionId = req.params.questionId;
    const taskId = req.query.taskId;
    const sectionId = req.query.sectionId;
    const reportId = req.query.reportId;
    const unassigned = req.query.unassigned === 'true';
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveQuestionDown(reportId, taskId, questionId, sectionId);

    let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId;
    if (unassigned) {
        redirectUrl += '&unassigned=true';
    } else {
        redirectUrl += '&sectionId=' + sectionId;
    }
    res.redirect(redirectUrl);
})

// Delete question - CONVERTED
router.get('/funding/grant/reports/questions/delete/:questionId', function (req, res) {
    const questionId = req.params.questionId;
    const taskId = req.query.taskId;
    const sectionId = req.query.sectionId;
    const reportId = req.query.reportId;
    const unassigned = req.query.unassigned === 'true';
    const confirm = req.query.confirm;
    const dataManager = new ReportsDataManager(req.session.data);

    if (confirm === 'yes') {
        dataManager.deleteQuestion(reportId, taskId, questionId, sectionId);
    }

    let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId;
    if (unassigned) {
        redirectUrl += '&unassigned=true';
    } else {
        redirectUrl += '&sectionId=' + sectionId;
    }
    res.redirect(redirectUrl);
})

// Edit report page - CONVERTED
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

// Update report - CONVERTED
router.post('/funding/grant/reports/edit/update', function (req, res) {
    const reportId = req.body.reportId;
    const newReportName = req.body.reportName;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.updateReport(reportId, {
        reportName: newReportName
    });

    res.redirect('/funding/grant/reports/');
})

// Edit section page - CONVERTED
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

// Update section - CONVERTED
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

// Edit task page - CONVERTED
router.get('/funding/grant/reports/edit/task/', function (req, res) {
    const taskId = req.query.taskId;
    const sectionId = req.query.sectionId;
    const reportId = req.query.reportId;
    const unassigned = req.query.unassigned === 'true';
    const dataManager = new ReportsDataManager(req.session.data);

    const currentReport = dataManager.getReport(reportId);
    const currentTask = dataManager.getTask(reportId, taskId, sectionId);
    
    if (!currentReport || !currentTask) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
    }

    const templateData = {
        currentTaskId: taskId,
        currentSectionId: sectionId,
        currentReportId: reportId,
        currentTaskName: currentTask.taskName,
        reportName: currentReport.reportName,
        isUnassignedTask: unassigned,
        grantName: req.session.data.grantName || 'Sample Grant Name'
    };

    res.render('funding/grant/reports/edit/task/index', templateData);
})

// Update task - CONVERTED
router.post('/funding/grant/reports/edit/task/update', function (req, res) {
    const taskId = req.body.taskId;
    const sectionId = req.body.sectionId;
    const reportId = req.body.reportId;
    const newTaskName = req.body.taskName;
    const isUnassignedTask = req.body.isUnassignedTask === 'true';
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.updateTask(reportId, taskId, {
        taskName: newTaskName
    }, sectionId);

    // Build redirect URL back to questions page
    let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId;
    if (isUnassignedTask) {
        redirectUrl += '&unassigned=true';
    } else {
        redirectUrl += '&sectionId=' + sectionId;
    }

    res.redirect(redirectUrl);
})

module.exports = router