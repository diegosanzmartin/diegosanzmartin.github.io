// SIDEBAR
export class Sidebar {
    constructor(dataService, editor) {
        this.dataService = dataService;
        this.editor = editor;
        this.sidebarEl = document.querySelector('aside');
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the sidebar
     */
    setupEventListeners() {
        // Initialize when we have the data
        this.dataService.addEventListener('data-changed', () => this.render());
        this.dataService.addEventListener('file-changed', () => this.render());
        
        // Delegate drag and drop events at the sidebar level
        this.sidebarEl.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.sidebarEl.addEventListener('dragover', this.handleDragOver.bind(this));
        this.sidebarEl.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.sidebarEl.addEventListener('drop', this.handleDrop.bind(this));
        this.sidebarEl.addEventListener('dragend', this.handleDragEnd.bind(this));
        
        // Setup context menu events
        this.sidebarEl.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        document.addEventListener('click', this.hideContextMenu.bind(this));
        
        // Create context menu and modal once
        this.createContextMenu();
        this.createModal();
    }
    
    /**
     * Create the context menu element
     */
    createContextMenu() {
        // Create context menu element if it doesn't exist
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'file-tree-context-menu';
        this.contextMenu.innerHTML = `
            <ul>
                <li class="new-file">
                    <img class="icon" src="./icons/file.svg"> New File
                </li>
                <li class="new-folder">
                    <img class="icon" src="./icons/folder.svg"> New Folder
                </li>
                <li class="divider"></li>
                <li class="rename">
                    <img class="icon" src="./icons/pencil.svg"> Rename
                </li>
                <li class="delete">
                    <img class="icon" src="./icons/delete.svg"> Delete
                </li>
            </ul>
        `;
        document.body.appendChild(this.contextMenu);
        
        // Add event listeners to menu items
        this.contextMenu.querySelector('.new-file').addEventListener('click', () => {
            this.showModal('Create New File', 'create-file');
        });
        
        this.contextMenu.querySelector('.new-folder').addEventListener('click', () => {
            this.showModal('Create New Folder', 'create-folder');
        });
        
        this.contextMenu.querySelector('.rename').addEventListener('click', () => {
            this.showModal('Rename', 'rename');
        });
        
        this.contextMenu.querySelector('.delete').addEventListener('click', () => {
            this.handleDelete();
        });
    }
    
    /**
     * Create the modal element for file operations
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'file-tree-modal';
        this.modal.innerHTML = `
            <input type="text" placeholder="Enter name...">
            <div class="modal-buttons">
                <button class="cancel">Cancel</button>
                <button class="confirm">Confirm</button>
            </div>
        `;
        document.body.appendChild(this.modal);
        
        // Add event listeners
        this.modal.querySelector('.cancel').addEventListener('click', () => {
            this.hideModal();
        });
        
        this.modal.querySelector('.confirm').addEventListener('click', () => {
            this.handleModalConfirm();
        });
        
        this.modal.querySelector('input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleModalConfirm();
            } else if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }
    
    /**
     * Handle right-click context menu
     */
    handleContextMenu(e) {
        // Only show context menu for file tree items
        const fileItem = e.target.closest('.nav-file');
        const folderItem = e.target.closest('.folder-label');
        const treeSection = e.target.closest('.file-tree-section');
        
        // Don't show context menu if not clicking on a valid item
        if (!fileItem && !folderItem && !treeSection) return;
        
        // Prevent default browser context menu
        e.preventDefault();
        
        // Set the current target for later use
        if (fileItem) {
            this.contextTarget = {
                type: 'file',
                element: fileItem,
                index: parseInt(fileItem.getAttribute('data-file-index'))
            };
            // Make rename visible
            this.contextMenu.querySelector('.rename').style.display = 'flex';
        } else if (folderItem) {
            this.contextTarget = {
                type: 'folder',
                element: folderItem,
                path: this.getFolderPathFromElement(folderItem)
            };
            // Make rename visible
            this.contextMenu.querySelector('.rename').style.display = 'flex';
        } else {
            // Clicking on empty space or section header
            this.contextTarget = {
                type: 'section',
                element: treeSection
            };
            // Hide rename option
            this.contextMenu.querySelector('.rename').style.display = 'none';
        }
        
        // Position and show the context menu
        this.contextMenu.style.top = `${e.clientY}px`;
        this.contextMenu.style.left = `${e.clientX}px`;
        this.contextMenu.style.display = 'block';
    }
    
    /**
     * Hide the context menu
     */
    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
    }
    
    /**
     * Show the modal for renaming or creating items
     * @param {String} title - Title to show in the modal
     * @param {String} action - Action to perform (rename, create-file, create-folder)
     */
    showModal(title, action) {
        // Hide context menu
        this.hideContextMenu();
        
        const input = this.modal.querySelector('input');
        input.placeholder = title;
        this.currentModalAction = action;
        
        // Prefill input if renaming
        if (action === 'rename') {
            if (this.contextTarget.type === 'file') {
                const file = this.dataService.data[this.contextTarget.index];
                const firstHeader = file.lines.find(line => line.type === 'h1');
                input.value = firstHeader ? firstHeader.value : 'Document';
            } else if (this.contextTarget.type === 'folder') {
                const folderName = this.contextTarget.path[this.contextTarget.path.length - 1];
                input.value = folderName;
            }
        } else {
            input.value = '';
        }
        
        // Position the modal near the context menu position
        const rect = this.contextTarget.element.getBoundingClientRect();
        this.modal.style.top = `${rect.top}px`;
        this.modal.style.left = `${rect.left + rect.width}px`;
        this.modal.style.display = 'block';
        
        // Focus the input
        input.focus();
        input.select();
    }
    
