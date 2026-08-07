MHCLG Funding Service Prototype
Documentation

This repository contains the GOV.UK Prototype for the MHCLG Funding Service, encompassing both the Access grant funding (external applicant journey) and Deliver grant funding (internal Grant Policy Team journey) services.

This prototype is built using the GOV.UK Prototype Kit. It allows for the rapid design and testing of user journeys, the validation of complex policy requirements, and iteration on feedback before building production-ready software.

--------------------------------------------------

Getting Started

To run this prototype locally, Node.js needs to be installed.

1. Clone the repository: 
   git clone [your-repo-link]
   cd [your-repo-name]

2. Install dependencies: 
   npm install

3. Run the prototype: 
   npm run dev

4. View in your browser: 
   Open http://localhost:3000

--------------------------------------------------

Interesting Features Built in this Prototype

To solve complex user needs, several advanced design patterns have been implemented in this prototype:

* Tabbed Interfaces with Sticky Navigation: To prevent cognitive overload on the internal review hub, the long-form application data ("Responses") is separated from the audit trail ("Timeline") using tabs. A sticky navigation menu is also implemented inside the tabs to reduce scroll fatigue when reviewing long grant submissions.

* Role-Based Status Tags: Contextual tags are implemented that change based on the user's role. For example, if a policy team member requests a change, the applicant sees "Changes requested", but once returned, the policy team sees "Submitted with changes". In-form "Changed" tags are also used to highlight specific field updates.

* Accessible Autocomplete (Type-ahead): The selectWithSearch macro is utilized to convert standard, overwhelming drop-downs (like the list of 300+ Local Authorities or various Grants) into easily searchable, accessible text inputs.

--------------------------------------------------

Developer Hints & Best Practices

1. Passing and Displaying Data

The GOV.UK Prototype Kit automatically stores form data in a session variable called 'data'. When a form is submitted, the 'name' attribute of the input becomes the key.

Example Input:
<input class="govuk-input" id="company-search" name="companySearch" type="text">

Displaying that data on the next page:
The stored data can be printed anywhere using Nunjucks. It is best practice to provide a fallback value in case the user skips the step or the session drops:

You searched for: {{ data['companySearch'] or 'REDCROSS' }}


2. Routing Users Between Pages

There are two ways to handle routing in this prototype: Front-end (JavaScript) and Back-end (Express).

Method A: Simple Front-end Routing (Quick validations)
Inline scripts can be used to intercept form submissions and route users based on their radio button selections.

document.getElementById('la-request-form').addEventListener('submit', function(event) {
  event.preventDefault(); 
  const selectedRadio = document.querySelector('input[name="laRequest"]:checked');
  
  if (selectedRadio) {
    if (selectedRadio.value === 'none') {
      window.location.href = 'la_select'; // Go to local authority select
    } else {
      window.location.href = 'grant_select'; // Go to grant select
    }
  }
});


Method B: Back-end Routing (Standard Prototype Kit approach)
For more complex logic, the app/routes.js file should be used. This is the recommended GOV.UK way.

// In app/routes.js
const express = require('express')
const router = express.Router()

router.post('/charity-answer', function (req, res) {
  var isRegistered = req.session.data['charityRegistered']

  if (isRegistered === "yes") {
    res.redirect('/search_charity_register')
  } else {
    res.redirect('/support_desk')
  }
})


--------------------------------------------------

Useful GOV.UK Resources

Whenever designing new pages or components, refer to these central resources first:

* GOV.UK Design System: The single source of truth for all components, typography, styles, and patterns (search for it online).
* GOV.UK Prototype Kit Documentation: Tutorials on passing data, routing, and using Nunjucks.
* Accessible Autocomplete Component: Documentation for the progressive enhancement search dropdowns used for local authorities and grants.