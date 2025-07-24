const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const ReportsDataManager = require('../data/ReportsDataManager')

// Add task page
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

    // Clear any existing task name from session  ← ADD THIS
    delete req.session.data.taskName;

    // Build template data with fresh information
    const templateData = dataManager.buildTemplateData(reportId, { 
        sectionId: sectionId 
    });

    // Add the current context to template data
    templateData.currentReportId = reportId;
    templateData.currentSectionId = sectionId;

    res.render('funding/grant/reports/add/task/index', templateData)
})

// Add task
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

// Move task up
router.get('/funding/grant/reports/tasks/move-up/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const sectionId = req.query.sectionId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveTaskUp(reportId, taskId, sectionId);
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
})

// Move task down
router.get('/funding/grant/reports/tasks/move-down/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const sectionId = req.query.sectionId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveTaskDown(reportId, taskId, sectionId);
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
})

// Move unassigned task up
router.get('/funding/grant/reports/unassigned-tasks/move-up/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveTaskUp(reportId, taskId); // No sectionId = unassigned
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
})

// Move unassigned task down
router.get('/funding/grant/reports/unassigned-tasks/move-down/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveTaskDown(reportId, taskId); // No sectionId = unassigned
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId);
})

// Delete task
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

// Delete unassigned task
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

// Move task to section
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

// Show move task to section page
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

// Edit task page
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

// Update task
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
    let redirectUrl = '/funding/grant/reports/sections?reportId=' + reportId;
    if (isUnassignedTask) {
        redirectUrl += '&unassigned=true';
    } else {
        redirectUrl += '&sectionId=' + sectionId;
    }

    res.redirect(redirectUrl);
})


module.exports = router
