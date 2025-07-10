const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const GrantsDataManager = require('../data/GrantsDataManager')

// Grants listing page
router.get('/funding/grants', function (req, res) {
    // Ensure grants array exists in session
    if (!req.session.data.grants) {
        req.session.data.grants = [];
    }
    
    const dataManager = new GrantsDataManager(req.session.data);
    
    // Debug session data
    console.log('=== GRANTS LISTING DEBUG ===');
    console.log('Session data.grants:', req.session.data.grants);
    console.log('Session data keys:', Object.keys(req.session.data));
    
    // Get all grants for display - always get fresh data
    const allGrants = dataManager.getGrants();
    req.session.data.allGrants = allGrants;
    
    console.log('DataManager.getGrants() returned:', allGrants);
    console.log('allGrants length:', allGrants.length);
    console.log('Setting req.session.data.allGrants to:', allGrants);
    console.log('=== END DEBUG ===');
    
    res.render('funding/grants')
})

// Start grant setup
router.get('/funding/grant/add/', function (req, res) {
    // Clear any existing grant setup data
    delete req.session.data['grant-ggis'];
    delete req.session.data['grant-ggisNumber'];
    delete req.session.data['grantName'];
    delete req.session.data['grant-description'];
    delete req.session.data['grant-primaryContactName'];
    delete req.session.data['grant-primaryContactEmail'];
    
    res.render('funding/grant/add/index')
})

// Handle POST from start page (form action="/funding/grant/add/ggis-number")
router.post('/funding/grant/add/ggis-number', function (req, res) {
    // This handles the form from index.html - just show the GGIS page
    res.render('funding/grant/add/ggis-number')
})

// GGIS number page
router.get('/funding/grant/add/ggis-number', function (req, res) {
    res.render('funding/grant/add/ggis-number')
})

// Handle POST from GGIS page (form action="/funding/grant/add/name") 
router.post('/funding/grant/add/name', function (req, res) {
    const grantGgis = req.body['grant-ggis'];
    const ggisNumber = req.body['grant-ggisNumber'];
    
    // Store the GGIS data
    req.session.data['grant-ggis'] = grantGgis;
    if (ggisNumber) {
        req.session.data['grant-ggisNumber'] = ggisNumber;
    }
    
    // Handle the redirect based on selection
    if (grantGgis === 'No~/funding/grant/add/cannot-continue') {
        return res.redirect('/funding/grant/add/cannot-continue');
    }
    
    // Show the name page
    res.render('funding/grant/add/name');
})

// Cannot continue page
router.get('/funding/grant/add/cannot-continue', function (req, res) {
    res.render('funding/grant/add/cannot-continue')
})

// Grant name page
router.get('/funding/grant/add/name', function (req, res) {
    res.render('funding/grant/add/name')
})

// Handle POST from name page (form action="/funding/grant/add/description")
router.post('/funding/grant/add/description', function (req, res) {
    const grantName = req.body.grantName;
    const dataManager = new GrantsDataManager(req.session.data);
    
    // Check if grant name already exists
    if (dataManager.grantNameExists(grantName)) {
        console.log('Grant name already exists:', grantName);
    }
    
    req.session.data.grantName = grantName;
    
    // Handle change flow
    if (req.query.change === 'yes') {
        return res.redirect('/funding/grant/add/summary?notification=&change=');
    }
    
    // Show the description page
    res.render('funding/grant/add/description');
})

// Grant description page
router.get('/funding/grant/add/description', function (req, res) {
    res.render('funding/grant/add/description')
})

// Handle POST from description page (form action="/funding/grant/add/primary-contact-details")
router.post('/funding/grant/add/primary-contact-details', function (req, res) {
    // Store the description
    req.session.data['grant-description'] = req.body['grant-description'];
    
    // Handle change flow
    if (req.query.change === 'yes') {
        return res.redirect('/funding/grant/add/summary?notification=&change=');
    }
    
    // Show the primary contact details page
    res.render('funding/grant/add/primary-contact-details');
})

// Primary contact details page
router.get('/funding/grant/add/primary-contact-details', function (req, res) {
    res.render('funding/grant/add/primary-contact-details')
})

// Handle POST from primary contact details page (form action="/funding/grant/add/summary")
router.post('/funding/grant/add/summary', function (req, res) {
    // Store the contact details
    req.session.data['grant-primaryContactName'] = req.body['grant-primaryContactName'];
    req.session.data['grant-primaryContactEmail'] = req.body['grant-primaryContactEmail'];
    
    // Handle change flow
    if (req.query.change === 'yes') {
        return res.redirect('/funding/grant/add/summary?notification=&change=');
    }
    
    // Show the summary page
    res.render('funding/grant/add/summary');
})

// Summary page
router.get('/funding/grant/add/summary', function (req, res) {
    res.render('funding/grant/add/summary')
})

// Handle POST from summary page (form action="/funding/grant/")
router.post('/funding/grant/', function (req, res) {
    console.log('=== GRANT CREATION DEBUG ===');
    console.log('Session data before creation:', req.session.data);
    
    const dataManager = new GrantsDataManager(req.session.data);
    
    console.log('Creating grant with data:', {
        grantName: req.session.data.grantName,
        ggisNumber: req.session.data['grant-ggisNumber'],
        description: req.session.data['grant-description'],
        primaryContactName: req.session.data['grant-primaryContactName'],
        primaryContactEmail: req.session.data['grant-primaryContactEmail']
    });
    
    // Create the new grant
    const newGrant = dataManager.addGrant({
        grantName: req.session.data.grantName,
        ggisNumber: req.session.data['grant-ggisNumber'],
        description: req.session.data['grant-description'],
        primaryContactName: req.session.data['grant-primaryContactName'],
        primaryContactEmail: req.session.data['grant-primaryContactEmail']
    });
    
    console.log('Created new grant:', newGrant);
    console.log('All grants after creation:', dataManager.getGrants());
    console.log('Session grants array after creation:', req.session.data.grants);
    console.log('Session data keys after creation:', Object.keys(req.session.data));
    console.log('=== END GRANT CREATION DEBUG ===');
    
    // Set the current grant name for the next page
    req.session.data.currentGrantName = newGrant.grantName;
    
    // Clear the setup data
    delete req.session.data['grant-ggis'];
    delete req.session.data['grant-ggisNumber'];
    delete req.session.data['grant-description'];
    delete req.session.data['grant-primaryContactName'];
    delete req.session.data['grant-primaryContactEmail'];
    
    // Redirect to the grant overview page
    res.redirect('/funding/grant/?grantName=' + encodeURIComponent(newGrant.grantName));
})

// Individual grant page
router.get('/funding/grant/', function (req, res) {
    const grantName = req.query.grantName || req.session.data.currentGrantName;
    const dataManager = new GrantsDataManager(req.session.data);
    
    if (!grantName) {
        return res.redirect('/funding/grants');
    }
    
    const currentGrant = dataManager.getGrant(grantName);
    if (!currentGrant) {
        return res.redirect('/funding/grants');
    }
    
    // Set the grant name for other parts of the system to use
    req.session.data.grantName = grantName;
    req.session.data.currentGrant = currentGrant;
    
    res.render('funding/grant/index');
})

module.exports = router