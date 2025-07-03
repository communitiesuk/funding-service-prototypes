//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const radioButtonRedirect = require('radio-button-redirect')
router.use(radioButtonRedirect)

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

// Logging session data 
router.use((req, res, next) => { 
    const log = { 
    method: req.method, 
    url: req.originalUrl, 
    data: req.session.data 
    } 
    console.log(JSON.stringify(log, null, 2)) 
   
    next() 
})

// get sprint name ( not really using)
router.use('/', (req, res, next) => {
    res.locals.currentURL = req.originalUrl; //current screen
    res.locals.prevURL = req.get('Referrer'); // previous screen
  console.log('previous page is: ' + res.locals.prevURL + " and current page is " + req.url + " " + res.locals.currentURL );
    next();
  });

// Reports
router.get('/funding/grant/reports/', function (req, res) {
    // Set default grant name if not already set
    if (!req.session.data.grantName) {
        req.session.data.grantName = "Sample Grant Name" // Replace with actual grant name
    }        
    
    // Force session save before rendering
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        res.render('funding/grant/reports/index')
    })
})

router.post('/funding/grant/reports/', function (req, res) {
  // Create reports array if it doesn't already exist
  if (!req.session.data.reports) {
    req.session.data.reports = []
  }
  
  // Set grant name if not already set
  if (!req.session.data.grantName) {
    req.session.data.grantName = "Sample Grant Name" // Replace with actual grant name
  }
  
  // New report object in array
  const newReport = {
    id: Date.now().toString(), // unique ID created
    reportName: req.body.reportName,
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
    updatedBy: 'mj@communities.gov.uk'
  }
  
  // Add to reports array
  req.session.data.reports.push(newReport)
  
  // Set to show we have reports
  req.session.data.setupReport = 'yes'
  
  // Force session save before redirecting
  req.session.save(function(err) {
    if (err) {
      console.log('Session save error:', err)
    }
    res.redirect('/funding/grant/reports/?setupReport=yes')
  })
})

// Deleting a report
router.get('/funding/grant/reports/delete/:id', function (req, res) {
  const reportId = req.params.id
  if (req.session.data.reports) {
    req.session.data.reports = req.session.data.reports.filter(
      report => report.id !== reportId
    )
    
    // If no reports left, reset setupReport
    if (req.session.data.reports.length === 0) {
      req.session.data.setupReport = undefined
    }
  }
  res.redirect('/funding/grant/reports/')
})

// Adding a section - captures which report from URL parameter
router.get('/funding/grant/reports/add/section/', function (req, res) {
    // Get report ID from URL parameter and store in session
    const reportId = req.query.reportId || req.session.data.currentReportId
    const returnTo = req.query.returnTo // Track where to return after adding section
    
    if (reportId) {
        req.session.data.currentReportId = reportId
    }
    
    // Store return destination (defaults to reports list)
    req.session.data.returnToAfterSection = returnTo || 'reports'
    
    // Clear any existing sectionName from session
    delete req.session.data.sectionName
    res.render('funding/grant/reports/add/section/index')
})

// Add section to the current report
router.post('/funding/grant/reports/add/section/another', function (req, res) {
    const reportId = req.session.data.currentReportId
    const sectionName = req.body.sectionName
    const returnTo = req.session.data.returnToAfterSection || 'reports'
    
    if (!req.session.data.reports || !reportId) {
        // Redirect back if no reports or no current report selected
        return res.redirect('/funding/grant/reports/')
    }
    
    // Finds the report we're adding the section to
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Create sections array for this report if it doesn't already exist
    if (!req.session.data.reports[reportIndex].sections) {
        req.session.data.reports[reportIndex].sections = []
    }
    
    // Create new section
    const newSection = {
        id: Date.now().toString(),
        sectionName: sectionName,
        createdDate: new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }),
        tasks: []
    }
    
    // Add section to the report
    req.session.data.reports[reportIndex].sections.push(newSection)
    
    // Always update currentSections with fresh data
    req.session.data.currentSections = [...req.session.data.reports[reportIndex].sections]
    req.session.data.reportName = req.session.data.reports[reportIndex].reportName
    
    // Clear the sectionName from session
    delete req.session.data.sectionName
    delete req.session.data.returnToAfterSection
    
    // Force session save before redirecting
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        // Always redirect to sections page when adding a section
        res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    })
})

