// app/data/ReportsDataManager.js
// Data management for GOV.UK prototype kit

class ReportsDataManager {
    constructor(sessionData) {
        this.data = sessionData;
        
        // Ensure reports array exists
        if (!this.data.reports) {
            this.data.reports = [];
        }
    }

    // === GETTERS ===
    
    getReport(reportId) {
        if (!reportId) return null;
        return this.data.reports.find(report => report.id === reportId);
    }

    getSection(reportId, sectionId) {
        if (!sectionId) return null;
        const report = this.getReport(reportId);
        return report?.sections?.find(section => section.id === sectionId);
    }

    getTask(reportId, taskId, sectionId = null) {
        if (!taskId) return null;
        const report = this.getReport(reportId);
        if (!report) return null;

        if (sectionId) {
            // Task in a section
            const section = report.sections?.find(s => s.id === sectionId);
            return section?.tasks?.find(task => task.id === taskId);
        } else {
            // Unassigned task
            return report.unassignedTasks?.find(task => task.id === taskId);
        }
    }

    getQuestion(reportId, taskId, questionId, sectionId = null) {
        if (!questionId) return null;
        const task = this.getTask(reportId, taskId, sectionId);
        return task?.questions?.find(question => question.id === questionId);
    }

    // === CREATORS ===
    
    addReport(reportData) {
        const newReport = {
            id: Date.now().toString(),
            reportName: reportData.reportName,
            createdDate: new Date().toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            createdBy: 'hugo.furst@communities.gov.uk',
            lastUpdated: new Date().toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            updatedBy: 'mj@communities.gov.uk',
            sections: [],
            unassignedTasks: []
        };
        
        this.data.reports.push(newReport);
        return newReport;
    }

    addSection(reportId, sectionData) {
        const report = this.getReport(reportId);
        if (!report) return null;

        if (!report.sections) report.sections = [];

        const newSection = {
            id: Date.now().toString(),
            sectionName: sectionData.sectionName,
            createdDate: new Date().toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            tasks: []
        };

        report.sections.push(newSection);
        this.updateReportTimestamp(reportId);
        return newSection;
    }

    addTask(reportId, taskData, sectionId = null) {
        const report = this.getReport(reportId);
        if (!report) return null;

        const newTask = {
            id: Date.now().toString(),
            taskName: taskData.taskName,
            createdDate: new Date().toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            questions: []
        };

        if (sectionId) {
            const section = this.getSection(reportId, sectionId);
            if (!section) return null;
            if (!section.tasks) section.tasks = [];
            section.tasks.push(newTask);
        } else {
            if (!report.unassignedTasks) report.unassignedTasks = [];
            report.unassignedTasks.push(newTask);
        }

        this.updateReportTimestamp(reportId);
        return newTask;
    }

    addQuestion(reportId, taskId, questionData, sectionId = null) {
        const task = this.getTask(reportId, taskId, sectionId);
        if (!task) return null;

        if (!task.questions) task.questions = [];

        const newQuestion = {
            id: Date.now().toString(),
            questionName: questionData.questionName,
            questionType: questionData.questionType,
            createdDate: new Date().toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
        };

        task.questions.push(newQuestion);
        this.updateReportTimestamp(reportId);
        return newQuestion;
    }

    // === UPDATERS ===
    
    updateReport(reportId, updates) {
        const report = this.getReport(reportId);
        if (report) {
            Object.assign(report, updates);
            this.updateReportTimestamp(reportId);
            return true;
        }
        return false;
    }

    updateSection(reportId, sectionId, updates) {
        const section = this.getSection(reportId, sectionId);
        if (section) {
            Object.assign(section, updates);
            this.updateReportTimestamp(reportId);
            return true;
        }
        return false;
    }

    updateTask(reportId, taskId, updates, sectionId = null) {
        const task = this.getTask(reportId, taskId, sectionId);
        if (task) {
            Object.assign(task, updates);
            this.updateReportTimestamp(reportId);
            return true;
        }
        return false;
    }

    // === MOVERS ===
    
    moveItemInArray(array, itemId, direction) {
        const index = array.findIndex(item => item.id === itemId);
        if (index === -1) return false;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= array.length) return false;

