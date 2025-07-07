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


// Reports index page
router.get('/funding/grant/reports/', function (req, res) {
    // Set default grant name if not already set
    if (!req.session.data.grantName) {
        req.session.data.grantName = "Sample Grant Name" // Replace with actual grant name
    }

    // Clear any cached data that might be stale
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

    // Force session save before rendering to ensure fresh state
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
    updatedBy: 'mj@communities.gov.uk',
    sections: [],
    unassignedTasks: []
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

    // ALWAYS get fresh data from the reports array
    const currentReport = req.session.data.reports?.find(report => report.id === reportId)
    if (!currentReport) {
        // Clear any remaining stale session data and redirect
        delete req.session.data.deleteConfirm
        delete req.session.data.deleteSectionId
        delete req.session.data.deleteSectionName
        delete req.session.data.taskDeleteConfirm
        delete req.session.data.deleteTaskId
        delete req.session.data.deleteTaskSectionId
        delete req.session.data.deleteTaskName
        return res.redirect('/funding/grant/reports/')
    }

    // ALWAYS update session with fresh data from the reports array
    req.session.data.currentReportId = reportId
    req.session.data.reportName = currentReport.reportName
    req.session.data.currentSections = currentReport.sections ? [...currentReport.sections] : []
    req.session.data.currentUnassignedTasks = currentReport.unassignedTasks ? [...currentReport.unassignedTasks] : []

    console.log('Sections page - Fresh data loaded:')
    console.log('Report name:', req.session.data.reportName)
    console.log('Sections count:', req.session.data.currentSections.length)
    console.log('Unassigned tasks count:', req.session.data.currentUnassignedTasks.length)

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

    // Prepare template data directly
    const templateData = {
        currentReportId: reportId,
        reportName: currentReport.reportName,
        currentSections: currentReport.sections ? [...currentReport.sections] : [],
        currentUnassignedTasks: currentReport.unassignedTasks ? [...currentReport.unassignedTasks] : [],
        grantName: req.session.data.grantName || 'Sample Grant Name',
        // Pass through any confirmation states
        deleteConfirm: req.session.data.deleteConfirm,
        deleteSectionId: req.session.data.deleteSectionId,
        deleteSectionName: req.session.data.deleteSectionName,
        taskDeleteConfirm: req.session.data.taskDeleteConfirm,
        deleteTaskId: req.session.data.deleteTaskId,
        deleteTaskSectionId: req.session.data.deleteTaskSectionId,
        deleteTaskName: req.session.data.deleteTaskName
    }

    // Save session before rendering
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        res.render('funding/grant/reports/sections', templateData)
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
        // More about direct access
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

// UNIFIED TASK CREATION - handles both section-specific and unassigned tasks
router.get('/funding/grant/reports/add/task/', function (req, res) {
    const sectionId = req.query.sectionId || req.session.data.currentSectionId
    const reportId = req.query.reportId || req.session.data.currentReportId

    if (!reportId) {
        console.log('No reportId found, redirecting')
        return res.redirect('/funding/grant/reports/')
    }

    // ALWAYS get fresh data from the reports array to ensure we have current context
    const currentReport = req.session.data.reports?.find(report => report.id === reportId)
    console.log('Found report:', currentReport ? currentReport.reportName : 'NOT FOUND')

    if (!currentReport) {
        console.log('Report not found in session, redirecting')
        return res.redirect('/funding/grant/reports/')
    }

    // Store current context with fresh data
    req.session.data.currentReportId = reportId
    req.session.data.currentSectionId = sectionId  // This will be undefined for unassigned tasks
    req.session.data.reportName = currentReport.reportName

    console.log('Session after setting - reportName:', req.session.data.reportName)

    if (sectionId && currentReport.sections) {
        // Adding to a specific section
        const currentSection = currentReport.sections.find(section => section.id === sectionId)
        if (currentSection) {
            req.session.data.sectionName = currentSection.sectionName
        }
    } else {
        // Clear any stale section data when adding unassigned task
        delete req.session.data.sectionName
    }

    // Clear any existing taskName from session
    delete req.session.data.taskName

    // Prepare template data directly instead of relying on session
    const templateData = {
        currentReportId: reportId,
        reportName: currentReport.reportName,
        currentSectionId: sectionId,
        sectionName: req.session.data.sectionName,
        grantName: req.session.data.grantName || 'Sample Grant Name'
    }

    console.log('Template data being passed:', templateData)

    // Force session save AND pass data directly to template
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        console.log('About to render template with direct data')
        res.render('funding/grant/reports/add/task/index', templateData)
    })
})