// "Add sections" link to set currentReportId
router.get('/funding/grant/reports/add/section/:reportId', function (req, res) {
    // Set which report we're adding sections to
    req.session.data.currentReportId = req.params.reportId
    // Clear any existing sectionName
    delete req.session.data.sectionName
    res.redirect('/funding/grant/reports/add/section/')
})

// Sections page (handles delete confirmation and force data refresh)
router.get('/funding/grant/reports/sections', function (req, res) {
    const reportId = req.query.reportId || req.session.data.currentReportId
    
    if (!reportId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Always get fresh data from the reports array
    const currentReport = req.session.data.reports?.find(report => report.id === reportId)
    if (!currentReport) {
        // Clear stale session data and redirect
        delete req.session.data.currentSections
        delete req.session.data.reportName
        delete req.session.data.currentReportId
        return res.redirect('/funding/grant/reports/')
    }
    
    // Update session with fresh data
    req.session.data.currentReportId = reportId
    req.session.data.reportName = currentReport.reportName
    req.session.data.currentSections = currentReport.sections ? [...currentReport.sections] : []    
    
    // Cancel parameter - redirect to clear URL
    if (req.query.cancel === 'true') {
        // Clear all confirmation data
        delete req.session.data.deleteConfirm
        delete req.session.data.deleteSectionId
        delete req.session.data.deleteSectionName
        delete req.session.data.taskDeleteConfirm
        delete req.session.data.deleteTaskId
        delete req.session.data.deleteTaskSectionId
        delete req.session.data.deleteTaskName
        
        // Save session and redirect to clean URL
        req.session.save(function(err) {
            if (err) {
                console.log('Session save error:', err)
            }
            res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
        })
        return
    }
    
    // Delete confirmation parameters for sections
    if (req.query.deleteConfirm === 'true') {
        req.session.data.deleteConfirm = true
        req.session.data.deleteSectionId = req.query.deleteSectionId
        req.session.data.deleteSectionName = req.query.deleteSectionName
    } else {
        // Clear confirmation data if not in confirmation mode
        delete req.session.data.deleteConfirm
        delete req.session.data.deleteSectionId
        delete req.session.data.deleteSectionName
    }
    
    // Delete confirmation parameters for tasks
    if (req.query.taskDeleteConfirm === 'true') {
        req.session.data.taskDeleteConfirm = true
        req.session.data.deleteTaskId = req.query.deleteTaskId
        req.session.data.deleteTaskSectionId = req.query.deleteTaskSectionId
        req.session.data.deleteTaskName = req.query.deleteTaskName
    } else {
        // Clear task confirmation data if not in confirmation mode
        delete req.session.data.taskDeleteConfirm
        delete req.session.data.deleteTaskId
        delete req.session.data.deleteTaskSectionId
        delete req.session.data.deleteTaskName
    }
    
    // Save session before rendering
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        res.render('funding/grant/reports/sections')
    })
})

