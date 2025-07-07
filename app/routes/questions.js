const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const ReportsDataManager = require('../data/ReportsDataManager')

// Questions page
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

    // Clear any stale confirmation data from session first
    delete req.session.data.questionDeleteConfirm;
    delete req.session.data.deleteQuestionId;
    delete req.session.data.deleteQuestionName;
    delete req.session.data.taskDeleteConfirm;
    delete req.session.data.deleteTaskId;
    delete req.session.data.deleteTaskName;

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

// Add question page
router.get('/funding/grant/reports/add/question/', function (req, res) {
    const taskId = req.query.taskId;
    const sectionId = req.query.sectionId;
    const reportId = req.query.reportId;
    const unassigned = req.query.unassigned === 'true';
    const dataManager = new ReportsDataManager(req.session.data);

    if (!taskId || !reportId) {
        return res.redirect('/funding/grant/reports/');
    }

    // Get fresh task data - handle undefined sectionId properly
    const actualSectionId = sectionId && sectionId !== 'undefined' ? sectionId : null;
    const currentTask = dataManager.getTask(reportId, taskId, actualSectionId);
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

// Add question
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

// Move question up
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

// Move question down
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

// Delete question
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

module.exports = router