// UNIFIED TASK CREATION - handles both section-specific and unassigned tasks
router.post('/funding/grant/reports/add/task/another', function (req, res) {
    const sectionId = req.session.data.currentSectionId  // Will be undefined for unassigned tasks
    const reportId = req.session.data.currentReportId
    const taskName = req.body.taskName

    if (!req.session.data.reports || !reportId) {
        return res.redirect('/funding/grant/reports/')
    }

    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }

    // Create new task
    const newTask = {
        id: Date.now().toString(),
        taskName: taskName,
        createdDate: new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }),
        questions: []
    }

    if (sectionId) {
        // Adding to a specific section
        const sectionIndex = req.session.data.reports[reportIndex].sections?.findIndex(section => section.id === sectionId)
        if (sectionIndex === -1) {
            return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
        }

        // Create tasks array for this section if it doesn't already exist
        if (!req.session.data.reports[reportIndex].sections[sectionIndex].tasks) {
            req.session.data.reports[reportIndex].sections[sectionIndex].tasks = []
        }

        // Add task to the section
        req.session.data.reports[reportIndex].sections[sectionIndex].tasks.push(newTask)

        // Update currentSections with fresh data
        req.session.data.currentSections = [...req.session.data.reports[reportIndex].sections]
    } else {
        // Adding as unassigned task
        // Create unassignedTasks array for this report if it doesn't already exist
        if (!req.session.data.reports[reportIndex].unassignedTasks) {
            req.session.data.reports[reportIndex].unassignedTasks = []
        }

        // Add task to the report's unassigned tasks
        req.session.data.reports[reportIndex].unassignedTasks.push(newTask)
    }

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


// Move unassigned task up
router.get('/funding/grant/reports/unassigned-tasks/move-up/:taskId', function (req, res) {
    const taskId = req.params.taskId
    const reportId = req.query.reportId || req.session.data.currentReportId

    if (!reportId || !taskId) {
        return res.redirect('/funding/grant/reports/')
    }

    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }

    const unassignedTasks = req.session.data.reports[reportIndex].unassignedTasks
    if (!unassignedTasks) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }

    // Find the task index
    const taskIndex = unassignedTasks.findIndex(task => task.id === taskId)
    if (taskIndex > 0) {
        // Swap with previous task
        const temp = unassignedTasks[taskIndex]
        unassignedTasks[taskIndex] = unassignedTasks[taskIndex - 1]
        unassignedTasks[taskIndex - 1] = temp

        // Update currentUnassignedTasks with fresh data
        req.session.data.currentUnassignedTasks = [...unassignedTasks]
    }

    res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
})

