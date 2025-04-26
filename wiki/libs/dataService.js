// DATA SERVICE
export class DataService {
    constructor() {
        this.data = [];
        this.currentFileIndex = 0;  // Index of the currently active file in data array
        this.listeners = {
            'data-changed': [],
            'save-completed': [],
            'error': [],
            'file-changed': []  // New event for file changes
        };
    }

    /**
     * Load data from the JSON file
     */
    async loadData() {
        try {
            // Try to load data from localStorage first
            const localData = localStorage.getItem('wiki_data');
            if (localData) {
                this.data = JSON.parse(localData);
                
                // Use the loaded local data
                if (this.data.length > 0) {
                    this.currentFileIndex = 0;
                    this.notifyListeners('file-changed', this.getCurrentFile());
                    this.notifyListeners('data-changed', this.getCurrentFile());
                    return this.data;
                }
            }
            
            // If no local data, fetch from file
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            
            // Default to the first file if it exists
            if (this.data.length > 0) {
                this.currentFileIndex = 0;
                this.notifyListeners('file-changed', this.getCurrentFile());
            } else {
                // Initialize with a single blank page if there are no files
                this.data = [{
                    updated: Date.now(),
                    history: [],
                    path: {"root": null},
                    lines: []
                }];
                this.currentFileIndex = 0;
            }
            
            // Save to localStorage initially
            localStorage.setItem('wiki_data', JSON.stringify(this.data));
            
            this.notifyListeners('data-changed', this.getCurrentFile());
            return this.data;
        } catch (error) {
            console.error('Error loading data:', error);
            this.notifyListeners('error', error);
            
            // Initialize with empty data as fallback
            this.data = [{
                updated: Date.now(),
                history: [],
                path: {"root": null},
                lines: []
            }];
            this.currentFileIndex = 0;
            
            return this.data;
        }
    }

    /**
     * Save data to localStorage only
     */
    saveData() {
        if (!this.data || this.data.length === 0) return;
        
        try {
            // Update the timestamp for the current file
            const currentFile = this.getCurrentFile();
            if (currentFile) {
                currentFile.updated = Date.now();
            }
            
            // Save data to localStorage
            localStorage.setItem('wiki_data', JSON.stringify(this.data));
            
            console.log('Data saved to localStorage');
            this.notifyListeners('save-completed', this.data);
            
        } catch (error) {
            console.error('Error saving data:', error);
            this.notifyListeners('error', error);
        }
    }
    
    /**
     * Export data as JSON file for download
     */
    exportDataAsFile() {
        if (!this.data || this.data.length === 0) {
            console.log('No data to export');
            return;
        }
        
        try {
            // Create a formatted JSON string
            const jsonString = JSON.stringify(this.data, null, 2);
            
            // Create a blob from the JSON string
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // Create a URL for the blob
            const url = URL.createObjectURL(blob);
            
            // Create a temporary anchor element
            const a = document.createElement('a');
            a.href = url;
            a.download = `wiki_data_${new Date().toISOString().slice(0, 10)}.json`;
            
            // Trigger the download
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('Data exported successfully');
        } catch (error) {
            console.error('Error exporting data:', error);
            console.log('Error exporting data: ' + error.message);
        }
    }
    
    /**
     * Import data from a JSON file
     * @param {File} file - The file object to import
     */
    async importDataFromFile(file) {
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        try {
            const reader = new FileReader();
            
            const fileLoadPromise = new Promise((resolve, reject) => {
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = (error) => reject(error);
            });
            
            reader.readAsText(file);
            
            const fileContent = await fileLoadPromise;
            const importedData = JSON.parse(fileContent);
            
            // Validate the imported data structure
            if (!Array.isArray(importedData)) {
                throw new Error('Invalid data format. Expected an array.');
            }
            
            // Basic validation of each file in the array
            importedData.forEach((item, index) => {
                if (!item.path || !item.lines || !Array.isArray(item.lines)) {
                    throw new Error(`Invalid file structure at index ${index}`);
                }
            });
            
            // Update the data
            this.data = importedData;
            this.currentFileIndex = 0;
            
            // Save to localStorage
            localStorage.setItem('wiki_data', JSON.stringify(this.data));
            
            // Notify listeners
            this.notifyListeners('data-changed', this.getCurrentFile());
            this.notifyListeners('file-changed', this.getCurrentFile());
            
            console.log('Data imported successfully');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            console.log('Error importing data: ' + error.message);
            return false;
        }
    }