    /**
     * Hide the modal
     */
    hideModal() {
        this.modal.style.display = 'none';
        this.currentModalAction = null;
    }
    
    /**
     * Handle confirmation from the modal
     */
    handleModalConfirm() {
        const input = this.modal.querySelector('input');
        const value = input.value.trim();
        
        if (!value) {
            console.log('Name cannot be empty');
            return;
        }
        
        switch (this.currentModalAction) {
            case 'rename':
                this.handleRename(value);
                break;
            case 'create-file':
                this.handleCreateFile(value);
                break;
            case 'create-folder':
                this.handleCreateFolder(value);
                break;
        }
        
        this.hideModal();
    }
    
    /**
     * Handle renaming a file or folder
     * @param {String} newName - New name for the item
     */
    handleRename(newName) {
        if (this.contextTarget.type === 'file') {
            // Get file by index
            const fileIndex = this.contextTarget.index;
            const file = this.dataService.data[fileIndex];
            
            // Update the title in the first h1 element
            const firstHeaderIndex = file.lines.findIndex(line => line.type === 'h1');
            if (firstHeaderIndex !== -1) {
                file.lines[firstHeaderIndex].value = newName;
            }
            
            // Update the file path if it's a direct title (not in nested folders)
            if (file.path.root && typeof file.path.root === 'string') {
                file.path.root = newName;
            } else {
                // Find the deepest level and update the value
                this.updateNestedPathName(file.path, newName);
            }
            
            // Save changes
            this.dataService.saveData();
            this.render();
            
        } else if (this.contextTarget.type === 'folder') {
            // Renaming a folder is more complex - need to update all affected files
            const folderPath = this.contextTarget.path;
            const oldFolderName = folderPath[folderPath.length - 1];
            
            // Create new path with the renamed folder
            const newFolderPath = [...folderPath.slice(0, -1), newName];
            
            // Update all files that are in this folder
            this.dataService.data.forEach((file, index) => {
                // If this file is in the target folder, update its path
                if (this.isFileInFolder(file, folderPath)) {
                    const newPath = this.createNewPathWithRenamedFolder(
                        file.path, 
                        folderPath, 
                        newName
                    );
                    this.dataService.updateFilePath(index, newPath);
                }
            });
            
            // Save changes
            this.dataService.saveData();
            this.render();
        }
    }
    
    /**
     * Create a new path with renamed folder
     */
    createNewPathWithRenamedFolder(pathObj, folderPath, newFolderName) {
        // Handle root case
        if (!pathObj || typeof pathObj !== 'object') {
            return pathObj;
        }
        
        // Clone the path object to avoid mutations
        const newPath = { ...pathObj };
        
        // Root level
        if (newPath.root) {
            // If target folder is at root level
            if (folderPath.length === 1) {
                // Find the folder in root
                const oldFolderName = folderPath[0];
                if (newPath.root[oldFolderName]) {
                    // Clone the root object
                    const newRoot = { ...newPath.root };
                    // Copy the old folder's content to the new name
                    newRoot[newFolderName] = newPath.root[oldFolderName];
                    // Delete the old folder
                    delete newRoot[oldFolderName];
                    // Update path
                    newPath.root = newRoot;
                    return newPath;
                }
            } else {
                // Nested case - recursively update
                newPath.root = this.renameNestedFolder(
                    newPath.root,
                    folderPath,
                    newFolderName
                );
            }
        }
        
        return newPath;
    }
    
    /**
     * Helper to recursively rename nested folders
     */
    renameNestedFolder(obj, folderPath, newFolderName, level = 0) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        
        // Clone the current object
        const newObj = { ...obj };
        
        // Current folder name in the path
        const currentFolder = folderPath[level];
        
        // If this is the target folder to rename
        if (level === folderPath.length - 1) {
            // Rename the folder
            if (currentFolder in newObj) {
                newObj[newFolderName] = newObj[currentFolder];
                delete newObj[currentFolder];
            }
            return newObj;
        }
        
        // Continue traversing if this is not the target level
        if (currentFolder in newObj) {
            newObj[currentFolder] = this.renameNestedFolder(
                newObj[currentFolder],
                folderPath,
                newFolderName,
                level + 1
            );
        }
        