// Move unassigned task down
router.get('/funding/grant/reports/unassigned-tasks/move-down/:taskId', function (req, res) {
    const taskId = req.params.taskId
    const reportId = req.query.reportId || req.session.data.currentReportId

    if (!reportId || !taskId) {
        return res.redirect('/funding/grant/reports/')
    }

    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }

    const unassignedTasks = req.session.data.reports[reportIndex].unassignedTasks
    if (!unassignedTasks) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }

    // Find the task index
    const taskIndex = unassignedTasks.findIndex(task => task.id === taskId)
    if (taskIndex >= 0 && taskIndex < unassignedTasks.length - 1) {
        // Swap with next task
        const temp = unassignedTasks[taskIndex]
        unassignedTasks[taskIndex] = unassignedTasks[taskIndex + 1]
        unassignedTasks[taskIndex + 1] = temp

        // Update currentUnassignedTasks with fresh data
        req.session.data.currentUnassignedTasks = [...unassignedTasks]
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

// Deleting an unassigned task
router.get('/funding/grant/reports/unassigned-tasks/delete/:taskId', function (req, res) {
    const taskId = req.params.taskId
    const reportId = req.query.reportId || req.session.data.currentReportId
    const confirm = req.query.confirm

    if (!reportId || !taskId) {
        return res.redirect('/funding/grant/reports/')
    }

    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }

    // If confirmed, actually delete the unassigned task
    if (confirm === 'yes') {
        // Remove the task from unassigned tasks
        if (req.session.data.reports[reportIndex].unassignedTasks) {
            req.session.data.reports[reportIndex].unassignedTasks =
                req.session.data.reports[reportIndex].unassignedTasks.filter(
                    task => task.id !== taskId
                )
        }

        // Force update the currentUnassignedTasks with fresh data
        req.session.data.currentUnassignedTasks = req.session.data.reports[reportIndex].unassignedTasks ?
            [...req.session.data.reports[reportIndex].unassignedTasks] : []

        // Clear any confirmation data
        delete req.session.data.taskDeleteConfirm
        delete req.session.data.deleteTaskId
        delete req.session.data.deleteTaskName

        // Force session save before redirecting
        req.session.save(function(err) {
            if (err) {
                console.log('Session save error:', err)
            }
            // Redirect back to sections page (not questions page since task is deleted)
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
    const unassigned = req.query.unassigned === 'true'

    if (!taskId || !reportId) {
        return res.redirect('/funding/grant/reports/')
    }

    // Store current context
    req.session.data.currentTaskId = taskId
    req.session.data.currentSectionId = sectionId
    req.session.data.currentReportId = reportId
    req.session.data.isUnassignedTask = unassigned

    // Find the task to get its name for the page header
    const currentReport = req.session.data.reports?.find(report => report.id === reportId)
    if (currentReport) {
        let currentTask = null

        if (unassigned && currentReport.unassignedTasks) {
            currentTask = currentReport.unassignedTasks.find(task => task.id === taskId)
        } else if (currentReport.sections && sectionId) {
            const currentSection = currentReport.sections.find(section => section.id === sectionId)
            if (currentSection && currentSection.tasks) {
                currentTask = currentSection.tasks.find(task => task.id === taskId)
            }
        }

        if (currentTask) {
            req.session.data.taskName = currentTask.taskName
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
    const isUnassignedTask = req.session.data.isUnassignedTask

    if (!req.session.data.reports || !reportId || !taskId) {
        return res.redirect('/funding/grant/reports/')
    }

    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) {
        return res.redirect('/funding/grant/reports/')
    }

    let taskLocation = null

    if (isUnassignedTask) {
        // Find the task in unassigned tasks
        const taskIndex = req.session.data.reports[reportIndex].unassignedTasks?.findIndex(task => task.id === taskId)
        if (taskIndex === -1) {
            return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
        }
        taskLocation = {
            type: 'unassigned',
            taskIndex: taskIndex
        }
    } else {
        // Find the section and task
        const sectionIndex = req.session.data.reports[reportIndex].sections?.findIndex(section => section.id === sectionId)
        if (sectionIndex === -1) {
            return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
        }

        const taskIndex = req.session.data.reports[reportIndex].sections[sectionIndex].tasks?.findIndex(task => task.id === taskId)
        if (taskIndex === -1) {
            return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
        }

        taskLocation = {
            type: 'section',
            sectionIndex: sectionIndex,
            taskIndex: taskIndex
        }
    }

    // Get reference to the task based on location
    let targetTask = null
    if (taskLocation.type === 'unassigned') {
        targetTask = req.session.data.reports[reportIndex].unassignedTasks[taskLocation.taskIndex]
    } else {
        targetTask = req.session.data.reports[reportIndex].sections[taskLocation.sectionIndex].tasks[taskLocation.taskIndex]
    }

    // Create questions array for this task if it doesn't already exist
    if (!targetTask.questions) {
        targetTask.questions = []
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
    targetTask.questions.push(newQuestion)

    // Update currentQuestions with fresh data
    req.session.data.currentQuestions = [...targetTask.questions]

    // Clear question-related session data
    delete req.session.data.questionName
    delete req.session.data.questionType
    delete req.session.data.isUnassignedTask

    // Build redirect URL based on task location
    let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId
    if (isUnassignedTask) {
        redirectUrl += '&unassigned=true'
    } else {
        redirectUrl += '&sectionId=' + sectionId
    }

    // Force session save before redirecting
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        res.redirect(redirectUrl)
    })
})

// Questions page (handles delete confirmation and force data refresh)
router.get('/funding/grant/reports/questions', function (req, res) {
    const taskId = req.query.taskId || req.session.data.currentTaskId
    const sectionId = req.query.sectionId || req.session.data.currentSectionId
    const reportId = req.query.reportId || req.session.data.currentReportId
    const unassigned = req.query.unassigned === 'true'

    if (!taskId || !reportId) {
        return res.redirect('/funding/grant/reports/')
    }

    // Always get fresh data from the reports array
    const currentReport = req.session.data.reports?.find(report => report.id === reportId)
    if (!currentReport) {
        return res.redirect('/funding/grant/reports/')
    }

    let currentTask = null
    if (unassigned && currentReport.unassignedTasks) {
        currentTask = currentReport.unassignedTasks.find(task => task.id === taskId)
    } else if (currentReport.sections && sectionId) {
        const currentSection = currentReport.sections.find(section => section.id === sectionId)
        if (!currentSection) {
            return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
        }
        currentTask = currentSection.tasks?.find(task => task.id === taskId)
    }

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
    req.session.data.isUnassignedTask = unassigned


    // Find the section name if this is not an unassigned task
    let sectionName = null
    if (!unassigned && currentReport.sections && sectionId) {
        const currentSection = currentReport.sections.find(section => section.id === sectionId)
        if (currentSection) {
            sectionName = currentSection.sectionName
        }
    }



    // Cancel parameter - redirect to clear URL
    if (req.query.cancel === 'true') {
        // Clear confirmation data
        delete req.session.data.questionDeleteConfirm
        delete req.session.data.deleteQuestionId
        delete req.session.data.deleteQuestionName

        // Build clean redirect URL
        let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId
        if (unassigned) {
            redirectUrl += '&unassigned=true'
        } else {
            redirectUrl += '&sectionId=' + sectionId
        }

        // Save session and redirect to clean URL
        req.session.save(function(err) {
            if (err) {
                console.log('Session save error:', err)
            }
            res.redirect(redirectUrl)
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

    // Prepare template data directly
    const templateData = {
        currentTaskId: taskId,
        currentSectionId: sectionId,
        currentReportId: reportId,
        taskName: currentTask.taskName,
        reportName: currentReport.reportName,
        sectionName: sectionName,  // <-- ADD THIS LINE
        currentQuestions: currentTask.questions ? [...currentTask.questions] : [],
        isUnassignedTask: unassigned,
        grantName: req.session.data.grantName || 'Sample Grant Name',
        // Pass through any confirmation states
        questionDeleteConfirm: req.session.data.questionDeleteConfirm,
        deleteQuestionId: req.session.data.deleteQuestionId,
        deleteQuestionName: req.session.data.deleteQuestionName,
        taskDeleteConfirm: req.session.data.taskDeleteConfirm,
        deleteTaskId: req.session.data.deleteTaskId,
        deleteTaskName: req.session.data.deleteTaskName
    }

    // Save session before rendering
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        res.render('funding/grant/reports/questions', templateData)
    })
})

// Move question up
router.get('/funding/grant/reports/questions/move-up/:questionId', function (req, res) {
    const questionId = req.params.questionId
    const taskId = req.query.taskId || req.session.data.currentTaskId
    const sectionId = req.query.sectionId || req.session.data.currentSectionId
    const reportId = req.query.reportId || req.session.data.currentReportId
    const unassigned = req.query.unassigned === 'true'

    if (!reportId || !taskId || !questionId) {
        return res.redirect('/funding/grant/reports/')
    }

    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) return res.redirect('/funding/grant/reports/')

    let questions = null
    if (unassigned) {
        const taskIndex = req.session.data.reports[reportIndex].unassignedTasks?.findIndex(task => task.id === taskId)
        if (taskIndex === -1) return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
        questions = req.session.data.reports[reportIndex].unassignedTasks[taskIndex].questions
    } else {
        const sectionIndex = req.session.data.reports[reportIndex].sections?.findIndex(section => section.id === sectionId)
        if (sectionIndex === -1) return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)

        const taskIndex = req.session.data.reports[reportIndex].sections[sectionIndex].tasks?.findIndex(task => task.id === taskId)
        if (taskIndex === -1) return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)

        questions = req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions
    }

    if (!questions) {
        let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId
        if (unassigned) {
            redirectUrl += '&unassigned=true'
        } else {
            redirectUrl += '&sectionId=' + sectionId
        }
        return res.redirect(redirectUrl)
    }

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

    let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId
    if (unassigned) {
        redirectUrl += '&unassigned=true'
    } else {
        redirectUrl += '&sectionId=' + sectionId
    }
    res.redirect(redirectUrl)
})

// Move question down
router.get('/funding/grant/reports/questions/move-down/:questionId', function (req, res) {
    const questionId = req.params.questionId
    const taskId = req.query.taskId || req.session.data.currentTaskId
    const sectionId = req.query.sectionId || req.session.data.currentSectionId
    const reportId = req.query.reportId || req.session.data.currentReportId
    const unassigned = req.query.unassigned === 'true'

    if (!reportId || !taskId || !questionId) {
        return res.redirect('/funding/grant/reports/')
    }

    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) return res.redirect('/funding/grant/reports/')

    let questions = null
    if (unassigned) {
        const taskIndex = req.session.data.reports[reportIndex].unassignedTasks?.findIndex(task => task.id === taskId)
        if (taskIndex === -1) return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
        questions = req.session.data.reports[reportIndex].unassignedTasks[taskIndex].questions
    } else {
        const sectionIndex = req.session.data.reports[reportIndex].sections?.findIndex(section => section.id === sectionId)
        if (sectionIndex === -1) return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)

        const taskIndex = req.session.data.reports[reportIndex].sections[sectionIndex].tasks?.findIndex(task => task.id === taskId)
        if (taskIndex === -1) return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)

        questions = req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions
    }

    if (!questions) {
        let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId
        if (unassigned) {
            redirectUrl += '&unassigned=true'
        } else {
            redirectUrl += '&sectionId=' + sectionId
        }
        return res.redirect(redirectUrl)
    }

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

    let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId
    if (unassigned) {
        redirectUrl += '&unassigned=true'
    } else {
        redirectUrl += '&sectionId=' + sectionId
    }
    res.redirect(redirectUrl)
})

