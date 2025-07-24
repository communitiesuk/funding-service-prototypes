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

    // IMMEDIATELY clear any existing question data from session BEFORE storing context
    const fieldsToDelete = [
        'questionName', 'questionText', 'questionHint', 'questionType',
        // Text fields
        'textType', 'textPrefix', 'textSuffix', 'textAutocomplete', 'characterLimit', 'textareaRows',
        // Number fields
        'numberPrefix', 'numberSuffix', 'allowDecimals', 'minValue', 'maxValue', 'stepValue', 'numberInputWidth',
        // Selection fields
        'selectionType', 'selectionOptions', 'selectionLayout', 'selectionSize', 'includeOtherOption', 'otherOptionText',
        // Date fields
        'dateInputType', 'includePastDates', 'includeFutureDates', 'earliestDate', 'latestDate',
        // Email fields
        'emailAutocomplete', 'allowMultipleEmails',
        // Phone fields
        'phoneType', 'phoneAutocomplete',
        // Address fields
        'addressType', 'includeAddressLine3', 'requireCounty',
        // File fields
        'acceptedFileTypes', 'maxFileSize', 'allowMultipleFiles', 'maxFiles', 'enableDragDrop', 'requireFileDescription',
        // Add another fields
        'addAnotherMinItems', 'addAnotherMaxItems', 'addAnotherShowSummary', 'addAnotherButtonText'
    ];

    fieldsToDelete.forEach(field => {
        delete req.session.data[field];
    });

    // Store current context for form processing AFTER clearing old data
    req.session.data.currentTaskId = taskId;
    req.session.data.currentSectionId = sectionId;
    req.session.data.currentReportId = reportId;
    req.session.data.isUnassignedTask = unassigned;
    req.session.data.taskName = currentTask.taskName;

    res.render('funding/grant/reports/add/question/index');
})

// Question type selection
router.post('/funding/grant/reports/add/question/options', function (req, res) {
    // Clear any existing question configuration data first (except context data)
    const fieldsToDelete = [
        'questionName', 'questionText', 'questionHint',
        // Text fields
        'textType', 'textPrefix', 'textSuffix', 'textAutocomplete', 'characterLimit', 'textareaRows',
        // Number fields
        'numberPrefix', 'numberSuffix', 'allowDecimals', 'minValue', 'maxValue', 'stepValue', 'numberInputWidth',
        // Selection fields
        'selectionType', 'selectionOptions', 'selectionLayout', 'selectionSize', 'includeOtherOption', 'otherOptionText',
        // Date fields
        'dateInputType', 'includePastDates', 'includeFutureDates', 'earliestDate', 'latestDate',
        // Email fields
        'emailAutocomplete', 'allowMultipleEmails',
        // Phone fields
        'phoneType', 'phoneAutocomplete',
        // Address fields
        'addressType', 'includeAddressLine3', 'requireCounty',
        // File fields
        'acceptedFileTypes', 'maxFileSize', 'allowMultipleFiles', 'maxFiles', 'enableDragDrop', 'requireFileDescription',
        // Add another fields
        'addAnotherMinItems', 'addAnotherMaxItems', 'addAnotherShowSummary', 'addAnotherButtonText'
    ];

    fieldsToDelete.forEach(field => {
        delete req.session.data[field];
    });

    // Store the selected question type
    req.session.data.questionType = req.body.questionType;
    res.render('funding/grant/reports/add/question/options');
})

