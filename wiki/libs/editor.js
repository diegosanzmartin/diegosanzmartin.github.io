import { renderEditor } from './editorRender.js';
import { createContextMenu } from './editorContextMenu.js';
import { initDragAndDrop } from './editorDragDrop.js';
import { initTableContextMenu } from './editorTableContextMenu.js';
import { updateCurrentFile } from './editorGetData.js';
import { initTextToolbar } from './textToolbar.js';

export class Editor {
    constructor(dataService) {
        this.dataService = dataService;
        this.dragDropInitialized = false;
        
        // Add listener for file changes to re-render the editor
        this.dataService.addEventListener('file-changed', () => {
            this.render();
        });
        
        // Add input event listener to the editor to update data on changes
        document.addEventListener('input', this.handleEditorInput.bind(this));
    }
    
    /**
     * Handle input events in the editor
     * @param {Event} e - The input event
     */
    handleEditorInput(e) {
        // Only process input events inside the editor
        const editor = document.querySelector('editor');
        if (editor && editor.contains(e.target)) {
            // Update the current file with the new content
            setTimeout(() => {
                updateCurrentFile(this.dataService);
            }, 100); // Short delay to allow the DOM to update fully
        }
    }

    render() {
        // Pass the current file instead of the entire data array
        const currentFile = this.dataService.getCurrentFile();
        if (currentFile) {
            renderEditor(currentFile);
            createContextMenu(this.dataService);
            
            // Initialize drag and drop only once
            if (!this.dragDropInitialized) {
                initDragAndDrop(this.dataService);
                this.dragDropInitialized = true;
                console.log('Drag and drop functionality initialized');
            }
            
            // Inicializar el menú contextual de tablas
            initTableContextMenu(this.dataService);
            
            // Inicializar la barra de herramientas de texto
            initTextToolbar(this.dataService);
        } else {
            console.error('No current file to render');
        }
    }
}