// Deleting a question
router.get('/funding/grant/reports/questions/delete/:questionId', function (req, res) {
    const questionId = req.params.questionId
    const taskId = req.query.taskId || req.session.data.currentTaskId
    const sectionId = req.query.sectionId || req.session.data.currentSectionId
    const reportId = req.query.reportId || req.session.data.currentReportId
    const unassigned = req.query.unassigned === 'true'
    const confirm = req.query.confirm

    if (!reportId || !taskId || !questionId) {
        return res.redirect('/funding/grant/reports/')
    }

    // Find the report
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex === -1) return res.redirect('/funding/grant/reports/')

    // If confirmed, actually delete the question
    if (confirm === 'yes') {
        let questions = null
        if (unassigned) {
            const taskIndex = req.session.data.reports[reportIndex].unassignedTasks?.findIndex(task => task.id === taskId)
            if (taskIndex !== -1) {
                questions = req.session.data.reports[reportIndex].unassignedTasks[taskIndex].questions
                if (questions) {
                    req.session.data.reports[reportIndex].unassignedTasks[taskIndex].questions =
                        questions.filter(question => question.id !== questionId)
                    req.session.data.currentQuestions = [...req.session.data.reports[reportIndex].unassignedTasks[taskIndex].questions]
                }
            }
        } else {
            const sectionIndex = req.session.data.reports[reportIndex].sections?.findIndex(section => section.id === sectionId)
            if (sectionIndex !== -1) {
                const taskIndex = req.session.data.reports[reportIndex].sections[sectionIndex].tasks?.findIndex(task => task.id === taskId)
                if (taskIndex !== -1) {
                    questions = req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions
                    if (questions) {
                        req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions =
                            questions.filter(question => question.id !== questionId)
                        req.session.data.currentQuestions = [...req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].questions]
                    }
                }
            }
        }

        // Clear any confirmation data
        delete req.session.data.questionDeleteConfirm
        delete req.session.data.deleteQuestionId
        delete req.session.data.deleteQuestionName

        // Build redirect URL
        let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId
        if (unassigned) {
            redirectUrl += '&unassigned=true'
        } else {
            redirectUrl += '&sectionId=' + sectionId
        }

        // Force session save before redirecting
        req.session.save(function(err) {
            if (err) {
                console.log('Session save error:', err)
            }
            res.redirect(redirectUrl)
        })
    } else {
        // This shouldn't happen with the new flow, but redirect back if accessed directly
        let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId
        if (unassigned) {
            redirectUrl += '&unassigned=true'
        } else {
            redirectUrl += '&sectionId=' + sectionId
        }
        res.redirect(redirectUrl)
    }
})

