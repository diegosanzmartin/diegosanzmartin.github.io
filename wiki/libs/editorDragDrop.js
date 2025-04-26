import { $ } from './myjquery.js';
import { updateCurrentFile } from './editorGetData.js';

const $editor = $("editor");
let draggedElement = null;
let draggedElementIndex = -1;
let dragOverElement = null;

/**
 * Initialize drag and drop functionality for editor lines
 * @param {DataService} dataService - Data service for saving changes
 */
export function initDragAndDrop(dataService) {
    // Now works with the current file in the dataService instead of the entire data
    console.log('Inicializando funcionalidad de drag & drop...');
    
    // Set up drag and drop events on the editor
    $editor.addEventListener('dragstart', handleDragStart);
    $editor.addEventListener('dragover', handleDragOver);
    $editor.addEventListener('dragleave', handleDragLeave);
    $editor.addEventListener('drop', handleDrop);
    $editor.addEventListener('dragend', handleDragEnd);
    
    // Prevent default dragenter behavior on document to avoid interference
    document.addEventListener('dragenter', (e) => {
        e.preventDefault();
        return false;
    });
    
    /**
     * Handle the start of a drag operation
     */
    function handleDragStart(e) {
        // Ensure we're only dragging from the grab handle
        if (!e.target.matches('img[src*="grab"]')) {
            e.preventDefault();
            return false;
        }
        
        // Find the parent line element
        draggedElement = e.target.closest('line');
        if (!draggedElement) {
            e.preventDefault();
            return false;
        }

        // Store the current index for later use
        const lines = Array.from($editor.querySelectorAll('line'));
        draggedElementIndex = lines.indexOf(draggedElement);
        
        // Set data for the drag operation
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedElement.getAttribute('data-id'));
        
        // Make elements inside the dragged line non-editable during drag
        const editableElements = draggedElement.querySelectorAll('[contenteditable="true"]');
        editableElements.forEach(el => {
            el.setAttribute('data-contenteditable-backup', 'true');
            el.setAttribute('contenteditable', 'false');
        });
        
        // Add dragging class after a small delay (helps with initial visual feedback)
        setTimeout(() => {
            draggedElement.classList.add('line-dragging');
        }, 0);
        
        return true;
    }

    /**
     * Handle dragover event to allow dropping
     */
    function handleDragOver(e) {
        // Only process if we're dragging a line
        if (!draggedElement) return true;
        
        e.preventDefault(); // Necessary to allow dropping
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        // Determine the target line
        const targetLine = getTargetLine(e);
        
        // If we have a valid target, highlight it as a drop zone
        if (targetLine && targetLine !== draggedElement) {
            // Remove highlight from previous target if it's different
            if (dragOverElement && dragOverElement !== targetLine) {
                dragOverElement.classList.remove('line-drag-over');
            }
            
            // Highlight new target
            targetLine.classList.add('line-drag-over');
            dragOverElement = targetLine;
        }
        
        return false;
    }
    
    /**
     * Get the target line element based on mouse position
     */
    function getTargetLine(e) {
        // Get the element directly under the mouse
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);
        
        // If we're over the editor but not over a line, find the nearest line
        if (targetElement && !targetElement.closest('line')) {
            const editorRect = $editor.getBoundingClientRect();
            const mouseY = e.clientY;
            
            // Get all lines and their positions
            const lines = Array.from($editor.querySelectorAll('line'));
            
            // Find the nearest line based on vertical position
            let nearestLine = null;
            let nearestDistance = Number.MAX_VALUE;
            
            for (const line of lines) {
                if (line === draggedElement) continue;
                
                const rect = line.getBoundingClientRect();
                const middle = rect.top + rect.height / 2;
                const distance = Math.abs(mouseY - middle);
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestLine = line;
                }
            }
            
            return nearestLine;
        }
        
        // Return the line element under the mouse, or null
        return targetElement ? targetElement.closest('line') : null;
    }

    /**
     * Handle when dragged element leaves a drop target
     */
    function handleDragLeave(e) {
        // Only process if we're dragging a line
        if (!draggedElement) return;
        
        const relatedTarget = e.relatedTarget;
        
        // Check if we've left the editor or moved to a different line
        if (!relatedTarget || !$editor.contains(relatedTarget)) {
            // If we've left the editor, remove all highlights
            if (dragOverElement) {
                dragOverElement.classList.remove('line-drag-over');
                dragOverElement = null;
            }
        }
    }

    /**
     * Handle dropping the element at a new position
     */
    function handleDrop(e) {
        // Prevent default behavior
        e.preventDefault();
        e.stopPropagation();
        
        // Only process if we're dragging a line
        if (!draggedElement) return;
        
        // Find the drop target line
        const targetLine = getTargetLine(e);
        
        // Perform the move if we have a valid target
        if (targetLine && targetLine !== draggedElement) {
            // Get all lines to determine the new index
            const lines = Array.from($editor.querySelectorAll('line'));
            const targetIndex = lines.indexOf(targetLine);
            
            // Determine where to insert the dragged element
            const insertBeforePosition = targetIndex > draggedElementIndex;
            
            // Move the element in the DOM
            if (insertBeforePosition) {
                $editor.insertBefore(draggedElement, targetLine.nextSibling);
            } else {
                $editor.insertBefore(draggedElement, targetLine);
            }
            
            // Calculate the new index for the data model
            let newIndex = targetIndex;
            if (draggedElementIndex < targetIndex && !insertBeforePosition) {
                newIndex -= 1;
            } else if (draggedElementIndex > targetIndex && insertBeforePosition) {
                newIndex += 1;
            }
            
            // Use the dataService to update the data model
            const draggedId = draggedElement.getAttribute('data-id');
            dataService.moveLine(draggedId, newIndex);
            
            // Update the current file directly
            updateCurrentFile(dataService);
        }
        
        // Clean up
        cleanupDragOperation();
        
        return false;
    }

    /**
     * Handle the end of a drag operation
     */
    function handleDragEnd(e) {
        e.preventDefault();
        cleanupDragOperation();
        return false;
    }
    
    /**
     * Clean up after a drag operation
     */
    function cleanupDragOperation() {
        // Reset the cursor
        document.body.style.cursor = 'default';
        
        // Make elements editable again
        if (draggedElement) {
            const editableElements = draggedElement.querySelectorAll('[data-contenteditable-backup="true"]');
            editableElements.forEach(el => {
                el.removeAttribute('data-contenteditable-backup');
                el.setAttribute('contenteditable', 'true');
            });
            
            // Remove the dragging class
            draggedElement.classList.remove('line-dragging');
            draggedElement = null;
            draggedElementIndex = -1;
        }
        
        // Remove any drag-over classes
        if (dragOverElement) {
            dragOverElement.classList.remove('line-drag-over');
            dragOverElement = null;
        }
        
        // Remove any other drag-over classes (just in case)
        document.querySelectorAll('.line-drag-over').forEach(element => {
            element.classList.remove('line-drag-over');
        });
    }
}