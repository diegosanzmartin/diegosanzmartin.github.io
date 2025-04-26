import { $, $$ } from './myjquery.js';
import { getData } from './editorGetData.js'
import { renderEditor } from './editorRender.js';

const $editor = $("editor");

function createHistoryMenu() {
    const $historyMenu = document.createElement("historyMenu");
    $historyMenu.innerHTML = `
    <img id="backhistory" src="./icons/back.svg">
    <img id="uphistory" src="./icons/up.svg">
    <img id="history" src="./icons/history.svg">
    `

    document.body.appendChild($historyMenu);
}

function setupEditorAutosave() {
    let debounceTimer;

    const compareLines = (prevLinesMap, currentLine) => {
        const prev = prevLinesMap.get(currentLine.id);
        if (!prev) return true;

        // Comparar solo las claves relevantes
        const keys = Object.keys(currentLine);
        for (const key of keys) {
            if (key !== 'id' && JSON.stringify(currentLine[key]) !== JSON.stringify(prev[key])) {
                return true;
            }
        }
        return false;
    };

    const saveToLocalStorage = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const now = Math.floor(Date.now() / 1000);
            const currentData = getData();
            const currentLines = currentData.lines;

            const stored = JSON.parse(localStorage.getItem('editorData')) || {};
            const prevLines = stored.lines || [];
            const history = stored.history || [];

            const prevMap = new Map(prevLines.map(line => [line.id, line]));

            const modifiedLines = currentLines.filter(line => compareLines(prevMap, line));

            if (modifiedLines.length === 0) return; // Nada ha cambiado

            history.push({
                updated: now,
                lines: modifiedLines
            });

            const newData = {
                ...currentData,
                updated: now,
                history
            };

            localStorage.setItem('editorData', JSON.stringify(newData));
            console.log(`Auto-saved ${modifiedLines.length} line(s) at ${now}`);
        }, 1000);
    };

    $editor.addEventListener("input", saveToLocalStorage);
    new MutationObserver(saveToLocalStorage).observe($editor, {
        childList: true,
        subtree: true,
        attributes: true
    });
}

function restoreLinesFromHistory() {
    const editorData = JSON.parse(localStorage.getItem('editorData'));
    if (!editorData || !editorData.history || editorData.history.length === 0) return;

    const lastEntry = editorData.history.pop();
    const lastLines = lastEntry.lines;
    const currentLines = editorData.lines;

    // Crear mapa actual por ID para reemplazar líneas
    const linesMap = new Map(currentLines.map(line => [line.id, line]));

    // Reemplazar o insertar líneas del historial
    for (const line of lastLines) {
        linesMap.set(line.id, line);
    }

    // Reconstruir array de líneas preservando el orden original, con actualizaciones
    const updatedLines = currentLines.map(line => linesMap.get(line.id) || line);

    // Asegurar que también agregamos líneas nuevas si no existían antes
    const newLineIds = lastLines.map(line => line.id);
    const missingLines = lastLines.filter(line => !updatedLines.some(l => l.id === line.id));
    updatedLines.push(...missingLines);

    // Guardar cambios
    const now = Math.floor(Date.now() / 1000);
    const updatedData = {
        ...editorData,
        updated: now,
        lines: updatedLines,
        history: editorData.history
    };

    localStorage.setItem('editorData', JSON.stringify(updatedData));
    console.log(`Restored ${lastLines.length} line(s) from history`);

    // Rerender en el DOM si hace falta
    renderEditor(updatedData);
}

export { createHistoryMenu, setupEditorAutosave, restoreLinesFromHistory }