// Show edit report page
router.get('/funding/grant/reports/edit/', function (req, res) {
    const reportId = req.query.reportId

    console.log('Edit report GET - reportId:', reportId)

    if (!reportId) {
        console.log('No reportId provided, redirecting to reports')
        return res.redirect('/funding/grant/reports/')
    }

    // ALWAYS get fresh data directly from the reports array
    const currentReport = req.session.data.reports?.find(report => report.id === reportId)
    if (!currentReport) {
        console.log('Report not found with ID:', reportId)
        console.log('Available reports:', req.session.data.reports?.map(r => ({id: r.id, name: r.reportName})))
        return res.redirect('/funding/grant/reports/')
    }

    console.log('Found report:', currentReport.reportName)

    // CLEAR ALL cached data to prevent conflicts
    delete req.session.data.currentReportId
    delete req.session.data.currentReportName
    delete req.session.data.reportName
    delete req.session.data.currentSections

    // Set fresh data directly from the reports array
    req.session.data.currentReportId = reportId
    req.session.data.currentReportName = currentReport.reportName

    console.log('Set currentReportName to:', req.session.data.currentReportName)

    // Don't rely on session save - pass the data directly to the template
    const templateData = {
        currentReportId: reportId,
        currentReportName: currentReport.reportName,
        grantName: req.session.data.grantName || 'Sample Grant Name'
    }

    console.log('Template data:', templateData)

    // Force session save AND pass fresh data to template
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        console.log('About to render edit page with template data:', templateData)

        // Pass the fresh data directly to the template instead of relying on session
        res.render('funding/grant/reports/edit/index', templateData)
    })
})

