import { $, $$ } from './myjquery.js';
import { updateCurrentFile } from './editorGetData.js';

// Reference to the data service
let dataService = null;

// Create text toolbar element
const textToolbar = document.createElement('div');
textToolbar.className = 'text-toolbar';
textToolbar.innerHTML = `
        <button class="toolbar-button" data-command="bold" title="Bold">
            <img src="./icons/bold.svg" class="icon" alt="Bold">
        </button>
        <button class="toolbar-button" data-command="italic" title="Italic">
            <img src="./icons/italic.svg" class="icon" alt="Italic">
        </button>
        <button class="toolbar-button" data-command="underline" title="Underline">
            <img src="./icons/underline.svg" class="icon" alt="Underline">
        </button>
        <button class="toolbar-button" data-command="fontSize" title="Text Size">
            <img src="./icons/size.svg" class="icon" alt="Text Size">
        </button>
        <span class="border"></span>
        <button class="toolbar-button" data-command="justifyLeft" title="Align Left">
            <img src="./icons/textleft.svg" class="icon" alt="Align Left">
        </button>
        <button class="toolbar-button" data-command="justifyCenter" title="Align Center">
            <img src="./icons/textmiddle.svg" class="icon" alt="Align Center">
        </button>
        <button class="toolbar-button" data-command="justifyRight" title="Align Right">
            <img src="./icons/textright.svg" class="icon" alt="Align Right">
        </button>
        <span class="border"></span>
        <button class="toolbar-button" data-command="foreColor" title="Text Color">
            <img src="./icons/textcolor.svg" class="icon" alt="Text Color">
        </button>
        <button class="toolbar-button" data-command="backColor" title="Background Color">
            <img src="./icons/textfill.svg" class="icon" alt="Background Color">
        </button>
        <button class="toolbar-button" data-command="formatCode" title="Code">
            <img src="./icons/code.svg" class="icon" alt="Code">
        </button>
        <button class="toolbar-button" data-command="createLink" title="Link">
            <img src="./icons/link.svg" class="icon" alt="Link">
        </button>
`;

// Create color picker submenu
const colorSubmenu = document.createElement('div');
colorSubmenu.className = 'color-submenu';
colorSubmenu.innerHTML = `
    <div class="color-grid">
        <div class="color-option" style="background-color: #000000;" data-color="#000000"></div>
        <div class="color-option" style="background-color: #e74c3c;" data-color="#e74c3c"></div>
        <div class="color-option" style="background-color: #e67e22;" data-color="#e67e22"></div>
        <div class="color-option" style="background-color: #f1c40f;" data-color="#f1c40f"></div>
        <div class="color-option" style="background-color: #2ecc71;" data-color="#2ecc71"></div>
        <div class="color-option" style="background-color: #1abc9c;" data-color="#1abc9c"></div>
        <div class="color-option" style="background-color: #ffffff;" data-color="#ffffff"></div>
        <div class="color-option" style="background-color: #3498db;" data-color="#3498db"></div>
        <div class="color-option" style="background-color: #9b59b6;" data-color="#9b59b6"></div>
        <div class="color-option" style="background-color: #34495e;" data-color="#34495e"></div>
        <div class="color-option" style="background-color: #7f8c8d;" data-color="#7f8c8d"></div>
        <div class="color-option" style="background-color: #bdc3c7;" data-color="#bdc3c7"></div>
    </div>
    <div class="custom-color-option">
        <input type="text" class="custom-color-input" placeholder="#hexcode">
    </div>
`;

// Create link dialog
const linkDialog = document.createElement('div');
linkDialog.className = 'link-dialog';
linkDialog.innerHTML = `
    <input type="text" class="link-url-input" placeholder="Enter URL">
    <input type="text" class="link-text-input" placeholder="Link text (optional)">
    <div class="dialog-buttons">
        <button class="apply-link">Apply</button>
        <button class="cancel">Cancel</button>
    </div>
`;