        // Swap items
        [array[index], array[newIndex]] = [array[newIndex], array[index]];
        return true;
    }

    moveSectionUp(reportId, sectionId) {
        const report = this.getReport(reportId);
        if (report?.sections) {
            const success = this.moveItemInArray(report.sections, sectionId, 'up');
            if (success) this.updateReportTimestamp(reportId);
            return success;
        }
        return false;
    }

    moveSectionDown(reportId, sectionId) {
        const report = this.getReport(reportId);
        if (report?.sections) {
            const success = this.moveItemInArray(report.sections, sectionId, 'down');
            if (success) this.updateReportTimestamp(reportId);
            return success;
        }
        return false;
    }

    moveTaskUp(reportId, taskId, sectionId = null) {
        const report = this.getReport(reportId);
        if (!report) return false;

        let tasks;
        if (sectionId) {
            const section = this.getSection(reportId, sectionId);
            tasks = section?.tasks;
        } else {
            tasks = report.unassignedTasks;
        }

        if (tasks) {
            const success = this.moveItemInArray(tasks, taskId, 'up');
            if (success) this.updateReportTimestamp(reportId);
            return success;
        }
        return false;
    }

    moveTaskDown(reportId, taskId, sectionId = null) {
        const report = this.getReport(reportId);
        if (!report) return false;

        let tasks;
        if (sectionId) {
            const section = this.getSection(reportId, sectionId);
            tasks = section?.tasks;
        } else {
            tasks = report.unassignedTasks;
        }

        if (tasks) {
            const success = this.moveItemInArray(tasks, taskId, 'down');
            if (success) this.updateReportTimestamp(reportId);
            return success;
        }
        return false;
    }

    moveQuestionUp(reportId, taskId, questionId, sectionId = null) {
        const task = this.getTask(reportId, taskId, sectionId);
        if (task?.questions) {
            const success = this.moveItemInArray(task.questions, questionId, 'up');
            if (success) this.updateReportTimestamp(reportId);
            return success;
        }
        return false;
    }

    moveQuestionDown(reportId, taskId, questionId, sectionId = null) {
        const task = this.getTask(reportId, taskId, sectionId);
        if (task?.questions) {
            const success = this.moveItemInArray(task.questions, questionId, 'down');
            if (success) this.updateReportTimestamp(reportId);
            return success;
        }
        return false;
    }

    // === DELETERS ===
    
    deleteReport(reportId) {
        const index = this.data.reports.findIndex(r => r.id === reportId);
        if (index !== -1) {
            this.data.reports.splice(index, 1);
            return true;
        }
        return false;
    }

    deleteSection(reportId, sectionId) {
        const report = this.getReport(reportId);
        if (report?.sections) {
            const index = report.sections.findIndex(s => s.id === sectionId);
            if (index !== -1) {
                report.sections.splice(index, 1);
                this.updateReportTimestamp(reportId);
                return true;
            }
        }
        return false;
    }

    deleteTask(reportId, taskId, sectionId = null) {
        const report = this.getReport(reportId);
        if (!report) return false;

        if (sectionId) {
            const section = this.getSection(reportId, sectionId);
            if (section?.tasks) {
                const index = section.tasks.findIndex(t => t.id === taskId);
                if (index !== -1) {
                    section.tasks.splice(index, 1);
                    this.updateReportTimestamp(reportId);
                    return true;
                }
            }
        } else {
            if (report.unassignedTasks) {
                const index = report.unassignedTasks.findIndex(t => t.id === taskId);
                if (index !== -1) {
                    report.unassignedTasks.splice(index, 1);
                    this.updateReportTimestamp(reportId);
                    return true;
                }
            }
        }
        return false;
    }

    deleteQuestion(reportId, taskId, questionId, sectionId = null) {
        const task = this.getTask(reportId, taskId, sectionId);
        if (task?.questions) {
            const index = task.questions.findIndex(q => q.id === questionId);
            if (index !== -1) {
                task.questions.splice(index, 1);
                this.updateReportTimestamp(reportId);
                return true;
            }
        }
        return false;
    }

    // === TEMPLATE DATA BUILDER ===
    
    buildTemplateData(reportId, options = {}) {
        const report = this.getReport(reportId);
        if (!report) return null;

        const data = {
            currentReportId: reportId,
            reportName: report.reportName,
            grantName: this.data.grantName || 'Sample Grant Name'
        };

        if (options.includeSections) {
            data.currentSections = report.sections || [];
            data.currentUnassignedTasks = report.unassignedTasks || [];
        }

        if (options.sectionId) {
            const section = this.getSection(reportId, options.sectionId);
            if (section) {
                data.currentSectionId = options.sectionId;
                data.sectionName = section.sectionName;
                data.currentSectionName = section.sectionName; // For edit forms
            }
        }

        if (options.taskId) {
            const task = this.getTask(reportId, options.taskId, options.sectionId);
            if (task) {
                data.currentTaskId = options.taskId;
                data.taskName = task.taskName;
                data.currentTaskName = task.taskName; // For edit forms
                data.currentQuestions = task.questions || [];
                data.isUnassignedTask = !options.sectionId;
            }
        }

        return data;
    }

    // === HELPERS ===
    
    updateReportTimestamp(reportId) {
        const report = this.getReport(reportId);
        if (report) {
            report.lastUpdated = new Date().toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            report.updatedBy = 'mj@communities.gov.uk';
        }
    }

    // Task movement between sections
    moveTaskToSection(reportId, taskId, fromSectionId, toSectionId, newSectionName = null) {
        const report = this.getReport(reportId);
        if (!report) return false;

        // Find and remove task from current location
        let task = null;
        if (fromSectionId) {
            const fromSection = this.getSection(reportId, fromSectionId);
            if (fromSection?.tasks) {
                const taskIndex = fromSection.tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    task = fromSection.tasks.splice(taskIndex, 1)[0];
                }
            }
        } else {
            // From unassigned
            if (report.unassignedTasks) {
                const taskIndex = report.unassignedTasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    task = report.unassignedTasks.splice(taskIndex, 1)[0];
                }
            }
        }

        if (!task) return false;

        // Add task to new location
        if (toSectionId === 'unassigned') {
            // Moving to unassigned
            if (!report.unassignedTasks) report.unassignedTasks = [];
            report.unassignedTasks.push(task);
        } else if (toSectionId === 'new-section' && newSectionName) {
            // Create new section and add task
            const newSection = this.addSection(reportId, { sectionName: newSectionName });
            if (newSection) {
                newSection.tasks.push(task);
            }
        } else {
            // Moving to existing section
            const toSection = this.getSection(reportId, toSectionId);
            if (!toSection) return false;
            if (!toSection.tasks) toSection.tasks = [];
            toSection.tasks.push(task);
        }

        this.updateReportTimestamp(reportId);
        return true;
    }
}

// Export for prototype kit
module.exports = ReportsDataManager;