// Update report name
router.post('/funding/grant/reports/edit/update', function (req, res) {
    const reportId = req.body.reportId
    const newReportName = req.body.reportName

    console.log('Updating report:', reportId, 'to name:', newReportName)

    if (!reportId || !newReportName) {
        console.log('Missing reportId or newReportName, redirecting')
        return res.redirect('/funding/grant/reports/')
    }

    // Find and update the report in the main reports array
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex !== -1) {
        console.log('Found report at index:', reportIndex)
        console.log('Old name:', req.session.data.reports[reportIndex].reportName)

        req.session.data.reports[reportIndex].reportName = newReportName
        req.session.data.reports[reportIndex].lastUpdated = new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
        req.session.data.reports[reportIndex].updatedBy = 'mj@communities.gov.uk'

        console.log('New name:', req.session.data.reports[reportIndex].reportName)
        console.log('Updated report object:', req.session.data.reports[reportIndex])
    } else {
        console.log('Report not found with ID:', reportId)
        console.log('Available reports:', req.session.data.reports.map(r => ({id: r.id, name: r.reportName})))
    }

    // Clear ALL cached session data to force fresh reload
    delete req.session.data.currentReportId
    delete req.session.data.currentReportName
    delete req.session.data.reportName
    delete req.session.data.currentSections

    console.log('About to save session and redirect')

    // Force session save before redirecting
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        } else {
            console.log('Session saved successfully')
        }
        res.redirect('/funding/grant/reports/')
    })
})