// Add elements to the DOM
document.body.appendChild(textToolbar);
textToolbar.appendChild(colorSubmenu);
textToolbar.appendChild(linkDialog);

// Current active element and command
let activeElement = null;
let activeCommand = null;

// Initialize the text toolbar functionality
export function initTextToolbar(dataServiceInstance) {
    // Set dataService reference
    dataService = dataServiceInstance;
    
    // Enable StyleWithCSS for better color handling
    document.execCommand('styleWithCSS', false, true);

    // Set up event listeners for contenteditable elements
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);
    document.addEventListener('focus', handleSelection, true); // Capture phase
    
    // Add listener for scroll events to update toolbar position
    window.addEventListener('scroll', updateToolbarPosition);
    
    // Add focus listeners to all contenteditable elements
    addFocusListenersToEditableElements();
    
    // Set up toolbar button click handlers
    textToolbar.querySelectorAll('.toolbar-button').forEach(button => {
        button.addEventListener('click', handleToolbarButtonClick);
    });

    // Initialize existing contenteditable elements
    // Use MutationObserver to detect new contenteditable elements
    setupEditableMutationObserver();

    // Set up color options click handlers
    colorSubmenu.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', handleColorOptionClick);
    });

    // Set up custom color input handler
    colorSubmenu.querySelector('.custom-color-input').addEventListener('keydown', handleCustomColorInput);

    // Set up link dialog button handlers
    linkDialog.querySelector('.apply-link').addEventListener('click', applyLink);
    linkDialog.querySelector('.cancel').addEventListener('click', hideSubmenus);

    // Close toolbar and submenus when clicking outside
    document.addEventListener('click', handleDocumentClick);
}

// Handle selection or focus on contenteditable elements
function handleSelection(event) {
    // Find the active contenteditable element
    let element = null;
    
    // Check if the event is a focus event
    if (event.type === 'focus' && event.target.hasAttribute('contenteditable')) {
        element = event.target;
    } else {
        // Check for selection
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        let node = selection.anchorNode;
        while (node && node.nodeType !== 1) {
            node = node.parentNode;
        }
        
        if (node && node.hasAttribute('contenteditable')) {
            element = node;
        }
    }
    
    if (!element) {
        // No contenteditable element found
        return;
    }
    
    // Store the active element
    activeElement = element;
    
    // Position and show the toolbar
    showTextToolbar(element);
}

// Show the text toolbar above the selection
function showTextToolbar(element) {
    // Hide any open submenus
    hideSubmenus();
    
    // Get element position
    const rect = element.getBoundingClientRect();
    
    // Position the toolbar, considering scroll position
    textToolbar.style.left = `${rect.left + window.pageXOffset}px`;
    textToolbar.style.top = `${rect.top + window.pageYOffset - 45}px`;
    textToolbar.style.display = 'block';
}

// Hide the text toolbar
function hideTextToolbar() {
    textToolbar.style.display = 'none';
    hideSubmenus();
    activeElement = null;
}

// Hide all submenus
function hideSubmenus() {
    // Hide color submenu
    colorSubmenu.style.display = 'none';
    // Hide link dialog
    linkDialog.style.display = 'none';
    // Reset active command
    activeCommand = null;
}

// Handle toolbar button clicks
function handleToolbarButtonClick(event) {
    event.stopPropagation();
    
    const button = event.currentTarget;
    const command = button.dataset.command;
    
    // Toggle active state for buttons with submenus
    if (['foreColor', 'backColor', 'createLink', 'fontSize'].includes(command)) {
        if (activeCommand === command) {
            // If same command is clicked again, hide submenu
            hideSubmenus();
            return;
        }
        
        // Hide any open submenus
        hideSubmenus();
        
        // Set as active command
        activeCommand = command;
        
        // Show appropriate submenu
        if (command === 'foreColor' || command === 'backColor') {
            showColorSubmenu(button, command);
        } else if (command === 'createLink') {
            showLinkDialog(button);
        } else if (command === 'fontSize') {
            // TODO: Implement font size submenu if needed
            document.execCommand('fontSize', false, prompt('Enter font size (1-7):', '3'));
            updateAfterEdit();
        }
    } else {
        // Execute command directly
        if (command === 'formatCode') {
            formatAsCode();
        } else {
            document.execCommand(command, false, null);
        }
        updateAfterEdit();
    }
}

