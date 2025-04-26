import { $, $$ } from './myjquery.js';
import { getH1Line, getH2Line, getH3Line, getTextLine, getDividerLine, getTableLine, getCodeLine, getImageLine, getDiagramLine } from './editorGetElements.js'

const $editor = $("editor");

/**
 * Get the line data from the editor
 * @returns {Array} Array of line objects
 */
function getLines() {
    const lines = [];

    const handlers = {
        h1: getH1Line,
        h2: getH2Line,
        h3: getH3Line,
        text: getTextLine,
        hr: getDividerLine,
        table: getTableLine,
        select: getCodeLine,
        img: getImageLine,
        diagram: getDiagramLine
    };

    $editor.querySelectorAll("line").forEach(element => {
        const $children = Array.from(element.children);
        for (const $child of $children) {
            const tag = $child.tagName.toLowerCase();
            
            if (tag === 'actions') continue;

            if (tag === 'select' && element.querySelector('code')) {
                lines.push(getCodeLine(element));
                break;
            }

            const handler = handlers[tag];
            if (handler && !(tag === 'select')) {
                lines.push(handler(element));
                break;
            }
        }
    });

    return lines;
}

/**
 * Get data from the editor - compatible with the old format for backward compatibility
 */
function getData() {
    return {
        history: [],
        lines: getLines()
    };
}

/**
 * Update the current file in dataService with current editor content
 * @param {DataService} dataService - The data service to update
 */
function updateCurrentFile(dataService) {
    if (!dataService || !dataService.getCurrentFile) return;
    
    const currentFile = dataService.getCurrentFile();
    if (!currentFile) return;
    
    // Update only the lines, preserving other properties
    currentFile.lines = getLines();
    
    // Schedule auto-save
    setTimeout(() => {
        dataService.saveData();
    }, 100);
}

export { getData, getLines, updateCurrentFile }