//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

function setToggleVisuallyHiddenText(el) {
    if (localStorage.getItem('prototype-reveal-hidden') === 'true') {
        el.textContent = 'Hide visually revealed';
    } else {
        el.textContent = 'Show visually hidden';
    }
}

function revealHiddenText() {
    let hiddenElements = document.querySelectorAll('.govuk-visually-hidden');
    for (const hiddenElement of hiddenElements) {
        if (hiddenElement.classList.contains('govuk-phase-banner')) {continue;}

        hiddenElement.classList.remove('govuk-visually-hidden');
        hiddenElement.classList.add('prototype-visually-revealed');
    }
}

function hideRevealedText() {
    let revealedElements = document.querySelectorAll('.prototype-visually-revealed');
    for (const revealedElement of revealedElements) {
        revealedElement.classList.remove('prototype-visually-revealed');
        revealedElement.classList.add('govuk-visually-hidden');
    }
}

function setTogglePhaseBannerText(el) {
    if (localStorage.getItem('prototype-hide-phase-banner') === 'true') {
        el.textContent = 'Show phase banner';
    } else {
        el.textContent = 'Hide phase banner';
    }
}

function togglePhaseBanner() {
    const phaseBanner = document.querySelector('.govuk-phase-banner');
    phaseBanner.classList.toggle('govuk-visually-hidden');
}

window.GOVUKPrototypeKit.documentReady(() => {
  // Add JavaScript here
    "use strict";

    const toggleVisuallyHiddenElement = document.querySelector('[data-module="prototype-reveal-hidden"]');
    toggleVisuallyHiddenElement.addEventListener('click', (e) => {
        e.preventDefault();

        let revealed = localStorage.getItem('prototype-reveal-hidden');
        if (revealed === 'false' || revealed === null) {
            revealHiddenText();
            localStorage.setItem('prototype-reveal-hidden', 'true');
        } else {
            hideRevealedText();
            localStorage.setItem('prototype-reveal-hidden', 'false');
        }

        setToggleVisuallyHiddenText(toggleVisuallyHiddenElement);
    });

    // Reveal hidden text on page load if we're in revealed-mode. Allows this to last across page loads/sessions.
    if (localStorage.getItem('prototype-reveal-hidden') === 'true') {
        revealHiddenText();
    };
    setToggleVisuallyHiddenText(toggleVisuallyHiddenElement);

    const togglePhaseBannerElement = document.querySelector('[data-module="prototype-toggle-phase-banner"]');
    togglePhaseBannerElement.addEventListener('click', (e) => {
        e.preventDefault();

        let revealed = localStorage.getItem('prototype-hide-phase-banner');
        if (revealed === 'false' || revealed === null) {
            localStorage.setItem('prototype-hide-phase-banner', 'true');
        } else {
            localStorage.setItem('prototype-hide-phase-banner', 'false');
        }
        togglePhaseBanner();
        setTogglePhaseBannerText(togglePhaseBannerElement);
    });

    // Hide phase banner on page load if we're in hidden-mode. Allows this to last across page loads/sessions.
    if (localStorage.getItem('prototype-hide-phase-banner') === 'true') {
        togglePhaseBanner();
    }
    setTogglePhaseBannerText(togglePhaseBannerElement);
})