        return newObj;
    }
    
    /**
     * Check if a file is inside a specific folder
     */
    isFileInFolder(file, folderPath) {
        // File must have a path object
        if (!file.path || !file.path.root) {
            return false;
        }
        
        // Try to traverse the path to see if it's in the folder
        let current = file.path.root;
        for (let i = 0; i < folderPath.length; i++) {
            const folder = folderPath[i];
            
            // If we've reached a string (file name) before traversing the full path
            if (typeof current !== 'object' || current === null) {
                return false;
            }
            
            // Check if current level contains the folder
            if (!(folder in current)) {
                return false;
            }
            
            // Move to the next level
            current = current[folder];
        }
        
        // If we've traversed the full path, the file is in this folder
        return true;
    }
    
    /**
     * Update a nested path's filename
     * @param {Object} pathObj - The path object to update
     * @param {String} newName - The new file name
     */
    updateNestedPathName(pathObj, newName) {
        if (!pathObj || typeof pathObj !== 'object') {
            return;
        }
        
        // Handle root level
        if (pathObj.root) {
            if (typeof pathObj.root === 'object') {
                this.updateDeepestPathValue(pathObj.root, newName);
            }
        }
    }
    
    /**
     * Helper to find and update the deepest path value
     */
    updateDeepestPathValue(obj, newName) {
        if (!obj || typeof obj !== 'object') {
            return;
        }
        
        // Check if this object has any keys
        const keys = Object.keys(obj);
        
        if (keys.length === 0) {
            return;
        }
        
        // Look at each property
        for (const key of keys) {
            const value = obj[key];
            
            // If the value is a string, this is a filename, update it
            if (typeof value === 'string') {
                obj[key] = newName;
            }
            // If the value is an object, recursively search deeper
            else if (typeof value === 'object' && value !== null) {
                this.updateDeepestPathValue(value, newName);
            }
        }
    }
    
    /**
     * Handle creating a new file
     * @param {String} fileName - Name for the new file
     */
    handleCreateFile(fileName) {
        let path = null;
        
        if (this.contextTarget.type === 'folder') {
            // Create in the selected folder
            const folderPath = this.contextTarget.path;
            path = { root: this.createNestedPath(folderPath, fileName) };
        } else if (this.contextTarget.type === 'file') {
            // Create in the same folder as the selected file
            const fileIndex = this.contextTarget.index;
            const file = this.dataService.data[fileIndex];
            
            // Find the parent folder path
            if (file.path && file.path.root) {
                if (typeof file.path.root === 'string') {
                    // File is at root level, so new file also at root
                    path = { root: fileName };
                } else {
                    // Find parent folder path and create new file there
                    const parentPath = this.getParentFolderPath(file.path);
                    if (parentPath.length > 0) {
                        path = { root: this.createNestedPath(parentPath, fileName) };
                    } else {
                        path = { root: fileName };
                    }
                }
            }
        } else {
            // Create at root level
            path = { root: fileName };
        }
        
        // Create the new file
        this.dataService.createNewFile(path, fileName);
        this.render();
    }
    
    /**
     * Get the parent folder path for a file
     */
    getParentFolderPath(pathObj) {
        const result = [];
        
        // If not an object or no root, return empty path
        if (!pathObj || !pathObj.root || typeof pathObj.root !== 'object') {
            return result;
        }
        
        // Traverse the path to find the parent folder
        this.extractFolderPathFromPathObj(pathObj.root, [], result);
        
        return result;
    }
    
    /**
     * Helper to extract folder path from a path object
     */
    extractFolderPathFromPathObj(obj, currentPath, result) {
        if (!obj || typeof obj !== 'object') {
            return false;
        }
        
        const keys = Object.keys(obj);
        
        // If no keys, we've reached the end
        if (keys.length === 0) {
            return false;
        }
        
        for (const key of keys) {
            const value = obj[key];
            
            // If value is a string, we've found the file
            if (typeof value === 'string') {
                // Copy the current path to result
                result.push(...currentPath, key);
                return true;
            }
            // If value is an object, recurse deeper
            else if (typeof value === 'object' && value !== null) {
                const newPath = [...currentPath, key];
                if (this.extractFolderPathFromPathObj(value, newPath, result)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Handle creating a new folder
     * @param {String} folderName - Name for the new folder
     */
    handleCreateFolder(folderName) {
        let parentPath = [];
        
        if (this.contextTarget.type === 'folder') {
            // Create inside the selected folder
            parentPath = this.contextTarget.path;
        } else if (this.contextTarget.type === 'file') {
            // Create in the same folder as the selected file
            const fileIndex = this.contextTarget.index;
            const file = this.dataService.data[fileIndex];
            
            // Find the parent folder path
            if (file.path && file.path.root) {
                if (typeof file.path.root !== 'string') {
                    parentPath = this.getParentFolderPath(file.path);
                    // Remove the last element (file name)
                    if (parentPath.length > 0) {
                        parentPath.pop();
                    }
                }
                // If file.path.root is a string, parentPath remains empty (root level)
            }
        }
        
        // To create a folder, we need to create a dummy file inside it
        // Because folders only exist if they have files
        const dummyFileName = 'New Document';
        const fullPath = [...parentPath, folderName];
        const path = { root: this.createNestedPath(fullPath, dummyFileName) };
        
        // Create a new file in the new folder
        this.dataService.createNewFile(path, dummyFileName);
        this.render();
    }
    
    /**
     * Handle drag start event for file items
     */
    handleDragStart(e) {
        const fileItem = e.target.closest('.nav-file');
        if (!fileItem) return;
        
        // Set the file index being dragged
        const fileIndex = parseInt(fileItem.getAttribute('data-file-index'));
        e.dataTransfer.setData('text/plain', fileIndex);
        e.dataTransfer.effectAllowed = 'move';
        
        // Add a class to visualize the dragging state
        fileItem.classList.add('dragging');
    }
    
    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault(); // Allow drop
        
        // Set the drop effect
        e.dataTransfer.dropEffect = 'move';
        
        // Highlight potential drop targets
        const dropTarget = this.findDropTarget(e.clientY);
        if (dropTarget) {
            // Clear previous highlights
            this.clearDropHighlights();
            
            // Add highlight class to current target
            dropTarget.classList.add('drop-target');
            
            // Show drop indicator
            this.showDropIndicator(dropTarget, e.clientY);
        }
    }
    
    /**
     * Show a drop indicator line
     * @param {HTMLElement} target - The drop target element
     * @param {Number} y - The cursor Y position
     */
    showDropIndicator(target, y) {
        // Remove any existing indicators
        this.removeDropIndicators();
        
        // Get target position
        const rect = target.getBoundingClientRect();
        const indicator = document.createElement('div');
        indicator.className = 'drag-indicator';
        
        // Add the indicator to the document body
        document.body.appendChild(indicator);
        
        // Position indicator based on cursor position relative to the target
        if (y < rect.top + rect.height / 2) {
            // Position at the top of the target
            indicator.classList.add('top');
            indicator.style.top = `${rect.top}px`;
        } else {
            // Position at the bottom of the target
            indicator.classList.add('bottom');
            indicator.style.top = `${rect.bottom}px`;
        }
        
        // Set width and horizontal position
        indicator.style.left = `${rect.left}px`;
        indicator.style.width = `${rect.width}px`;
        indicator.style.display = 'block';
    }
    
    /**
     * Remove any drop indicators
     */
    removeDropIndicators() {
        document.querySelectorAll('.drag-indicator').forEach(el => {
            el.remove();
        });
    }
    
    /**
     * Handle drag leave event
     */
    handleDragLeave(e) {
        if (!e.relatedTarget || !this.sidebarEl.contains(e.relatedTarget)) {
            this.clearDropHighlights();
        }
    }
    
    /**
     * Handle drop event
     */
    handleDrop(e) {
        e.preventDefault();
        
        // Get the file index being dragged
        const fileIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (isNaN(fileIndex)) return;
        
        // Find the drop target folder or position
        const dropTarget = this.findDropTarget(e.clientY);
        if (!dropTarget) return;
        
        // Determine whether it's a folder or a position between files
        if (dropTarget.classList.contains('folder-label')) {
            this.moveFileToFolder(fileIndex, dropTarget);
        } else if (dropTarget.classList.contains('nav-file')) {
            this.moveFileAdjacentToFile(fileIndex, dropTarget);
        }
        
        // Clear highlights and indicators
        this.clearDropHighlights();
        this.removeDropIndicators();
    }
    
    /**
     * Handle drag end event
     */
    handleDragEnd() {
        this.clearDropHighlights();
        this.removeDropIndicators();
        
        // Remove dragging class from all elements
        const draggingItem = document.querySelector('.dragging');
        if (draggingItem) {
            draggingItem.classList.remove('dragging');
        }
    }
    
    /**
     * Find a valid drop target based on cursor position
     * @param {Number} y - Cursor Y position
     * @returns {HTMLElement|null} The drop target element or null
     */
    findDropTarget(y) {
        // Find all potential drop targets (folders and files)
        const folders = Array.from(this.sidebarEl.querySelectorAll('.folder-label'));
        const files = Array.from(this.sidebarEl.querySelectorAll('.nav-file:not(.dragging)'));
        
        // Combine folders and files as valid drop targets
        const dropTargets = [...folders, ...files];
        
        // Find the closest element to the cursor position
        return dropTargets.reduce((closest, target) => {
            const box = target.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            // Find the closest element by comparing offset
            if (closest === null || Math.abs(offset) < Math.abs(closest.offset)) {
                return { element: target, offset: offset };
            } else {
                return closest;
            }
        }, null)?.element || null;
    }
    
    /**
     * Clear all drop target highlights
     */
    clearDropHighlights() {
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
    }
    
    /**
     * Move a file to a folder in the tree
     * @param {Number} fileIndex - Index of the file to move
     * @param {HTMLElement} folderEl - The folder element to move to
     */
    moveFileToFolder(fileIndex, folderEl) {
        // Get the folder path by traversing up the DOM
        const folderPath = this.getFolderPathFromElement(folderEl);
        if (!folderPath) return;
        
        // Get the file title from data service
        const file = this.dataService.data[fileIndex];
        if (!file) return;
        
        // Get the title from the first h1 element or use default
        let fileTitle = 'Document';
        if (file.lines && file.lines.length > 0) {
            const firstHeader = file.lines.find(line => line.type === 'h1');
            if (firstHeader) {
                fileTitle = firstHeader.value;
            }
        }
        
        // Create the new path object
        const newPath = { root: this.createNestedPath(folderPath, fileTitle) };
        
        // Update the file path in the data service
        this.dataService.updateFilePath(fileIndex, newPath);
    }
    
    /**
     * Move a file adjacent to another file (above or below)
     * @param {Number} fileIndex - Index of the file to move
     * @param {HTMLElement} targetFileEl - The file element to move adjacent to
     */
    moveFileAdjacentToFile(fileIndex, targetFileEl) {
        // Get the target file's parent folder
        const parentFolder = targetFileEl.closest('ul').closest('li');
        if (parentFolder && parentFolder.classList.contains('nav-folder')) {
            // If the target is inside a folder, get the folder path
            const folderLabelEl = parentFolder.querySelector('.folder-label');
            this.moveFileToFolder(fileIndex, folderLabelEl);
        } else {
            // If the target is at the root level, move to root
            const file = this.dataService.data[fileIndex];
            if (!file) return;
            
            // Get the file title
            let fileTitle = 'Document';
            if (file.lines && file.lines.length > 0) {
                const firstHeader = file.lines.find(line => line.type === 'h1');
                if (firstHeader) {
                    fileTitle = firstHeader.value;
                }
            }
            
            // Create new path at root level
            const newPath = { root: fileTitle };
            
            // Update the file path
            this.dataService.updateFilePath(fileIndex, newPath);
        }
    }
    
    /**
     * Get the folder path by traversing up the DOM tree
     * @param {HTMLElement} folderEl - The folder element
     * @returns {Array} Array of folder names representing the path
     */
    getFolderPathFromElement(folderEl) {
        const path = [];
        
        // Get the folder name
        const folderName = folderEl.textContent.trim().replace('📁 ', '').replace('📂 ', '');
        path.unshift(folderName);
        
        // Traverse up the DOM to build the path
        let parent = folderEl.closest('li').closest('ul').closest('li');
        
        while (parent && parent.classList.contains('nav-folder')) {
            const parentLabel = parent.querySelector('.folder-label');
            if (parentLabel) {
                const parentName = parentLabel.textContent.trim().replace('📁 ', '').replace('📂 ', '');
                path.unshift(parentName);
            }
            parent = parent.closest('ul').closest('li');
        }
        
        return path;
    }
    
    /**
     * Create a nested path object from a path array
     * @param {Array} pathArray - Array of folder names
     * @param {String} fileName - Name of the file
     * @returns {Object} Nested path object for the data structure
     */
    createNestedPath(pathArray, fileName) {
        // If path is empty, return the filename directly
        if (pathArray.length === 0) {
            return fileName;
        }
        
        // Build nested object from the deepest level up
        let result = fileName;
        for (let i = pathArray.length - 1; i >= 0; i--) {
            const folder = pathArray[i];
            const temp = {};
            temp[folder] = result;
            result = temp;
        }
        
        return result;
    }

    /**
     * Build a tree structure from flat paths
     * @param {Array} pathObjs - Array of path objects
     * @returns {Object} Tree structure
     */
    buildPathTree(pathObjs) {
        const tree = {};
        
        // Process each path
        pathObjs.forEach(pathObj => {
            const path = pathObj.path;
            
            // Skip if path is empty or invalid
            if (!path || Object.keys(path).length === 0) return;
            
            // Start from root
            if (path.root) {
                // Handle case where root is a string (document name)
                if (typeof path.root === 'string') {
                    if (!tree.__files) {
                        tree.__files = [];
                    }
                    
                    tree.__files.push({
                        index: pathObj.index,
                        updated: pathObj.updated,
                        title: path.root // Store the document title
                    });
                    return;
                }
                
                // Process nested path objects
                this.processNestedPath(tree, path.root, pathObj.index, pathObj.updated);
            }
        });
        
        return tree;
    }
    
    /**
     * Process a nested path object and add it to the tree
     * @param {Object} parentNode - Parent node in the tree
     * @param {Object} pathObject - Current path object to process
     * @param {Number} fileIndex - Index of the file
     * @param {Number} updated - Last updated timestamp
     */
    processNestedPath(parentNode, pathObject, fileIndex, updated) {
        // Log path object for debugging
        console.log('Processing path object:', JSON.stringify(pathObject));
        
        // Handle string value (leaf node/file)
        if (typeof pathObject === 'string') {
            if (!parentNode.__files) {
                parentNode.__files = [];
            }
            
            parentNode.__files.push({
                index: fileIndex,
                updated: updated,
                title: pathObject
            });
            return;
        }
        
        // Process each key in the path object
        for (const key of Object.keys(pathObject)) {
            const value = pathObject[key];
            
            // Create the node if it doesn't exist
            if (!parentNode[key]) {
                parentNode[key] = {};
            }
            
            // Process the value
            this.processNestedPath(parentNode[key], value, fileIndex, updated);
        }
    }

    /**
     * Find path to current file in the tree
     * @param {Object} node - Current node in tree
     * @param {Number} targetIndex - Index of the file to find
     * @param {Array} currentPath - Current path in the tree (accumulator)
     * @returns {Array|null} Path to the file or null if not found
     */
    findPathToFile(node, targetIndex, currentPath = []) {
        // Check files at this level
        if (node.__files) {
            for (const file of node.__files) {
                if (file.index === targetIndex) {
                    return [...currentPath]; // Return copy of the current path
                }
            }
        }
        
        // Recursively check all children
        for (const key in node) {
            if (key === '__files') continue; // Skip the files property
            
            const childPath = this.findPathToFile(node[key], targetIndex, [...currentPath, key]);
            if (childPath) {
                return childPath;
            }
        }
        
        return null; // Not found in this branch
    }

    /**
     * Render a tree structure as DOM elements
     * @param {Object} node - Tree node to render
     * @param {HTMLElement} parent - Parent element to append to
     * @param {String} path - Current path string
     * @param {Array} expandedPath - Path to expand
     */
    renderTreeNode(node, parent, path = '', expandedPath = []) {
        // Process each key in the node
        Object.keys(node).forEach(key => {
            // Skip the special __files property
            if (key === '__files') return;
            
            // Create a folder item
            const folderItem = document.createElement('li');
            folderItem.className = 'nav-folder';
            
            // Create folder label with toggle functionality
            const folderLabel = document.createElement('div');
            folderLabel.className = 'folder-label';
            folderLabel.innerHTML = `<span class="folder-icon">📁</span> ${key}`;
            folderItem.appendChild(folderLabel);
            
            // Create container for children
            const childrenContainer = document.createElement('ul');
            childrenContainer.className = 'folder-children';
            
            // Check if this folder should be expanded (it's in the path to current file)
            const shouldExpand = expandedPath.includes(key);
            
            // Always add the child container to the folder item first
            folderItem.appendChild(childrenContainer);

            // Add folder to parent
            parent.appendChild(folderItem);
            
            // Recursively render children - this happens after adding the folder to the parent
            this.renderTreeNode(
                node[key],
                childrenContainer,
                path + '/' + key,
                shouldExpand ? expandedPath.slice(expandedPath.indexOf(key) + 1) : []
            );
            
            // Add toggle functionality
            folderLabel.addEventListener('click', (e) => {
                e.stopPropagation();
                childrenContainer.classList.toggle('collapsed');
                folderLabel.classList.toggle('collapsed');
                
                // Toggle folder icon
                const folderIcon = folderLabel.querySelector('.folder-icon');
                if (folderIcon) {
                    folderIcon.textContent = childrenContainer.classList.contains('collapsed') ? '📁' : '📂';
                }
            });
            
            // Start collapsed unless this folder should be expanded
            if (!shouldExpand) {
                childrenContainer.classList.add('collapsed');
                folderLabel.classList.add('collapsed');
                if (folderLabel.querySelector('.folder-icon')) {
                    folderLabel.querySelector('.folder-icon').textContent = '📁';
                }
            }
        });
        
        // Add any files at this level
        if (node.__files && node.__files.length > 0) {
            node.__files.forEach(file => {
                const fileItem = document.createElement('li');
                fileItem.className = 'nav-file';
                fileItem.draggable = true; // Make it draggable
                
                // Highlight current file
                if (file.index === this.dataService.currentFileIndex) {
                    fileItem.classList.add('active-file');
                }
                
                // Show file title or fallback to "Document"
                const fileTitle = file.title || "Document";
                fileItem.innerHTML = `<span class="file-icon">📄</span> ${fileTitle}`;
                fileItem.setAttribute('data-file-index', file.index);
                
                // Handle click to load this file
                fileItem.addEventListener('click', () => {
                    // First save the current file
                    this.dataService.saveData();
                    
                    // Change to the selected file
                    const fileIndex = parseInt(fileItem.getAttribute('data-file-index'));
                    this.dataService.changeFile(fileIndex);
                });
                
                // Add file to parent
                parent.appendChild(fileItem);
            });
        }
    }

    /**
     * Render the sidebar
     */
    render() {
        console.log("SIDEBAR RENDER");
        if (!this.dataService.data) return;
        
        // Clear the sidebar
        this.sidebarEl.innerHTML = '';
        
        // Add title
        const title = document.createElement('h1');
        title.textContent = 'Wiki';
        this.sidebarEl.appendChild(title);
        
        // Add search box
        const searchBox = document.createElement('input');
        searchBox.type = 'text';
        searchBox.placeholder = 'Search...';
        searchBox.className = 'search-box';
        this.sidebarEl.appendChild(searchBox);
        
        // Setup search functionality
        searchBox.addEventListener('input', this.handleSearch.bind(this));
        
        // Create file tree navigation
        const navSection = document.createElement('div');
        navSection.className = 'file-tree-section';
        
        const navTitle = document.createElement('h3');
        navTitle.textContent = 'Files';
        navSection.appendChild(navTitle);
        
        // Get all paths
        const paths = this.dataService.getAllPaths();
        
        // Build tree structure
        const pathTree = this.buildPathTree(paths);
        
        // Debug: Log the resulting tree structure
        console.log('Path tree structure:', this.debugPathTree(pathTree));
        
        // Find path to current file
        const currentFileIndex = this.dataService.currentFileIndex;
        const expandedPath = this.findPathToFile(pathTree, currentFileIndex) || [];
        
        // Create tree DOM structure
        const treeContainer = document.createElement('ul');
        treeContainer.className = 'file-tree';
        
        // Render tree with path to expand
        this.renderTreeNode(pathTree, treeContainer, '', expandedPath);
        
        // Add tree to navigation section
        navSection.appendChild(treeContainer);
        
        // Add navigation section to sidebar
        this.sidebarEl.appendChild(navSection);
        
        // Add section for quick navigation to page sections
        const currentFile = this.dataService.getCurrentFile();
        if (currentFile && currentFile.lines && currentFile.lines.length > 0) {
            const pageNavSection = document.createElement('div');
            pageNavSection.className = 'nav-section';
            
            // Find all headers in the content
            const headers = currentFile.lines.filter(
                line => ['h1', 'h2', 'h3'].includes(line.type)
            );
            
            if (headers.length > 0) {
                const navList = document.createElement('ul');
                navList.className = 'nav-list';
                
                headers.forEach(header => {
                    const navItem = document.createElement('li');
                    navItem.className = `nav-item nav-${header.type}`;
                    navItem.textContent = header.value;
                    
                    // Scroll to this header when clicked
                    navItem.addEventListener('click', () => {
                        const headerEl = document.querySelector(`line[data-id="${header.id}"]`);
                        if (headerEl) {
                            headerEl.scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                    
                    navList.appendChild(navItem);
                });
                
                pageNavSection.appendChild(navList);
            } else {
                const noHeaders = document.createElement('p');
                noHeaders.textContent = 'No headers found';
                noHeaders.className = 'no-headers';
                pageNavSection.appendChild(noHeaders);
            }
            
            this.sidebarEl.appendChild(pageNavSection);
        }
        
        // Add export options
        const exportSection = document.createElement('div');
        exportSection.className = 'export-section';
        
        // Add export JSON button
        const exportBtn = document.createElement('img');
        exportBtn.src = "./icons/export.svg"
        exportBtn.className = 'icon';
        exportBtn.addEventListener('click', () => {
            this.dataService.exportDataAsFile();
        });
        exportSection.appendChild(exportBtn);
        
        const importBtn = document.createElement('img');
        importBtn.src = "./icons/import.svg"
        importBtn.className = 'icon';
        exportSection.appendChild(importBtn);
        
        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.id = 'json-file-input';
        exportSection.appendChild(fileInput);
        
        // Connect button to file input
        importBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Handle file selection
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                const success = await this.dataService.importDataFromFile(file);
                if (success) {
                    // Reset the file input
                    fileInput.value = '';
                    // Re-render the sidebar with new data
                    this.render();
                    // Let the editor know about the change
                    this.editor.render();
                }
            }
        });
        
        const exportHTML = document.createElement('img');
        exportHTML.src = "./icons/html.svg"
        exportHTML.className = 'icon';
        exportHTML.addEventListener('click', this.exportAsHTML.bind(this));
        exportSection.appendChild(exportHTML);
        
        const exportMD = document.createElement('img');
        exportMD.src = "./icons/markdown.svg"
        exportMD.className = 'icon';
        exportMD.addEventListener('click', this.exportAsMarkdown.bind(this));
        exportSection.appendChild(exportMD);
    
        
        this.sidebarEl.appendChild(exportSection);
    }

    /**
     * Handle search functionality
     */
    handleSearch(e) {
        const query = e.target.value.toLowerCase();
        
        // Find all text-containing elements in the editor
        const elements = document.querySelectorAll('editor line text, editor line h1, editor line h2, editor line h3, editor line code');
        
        elements.forEach(el => {
            const line = el.closest('line');
            const content = el.textContent.toLowerCase();
            
            if (query && content.includes(query)) {
                // Highlight this element
                line.classList.add('search-highlight');
                
                // Ensure it's visible
                if (query.length > 2) { // Only scroll for queries with at least 3 chars
                    line.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // Remove highlight
                line.classList.remove('search-highlight');
            }
        });
    }

    /**
     * Export content as HTML
     */
    exportAsHTML() {
        const currentFile = this.dataService.getCurrentFile();
        if (!currentFile) return;
        
        let html = '<!DOCTYPE html>\n<html>\n<head>\n';
        html += '<meta charset="UTF-8">\n';
        html += '<title>Wiki Export</title>\n';
        html += '<style>\n';
        html += 'body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }\n';
        html += 'h1 { font-size: 28px; margin-bottom: 16px; }\n';
        html += 'h2 { font-size: 24px; margin-bottom: 14px; }\n';
        html += 'h3 { font-size: 20px; margin-bottom: 12px; }\n';
        html += 'p { font-size: 16px; line-height: 1.5; margin-bottom: 16px; }\n';
        html += 'code { font-family: monospace; background-color: #f5f5f5; padding: 16px; display: block; white-space: pre-wrap; }\n';
        html += 'hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }\n';
        html += 'table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }\n';
        html += 'th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }\n';
        html += 'img { max-width: 100%; height: auto; }\n';
        html += '</style>\n';
        html += '</head>\n<body>\n';
        
        // Convert each line to HTML
        currentFile.lines.forEach(line => {
            switch (line.type) {
                case 'h1':
                    html += `<h1>${this.escapeHTML(line.value)}</h1>\n`;
                    break;
                case 'h2':
                    html += `<h2>${this.escapeHTML(line.value)}</h2>\n`;
                    break;
                case 'h3':
                    html += `<h3>${this.escapeHTML(line.value)}</h3>\n`;
                    break;
                case 'text':
                    html += `<p>${this.escapeHTML(line.value)}</p>\n`;
                    break;
                case 'divider':
                    html += '<hr>\n';
                    break;
                case 'code':
                    html += `<code>${this.escapeHTML(line.value)}</code>\n`;
                    break;
                case 'table':
                    html += line.value + '\n';
                    break;
                case 'image':
                    html += `<img src="${line.value}" alt="Image" style="height: ${line.height};">\n`;
                    break;
            }
        });
        
        html += '</body>\n</html>';
        
        // Create a downloadable file
        this.downloadFile(html, 'wiki-export.html', 'text/html');
    }

    /**
     * Export content as Markdown
     */
    exportAsMarkdown() {
        const currentFile = this.dataService.getCurrentFile();
        if (!currentFile) return;
        
        let markdown = '';
        
        // Convert each line to markdown
        currentFile.lines.forEach(line => {
            switch (line.type) {
                case 'h1':
                    markdown += `# ${line.value}\n\n`;
                    break;
                case 'h2':
                    markdown += `## ${line.value}\n\n`;
                    break;
                case 'h3':
                    markdown += `### ${line.value}\n\n`;
                    break;
                case 'text':
                    markdown += `${line.value}\n\n`;
                    break;
                case 'divider':
                    markdown += '---\n\n';
                    break;
                case 'code':
                    markdown += '```' + (line.lang || '') + '\n';
                    markdown += line.value + '\n';
                    markdown += '```\n\n';
                    break;
                case 'table':
                    // Convert HTML table to markdown (basic conversion)
                    try {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = line.value;
                        
                        const table = tempDiv.querySelector('table');
                        if (table) {
                            const headerRow = table.querySelector('thead tr');
                            const bodyRows = table.querySelectorAll('tbody tr');
                            
                            if (headerRow) {
                                const headers = Array.from(headerRow.querySelectorAll('th'))
                                    .map(th => th.textContent.trim());
                                
                                // Header row
                                markdown += '| ' + headers.join(' | ') + ' |\n';
                                
                                // Separator row
                                markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
                                
                                // Data rows
                                bodyRows.forEach(row => {
                                    const cells = Array.from(row.querySelectorAll('td'))
                                        .map(td => td.textContent.trim());
                                    markdown += '| ' + cells.join(' | ') + ' |\n';
                                });
                                
                                markdown += '\n';
                            }
                        }
                    } catch (e) {
                        console.error('Error converting table to markdown:', e);
                        markdown += '*[Table content could not be converted to markdown]*\n\n';
                    }
                    break;
                case 'image':
                    markdown += `![Image](${line.value})\n\n`;
                    break;
            }
        });
        
        // Create a downloadable file
        this.downloadFile(markdown, 'wiki-export.md', 'text/markdown');
    }
    
    /**
     * Helper to escape HTML for export
     */
    escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    /**
     * Download content as a file
     */
    downloadFile(content, filename, contentType) {
        const a = document.createElement('a');
        const file = new Blob([content], { type: contentType });
        
        a.href = URL.createObjectURL(file);
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(a.href);
    }
    
    /**
     * Handle the delete action for files and folders
     */
    handleDelete() {
        // Hide context menu
        this.hideContextMenu();
        
        if (!this.contextTarget) {
            return;
        }
        
        // Determine what to delete based on context target type
        if (this.contextTarget.type === 'file') {
            // File deletion
            const fileIndex = this.contextTarget.index;
            
            // Confirm with the user
            if (confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
                // Get file title for user feedback
                const file = this.dataService.data[fileIndex];
                let fileTitle = "Document";
                if (file && file.lines) {
                    const firstHeader = file.lines.find(line => line.type === 'h1');
                    if (firstHeader) {
                        fileTitle = firstHeader.value;
                    }
                }
                
                // Delete the file
                this.deleteFile(fileIndex);
                
                // Show success message
                console.log(`File "${fileTitle}" has been deleted.`);
            }
        } else if (this.contextTarget.type === 'folder') {
            // Folder deletion
            const folderPath = this.contextTarget.path;
            const folderName = folderPath[folderPath.length - 1];
            
            // Confirm with the user
            if (confirm(`Are you sure you want to delete the folder "${folderName}" and ALL its contents? This action cannot be undone.`)) {
                // Delete the folder and all its contents
                const deletedCount = this.deleteFolder(folderPath);
                
                // Show success message
                console.log(`Folder "${folderName}" and ${deletedCount} files have been deleted.`);
            }
        }
    }
    
    /**
     * Delete a file by its index
     * @param {Number} fileIndex - Index of the file to delete
     * @returns {Boolean} True if successful, false otherwise
     */
    deleteFile(fileIndex) {
        if (!this.dataService.data || fileIndex < 0 || fileIndex >= this.dataService.data.length) {
            return false;
        }
        
        // Remove the file from the data array
        this.dataService.data.splice(fileIndex, 1);
        
        // If we deleted the current file, switch to another file
        if (fileIndex === this.dataService.currentFileIndex) {
            if (this.dataService.data.length > 0) {
                // Switch to the first file
                this.dataService.currentFileIndex = 0;
                this.dataService.notifyListeners('file-changed', this.dataService.getCurrentFile());
            } else {
                // No files left, create a blank one
                this.dataService.createNewFile({
                    root: "New Document"
                }, "New Document");
            }
        } else if (fileIndex < this.dataService.currentFileIndex) {
            // Adjust the current file index if we deleted a file before it
            this.dataService.currentFileIndex--;
        }
        
        // Save changes and update the UI
        this.dataService.saveData();
        this.render();
        
        return true;
    }
    
    /**
     * Delete a folder and all files within it
     * @param {Array} folderPath - Path to the folder to delete
     * @returns {Number} Number of files deleted
     */
    deleteFolder(folderPath) {
        if (!this.dataService.data || !folderPath || folderPath.length === 0) {
            return 0;
        }
        
        // Find all files inside this folder
        const filesToDelete = [];
        
        this.dataService.data.forEach((file, index) => {
            if (this.isFileInFolder(file, folderPath)) {
                filesToDelete.push(index);
            }
        });
        
        // Sort indices in descending order to avoid shifting issues when deleting
        filesToDelete.sort((a, b) => b - a);
        
        // Delete each file
        for (const index of filesToDelete) {
            this.deleteFile(index);
        }
        
        return filesToDelete.length;
    }
    
    /**
     * Debug helper to print the path tree structure
     * @param {Object} node - Node to print
     * @param {Number} indent - Indentation level
     * @returns {String} Stringified tree structure
     */
    debugPathTree(node, indent = 0) {
        let result = '';
        const padding = ' '.repeat(indent * 2);
        
        // Process regular nodes
        for (const key in node) {
            if (key === '__files') continue;
            
            result += `${padding}${key}/\n`;
            result += this.debugPathTree(node[key], indent + 1);
        }
        
        // Process files
        if (node.__files) {
            for (const file of node.__files) {
                result += `${padding}📄 ${file.title} (${file.index})\n`;
            }
        }
        
        return result;
    }
}