// Show edit section page
router.get('/funding/grant/reports/edit/section/', function (req, res) {
    const sectionId = req.query.sectionId
    const reportId = req.query.reportId

    if (!sectionId || !reportId) {
        return res.redirect('/funding/grant/reports/')
    }

    // Get fresh data from the reports array
    const currentReport = req.session.data.reports?.find(report => report.id === reportId)
    if (!currentReport) {
        return res.redirect('/funding/grant/reports/')
    }

    const currentSection = currentReport.sections?.find(section => section.id === sectionId)
    if (!currentSection) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }

    // Update session data with fresh values
    req.session.data.currentSectionId = sectionId
    req.session.data.currentReportId = reportId
    req.session.data.currentSectionName = currentSection.sectionName
    req.session.data.reportName = currentReport.reportName

    // Pass the data directly to the template
    const templateData = {
        currentSectionId: sectionId,
        currentReportId: reportId,
        currentSectionName: currentSection.sectionName,
        reportName: currentReport.reportName,
        grantName: req.session.data.grantName || 'Sample Grant Name'
    }

    // Force session save AND pass fresh data to template
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        // Pass the fresh data directly to the template
        res.render('funding/grant/reports/edit/section/index', templateData)
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

    // Find and update the section in the main reports array
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex !== -1) {
        const sectionIndex = req.session.data.reports[reportIndex].sections.findIndex(section => section.id === sectionId)
        if (sectionIndex !== -1) {
            // Update the section name
            req.session.data.reports[reportIndex].sections[sectionIndex].sectionName = newSectionName

            // Update the report's last updated info
            req.session.data.reports[reportIndex].lastUpdated = new Date().toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
            req.session.data.reports[reportIndex].updatedBy = 'mj@communities.gov.uk'

            // Update the cached sections data with fresh data instead of deleting it
            req.session.data.currentSections = [...req.session.data.reports[reportIndex].sections]
            req.session.data.reportName = req.session.data.reports[reportIndex].reportName
            req.session.data.currentReportId = reportId
        }
    }

    // Only clear the section-specific data, not the data needed by sections page
    delete req.session.data.currentSectionId
    delete req.session.data.currentSectionName

    // Force session save before redirecting
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        // Redirect back to sections page - this will trigger fresh data load
        res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    })
})