    /**
     * Get the currently active file
     */
    getCurrentFile() {
        if (this.data && this.data.length > 0 && this.currentFileIndex >= 0 && this.currentFileIndex < this.data.length) {
            return this.data[this.currentFileIndex];
        }
        return null;
    }

    /**
     * Change to a specific file by index
     * @param {number} index - Index of the file to switch to
     * @returns {boolean} True if successful, false otherwise
     */
    changeFile(index) {
        if (this.data && this.data.length > 0 && index >= 0 && index < this.data.length) {
            // Save current file first
            this.saveData();
            
            // Change current file index
            this.currentFileIndex = index;
            
            // Notify listeners
            this.notifyListeners('file-changed', this.getCurrentFile());
            this.notifyListeners('data-changed', this.getCurrentFile());
            
            return true;
        }
        return false;
    }

    /**
     * Create a new file 
     * @param {Object} path - Path object defining location in the tree
     * @param {String} title - Title of the new file
     * @returns {number} Index of the new file
     */
    createNewFile(path, title = 'New Document') {
        const newFile = {
            updated: Date.now(),
            history: [],
            path: path || {"root": title},
            lines: [
                {
                    id: this.generateId(),
                    type: 'h1',
                    value: title
                }
            ]
        };
        
        // Add the new file to the data array
        this.data.push(newFile);
        const newIndex = this.data.length - 1;
        
        // Switch to the new file
        this.changeFile(newIndex);
        
        // Save the updated data
        this.saveData();
        
        return newIndex;
    }

    /**
     * Add a new line of content to the current file
     */
    addLine(type, value = '', position = null) {
        const currentFile = this.getCurrentFile();
        if (!currentFile) return null;

        const newLine = {
            id: this.generateId(),
            type: type
        };

        // Add specific properties based on type
        switch (type) {
            case 'text':
            case 'h1':
            case 'h2':
            case 'h3':
                newLine.value = value;
                break;
            case 'code':
                newLine.value = value;
                newLine.lang = 'javascript'; // Default language
                break;
            case 'divider':
                // Divider doesn't need additional properties
                break;
            case 'table':
                newLine.rows = 2;
                newLine.columns = 2;
                newLine.value = this.generateEmptyTable(2, 2);
                break;
            case 'image':
                newLine.value = value;
                newLine.height = '300px';
                break;
        }

        // Insert at specific position or at the end
        if (position !== null && position >= 0 && position <= currentFile.lines.length) {
            currentFile.lines.splice(position, 0, newLine);
        } else {
            currentFile.lines.push(newLine);
        }

        // Save history state
        this.addHistoryState('add', newLine);

        this.notifyListeners('data-changed', currentFile);
        return newLine;
    }

    /**
     * Update an existing line in the current file
     */
    updateLine(id, updates) {
        const currentFile = this.getCurrentFile();
        if (!currentFile) return false;

        const lineIndex = currentFile.lines.findIndex(line => line.id === id);
        if (lineIndex === -1) return false;

        const oldLine = { ...currentFile.lines[lineIndex] };
        currentFile.lines[lineIndex] = { ...oldLine, ...updates };

        // Save history state
        this.addHistoryState('update', oldLine, currentFile.lines[lineIndex]);

        this.notifyListeners('data-changed', currentFile);
        return true;
    }

    /**
     * Delete a line from the current file
     */
    deleteLine(id) {
        const currentFile = this.getCurrentFile();
        if (!currentFile) return false;

        const lineIndex = currentFile.lines.findIndex(line => line.id === id);
        if (lineIndex === -1) return false;

        const deletedLine = currentFile.lines[lineIndex];
        currentFile.lines.splice(lineIndex, 1);

        // Save history state
        this.addHistoryState('delete', deletedLine);

        this.notifyListeners('data-changed', currentFile);
        return true;
    }

