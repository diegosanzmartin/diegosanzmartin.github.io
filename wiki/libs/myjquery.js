const $ = el => document.querySelector(el);
const $$ = el => document.querySelectorAll(el);

// Function to get all editable elements
const $editable = () => document.querySelectorAll('[contenteditable="true"]');

// Function to create a new element with attributes
const $create = (tag, attrs = {}) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
        el.setAttribute(key, value);
    });
    return el;
};

export { $, $$, $editable, $create };