// Deleting a section
router.get('/funding/grant/reports/sections/delete/:sectionId', function (req, res) {
    const sectionId = req.params.sectionId
    const reportId = req.query.reportId || req.session.data.currentReportId
    const confirm = req.query.confirm
    
    if (!reportId || !sectionId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // If confirmed, actually delete the section
    if (confirm === 'yes') {
        // Remove the section
        if (req.session.data.reports[reportIndex].sections) {
            req.session.data.reports[reportIndex].sections = req.session.data.reports[reportIndex].sections.filter(
                section => section.id !== sectionId
            )
        }
        
        // Force update the currentSections immediately with fresh data
        req.session.data.currentSections = req.session.data.reports[reportIndex].sections ? 
            [...req.session.data.reports[reportIndex].sections] : []
        
        // Clear any confirmation data
        delete req.session.data.deleteConfirm
        delete req.session.data.deleteSectionId
        delete req.session.data.deleteSectionName
        
        // Force session save before redirecting
        req.session.save(function(err) {
            if (err) {
                console.log('Session save error:', err)
            }
            // Redirect back to sections page
            res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
        })
    } else {
        // More about direct access (shouldnt need it)
        res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
})

// Move section up
router.get('/funding/grant/reports/sections/move-up/:sectionId', function (req, res) {
    const sectionId = req.params.sectionId
    const reportId = req.query.reportId || req.session.data.currentReportId
    
    if (!reportId || !sectionId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }
    
    const sections = req.session.data.reports[reportIndex].sections
    if (!sections) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
    
    // Find the section index
    const sectionIndex = sections.findIndex(section => section.id === sectionId)
    if (sectionIndex > 0) {
        // Swap with previous section
        const temp = sections[sectionIndex]
        sections[sectionIndex] = sections[sectionIndex - 1]
        sections[sectionIndex - 1] = temp
        
        // Update currentSections with fresh data
        req.session.data.currentSections = [...sections]
    }
    
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
})

// Move section down
router.get('/funding/grant/reports/sections/move-down/:sectionId', function (req, res) {
    const sectionId = req.params.sectionId
    const reportId = req.query.reportId || req.session.data.currentReportId
    
    if (!reportId || !sectionId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }
    
    const sections = req.session.data.reports[reportIndex].sections
    if (!sections) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
    
    // Find the section index
    const sectionIndex = sections.findIndex(section => section.id === sectionId)
    if (sectionIndex >= 0 && sectionIndex < sections.length - 1) {
        // Swap with next section
        const temp = sections[sectionIndex]
        sections[sectionIndex] = sections[sectionIndex + 1]
        sections[sectionIndex + 1] = temp
        
        // Update currentSections with fresh data
        req.session.data.currentSections = [...sections]
    }
    
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
})


// Adding a task - captures which section and report from URL parameters
router.get('/funding/grant/reports/add/task/', function (req, res) {
    const sectionId = req.query.sectionId || req.session.data.currentSectionId
    const reportId = req.query.reportId || req.session.data.currentReportId
    
    if (!sectionId || !reportId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Store current context
    req.session.data.currentSectionId = sectionId
    req.session.data.currentReportId = reportId
    
    // Find the section to get its name for the page header
    const currentReport = req.session.data.reports?.find(report => report.id === reportId)
    if (currentReport && currentReport.sections) {
        const currentSection = currentReport.sections.find(section => section.id === sectionId)
        if (currentSection) {
            req.session.data.sectionName = currentSection.sectionName
        }
    }
    
    // Clear any existing taskName from session
    delete req.session.data.taskName
    
    res.render('funding/grant/reports/add/task/index')
})

// Add task to the current section
router.post('/funding/grant/reports/add/task/another', function (req, res) {
    const sectionId = req.session.data.currentSectionId
    const reportId = req.session.data.currentReportId
    const taskName = req.body.taskName
    
    if (!req.session.data.reports || !reportId || !sectionId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the section
    const sectionIndex = req.session.data.reports[reportIndex].sections.findIndex(section => section.id === sectionId)
    if (sectionIndex === -1) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
    
    // Create tasks array for this section if it doesn't already exist
    if (!req.session.data.reports[reportIndex].sections[sectionIndex].tasks) {
        req.session.data.reports[reportIndex].sections[sectionIndex].tasks = []
    }
    
    // Create new task
    const newTask = {
        id: Date.now().toString(),
        taskName: taskName,
        createdDate: new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }
    
    // Add task to the section
    req.session.data.reports[reportIndex].sections[sectionIndex].tasks.push(newTask)
    
    // Update currentSections with fresh data
    req.session.data.currentSections = [...req.session.data.reports[reportIndex].sections]
    
    // Clear task-related session data
    delete req.session.data.taskName
    delete req.session.data.currentSectionId
    delete req.session.data.sectionName
    
    // Force session save before redirecting
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    })
})

// Move task up
router.get('/funding/grant/reports/tasks/move-up/:taskId', function (req, res) {
    const taskId = req.params.taskId
    const reportId = req.query.reportId || req.session.data.currentReportId
    const sectionId = req.query.sectionId
    
    if (!reportId || !sectionId || !taskId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the section
    const sectionIndex = req.session.data.reports[reportIndex].sections.findIndex(section => section.id === sectionId)
    if (sectionIndex === -1) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
    
    const tasks = req.session.data.reports[reportIndex].sections[sectionIndex].tasks
    if (!tasks) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
    
    // Find the task index
    const taskIndex = tasks.findIndex(task => task.id === taskId)
    if (taskIndex > 0) {
        // Swap with previous task
        const temp = tasks[taskIndex]
        tasks[taskIndex] = tasks[taskIndex - 1]
        tasks[taskIndex - 1] = temp
        
        // Update currentSections with fresh data
        req.session.data.currentSections = [...req.session.data.reports[reportIndex].sections]
    }
    
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
})

// Move task down
router.get('/funding/grant/reports/tasks/move-down/:taskId', function (req, res) {
    const taskId = req.params.taskId
    const reportId = req.query.reportId || req.session.data.currentReportId
    const sectionId = req.query.sectionId
    
    if (!reportId || !sectionId || !taskId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the section
    const sectionIndex = req.session.data.reports[reportIndex].sections.findIndex(section => section.id === sectionId)
    if (sectionIndex === -1) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
    
    const tasks = req.session.data.reports[reportIndex].sections[sectionIndex].tasks
    if (!tasks) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
    
    // Find the task index
    const taskIndex = tasks.findIndex(task => task.id === taskId)
    if (taskIndex >= 0 && taskIndex < tasks.length - 1) {
        // Swap with next task
        const temp = tasks[taskIndex]
        tasks[taskIndex] = tasks[taskIndex + 1]
        tasks[taskIndex + 1] = temp
        
        // Update currentSections with fresh data
        req.session.data.currentSections = [...req.session.data.reports[reportIndex].sections]
    }
    
    res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
})

// Deleting a task
router.get('/funding/grant/reports/tasks/delete/:taskId', function (req, res) {
    const taskId = req.params.taskId
    const reportId = req.query.reportId || req.session.data.currentReportId
    const sectionId = req.query.sectionId
    const confirm = req.query.confirm
    
    if (!reportId || !sectionId || !taskId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the section
    const sectionIndex = req.session.data.reports[reportIndex].sections.findIndex(section => section.id === sectionId)
    if (sectionIndex === -1) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
    
    // If confirmed, actually delete the task
    if (confirm === 'yes') {
        // Remove the task
        if (req.session.data.reports[reportIndex].sections[sectionIndex].tasks) {
            req.session.data.reports[reportIndex].sections[sectionIndex].tasks = 
                req.session.data.reports[reportIndex].sections[sectionIndex].tasks.filter(
                    task => task.id !== taskId
                )
        }
        
        // Force update the currentSections with fresh data
        req.session.data.currentSections = [...req.session.data.reports[reportIndex].sections]
        
        // Clear any confirmation data
        delete req.session.data.taskDeleteConfirm
        delete req.session.data.deleteTaskId
        delete req.session.data.deleteTaskSectionId
        delete req.session.data.deleteTaskName
        
        // Force session save before redirecting
        req.session.save(function(err) {
            if (err) {
                console.log('Session save error:', err)
            }
            res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
        })
    } else {
        // This shouldn't happen with the new flow, but redirect back if accessed directly
        res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
})


// Adding a question - captures which task, section and report from URL parameters
router.get('/funding/grant/reports/add/question/', function (req, res) {
    const taskId = req.query.taskId || req.session.data.currentTaskId
    const sectionId = req.query.sectionId || req.session.data.currentSectionId
    const reportId = req.query.reportId || req.session.data.currentReportId
    
    if (!taskId || !sectionId || !reportId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Store current context
    req.session.data.currentTaskId = taskId
    req.session.data.currentSectionId = sectionId
    req.session.data.currentReportId = reportId
    
    // Find the task to get its name for the page header
    const currentReport = req.session.data.reports?.find(report => report.id === reportId)
    if (currentReport && currentReport.sections) {
        const currentSection = currentReport.sections.find(section => section.id === sectionId)
        if (currentSection && currentSection.tasks) {
            const currentTask = currentSection.tasks.find(task => task.id === taskId)
            if (currentTask) {
                req.session.data.taskName = currentTask.taskName
            }
        }
    }
    
    // Clear any existing question data from session
    delete req.session.data.questionType
    delete req.session.data.questionName
    
    res.render('funding/grant/reports/add/question/index')
})

// Question type selection
router.post('/funding/grant/reports/add/question/options', function (req, res) {
    // Store the selected question type
    req.session.data.questionType = req.body.questionType
    
    res.render('funding/grant/reports/add/question/options')
})

// Add question to the current task
router.post('/funding/grant/reports/add/question/another', function (req, res) {
    const taskId = req.session.data.currentTaskId
    const sectionId = req.session.data.currentSectionId
    const reportId = req.session.data.currentReportId
    const questionName = req.body.questionName
    const questionType = req.session.data.questionType
    
    if (!req.session.data.reports || !reportId || !sectionId || !taskId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the section
    const sectionIndex = req.session.data.reports[reportIndex].sections.findIndex(section => section.id === sectionId)
    if (sectionIndex === -1) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
    
    // Find the task
    const taskIndex = req.session.data.reports[reportIndex].sections[sectionIndex].tasks.findIndex(task => task.id === taskId)
    if (taskIndex === -1) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
    
    // Create questions array for this task if it doesn't already exist
    if (!req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions) {
        req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions = []
    }
    
    // Create new question
    const newQuestion = {
        id: Date.now().toString(),
        questionName: questionName,
        questionType: questionType,
        createdDate: new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }
    
    // Add question to the task
    req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions.push(newQuestion)
    
    // Update currentQuestions with fresh data
    req.session.data.currentQuestions = [...req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions]
    
    // Clear question-related session data
    delete req.session.data.questionName
    delete req.session.data.questionType
    
    // Force session save before redirecting
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        res.redirect('/funding/grant/reports/questions?taskId=' + taskId + '&sectionId=' + sectionId + '&reportId=' + reportId)
    })
})

// Questions page (handles delete confirmation and force data refresh)
router.get('/funding/grant/reports/questions', function (req, res) {
    const taskId = req.query.taskId || req.session.data.currentTaskId
    const sectionId = req.query.sectionId || req.session.data.currentSectionId
    const reportId = req.query.reportId || req.session.data.currentReportId
    
    if (!taskId || !sectionId || !reportId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Always get fresh data from the reports array
    const currentReport = req.session.data.reports?.find(report => report.id === reportId)
    if (!currentReport) {
        return res.redirect('/funding/grant/reports/')
    }
    
    const currentSection = currentReport.sections?.find(section => section.id === sectionId)
    if (!currentSection) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
    
    const currentTask = currentSection.tasks?.find(task => task.id === taskId)
    if (!currentTask) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
    
    // Update session with fresh data
    req.session.data.currentTaskId = taskId
    req.session.data.currentSectionId = sectionId
    req.session.data.currentReportId = reportId
    req.session.data.taskName = currentTask.taskName
    req.session.data.reportName = currentReport.reportName
    req.session.data.currentQuestions = currentTask.questions ? [...currentTask.questions] : []    
    
    // Cancel parameter - redirect to clear URL
    if (req.query.cancel === 'true') {
        // Clear confirmation data
        delete req.session.data.questionDeleteConfirm
        delete req.session.data.deleteQuestionId
        delete req.session.data.deleteQuestionName
        
        // Save session and redirect to clean URL
        req.session.save(function(err) {
            if (err) {
                console.log('Session save error:', err)
            }
            res.redirect('/funding/grant/reports/questions?taskId=' + taskId + '&sectionId=' + sectionId + '&reportId=' + reportId)
        })
        return
    }
    
    // Delete confirmation parameters for questions
    if (req.query.questionDeleteConfirm === 'true') {
        req.session.data.questionDeleteConfirm = true
        req.session.data.deleteQuestionId = req.query.deleteQuestionId
        req.session.data.deleteQuestionName = req.query.deleteQuestionName
    } else {
        // Clear question confirmation data if not in confirmation mode
        delete req.session.data.questionDeleteConfirm
        delete req.session.data.deleteQuestionId
        delete req.session.data.deleteQuestionName
    }
    
    // Save session before rendering
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        res.render('funding/grant/reports/questions')
    })
})

// Move question up
router.get('/funding/grant/reports/questions/move-up/:questionId', function (req, res) {
    const questionId = req.params.questionId
    const taskId = req.query.taskId || req.session.data.currentTaskId
    const sectionId = req.query.sectionId || req.session.data.currentSectionId
    const reportId = req.query.reportId || req.session.data.currentReportId
    
    if (!reportId || !sectionId || !taskId || !questionId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the report, section, and task
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) return res.redirect('/funding/grant/reports/')
    
    const sectionIndex = req.session.data.reports[reportIndex].sections.findIndex(section => section.id === sectionId)
    if (sectionIndex === -1) return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    
    const taskIndex = req.session.data.reports[reportIndex].sections[sectionIndex].tasks.findIndex(task => task.id === taskId)
    if (taskIndex === -1) return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    
    const questions = req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions
    if (!questions) return res.redirect('/funding/grant/reports/questions?taskId=' + taskId + '&sectionId=' + sectionId + '&reportId=' + reportId)
    
    // Find the question index
    const questionIndex = questions.findIndex(question => question.id === questionId)
    if (questionIndex > 0) {
        // Swap with previous question
        const temp = questions[questionIndex]
        questions[questionIndex] = questions[questionIndex - 1]
        questions[questionIndex - 1] = temp
        
        // Update currentQuestions with fresh data
        req.session.data.currentQuestions = [...questions]
    }
    
    res.redirect('/funding/grant/reports/questions?taskId=' + taskId + '&sectionId=' + sectionId + '&reportId=' + reportId)
})

// Move question down
router.get('/funding/grant/reports/questions/move-down/:questionId', function (req, res) {
    const questionId = req.params.questionId
    const taskId = req.query.taskId || req.session.data.currentTaskId
    const sectionId = req.query.sectionId || req.session.data.currentSectionId
    const reportId = req.query.reportId || req.session.data.currentReportId
    
    if (!reportId || !sectionId || !taskId || !questionId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the report, section, and task
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) return res.redirect('/funding/grant/reports/')
    
    const sectionIndex = req.session.data.reports[reportIndex].sections.findIndex(section => section.id === sectionId)
    if (sectionIndex === -1) return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    
    const taskIndex = req.session.data.reports[reportIndex].sections[sectionIndex].tasks.findIndex(task => task.id === taskId)
    if (taskIndex === -1) return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    
    const questions = req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions
    if (!questions) return res.redirect('/funding/grant/reports/questions?taskId=' + taskId + '&sectionId=' + sectionId + '&reportId=' + reportId)
    
    // Find the question index
    const questionIndex = questions.findIndex(question => question.id === questionId)
    if (questionIndex >= 0 && questionIndex < questions.length - 1) {
        // Swap with next question
        const temp = questions[questionIndex]
        questions[questionIndex] = questions[questionIndex + 1]
        questions[questionIndex + 1] = temp
        
        // Update currentQuestions with fresh data
        req.session.data.currentQuestions = [...questions]
    }
    
    res.redirect('/funding/grant/reports/questions?taskId=' + taskId + '&sectionId=' + sectionId + '&reportId=' + reportId)
})

// Deleting a question
router.get('/funding/grant/reports/questions/delete/:questionId', function (req, res) {
    const questionId = req.params.questionId
    const taskId = req.query.taskId || req.session.data.currentTaskId
    const sectionId = req.query.sectionId || req.session.data.currentSectionId
    const reportId = req.query.reportId || req.session.data.currentReportId
    const confirm = req.query.confirm
    
    if (!reportId || !sectionId || !taskId || !questionId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the report, section, and task
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) return res.redirect('/funding/grant/reports/')
    
    const sectionIndex = req.session.data.reports[reportIndex].sections.findIndex(section => section.id === sectionId)
    if (sectionIndex === -1) return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    
    const taskIndex = req.session.data.reports[reportIndex].sections[sectionIndex].tasks.findIndex(task => task.id === taskId)
    if (taskIndex === -1) return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    
    // If confirmed, actually delete the question
    if (confirm === 'yes') {
        // Remove the question
        if (req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions) {
            req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions = 
                req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions.filter(
                    question => question.id !== questionId
                )
        }
        
        // Force update the currentQuestions with fresh data
        req.session.data.currentQuestions = req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions ? 
            [...req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions] : []
        
        // Clear any confirmation data
        delete req.session.data.questionDeleteConfirm
        delete req.session.data.deleteQuestionId
        delete req.session.data.deleteQuestionName
        
        // Force session save before redirecting
        req.session.save(function(err) {
            if (err) {
                console.log('Session save error:', err)
            }
            res.redirect('/funding/grant/reports/questions?taskId=' + taskId + '&sectionId=' + sectionId + '&reportId=' + reportId)
        })
    } else {
        // This shouldn't happen with the new flow, but redirect back if accessed directly
        res.redirect('/funding/grant/reports/questions?taskId=' + taskId + '&sectionId=' + sectionId + '&reportId=' + reportId)
    }
})


// REPORT EDITING ROUTES

// Show edit report page
router.get('/funding/grant/reports/edit/', function (req, res) {
    const reportId = req.query.reportId
    
    if (!reportId) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find the report to get its current name
    const currentReport = req.session.data.reports?.find(report => report.id === reportId)
    if (!currentReport) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Store report data for the edit form
    req.session.data.currentReportId = reportId
    req.session.data.currentReportName = currentReport.reportName
    
    res.render('funding/grant/reports/edit/index')
})

// Update report name
router.post('/funding/grant/reports/edit/update', function (req, res) {
    const reportId = req.body.reportId
    const newReportName = req.body.reportName
    
    if (!reportId || !newReportName) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find and update the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex !== -1) {
        req.session.data.reports[reportIndex].reportName = newReportName
        req.session.data.reports[reportIndex].lastUpdated = new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
        req.session.data.reports[reportIndex].updatedBy = 'mj@communities.gov.uk'
    }
    
    // Clear edit session data
    delete req.session.data.currentReportId
    delete req.session.data.currentReportName
    
    // Force session save before redirecting
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        res.redirect('/funding/grant/reports/')
    })
})


// SECTION EDITING ROUTES

// Show edit section page
router.get('/funding/grant/reports/edit/section/', function (req, res) {
    const sectionId = req.query.sectionId
    const reportId = req.query.reportId
    
    console.log('Edit section GET - sectionId:', sectionId, 'reportId:', reportId)
    
    if (!sectionId || !reportId) {
        console.log('Missing sectionId or reportId, redirecting to reports')
        return res.redirect('/funding/grant/reports/')
    }
    
    // Always get fresh data from the reports array first
    const currentReport = req.session.data.reports?.find(report => report.id === reportId)
    if (!currentReport) {
        console.log('Report not found, redirecting')
        return res.redirect('/funding/grant/reports/')
    }
    
    const currentSection = currentReport.sections?.find(section => section.id === sectionId)
    if (!currentSection) {
        console.log('Section not found, redirecting to sections page')
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }
    
    console.log('Found section:', currentSection.sectionName)
    
    // Update session with fresh data from the reports array
    req.session.data.currentSectionId = sectionId
    req.session.data.currentReportId = reportId
    req.session.data.currentSectionName = currentSection.sectionName
    req.session.data.reportName = currentReport.reportName
    req.session.data.currentSections = currentReport.sections ? [...currentReport.sections] : []
    
    console.log('Set currentSectionName to:', req.session.data.currentSectionName)
    
    // Force session save before rendering
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        console.log('About to render with currentSectionName:', req.session.data.currentSectionName)
        res.render('funding/grant/reports/edit/section/index')
    })
})

// Update section name
router.post('/funding/grant/reports/edit/section/update', function (req, res) {
    const sectionId = req.body.sectionId
    const reportId = req.body.reportId
    const newSectionName = req.body.sectionName
    
    if (!sectionId || !reportId || !newSectionName) {
        return res.redirect('/funding/grant/reports/')
    }
    
    // Find and update the section
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex !== -1) {
        const sectionIndex = req.session.data.reports[reportIndex].sections.findIndex(section => section.id === sectionId)
        if (sectionIndex !== -1) {
            req.session.data.reports[reportIndex].sections[sectionIndex].sectionName = newSectionName
            
            // Update the report's last updated info
            req.session.data.reports[reportIndex].lastUpdated = new Date().toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
            req.session.data.reports[reportIndex].updatedBy = 'mj@communities.gov.uk'
            
            // Force update the currentSections with fresh data
            req.session.data.currentSections = [...req.session.data.reports[reportIndex].sections]
            req.session.data.reportName = req.session.data.reports[reportIndex].reportName
        }
    }
    
    // Clear edit session data
    delete req.session.data.currentSectionId
    delete req.session.data.currentSectionName
    
    // Force session save before redirecting
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        // Redirect back to sections page after updating section name
        res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    })
})


module.exports = router