// Show edit task page
router.get('/funding/grant/reports/edit/task/', function (req, res) {
    const taskId = req.query.taskId
    const sectionId = req.query.sectionId
    const reportId = req.query.reportId
    const unassigned = req.query.unassigned === 'true'

    if (!taskId || !reportId) {
        return res.redirect('/funding/grant/reports/')
    }

    // Get fresh data from the reports array
    const currentReport = req.session.data.reports?.find(report => report.id === reportId)
    if (!currentReport) {
        return res.redirect('/funding/grant/reports/')
    }

    let currentTask = null
    if (unassigned && currentReport.unassignedTasks) {
        currentTask = currentReport.unassignedTasks.find(task => task.id === taskId)
    } else if (currentReport.sections && sectionId) {
        const currentSection = currentReport.sections.find(section => section.id === sectionId)
        if (!currentSection) {
            return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
        }
        currentTask = currentSection.tasks?.find(task => task.id === taskId)
    }

    if (!currentTask) {
        return res.redirect('/funding/grant/reports/sections?reportId=' + reportId)
    }

    // Update session data with fresh values
    req.session.data.currentTaskId = taskId
    req.session.data.currentSectionId = sectionId
    req.session.data.currentReportId = reportId
    req.session.data.currentTaskName = currentTask.taskName
    req.session.data.reportName = currentReport.reportName
    req.session.data.isUnassignedTask = unassigned

// Pass the data directly to the template
const templateData = {
    currentTaskId: taskId,
    currentSectionId: sectionId,
    currentReportId: reportId,
    currentTaskName: currentTask.taskName,  // ADD THIS LINE
    reportName: currentReport.reportName,
    isUnassignedTask: unassigned,
    grantName: req.session.data.grantName || 'Sample Grant Name'
}

    // Force session save AND pass fresh data to template
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        // Pass the fresh data directly to the template
        res.render('funding/grant/reports/edit/task/index', templateData)
    })
})

// Update task name
router.post('/funding/grant/reports/edit/task/update', function (req, res) {
    const taskId = req.body.taskId
    const sectionId = req.body.sectionId
    const reportId = req.body.reportId
    const newTaskName = req.body.taskName
    const isUnassignedTask = req.body.isUnassignedTask === 'true'

    if (!taskId || !reportId || !newTaskName) {
        return res.redirect('/funding/grant/reports/')
    }

    // Find and update the task in the main reports array
    const reportIndex = req.session.data.reports.findIndex(report => report.id === reportId)
    if (reportIndex !== -1) {
        let taskUpdated = false

        if (isUnassignedTask) {
            // Update unassigned task
            const taskIndex = req.session.data.reports[reportIndex].unassignedTasks?.findIndex(task => task.id === taskId)
            if (taskIndex !== -1) {
                req.session.data.reports[reportIndex].unassignedTasks[taskIndex].taskName = newTaskName
                taskUpdated = true
            }
        } else {
            // Update task within section
            const sectionIndex = req.session.data.reports[reportIndex].sections?.findIndex(section => section.id === sectionId)
            if (sectionIndex !== -1) {
                const taskIndex = req.session.data.reports[reportIndex].sections[sectionIndex].tasks?.findIndex(task => task.id === taskId)
                if (taskIndex !== -1) {
                    req.session.data.reports[reportIndex].sections[sectionIndex].tasks[taskIndex].taskName = newTaskName
                    taskUpdated = true
                }
            }
        }

        if (taskUpdated) {
            // Update the report's last updated info
            req.session.data.reports[reportIndex].lastUpdated = new Date().toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
            req.session.data.reports[reportIndex].updatedBy = 'mj@communities.gov.uk'

            // Update cached data
            req.session.data.currentSections = req.session.data.reports[reportIndex].sections ? 
                [...req.session.data.reports[reportIndex].sections] : []
            req.session.data.currentUnassignedTasks = req.session.data.reports[reportIndex].unassignedTasks ? 
                [...req.session.data.reports[reportIndex].unassignedTasks] : []
            req.session.data.reportName = req.session.data.reports[reportIndex].reportName
            req.session.data.currentReportId = reportId
        }
    }

    // Clear task-specific session data
    delete req.session.data.currentTaskId
    delete req.session.data.currentTaskName
    delete req.session.data.isUnassignedTask

    // Build redirect URL back to questions page
    let redirectUrl = '/funding/grant/reports/questions?taskId=' + taskId + '&reportId=' + reportId
    if (isUnassignedTask) {
        redirectUrl += '&unassigned=true'
    } else {
        redirectUrl += '&sectionId=' + sectionId
    }

    // Force session save before redirecting
    req.session.save(function(err) {
        if (err) {
            console.log('Session save error:', err)
        }
        res.redirect(redirectUrl)
    })
})


module.exports = router