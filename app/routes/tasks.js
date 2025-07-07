const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const ReportsDataManager = require('../data/ReportsDataManager')

// === TASKS WITHIN SECTIONS ===

// List tasks in a section
// GET /funding/grant/reports/:reportId/sections/:sectionId/tasks
router.get('/funding/grant/reports/:reportId/sections/:sectionId/tasks', function (req, res) {
    const reportId = req.params.reportId;
    const sectionId = req.params.sectionId;
    const dataManager = new ReportsDataManager(req.session.data);

    // For now, redirect to the main sections page which shows tasks
    // In future, this could be a dedicated tasks-only view for the section
    res.redirect('/funding/grant/reports/' + reportId + '/sections');
})

// New task form for a section
// GET /funding/grant/reports/:reportId/sections/:sectionId/tasks/new
router.get('/funding/grant/reports/:reportId/sections/:sectionId/tasks/new', function (req, res) {
    const reportId = req.params.reportId;
    const sectionId = req.params.sectionId;
    const dataManager = new ReportsDataManager(req.session.data);

    // Validate report and section exist
    const report = dataManager.getReport(reportId);
    const section = dataManager.getSection(reportId, sectionId);
    
    if (!report || !section) {
        return res.redirect('/funding/grant/reports/' + reportId + '/sections');
    }

    // Store current context in session for the POST handler
    req.session.data.currentReportId = reportId;
    req.session.data.currentSectionId = sectionId;

    // Build template data
    const templateData = dataManager.buildTemplateData(reportId, { 
        sectionId: sectionId 
    });

    res.render('funding/grant/reports/add/task/index', templateData);
})