// Show color submenu
function showColorSubmenu(button, command) {
    // Get button position
    const buttonRect = button.getBoundingClientRect();
    
    // Calculate position for the submenu
    const toolbarRect = textToolbar.getBoundingClientRect();
    
    // Position the submenu below the button
    // We don't need to add page offset here because it's positioned relative to the toolbar
    colorSubmenu.style.left = `${buttonRect.left - toolbarRect.left}px`;
    colorSubmenu.style.top = `${buttonRect.height + 5}px`;
    colorSubmenu.style.display = 'block';
    
    // Store the command to be executed when a color is selected
    colorSubmenu.dataset.command = command;
}

// Show link dialog
function showLinkDialog(button) {
    // Get button position
    const buttonRect = button.getBoundingClientRect();
    
    // Calculate position for the submenu
    const toolbarRect = textToolbar.getBoundingClientRect();
    
    // Get selected text
    const selection = window.getSelection();
    let selectedText = '';
    if (selection.rangeCount > 0) {
        selectedText = selection.toString();
    }
    
    // Pre-fill text input if text is selected
    linkDialog.querySelector('.link-text-input').value = selectedText;
    
    // Position and show the dialog under the button
    // We don't need to add page offset here because it's positioned relative to the toolbar
    linkDialog.style.left = `${buttonRect.left - toolbarRect.left}px`;
    linkDialog.style.top = `${buttonRect.height + 5}px`;
    linkDialog.style.display = 'block';
    
    // Focus on URL input
    linkDialog.querySelector('.link-url-input').focus();
}

// Helper functions for selection management
// Save current selection/caret position
function saveSelection(containerEl) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (containerEl.contains(range.commonAncestorContainer)) {
            return range.cloneRange();
        }
    }
    return null;
}

// Restore selection/caret position
function restoreSelection(savedSelection) {
    if (savedSelection) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedSelection);
        return true;
    }
    return false;
}

// Handle color option click
function handleColorOptionClick(event) {
    event.stopPropagation();
    
    const color = event.currentTarget.dataset.color;
    const command = colorSubmenu.dataset.command;
    
    // Make sure the active element has focus
    if (activeElement) {
        activeElement.focus();
        
        // Apply color using execCommand with appropriate command
        if (command === 'foreColor') {
            document.execCommand('foreColor', false, color);
        } else if (command === 'backColor') {
            // Some browsers use 'hiliteColor' for background color
            try {
                document.execCommand('hiliteColor', false, color);
            } catch (e) {
                document.execCommand('backColor', false, color);
            }
        }
        
        // If no text was selected, we'll insert a colored space
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.getRangeAt(0).collapsed) {
            // Create a non-breaking space with the color
            const span = document.createElement('span');
            if (command === 'foreColor') {
                span.style.color = color;
            } else {
                span.style.backgroundColor = color;
            }
            span.innerHTML = '&nbsp;';
            
            // Insert the colored space
            const range = selection.getRangeAt(0);
            range.insertNode(span);
            
            // Move cursor after the span
            range.setStartAfter(span);
            range.setEndAfter(span);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    
    hideSubmenus();
    updateAfterEdit();
}

// Handle custom color input
function handleCustomColorInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        
        const color = event.currentTarget.value;
        const command = colorSubmenu.dataset.command;
        
        // Validate color format
        if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
            if (command === 'foreColor') {
                document.execCommand('foreColor', false, color);
            } else if (command === 'backColor') {
                try {
                    document.execCommand('hiliteColor', false, color);
                } catch (e) {
                    document.execCommand('backColor', false, color);
                }
            }
            hideSubmenus();
            updateAfterEdit();
        }
    }
}

