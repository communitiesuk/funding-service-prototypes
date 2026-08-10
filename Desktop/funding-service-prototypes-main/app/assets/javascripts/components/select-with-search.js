import Choices from "../vendor/choices.mjs";

/**
 * Select with search, lifted from funding-service (which vendored it from the exemplar in
 * xgovuk-flask-admin, in turn adapted from the select-with-search component in
 * govuk_publishing_components). Progressive enhancement of a
 * <select data-module="select-with-search"> using Choices.js.
 *
 * Supports per-option hint text: any <option data-hint="..."> has its hint rendered
 * below the option label in the dropdown.
 */
export default function selectWithSearch(selectEl) {
    if (!selectEl.matches("select")) {
        console.error("select-with-search must be applied to a select element");
        return;
    }

    const placeholderOption = selectEl.querySelector(
        'option[value=""]:first-child',
    );
    if (placeholderOption && placeholderOption.textContent === "") {
        placeholderOption.textContent = selectEl.multiple
            ? "Select all that apply"
            : "Select one";
    }

    const describedBy = selectEl.getAttribute("aria-describedby") || "";
    const labelId = `${selectEl.id}-label ${describedBy}`.trim();

    const hintsByValue = new Map();
    for (const option of selectEl.options) {
        if (option.dataset.hint) {
            hintsByValue.set(option.value, option.dataset.hint);
        }
    }

    new Choices(selectEl, {
        allowHTML: false,
        searchPlaceholderValue: "Search in list",
        shouldSort: false,
        itemSelectText: "",
        searchResultLimit: 100,
        removeItemButton: selectEl.multiple,
        labelId: labelId,
        fuseOptions: {
            ignoreLocation: true,
            threshold: 0,
        },
        callbackOnInit() {
            if (this.dropdown.type === "select-multiple") {
                this.containerInner.element.prepend(this.input.element);
            }
            this.itemList.element.setAttribute("aria-labelledby", labelId);
        },
        callbackOnCreateTemplates() {
            const defaultTemplates = Choices.defaults.templates;
            return {
                choice(...args) {
                    const element = defaultTemplates.choice.call(this, ...args);
                    const hint = hintsByValue.get(String(args[1].value));
                    if (hint) {
                        const hintEl = document.createElement("span");
                        hintEl.className =
                            "app-select-with-search__option-hint";
                        hintEl.textContent = hint;
                        element.appendChild(hintEl);
                    }
                    return element;
                },
            };
        },
    });
}