// Create task in a section
// POST /funding/grant/reports/:reportId/sections/:sectionId/tasks
router.post('/funding/grant/reports/:reportId/sections/:sectionId/tasks', function (req, res) {
    const reportId = req.params.reportId;
    const sectionId = req.params.sectionId;
    const dataManager = new ReportsDataManager(req.session.data);

    const newTask = dataManager.addTask(reportId, {
        taskName: req.body.taskName
    }, sectionId);

    // Clear form data
    delete req.session.data.taskName;
    delete req.session.data.currentSectionId;
    delete req.session.data.sectionName;

    if (newTask) {
        res.redirect('/funding/grant/reports/' + reportId + '/sections');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

// === UNASSIGNED TASKS ===

// List unassigned tasks for a report
// GET /funding/grant/reports/:reportId/tasks
router.get('/funding/grant/reports/:reportId/tasks', function (req, res) {
    const reportId = req.params.reportId;
    
    // For now, redirect to the main sections page which shows unassigned tasks
    // In future, this could be a dedicated unassigned tasks view
    res.redirect('/funding/grant/reports/' + reportId + '/sections');
})

// New unassigned task form
// GET /funding/grant/reports/:reportId/tasks/new
router.get('/funding/grant/reports/:reportId/tasks/new', function (req, res) {
    const reportId = req.params.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    // Validate report exists
    const report = dataManager.getReport(reportId);
    if (!report) {
        return res.redirect('/funding/grant/reports');
    }

    // Store current context (no sectionId = unassigned)
    req.session.data.currentReportId = reportId;
    req.session.data.currentSectionId = undefined;

    // Build template data
    const templateData = dataManager.buildTemplateData(reportId, {});

    res.render('funding/grant/reports/add/task/index', templateData);
})

// Create unassigned task
// POST /funding/grant/reports/:reportId/tasks
router.post('/funding/grant/reports/:reportId/tasks', function (req, res) {
    const reportId = req.params.reportId;
    const dataManager = new ReportsDataManager(req.session.data);

    const newTask = dataManager.addTask(reportId, {
        taskName: req.body.taskName
    }); // No sectionId = unassigned

    // Clear form data
    delete req.session.data.taskName;
    delete req.session.data.currentSectionId;
    delete req.session.data.sectionName;

    if (newTask) {
        res.redirect('/funding/grant/reports/' + reportId + '/sections');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

// === INDIVIDUAL TASK OPERATIONS ===

// View specific task (redirects to questions)
// GET /funding/grant/reports/:reportId/tasks/:taskId
router.get('/funding/grant/reports/:reportId/tasks/:taskId', function (req, res) {
    const reportId = req.params.reportId;
    const taskId = req.params.taskId;
    const dataManager = new ReportsDataManager(req.session.data);

    // Find the task (could be in a section or unassigned)
    const report = dataManager.getReport(reportId);
    if (!report) {
        return res.redirect('/funding/grant/reports');
    }

    // Check if task is in a section
    let sectionId = null;
    if (report.sections) {
        for (const section of report.sections) {
            if (section.tasks && section.tasks.find(task => task.id === taskId)) {
                sectionId = section.id;
                break;
            }
        }
    }

    // Build redirect URL for questions page
    let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId;
    if (sectionId) {
        redirectUrl += '&sectionId=' + sectionId;
    } else {
        redirectUrl += '&unassigned=true';
    }

    res.redirect(redirectUrl);
})

// Edit task form
// GET /funding/grant/reports/:reportId/tasks/:taskId/edit
router.get('/funding/grant/reports/:reportId/tasks/:taskId/edit', function (req, res) {
    const reportId = req.params.reportId;
    const taskId = req.params.taskId;
    const dataManager = new ReportsDataManager(req.session.data);

    const report = dataManager.getReport(reportId);
    if (!report) {
        return res.redirect('/funding/grant/reports');
    }

    // Find the task and determine if it's in a section
    let task = null;
    let sectionId = null;
    let isUnassigned = true;

    // Check sections first
    if (report.sections) {
        for (const section of report.sections) {
            if (section.tasks) {
                const foundTask = section.tasks.find(t => t.id === taskId);
                if (foundTask) {
                    task = foundTask;
                    sectionId = section.id;
                    isUnassigned = false;
                    break;
                }
            }
        }
    }

    // Check unassigned tasks if not found in sections
    if (!task && report.unassignedTasks) {
        task = report.unassignedTasks.find(t => t.id === taskId);
    }

    if (!task) {
        return res.redirect('/funding/grant/reports/' + reportId + '/sections');
    }

    const templateData = {
        currentTaskId: taskId,
        currentSectionId: sectionId,
        currentReportId: reportId,
        currentTaskName: task.taskName,
        reportName: report.reportName,
        isUnassignedTask: isUnassigned,
        grantName: req.session.data.grantName || 'Sample Grant Name'
    };

    res.render('funding/grant/reports/edit/task/index', templateData);
})

// Update task
// POST /funding/grant/reports/:reportId/tasks/:taskId/update
router.post('/funding/grant/reports/:reportId/tasks/:taskId/update', function (req, res) {
    const reportId = req.params.reportId;
    const taskId = req.params.taskId;
    const newTaskName = req.body.taskName;
    const isUnassignedTask = req.body.isUnassignedTask === 'true';
    const sectionId = req.body.sectionId;
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

// Delete task
// GET /funding/grant/reports/:reportId/tasks/:taskId/delete
router.get('/funding/grant/reports/:reportId/tasks/:taskId/delete', function (req, res) {
    const reportId = req.params.reportId;
    const taskId = req.params.taskId;
    const confirm = req.query.confirm;
    const sectionId = req.query.sectionId; // Might be passed for sectioned tasks
    const dataManager = new ReportsDataManager(req.session.data);

    if (confirm === 'yes') {
        dataManager.deleteTask(reportId, taskId, sectionId);
    }
    
    res.redirect('/funding/grant/reports/' + reportId + '/sections');
})

// Move task up
// GET /funding/grant/reports/:reportId/tasks/:taskId/move-up
router.get('/funding/grant/reports/:reportId/tasks/:taskId/move-up', function (req, res) {
    const reportId = req.params.reportId;
    const taskId = req.params.taskId;
    const sectionId = req.query.sectionId; // Optional - passed for sectioned tasks
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveTaskUp(reportId, taskId, sectionId);
    res.redirect('/funding/grant/reports/' + reportId + '/sections');
})

// Move task down  
// GET /funding/grant/reports/:reportId/tasks/:taskId/move-down
router.get('/funding/grant/reports/:reportId/tasks/:taskId/move-down', function (req, res) {
    const reportId = req.params.reportId;
    const taskId = req.params.taskId;
    const sectionId = req.query.sectionId; // Optional - passed for sectioned tasks
    const dataManager = new ReportsDataManager(req.session.data);

    dataManager.moveTaskDown(reportId, taskId, sectionId);
    res.redirect('/funding/grant/reports/' + reportId + '/sections');
})

// Move task to different section
// GET /funding/grant/reports/:reportId/tasks/:taskId/move-to-section
router.get('/funding/grant/reports/:reportId/tasks/:taskId/move-to-section', function (req, res) {
    const reportId = req.params.reportId;
    const taskId = req.params.taskId;
    const currentSectionId = req.query.currentSectionId;
    const isUnassigned = req.query.unassigned === 'true';
    const dataManager = new ReportsDataManager(req.session.data);

    // Get fresh data from the data manager
    const currentReport = dataManager.getReport(reportId);
    if (!currentReport) {
        return res.redirect('/funding/grant/reports');
    }

    // Find the task
    const currentTask = dataManager.getTask(reportId, taskId, currentSectionId);
    if (!currentTask) {
        return res.redirect('/funding/grant/reports/' + reportId + '/sections');
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

// Process move task to section
// POST /funding/grant/reports/:reportId/tasks/:taskId/move-to-section
router.post('/funding/grant/reports/:reportId/tasks/:taskId/move-to-section', function (req, res) {
    const reportId = req.params.reportId;
    const taskId = req.params.taskId;
    const currentSectionId = req.body.currentSectionId;
    const sectionChoice = req.body.sectionChoice;
    const newSectionName = req.body.newSectionName;
    const isUnassigned = req.body.isUnassigned === 'true';
    const dataManager = new ReportsDataManager(req.session.data);

    if (!sectionChoice) {
        return res.redirect('/funding/grant/reports/' + reportId + '/sections');
    }

    const fromSectionId = isUnassigned ? null : currentSectionId;
    const success = dataManager.moveTaskToSection(reportId, taskId, fromSectionId, sectionChoice, newSectionName);

    if (success) {
        res.redirect('/funding/grant/reports/' + reportId + '/sections');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

// === BACKWARD COMPATIBILITY ROUTES ===

// Old: /funding/grant/reports/add/task/?sectionId=456&reportId=123
router.get('/funding/grant/reports/add/task/', function (req, res) {
    const reportId = req.query.reportId;
    const sectionId = req.query.sectionId;
    
    if (reportId) {
        if (sectionId) {
            res.redirect('/funding/grant/reports/' + reportId + '/sections/' + sectionId + '/tasks/new');
        } else {
            res.redirect('/funding/grant/reports/' + reportId + '/tasks/new');
        }
    } else {
        res.redirect('/funding/grant/reports');
    }
})

// Old: /funding/grant/reports/add/task/another
router.post('/funding/grant/reports/add/task/another', function (req, res) {
    const reportId = req.session.data.currentReportId;
    const sectionId = req.session.data.currentSectionId;
    
    if (reportId) {
        if (sectionId) {
            res.redirect(307, '/funding/grant/reports/' + reportId + '/sections/' + sectionId + '/tasks');
        } else {
            res.redirect(307, '/funding/grant/reports/' + reportId + '/tasks');
        }
    } else {
        res.redirect('/funding/grant/reports');
    }
})

// Old task operations with query parameters
router.get('/funding/grant/reports/tasks/move-up/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const sectionId = req.query.sectionId;
    
    if (reportId) {
        let redirectUrl = '/funding/grant/reports/' + reportId + '/tasks/' + taskId + '/move-up';
        if (sectionId) {
            redirectUrl += '?sectionId=' + sectionId;
        }
        res.redirect(redirectUrl);
    } else {
        res.redirect('/funding/grant/reports');
    }
})

router.get('/funding/grant/reports/tasks/move-down/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const sectionId = req.query.sectionId;
    
    if (reportId) {
        let redirectUrl = '/funding/grant/reports/' + reportId + '/tasks/' + taskId + '/move-down';
        if (sectionId) {
            redirectUrl += '?sectionId=' + sectionId;
        }
        res.redirect(redirectUrl);
    } else {
        res.redirect('/funding/grant/reports');
    }
})

router.get('/funding/grant/reports/tasks/delete/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const sectionId = req.query.sectionId;
    const confirm = req.query.confirm;
    
    if (reportId) {
        let redirectUrl = '/funding/grant/reports/' + reportId + '/tasks/' + taskId + '/delete';
        const params = [];
        if (confirm) params.push('confirm=' + confirm);
        if (sectionId) params.push('sectionId=' + sectionId);
        if (params.length > 0) {
            redirectUrl += '?' + params.join('&');
        }
        res.redirect(redirectUrl);
    } else {
        res.redirect('/funding/grant/reports');
    }
})

// Old unassigned task operations
router.get('/funding/grant/reports/unassigned-tasks/move-up/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    
    if (reportId) {
        res.redirect('/funding/grant/reports/' + reportId + '/tasks/' + taskId + '/move-up');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

router.get('/funding/grant/reports/unassigned-tasks/move-down/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    
    if (reportId) {
        res.redirect('/funding/grant/reports/' + reportId + '/tasks/' + taskId + '/move-down');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

router.get('/funding/grant/reports/unassigned-tasks/delete/:taskId', function (req, res) {
    const taskId = req.params.taskId;
    const reportId = req.query.reportId;
    const confirm = req.query.confirm;
    
    if (reportId) {
        let redirectUrl = '/funding/grant/reports/' + reportId + '/tasks/' + taskId + '/delete';
        if (confirm) {
            redirectUrl += '?confirm=' + confirm;
        }
        res.redirect(redirectUrl);
    } else {
        res.redirect('/funding/grant/reports');
    }
})

// Old move task to section routes
router.get('/funding/grant/reports/move-task-to-section/', function (req, res) {
    const taskId = req.query.taskId;
    const reportId = req.query.reportId;
    const currentSectionId = req.query.currentSectionId;
    const unassigned = req.query.unassigned;
    
    if (reportId && taskId) {
        let redirectUrl = '/funding/grant/reports/' + reportId + '/tasks/' + taskId + '/move-to-section';
        const params = [];
        if (currentSectionId) params.push('currentSectionId=' + currentSectionId);
        if (unassigned) params.push('unassigned=' + unassigned);
        if (params.length > 0) {
            redirectUrl += '?' + params.join('&');
        }
        res.redirect(redirectUrl);
    } else {
        res.redirect('/funding/grant/reports');
    }
})

router.post('/funding/grant/reports/move-task-to-section/move', function (req, res) {
    const taskId = req.body.taskId;
    const reportId = req.body.reportId;
    
    if (reportId && taskId) {
        res.redirect(307, '/funding/grant/reports/' + reportId + '/tasks/' + taskId + '/move-to-section');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

// Old edit task routes
router.get('/funding/grant/reports/edit/task/', function (req, res) {
    const taskId = req.query.taskId;
    const reportId = req.query.reportId;
    
    if (reportId && taskId) {
        res.redirect('/funding/grant/reports/' + reportId + '/tasks/' + taskId + '/edit');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

router.post('/funding/grant/reports/edit/task/update', function (req, res) {
    const taskId = req.body.taskId;
    const reportId = req.body.reportId;
    
    if (reportId && taskId) {
        res.redirect(307, '/funding/grant/reports/' + reportId + '/tasks/' + taskId + '/update');
    } else {
        res.redirect('/funding/grant/reports');
    }
})

module.exports = router