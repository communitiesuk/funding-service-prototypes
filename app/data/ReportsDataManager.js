class ReportsDataManager {
    constructor(sessionData) {
        this.data = sessionData;
        
        // Initialize reports array if it doesn't exist
        if (!this.data.reports) {
            this.data.reports = [];
        }
    }

    // Helper function to generate unique IDs
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // REPORT METHODS
    
    // Get all reports
    getReports() {
        return this.data.reports || [];
    }

    // Get a specific report by ID
    getReport(reportId) {
        if (!reportId || !this.data.reports) return null;
        return this.data.reports.find(report => report.id === reportId);
    }

    // Add a new report
    addReport(reportData) {
        const newReport = {
            id: this.generateId(),
            reportName: reportData.reportName || 'Untitled Report',
            createdBy: 'Current User', // You might want to get this from session
            createdDate: new Date().toLocaleDateString('en-GB'),
            updatedBy: 'Current User',
            lastUpdated: new Date().toLocaleDateString('en-GB'),
            sections: [],
            unassignedTasks: []
        };

        this.data.reports.push(newReport);
        return newReport;
    }

    // Update a report
    updateReport(reportId, updates) {
        const report = this.getReport(reportId);
        if (!report) return false;

        Object.assign(report, updates);
        report.updatedBy = 'Current User';
        report.lastUpdated = new Date().toLocaleDateString('en-GB');
        return true;
    }

    // Delete a report
    deleteReport(reportId) {
        if (!this.data.reports) return false;
        
        const reportIndex = this.data.reports.findIndex(report => report.id === reportId);
        if (reportIndex === -1) return false;

        this.data.reports.splice(reportIndex, 1);
        return true;
    }

    // SECTION METHODS

    // Get a specific section by ID
    getSection(reportId, sectionId) {
        const report = this.getReport(reportId);
        if (!report || !report.sections) return null;
        return report.sections.find(section => section.id === sectionId);
    }

    // Add a new section to a report
    addSection(reportId, sectionData) {
        const report = this.getReport(reportId);
        if (!report) return null;

        if (!report.sections) {
            report.sections = [];
        }

        const newSection = {
            id: this.generateId(),
            sectionName: sectionData.sectionName || 'Untitled Section',
            tasks: []
        };

        report.sections.push(newSection);
        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return newSection;
    }

    // Update a section
    updateSection(reportId, sectionId, updates) {
        const section = this.getSection(reportId, sectionId);
        if (!section) return false;

        Object.assign(section, updates);
        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return true;
    }

    // Delete a section
    deleteSection(reportId, sectionId) {
        const report = this.getReport(reportId);
        if (!report || !report.sections) return false;

        const sectionIndex = report.sections.findIndex(section => section.id === sectionId);
        if (sectionIndex === -1) return false;

        // Move tasks from deleted section to unassigned tasks
        const deletedSection = report.sections[sectionIndex];
        if (deletedSection.tasks && deletedSection.tasks.length > 0) {
            if (!report.unassignedTasks) {
                report.unassignedTasks = [];
            }
            report.unassignedTasks.push(...deletedSection.tasks);
        }

        report.sections.splice(sectionIndex, 1);
        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return true;
    }

    // Move section up
    moveSectionUp(reportId, sectionId) {
        const report = this.getReport(reportId);
        if (!report || !report.sections) return false;

        const sectionIndex = report.sections.findIndex(section => section.id === sectionId);
        if (sectionIndex <= 0) return false; // Already at top or not found

        // Swap with previous section
        [report.sections[sectionIndex - 1], report.sections[sectionIndex]] = 
        [report.sections[sectionIndex], report.sections[sectionIndex - 1]];

        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return true;
    }

    // Move section down
    moveSectionDown(reportId, sectionId) {
        const report = this.getReport(reportId);
        if (!report || !report.sections) return false;

        const sectionIndex = report.sections.findIndex(section => section.id === sectionId);
        if (sectionIndex === -1 || sectionIndex >= report.sections.length - 1) return false; // Not found or already at bottom

        // Swap with next section
        [report.sections[sectionIndex], report.sections[sectionIndex + 1]] = 
        [report.sections[sectionIndex + 1], report.sections[sectionIndex]];

        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return true;
    }

    // TASK METHODS

    // Get a specific task by ID
    getTask(reportId, taskId, sectionId = null) {
        const report = this.getReport(reportId);
        if (!report) return null;

        let tasks = [];
        
        if (sectionId) {
            // Look in specific section
            const section = this.getSection(reportId, sectionId);
            if (section && section.tasks) {
                tasks = section.tasks;
            }
        } else {
            // Look in unassigned tasks
            if (report.unassignedTasks) {
                tasks = report.unassignedTasks;
            }
        }

        return tasks.find(task => task.id === taskId);
    }

    // Add a new task
    addTask(reportId, taskData, sectionId = null) {
        const report = this.getReport(reportId);
        if (!report) return null;

        const newTask = {
            id: this.generateId(),
            taskName: taskData.taskName || 'Untitled Task',
            questions: []
        };

        if (sectionId) {
            // Add to specific section
            const section = this.getSection(reportId, sectionId);
            if (!section) return null;
            
            if (!section.tasks) {
                section.tasks = [];
            }
            section.tasks.push(newTask);
        } else {
            // Add to unassigned tasks
            if (!report.unassignedTasks) {
                report.unassignedTasks = [];
            }
            report.unassignedTasks.push(newTask);
        }

        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return newTask;
    }

    // Update a task
    updateTask(reportId, taskId, updates, sectionId = null) {
        const task = this.getTask(reportId, taskId, sectionId);
        if (!task) return false;

        Object.assign(task, updates);
        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return true;
    }

    // Delete a task
    deleteTask(reportId, taskId, sectionId = null) {
        const report = this.getReport(reportId);
        if (!report) return false;

        let tasks = [];
        let taskArray = null;

        if (sectionId) {
            // Delete from specific section
            const section = this.getSection(reportId, sectionId);
            if (section && section.tasks) {
                taskArray = section.tasks;
            }
        } else {
            // Delete from unassigned tasks
            if (report.unassignedTasks) {
                taskArray = report.unassignedTasks;
            }
        }

        if (!taskArray) return false;

        const taskIndex = taskArray.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return false;

        taskArray.splice(taskIndex, 1);
        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return true;
    }

    // Move task up
    moveTaskUp(reportId, taskId, sectionId = null) {
        const report = this.getReport(reportId);
        if (!report) return false;

        let taskArray = null;

        if (sectionId) {
            const section = this.getSection(reportId, sectionId);
            if (section && section.tasks) {
                taskArray = section.tasks;
            }
        } else {
            if (report.unassignedTasks) {
                taskArray = report.unassignedTasks;
            }
        }

        if (!taskArray) return false;

        const taskIndex = taskArray.findIndex(task => task.id === taskId);
        if (taskIndex <= 0) return false; // Already at top or not found

        // Swap with previous task
        [taskArray[taskIndex - 1], taskArray[taskIndex]] = 
        [taskArray[taskIndex], taskArray[taskIndex - 1]];

        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return true;
    }

    // Move task down
    moveTaskDown(reportId, taskId, sectionId = null) {
        const report = this.getReport(reportId);
        if (!report) return false;

        let taskArray = null;

        if (sectionId) {
            const section = this.getSection(reportId, sectionId);
            if (section && section.tasks) {
                taskArray = section.tasks;
            }
        } else {
            if (report.unassignedTasks) {
                taskArray = report.unassignedTasks;
            }
        }

        if (!taskArray) return false;

        const taskIndex = taskArray.findIndex(task => task.id === taskId);
        if (taskIndex === -1 || taskIndex >= taskArray.length - 1) return false; // Not found or already at bottom

        // Swap with next task
        [taskArray[taskIndex], taskArray[taskIndex + 1]] = 
        [taskArray[taskIndex + 1], taskArray[taskIndex]];

        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return true;
    }

    // Move task to a different section
    moveTaskToSection(reportId, taskId, fromSectionId, toSectionChoice, newSectionName = null) {
        const report = this.getReport(reportId);
        if (!report) return false;

        // Find and remove task from current location
        let task = null;
        let sourceArray = null;

        if (fromSectionId) {
            // Task is currently in a section
            const fromSection = this.getSection(reportId, fromSectionId);
            if (fromSection && fromSection.tasks) {
                sourceArray = fromSection.tasks;
            }
        } else {
            // Task is currently unassigned
            if (report.unassignedTasks) {
                sourceArray = report.unassignedTasks;
            }
        }

        if (!sourceArray) return false;

        const taskIndex = sourceArray.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return false;

        task = sourceArray[taskIndex];
        sourceArray.splice(taskIndex, 1);

        // Add task to new location
        if (toSectionChoice === 'unassigned') {
            // Move to unassigned tasks
            if (!report.unassignedTasks) {
                report.unassignedTasks = [];
            }
            report.unassignedTasks.push(task);
        } else if (toSectionChoice === 'new' && newSectionName) {
            // Create new section and add task there
            const newSection = this.addSection(reportId, { sectionName: newSectionName });
            if (newSection) {
                newSection.tasks.push(task);
            }
        } else {
            // Move to existing section
            const toSection = this.getSection(reportId, toSectionChoice);
            if (toSection) {
                if (!toSection.tasks) {
                    toSection.tasks = [];
                }
                toSection.tasks.push(task);
            } else {
                // Failed to find target section, put back in source
                sourceArray.splice(taskIndex, 0, task);
                return false;
            }
        }

        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return true;
    }

    // QUESTION METHODS

    // Get a specific question by ID
    getQuestion(reportId, taskId, questionId, sectionId = null) {
        const task = this.getTask(reportId, taskId, sectionId);
        if (!task || !task.questions) return null;
        
        return task.questions.find(question => question.id === questionId);
    }

    // Add a new question to a task - ENHANCED TO STORE ALL CONFIGURATION
    addQuestion(reportId, taskId, questionData, sectionId = null) {
        const task = this.getTask(reportId, taskId, sectionId);
        if (!task) return null;

        if (!task.questions) {
            task.questions = [];
        }

        // Create question with ALL the provided configuration data
        const newQuestion = {
            id: this.generateId(),
            // Core fields
            questionName: questionData.questionName || 'Untitled Question',
            questionText: questionData.questionText || questionData.questionName,
            questionHint: questionData.questionHint,
            questionType: questionData.questionType || 'text',
            isRequired: questionData.isRequired || false,
            
            // Text type fields
            textType: questionData.textType,
            characterLimit: questionData.characterLimit,
            inputWidth: questionData.inputWidth,
            textAutocomplete: questionData.textAutocomplete,
            inputMode: questionData.inputMode,
            
            // Number type fields
            numberPrefix: questionData.numberPrefix,
            numberSuffix: questionData.numberSuffix,
            allowDecimals: questionData.allowDecimals,
            minValue: questionData.minValue,
            maxValue: questionData.maxValue,
            stepValue: questionData.stepValue,
            numberInputWidth: questionData.numberInputWidth,
            
            // Selection type fields
            selectionType: questionData.selectionType,
            selectionOptions: questionData.selectionOptions,
            selectionOptionsArray: questionData.selectionOptionsArray,
            selectionLayout: questionData.selectionLayout,
            selectionSize: questionData.selectionSize,
            includeOtherOption: questionData.includeOtherOption,
            
            // Date type fields
            dateInputType: questionData.dateInputType,
            includePastDates: questionData.includePastDates,
            includeFutureDates: questionData.includeFutureDates,
            earliestDate: questionData.earliestDate,
            latestDate: questionData.latestDate,
            
            // Email type fields
            emailAutocomplete: questionData.emailAutocomplete,
            allowMultipleEmails: questionData.allowMultipleEmails,
            
            // Phone type fields
            phoneType: questionData.phoneType,
            phoneAutocomplete: questionData.phoneAutocomplete,
            
            // Address type fields
            addressType: questionData.addressType,
            includeAddressLine3: questionData.includeAddressLine3,
            requireCounty: questionData.requireCounty,
            
            // File type fields
            acceptedFileTypes: questionData.acceptedFileTypes,
            maxFileSize: questionData.maxFileSize,
            allowMultipleFiles: questionData.allowMultipleFiles,
            maxFiles: questionData.maxFiles,
            enableDragDrop: questionData.enableDragDrop,
            requireFileDescription: questionData.requireFileDescription
        };

        task.questions.push(newQuestion);
        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return newQuestion;
    }

    // Update a question - ENHANCED TO UPDATE ALL CONFIGURATION
    updateQuestion(reportId, taskId, questionId, updates, sectionId = null) {
        const task = this.getTask(reportId, taskId, sectionId);
        if (!task || !task.questions) return false;
        
        const questionIndex = task.questions.findIndex(question => question.id === questionId);
        if (questionIndex === -1) return false;
        
        // Update the question with ALL new data
        Object.assign(task.questions[questionIndex], updates);
        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return true;
    }

    // Delete a question
    deleteQuestion(reportId, taskId, questionId, sectionId = null) {
        const task = this.getTask(reportId, taskId, sectionId);
        if (!task || !task.questions) return false;

        const questionIndex = task.questions.findIndex(question => question.id === questionId);
        if (questionIndex === -1) return false;

        task.questions.splice(questionIndex, 1);
        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return true;
    }

    // Move question up
    moveQuestionUp(reportId, taskId, questionId, sectionId = null) {
        const task = this.getTask(reportId, taskId, sectionId);
        if (!task || !task.questions) return false;

        const questionIndex = task.questions.findIndex(question => question.id === questionId);
        if (questionIndex <= 0) return false; // Already at top or not found

        // Swap with previous question
        [task.questions[questionIndex - 1], task.questions[questionIndex]] = 
        [task.questions[questionIndex], task.questions[questionIndex - 1]];

        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return true;
    }

    // Move question down
    moveQuestionDown(reportId, taskId, questionId, sectionId = null) {
        const task = this.getTask(reportId, taskId, sectionId);
        if (!task || !task.questions) return false;

        const questionIndex = task.questions.findIndex(question => question.id === questionId);
        if (questionIndex === -1 || questionIndex >= task.questions.length - 1) return false; // Not found or already at bottom

        // Swap with next question
        [task.questions[questionIndex], task.questions[questionIndex + 1]] = 
        [task.questions[questionIndex + 1], task.questions[questionIndex]];

        this.updateReport(reportId, {}); // Update lastUpdated timestamp
        return true;
    }

    // TEMPLATE DATA BUILDER

    // Build template data for rendering pages
    buildTemplateData(reportId, options = {}) {
        const report = this.getReport(reportId);
        if (!report) return null;

        const templateData = {
            currentReportId: reportId,
            reportName: report.reportName,
            grantName: this.data.grantName || 'Sample Grant Name'
        };

        // Include sections if requested
        if (options.includeSections) {
            templateData.currentSections = report.sections || [];
            templateData.currentUnassignedTasks = report.unassignedTasks || [];
        }

        // Include specific section data if sectionId provided
        if (options.sectionId) {
            const section = this.getSection(reportId, options.sectionId);
            if (section) {
                templateData.currentSectionId = options.sectionId;
                templateData.sectionName = section.sectionName;
                templateData.currentTasks = section.tasks || [];
            }
        }

        // Include specific task data if taskId provided
        if (options.taskId) {
            const task = this.getTask(reportId, options.taskId, options.sectionId);
            if (task) {
                templateData.currentTaskId = options.taskId;
                templateData.taskName = task.taskName;
                templateData.currentQuestions = task.questions || [];
            }
        }

        return templateData;
    }
}

module.exports = ReportsDataManager;