    /**
     * Move a line to a new position in the current file
     */
    moveLine(id, newPosition) {
        const currentFile = this.getCurrentFile();
        if (!currentFile) return false;

        const lineIndex = currentFile.lines.findIndex(line => line.id === id);
        if (lineIndex === -1) return false;

        if (newPosition < 0 || newPosition >= currentFile.lines.length) return false;
        if (lineIndex === newPosition) return true; // No change needed

        const [movedLine] = currentFile.lines.splice(lineIndex, 1);
        currentFile.lines.splice(newPosition, 0, movedLine);

        // Save history state
        this.addHistoryState('move', { id, oldPosition: lineIndex, newPosition });

        this.notifyListeners('data-changed', currentFile);
        this.saveData(); // Save data after moving a line
        return true;
    }

    /**
     * Get a specific line by id from the current file
     */
    getLine(id) {
        const currentFile = this.getCurrentFile();
        if (!currentFile) return null;
        return currentFile.lines.find(line => line.id === id) || null;
    }

    /**
     * Get all lines from the current file
     */
    getLines() {
        const currentFile = this.getCurrentFile();
        if (!currentFile) return [];
        return [...currentFile.lines];
    }
    
    /**
     * Get all paths from all files to build the navigation tree
     */
    getAllPaths() {
        if (!this.data || this.data.length === 0) return [];
        
        // Extract all the path objects from each file
        return this.data.map((file, index) => {
            return {
                path: file.path,
                index: index,
                updated: file.updated
            };
        });
    }
    
    /**
     * Update the path of a file to move it to a new location in the tree
     * @param {Number} fileIndex - Index of the file to move
     * @param {Object} newPath - New path object for the file
     * @returns {Boolean} True if successful, false otherwise
     */
    updateFilePath(fileIndex, newPath) {
        if (!this.data || fileIndex < 0 || fileIndex >= this.data.length) {
            return false;
        }
        
        // Update the path
        this.data[fileIndex].path = newPath;
        
        // Update the timestamp to mark the file as modified
        this.data[fileIndex].updated = Date.now();
        
        // Notify listeners
        this.notifyListeners('file-changed', this.data[fileIndex]);
        this.notifyListeners('data-changed', this.data[fileIndex]);
        
        // Save the changes
        this.saveData();
        
        return true;
    }

    /**
     * Add a history state for undo/redo functionality
     */
    addHistoryState(action, oldData, newData = null) {
        const currentFile = this.getCurrentFile();
        if (!currentFile) return;

        const historyItem = {
            timestamp: Date.now(),
            action,
            oldData,
            newData
        };

        // Limit history size
        if (currentFile.history.length > 50) {
            currentFile.history.shift(); // Remove oldest entry
        }

        currentFile.history.push(historyItem);
    }

    /**
     * Generate a unique ID for new elements
     */
    generateId() {
        return Math.random().toString(16).slice(2, 10);
    }

    /**
     * Generate empty HTML table structure
     */
    generateEmptyTable(rows, columns) {
        let tableHtml = '<thead><tr>';
        
        // Create header cells
        for (let i = 0; i < columns; i++) {
            tableHtml += `<th contenteditable='true' style='width: ${100/columns}%;'></th>`;
        }
        
        tableHtml += '</tr></thead><tbody>';
        
        // Create table body rows
        for (let i = 0; i < rows - 1; i++) {
            tableHtml += '<tr>';
            for (let j = 0; j < columns; j++) {
                tableHtml += `<td contenteditable='true' style='width: ${100/columns}%;'></td>`;
            }
            tableHtml += '</tr>';
        }
        
        tableHtml += '</tbody>';
        return tableHtml;
    }

    /**
     * Observer pattern: Add event listener
     */
    addEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Observer pattern: Remove event listener
     */
    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Observer pattern: Notify listeners of events
     */
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}