// Apply link from dialog
function applyLink(event) {
    event.stopPropagation();
    
    const url = linkDialog.querySelector('.link-url-input').value.trim();
    const text = linkDialog.querySelector('.link-text-input').value.trim();
    
    if (url) {
        // If text is provided and no text is selected, insert new link
        const selection = window.getSelection();
        if (text && selection.toString() === '') {
            // Create a new link element
            const link = document.createElement('a');
            link.href = url;
            link.textContent = text;
            
            // Insert at cursor position
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(link);
            
            // Move cursor after the link
            selection.collapseToEnd();
        } else {
            // Apply link to selected text
            document.execCommand('createLink', false, url);
        }
        
        hideSubmenus();
        updateAfterEdit();
    }
}

// Format selected text as code
function formatAsCode() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    if (selectedText) {
        // Create code element
        const codeElement = document.createElement('code');
        codeElement.textContent = selectedText;
        
        // Replace selected text with code element
        range.deleteContents();
        range.insertNode(codeElement);
        
        // Move cursor after the code element
        selection.collapseToEnd();
        
        updateAfterEdit();
    }
}

// Update data after editing
function updateAfterEdit() {
    if (dataService) {
        setTimeout(() => {
            updateCurrentFile(dataService);
        }, 100);
    }
}

// Close toolbar when clicking outside
function handleDocumentClick(event) {
    // Check if click is inside toolbar or active element or its submenus
    if (!textToolbar.contains(event.target) && 
        (!activeElement || !activeElement.contains(event.target))) {
        hideTextToolbar();
    }
}

// Add focus listeners to all contenteditable elements
function addFocusListenersToEditableElements() {
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.addEventListener('focus', handleSelection);
        el.addEventListener('blur', function(e) {
            // Only hide if not focusing another editable element
            // or clicking on the toolbar
            if (!textToolbar.contains(e.relatedTarget)) {
                // Use timeout to allow other handlers to execute first
                setTimeout(() => {
                    if (!document.activeElement.hasAttribute('contenteditable') && 
                        !textToolbar.contains(document.activeElement)) {
                        hideTextToolbar();
                    }
                }, 100);
            }
        });
    });
}

// Set up mutation observer to detect new contenteditable elements
function setupEditableMutationObserver() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    // Check if the node is an element and has contenteditable
                    if (node.nodeType === 1) { // ELEMENT_NODE
                        if (node.hasAttribute('contenteditable')) {
                            node.addEventListener('focus', handleSelection);
                            node.addEventListener('blur', handleBlur);
                        }
                        // Check child nodes
                        node.querySelectorAll('[contenteditable="true"]').forEach(el => {
                            el.addEventListener('focus', handleSelection);
                            el.addEventListener('blur', handleBlur);
                        });
                    }
                });
            }
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Handle blur events
function handleBlur(e) {
    // Only hide if not focusing another editable element
    // or clicking on the toolbar
    if (!textToolbar.contains(e.relatedTarget)) {
        // Use timeout to allow other handlers to execute first
        setTimeout(() => {
            if (!document.activeElement.hasAttribute('contenteditable') && 
                !textToolbar.contains(document.activeElement)) {
                hideTextToolbar();
            }
        }, 100);
    }
}

// Update toolbar position on scroll
function updateToolbarPosition() {
    // Only update if toolbar is visible and we have an active element
    if (textToolbar.style.display === 'block' && activeElement) {
        // Get the updated position of the active element
        const rect = activeElement.getBoundingClientRect();
        
        // Update the toolbar position with scroll offset
        textToolbar.style.left = `${rect.left + window.pageXOffset}px`;
        textToolbar.style.top = `${rect.top + window.pageYOffset - 45}px`;
    }
}