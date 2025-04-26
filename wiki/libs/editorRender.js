import { $, $$ } from './myjquery.js';
import { newTextLine, newTableLine, newDividerLine, newH1Line, newH2Line, newH3Line, newCodeLine, newImageLine, newDiagramLine } from './editorNewElements.js'

const $editor = $("editor");

function renderEditor(rawData) {
    if (rawData) {
        $editor.innerHTML = '';
        
        // Get lines from the current file in the data array
        const lines = rawData.lines || [];
        
        for (let line of lines) {
            let $line = null;
            if (line.type === "text") {
                $line = newTextLine(line);
            } else if (line.type === "table") {
                $line = newTableLine(line);
            } else if (line.type === "divider") {
                $line = newDividerLine(line);
            } else if (line.type === "h1") {
                $line = newH1Line(line);
            } else if (line.type === "h2") {
                $line = newH2Line(line);
            } else if (line.type === "h3") {
                $line = newH3Line(line);
            } else if (line.type === "code") {
                $line = newCodeLine(line);
            } else if (line.type === "image") {
                $line = newImageLine(line);
            } else if (line.type === "diagram") {
                $line = newDiagramLine(line);
            }
            
            if ($line) {
                $editor.appendChild($line);
            }
        }
    }
}

export { renderEditor }