// Add question
router.post('/funding/grant/reports/add/question/another', function (req, res) {
    const taskId = req.session.data.currentTaskId;
    const sectionId = req.session.data.currentSectionId;
    const reportId = req.session.data.currentReportId;
    const isUnassignedTask = req.session.data.isUnassignedTask;
    const dataManager = new ReportsDataManager(req.session.data);

    // Build comprehensive question configuration
    const questionConfig = {
        questionName: req.body.questionName,
        questionText: req.body.questionText || req.body.questionName,
        questionHint: req.body.questionHint,
        questionType: req.session.data.questionType,
        isRequired: true
    };

    // Add type-specific configurations
    switch (req.session.data.questionType) {
        case 'text':
            questionConfig.textType = req.body.textType || 'single';
            questionConfig.textPrefix = req.body.textPrefix;
            questionConfig.textSuffix = req.body.textSuffix;
            questionConfig.humanQuestionType = "Text";
            questionConfig.textAutocomplete = req.body.textAutocomplete;
            // Multi-line text fields
            if (req.body.characterLimit) {
                questionConfig.characterLimit = parseInt(req.body.characterLimit);
            }
            questionConfig.textareaRows = req.body.textareaRows;
            break;

        case 'yesno':
            // No additional configuration needed - always Yes/No
            questionConfig.humanQuestionType = 'Yes or no';
            break;

        case 'number':
            questionConfig.humanQuestionType = 'Number';
            questionConfig.numberPrefix = req.body.numberPrefix;
            questionConfig.numberSuffix = req.body.numberSuffix;
            questionConfig.allowDecimals = req.body.allowDecimals === 'true';
            if (req.body.minValue) {
                questionConfig.minValue = parseFloat(req.body.minValue);
            }
            if (req.body.maxValue) {
                questionConfig.maxValue = parseFloat(req.body.maxValue);
            }
            if (req.body.stepValue) {
                questionConfig.stepValue = parseFloat(req.body.stepValue);
            }
            questionConfig.numberInputWidth = req.body.numberInputWidth;
            break;

        case 'selection':
            questionConfig.humanQuestionType = 'Single option';
            questionConfig.selectionType = req.body.selectionType || 'radio';
            questionConfig.selectionOptions = req.body.selectionOptions;
            questionConfig.selectionLayout = req.body.selectionLayout || 'stacked';
            questionConfig.selectionSize = req.body.selectionSize || 'regular';
            questionConfig.includeOtherOption = req.body.includeOtherOption === 'true';
            questionConfig.otherOptionText = req.body.otherOptionText;

            // Parse options into array (split by newlines, remove empty lines)
            if (questionConfig.selectionOptions) {
                questionConfig.selectionOptionsArray = questionConfig.selectionOptions
                    .split('\n')
                    .map(option => option.trim())
                    .filter(option => option.length > 0);
            }
            break;

        case 'date':
            questionConfig.humanQuestionType = 'Date';
            questionConfig.dateInputType = req.body.dateInputType || 'full';
            questionConfig.includePastDates = req.body.includePastDates === 'true';
            questionConfig.includeFutureDates = req.body.includeFutureDates === 'true';
            questionConfig.earliestDate = req.body.earliestDate;
            questionConfig.latestDate = req.body.latestDate;
            break;

        case 'email':
            questionConfig.humanQuestionType = 'Email address';
            questionConfig.emailAutocomplete = req.body.emailAutocomplete || 'email';
            questionConfig.allowMultipleEmails = req.body.allowMultipleEmails === 'true';
            break;

        case 'phone':
            questionConfig.humanQuestionType = 'Phone number';
            questionConfig.phoneType = req.body.phoneType || 'any';
            questionConfig.phoneAutocomplete = req.body.phoneAutocomplete || 'tel';
            break;

        case 'address':
            questionConfig.humanQuestionType = 'Address';
            questionConfig.addressType = req.body.addressType || 'uk';
            questionConfig.includeAddressLine3 = req.body.includeAddressLine3 === 'true';
            questionConfig.requireCounty = req.body.requireCounty === 'true';
            break;

        case 'file':
            questionConfig.humanQuestionType = 'File upload';
            questionConfig.acceptedFileTypes = req.body.acceptedFileTypes;
            if (req.body.maxFileSize) {
                questionConfig.maxFileSize = parseInt(req.body.maxFileSize);
            }
            questionConfig.allowMultipleFiles = req.body.allowMultipleFiles === 'true';
            questionConfig.enableDragDrop = req.body.enableDragDrop === 'true';
            questionConfig.requireFileDescription = req.body.requireFileDescription === 'true';
            if (req.body.maxFiles) {
                questionConfig.maxFiles = parseInt(req.body.maxFiles);
            }
            break;

        case 'addanother':
            // Advanced options
            if (req.body.addAnotherMinItems) {
                questionConfig.addAnotherMinItems = parseInt(req.body.addAnotherMinItems);
            }
            if (req.body.addAnotherMaxItems) {
                questionConfig.addAnotherMaxItems = parseInt(req.body.addAnotherMaxItems);
            }

            questionConfig.addAnotherShowSummary = req.body.addAnotherShowSummary === 'true';
            questionConfig.addAnotherButtonText = req.body.addAnotherButtonText;
            break;
    }

    // Validate question configuration
    const validationErrors = validateQuestionConfig(questionConfig);
    if (validationErrors.length > 0) {
        // Store errors in session and redirect back to form
        req.session.data.validationErrors = validationErrors;
        return res.render('funding/grant/reports/add/question/options');
    }

    // Add the question to the task
    const newQuestion = dataManager.addQuestion(reportId, taskId, questionConfig, sectionId);

    // Clear form data from session
    const fieldsToDelete = [
        'questionName', 'questionText', 'questionHint', 'questionType',
        // Text fields
        'textType', 'textPrefix', 'textSuffix', 'textAutocomplete', 'characterLimit', 'textareaRows',
        // Number fields
        'numberPrefix', 'numberSuffix', 'allowDecimals', 'minValue', 'maxValue', 'stepValue', 'numberInputWidth',
        // Selection fields
        'selectionType', 'selectionOptions', 'selectionLayout', 'selectionSize', 'includeOtherOption', 'otherOptionText',
        // Date fields
        'dateInputType', 'includePastDates', 'includeFutureDates', 'earliestDate', 'latestDate',
        // Email fields
        'emailAutocomplete', 'allowMultipleEmails',
        // Phone fields
        'phoneType', 'phoneAutocomplete',
        // Address fields
        'addressType', 'includeAddressLine3', 'requireCounty',
        // File fields
        'acceptedFileTypes', 'maxFileSize', 'allowMultipleFiles', 'maxFiles', 'enableDragDrop', 'requireFileDescription',
        // Add another fields
        'addAnotherMinItems', 'addAnotherMaxItems', 'addAnotherShowSummary', 'addAnotherButtonText',
        // Context fields
        'isUnassignedTask', 'validationErrors'
    ];

    fieldsToDelete.forEach(field => {
        delete req.session.data[field];
    });

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

// Edit question page
router.get('/funding/grant/reports/edit/question/', function (req, res) {
    const questionId = req.query.questionId;
    const taskId = req.query.taskId;
    const sectionId = req.query.sectionId;
    const reportId = req.query.reportId;
    const unassigned = req.query.unassigned === 'true';
    const dataManager = new ReportsDataManager(req.session.data);

    if (!questionId || !taskId || !reportId) {
        return res.redirect('/funding/grant/reports/');
    }

    // Get fresh data
    const currentReport = dataManager.getReport(reportId);
    const currentTask = dataManager.getTask(reportId, taskId, sectionId);
    const currentQuestion = dataManager.getQuestion(reportId, taskId, questionId, sectionId);

    if (!currentReport || !currentTask || !currentQuestion) {
        // Redirect back to questions page if any data is missing
        let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId;
        if (unassigned) {
            redirectUrl += '&unassigned=true';
        } else {
            redirectUrl += '&sectionId=' + sectionId;
        }
        return res.redirect(redirectUrl);
    }

    // Get current section name if task is in a section
    let currentSectionName = null;
    if (sectionId && !unassigned) {
        const currentSection = dataManager.getSection(reportId, sectionId);
        currentSectionName = currentSection?.sectionName;
    }

    // Clear any existing question configuration data first
    const fieldsToDelete = [
        'questionName', 'questionText', 'questionHint', 'questionType',
        // Text fields
        'textType', 'textPrefix', 'textSuffix', 'textAutocomplete', 'characterLimit', 'textareaRows',
        // Number fields
        'numberPrefix', 'numberSuffix', 'allowDecimals', 'minValue', 'maxValue', 'stepValue', 'numberInputWidth',
        // Selection fields
        'selectionType', 'selectionOptions', 'selectionLayout', 'selectionSize', 'includeOtherOption', 'otherOptionText',
        // Date fields
        'dateInputType', 'includePastDates', 'includeFutureDates', 'earliestDate', 'latestDate',
        // Email fields
        'emailAutocomplete', 'allowMultipleEmails',
        // Phone fields
        'phoneType', 'phoneAutocomplete',
        // Address fields
        'addressType', 'includeAddressLine3', 'requireCounty',
        // File fields
        'acceptedFileTypes', 'maxFileSize', 'allowMultipleFiles', 'maxFiles', 'enableDragDrop', 'requireFileDescription',
        // Add another fields
        'addAnotherMinItems', 'addAnotherMaxItems', 'addAnotherShowSummary', 'addAnotherButtonText'
    ];

    fieldsToDelete.forEach(field => {
        delete req.session.data[field];
    });

    // Store current question data in session for form population
    req.session.data.questionName = currentQuestion.questionName;
    req.session.data.questionText = currentQuestion.questionText;
    req.session.data.questionHint = currentQuestion.questionHint;
    req.session.data.questionType = currentQuestion.questionType;
    req.session.data.isRequired = currentQuestion.isRequired;

    // Store ALL type-specific configuration fields
    switch (currentQuestion.questionType) {
        case 'text':
            req.session.data.textType = currentQuestion.textType;
            req.session.data.textPrefix = currentQuestion.textPrefix;
            req.session.data.textSuffix = currentQuestion.textSuffix;
            req.session.data.inputWidth = currentQuestion.inputWidth;
            req.session.data.textAutocomplete = currentQuestion.textAutocomplete;
            req.session.data.characterLimit = currentQuestion.characterLimit;
            req.session.data.textareaRows = currentQuestion.textareaRows;
            break;
        case 'yesno':
            // No session data needed - always Yes/No
            break;
        case 'number':
            req.session.data.numberPrefix = currentQuestion.numberPrefix;
            req.session.data.numberSuffix = currentQuestion.numberSuffix;
            req.session.data.allowDecimals = currentQuestion.allowDecimals;
            req.session.data.minValue = currentQuestion.minValue;
            req.session.data.maxValue = currentQuestion.maxValue;
            req.session.data.stepValue = currentQuestion.stepValue;
            req.session.data.numberInputWidth = currentQuestion.numberInputWidth;
            break;
        case 'selection':
            req.session.data.selectionType = currentQuestion.selectionType;
            req.session.data.selectionOptions = currentQuestion.selectionOptions;
            req.session.data.selectionLayout = currentQuestion.selectionLayout;
            req.session.data.selectionSize = currentQuestion.selectionSize;
            req.session.data.includeOtherOption = currentQuestion.includeOtherOption;
            req.session.data.otherOptionText = currentQuestion.otherOptionText;
            break;
        case 'date':
            req.session.data.dateInputType = currentQuestion.dateInputType;
            req.session.data.includePastDates = currentQuestion.includePastDates;
            req.session.data.includeFutureDates = currentQuestion.includeFutureDates;
            req.session.data.earliestDate = currentQuestion.earliestDate;
            req.session.data.latestDate = currentQuestion.latestDate;
            break;
        case 'email':
            req.session.data.emailAutocomplete = currentQuestion.emailAutocomplete;
            req.session.data.allowMultipleEmails = currentQuestion.allowMultipleEmails;
            break;
        case 'phone':
            req.session.data.phoneType = currentQuestion.phoneType;
            req.session.data.phoneAutocomplete = currentQuestion.phoneAutocomplete;
            break;
        case 'address':
            req.session.data.addressType = currentQuestion.addressType;
            req.session.data.includeAddressLine3 = currentQuestion.includeAddressLine3;
            req.session.data.requireCounty = currentQuestion.requireCounty;
            break;
        case 'file':
            req.session.data.acceptedFileTypes = currentQuestion.acceptedFileTypes;
            req.session.data.maxFileSize = currentQuestion.maxFileSize;
            req.session.data.allowMultipleFiles = currentQuestion.allowMultipleFiles;
            req.session.data.maxFiles = currentQuestion.maxFiles;
            req.session.data.enableDragDrop = currentQuestion.enableDragDrop;
            req.session.data.requireFileDescription = currentQuestion.requireFileDescription;
            break;
        case 'addanother':
            req.session.data.addAnotherMinItems = currentQuestion.addAnotherMinItems;
            req.session.data.addAnotherMaxItems = currentQuestion.addAnotherMaxItems;
            req.session.data.addAnotherShowSummary = currentQuestion.addAnotherShowSummary;
            req.session.data.addAnotherButtonText = currentQuestion.addAnotherButtonText;
            break;
    }

    const templateData = {
        currentQuestionId: questionId,
        currentTaskId: taskId,
        currentSectionId: sectionId,
        currentReportId: reportId,
        currentQuestionText: currentQuestion.questionText,
        currentQuestionName: currentQuestion.questionName,
        currentQuestionType: currentQuestion.questionType,
        taskName: currentTask.taskName,
        reportName: currentReport.reportName,
        sectionName: currentSectionName,
        isUnassignedTask: unassigned,
        grantName: req.session.data.grantName || 'Sample Grant Name',
        isEdit: true,

        // Pass all question data directly to template
        questionData: {
            questionName: currentQuestion.questionName,
            questionText: currentQuestion.questionText,
            questionHint: currentQuestion.questionHint,
            questionType: currentQuestion.questionType,
            isRequired: currentQuestion.isRequired,

            // Text fields
            textType: currentQuestion.textType,
            textPrefix: currentQuestion.textPrefix,
            textSuffix: currentQuestion.textSuffix,
            inputWidth: currentQuestion.inputWidth,
            textAutocomplete: currentQuestion.textAutocomplete,
            characterLimit: currentQuestion.characterLimit,
            textareaRows: currentQuestion.textareaRows,

            // Yes/No fields (no additional data needed)

            // Number fields
            numberPrefix: currentQuestion.numberPrefix,
            numberSuffix: currentQuestion.numberSuffix,
            allowDecimals: currentQuestion.allowDecimals,
            minValue: currentQuestion.minValue,
            maxValue: currentQuestion.maxValue,
            stepValue: currentQuestion.stepValue,
            numberInputWidth: currentQuestion.numberInputWidth,

            // Selection fields
            selectionType: currentQuestion.selectionType,
            selectionOptions: currentQuestion.selectionOptions,
            selectionLayout: currentQuestion.selectionLayout,
            selectionSize: currentQuestion.selectionSize,
            includeOtherOption: currentQuestion.includeOtherOption,
            otherOptionText: currentQuestion.otherOptionText,

            // Date fields
            dateInputType: currentQuestion.dateInputType,
            includePastDates: currentQuestion.includePastDates,
            includeFutureDates: currentQuestion.includeFutureDates,
            earliestDate: currentQuestion.earliestDate,
            latestDate: currentQuestion.latestDate,

            // Email fields
            emailAutocomplete: currentQuestion.emailAutocomplete,
            allowMultipleEmails: currentQuestion.allowMultipleEmails,

            // Phone fields
            phoneType: currentQuestion.phoneType,
            phoneAutocomplete: currentQuestion.phoneAutocomplete,

            // Address fields
            addressType: currentQuestion.addressType,
            includeAddressLine3: currentQuestion.includeAddressLine3,
            requireCounty: currentQuestion.requireCounty,

            // File fields
            acceptedFileTypes: currentQuestion.acceptedFileTypes,
            maxFileSize: currentQuestion.maxFileSize,
            allowMultipleFiles: currentQuestion.allowMultipleFiles,
            maxFiles: currentQuestion.maxFiles,
            enableDragDrop: currentQuestion.enableDragDrop,
            requireFileDescription: currentQuestion.requireFileDescription,

            // Add another fields
            addAnotherMinItems: currentQuestion.addAnotherMinItems,
            addAnotherMaxItems: currentQuestion.addAnotherMaxItems,
            addAnotherShowSummary: currentQuestion.addAnotherShowSummary,
            addAnotherButtonText: currentQuestion.addAnotherButtonText
        }
    };

    // Add confirmation states if present in query
    if (req.query.questionDeleteConfirm === 'true') {
        templateData.questionDeleteConfirm = true;
        templateData.deleteQuestionId = req.query.deleteQuestionId;
        templateData.deleteQuestionName = req.query.deleteQuestionName;
    }

    res.render('funding/grant/reports/edit/question/index', templateData);
})

// Update question
router.post('/funding/grant/reports/edit/question/update', function (req, res) {
    const questionId = req.body.questionId;
    const taskId = req.body.taskId;
    const sectionId = req.body.sectionId;
    const reportId = req.body.reportId;
    const isUnassignedTask = req.body.isUnassignedTask === 'true';
    const dataManager = new ReportsDataManager(req.session.data);

    // Build comprehensive updated question configuration
    const questionConfig = {
        questionName: req.body.questionName,
        questionText: req.body.questionText || req.body.questionName,
        questionHint: req.body.questionHint,
        questionType: req.body.questionType,
        isRequired: true
    };

    // Add type-specific configurations - SAME AS ADD ROUTE
    switch (req.body.questionType) {
        case 'text':
            questionConfig.textType = req.body.textType || 'single';
            questionConfig.textPrefix = req.body.textPrefix;
            questionConfig.textSuffix = req.body.textSuffix;
            questionConfig.textAutocomplete = req.body.textAutocomplete;
            if (req.body.characterLimit) {
                questionConfig.characterLimit = parseInt(req.body.characterLimit);
            }
            questionConfig.textareaRows = req.body.textareaRows;
            break;

        case 'yesno':
            break;

        case 'number':
            questionConfig.numberPrefix = req.body.numberPrefix;
            questionConfig.numberSuffix = req.body.numberSuffix;
            questionConfig.allowDecimals = req.body.allowDecimals === 'true';
            if (req.body.minValue) {
                questionConfig.minValue = parseFloat(req.body.minValue);
            }
            if (req.body.maxValue) {
                questionConfig.maxValue = parseFloat(req.body.maxValue);
            }
            if (req.body.stepValue) {
                questionConfig.stepValue = parseFloat(req.body.stepValue);
            }
            questionConfig.numberInputWidth = req.body.numberInputWidth;
            break;

        case 'selection':
            questionConfig.selectionType = req.body.selectionType || 'radio';
            questionConfig.selectionOptions = req.body.selectionOptions;
            questionConfig.selectionLayout = req.body.selectionLayout || 'stacked';
            questionConfig.selectionSize = req.body.selectionSize || 'regular';
            questionConfig.includeOtherOption = req.body.includeOtherOption === 'true';
            questionConfig.otherOptionText = req.body.otherOptionText;
            if (questionConfig.selectionOptions) {
                questionConfig.selectionOptionsArray = questionConfig.selectionOptions
                    .split('\n')
                    .map(option => option.trim())
                    .filter(option => option.length > 0);
            }
            break;

        case 'date':
            questionConfig.dateInputType = req.body.dateInputType || 'full';
            questionConfig.includePastDates = req.body.includePastDates === 'true';
            questionConfig.includeFutureDates = req.body.includeFutureDates === 'true';
            questionConfig.earliestDate = req.body.earliestDate;
            questionConfig.latestDate = req.body.latestDate;
            break;

        case 'email':
            questionConfig.emailAutocomplete = req.body.emailAutocomplete || 'email';
            questionConfig.allowMultipleEmails = req.body.allowMultipleEmails === 'true';
            break;

        case 'phone':
            questionConfig.phoneType = req.body.phoneType || 'any';
            questionConfig.phoneAutocomplete = req.body.phoneAutocomplete || 'tel';
            break;

        case 'address':
            questionConfig.addressType = req.body.addressType || 'uk';
            questionConfig.includeAddressLine3 = req.body.includeAddressLine3 === 'true';
            questionConfig.requireCounty = req.body.requireCounty === 'true';
            break;

        case 'file':
            questionConfig.acceptedFileTypes = req.body.acceptedFileTypes;
            if (req.body.maxFileSize) {
                questionConfig.maxFileSize = parseInt(req.body.maxFileSize);
            }
            questionConfig.allowMultipleFiles = req.body.allowMultipleFiles === 'true';
            questionConfig.enableDragDrop = req.body.enableDragDrop === 'true';
            questionConfig.requireFileDescription = req.body.requireFileDescription === 'true';
            if (req.body.maxFiles) {
                questionConfig.maxFiles = parseInt(req.body.maxFiles);
            }
            break;

        case 'addanother':
            if (req.body.addAnotherMinItems) {
                questionConfig.addAnotherMinItems = parseInt(req.body.addAnotherMinItems);
            }
            if (req.body.addAnotherMaxItems) {
                questionConfig.addAnotherMaxItems = parseInt(req.body.addAnotherMaxItems);
            }
            questionConfig.addAnotherShowSummary = req.body.addAnotherShowSummary === 'true';
            questionConfig.addAnotherButtonText = req.body.addAnotherButtonText;
            break;
    }

    // Update the question
    dataManager.updateQuestion(reportId, taskId, questionId, questionConfig, sectionId);

    // Build redirect URL back to questions page
    let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId;
    if (isUnassignedTask) {
        redirectUrl += '&unassigned=true';
    } else {
        redirectUrl += '&sectionId=' + sectionId;
    }

    res.redirect(redirectUrl);
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

// Enhanced validation function for question configuration
function validateQuestionConfig(questionConfig) {
    const errors = [];

    // Basic validation
    if (!questionConfig.questionName || questionConfig.questionName.trim().length === 0) {
        errors.push('Question text is required');
    }

    // Type-specific validation
    switch (questionConfig.questionType) {
        case 'selection':
            if (!questionConfig.selectionOptions || questionConfig.selectionOptions.trim().length === 0) {
                errors.push('Selection options are required');
            } else {
                const optionsArray = questionConfig.selectionOptions
                    .split('\n')
                    .map(option => option.trim())
                    .filter(option => option.length > 0);

                if (optionsArray.length < 2) {
                    errors.push('At least 2 selection options are required');
                }
            }
            break;

        case 'date':
            if (questionConfig.earliestDate && questionConfig.latestDate) {
                const dateFormat = /^\d{2}\/\d{2}\/\d{4}$/;
                if (questionConfig.earliestDate && !dateFormat.test(questionConfig.earliestDate)) {
                    errors.push('Earliest date must be in DD/MM/YYYY format');
                }
                if (questionConfig.latestDate && !dateFormat.test(questionConfig.latestDate)) {
                    errors.push('Latest date must be in DD/MM/YYYY format');
                }
            }
            break;

        case 'text':
            if (questionConfig.textType === 'multi' && (questionConfig.textPrefix || questionConfig.textSuffix)) {
                errors.push('Prefix and suffix are not supported with multi-line text (textarea)');
            }
            break;

        case 'number':
            if (questionConfig.minValue !== undefined && questionConfig.maxValue !== undefined) {
                if (questionConfig.minValue >= questionConfig.maxValue) {
                    errors.push('Minimum value must be less than maximum value');
                }
            }
            if (questionConfig.stepValue !== undefined && questionConfig.stepValue <= 0) {
                errors.push('Step value must be greater than 0');
            }
            break;

        case 'file':
            if (questionConfig.maxFileSize && questionConfig.maxFileSize < 1) {
                errors.push('Maximum file size must be at least 1MB');
            }
            if (questionConfig.maxFiles && questionConfig.maxFiles < 1) {
                errors.push('Maximum number of files must be at least 1');
            }
            if (questionConfig.maxFileSize && questionConfig.maxFileSize > 100) {
                errors.push('Maximum file size cannot exceed 100MB');
            }
            break;

        case 'addanother':
            if (questionConfig.addAnotherMinItems !== undefined && questionConfig.addAnotherMaxItems !== undefined) {
                if (questionConfig.addAnotherMinItems > questionConfig.addAnotherMaxItems) {
                    errors.push('Minimum number cannot be greater than maximum number');
                }
            }

            if (questionConfig.addAnotherMaxItems !== undefined && questionConfig.addAnotherMaxItems < 1) {
                errors.push('Maximum number must be at least 1');
            }
            break;
    }

    return errors;
}

module.exports = router
