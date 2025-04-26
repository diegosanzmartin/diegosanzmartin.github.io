import { $, $$ } from './myjquery.js';
import { newTextLine, newTableLine, newDividerLine, newH1Line, newH2Line, newH3Line, newCodeLine, newImageLine, newDiagramLine } from './editorNewElements.js';
import { updateCurrentFile } from './editorGetData.js';

const $contextMenu = document.createElement("div");
// Reference to the data service - will be set when createContextMenu is called
let dataService = null;
// Store a reference to the current line to avoid querying the DOM again
let currentLineElement = null;

function createContextMenu(dataServiceInstance) {
    // Store reference to data service if provided
    if (dataServiceInstance) {
        dataService = dataServiceInstance;
    }
    
    $contextMenu.classList.add("context-menu");
    $contextMenu.innerHTML = `
        <ul>
            <li id="addText">
                <img src="./icons/text.svg"> Text
            </li>
            <li id="addTable">
                <img src="./icons/table.svg"> Table
            </li>
            <li id="addDivider">
                <img src="./icons/divider.svg"> Divider
            </li>
            <li id="addFold">
                <img src="./icons/fold.svg"> Fold
            </li>
            <li id="addH1">
                <img src="./icons/h1.svg"> Title
            </li>
            <li id="addH2">
                <img src="./icons/h2.svg"> Subtitle
            </li>
            <li id="addH3">
                <img src="./icons/h3.svg"> Subsubtitle
            </li>
            <li id="addCode">
                <img src="./icons/code.svg"> Code
            </li>
            <li id="addImage">
                <img src="./icons/image.svg"> Image
            </li>
            <li id="addDiagram">
                <img src="./icons/diagram.svg"> Diagram
            </li>
        </ul>
    `;
    document.body.appendChild($contextMenu);
    contextMenuListeners();
    return $contextMenu;
}

function showContextMenu(x, y, $line) {
    $contextMenu.style.top = `${y}px`;
    $contextMenu.style.left = `${x}px`;
    $contextMenu.style.display = "block";
    // Store the line element directly instead of just its ID
    currentLineElement = $line;
    $contextMenu.dataset.id = $line.dataset.id;
}

function hideContextMenu() {
    $contextMenu.style.display = "none";
    // Clean up reference when menu is hidden
    currentLineElement = null;
}

function updateDataIfNeeded() {
    if (dataService) {
        // Update the current file in the data service
        updateCurrentFile(dataService);
    }
}

function contextMenuListeners() {
    document.addEventListener("click", (e) => {
        if (!$contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });

    document.addEventListener("contextmenu", (e) => {
        if (e.target.classList.contains("i")) {
            e.preventDefault();
            const $line = e.target.parentElement.parentElement;
            showContextMenu(e.pageX, e.pageY, $line);
            console.log();
        }
    });

    $("#addText").addEventListener("click", function() {
        const $newline = newTextLine();
        console.log(currentLineElement);
        currentLineElement.insertAdjacentElement("afterend", $newline);
        $newline.querySelector("text").focus();
        hideContextMenu();
        updateDataIfNeeded();
    });

    $("#addTable").addEventListener("click", function() {
        const $newline = newTableLine();
        currentLineElement.insertAdjacentElement("afterend", $newline);
        hideContextMenu();
        updateDataIfNeeded();
    });

    $("#addDivider").addEventListener("click", function() {
        const $newline = newDividerLine();
        currentLineElement.insertAdjacentElement("afterend", $newline);
        hideContextMenu();
        updateDataIfNeeded();
    });

    $("#addFold").addEventListener("click", function() {
        console.log("addFold");
        updateDataIfNeeded();
    });

    $("#addH1").addEventListener("click", function() {
        const $newline = newH1Line();
        currentLineElement.insertAdjacentElement("afterend", $newline);
        $newline.querySelector("h1").focus();
        hideContextMenu();
        updateDataIfNeeded();
    });

    $("#addH2").addEventListener("click", function() {
        const $newline = newH2Line();
        currentLineElement.insertAdjacentElement("afterend", $newline);
        $newline.querySelector("h2").focus();
        hideContextMenu();
        updateDataIfNeeded();
    });

    $("#addH3").addEventListener("click", function() {
        const $newline = newH3Line();
        currentLineElement.insertAdjacentElement("afterend", $newline);
        $newline.querySelector("h3").focus();
        hideContextMenu();
        updateDataIfNeeded();
    });

    $("#addCode").addEventListener("click", function() {
        const $newline = newCodeLine();
        currentLineElement.insertAdjacentElement("afterend", $newline);
        $newline.querySelector("code").focus();
        hideContextMenu();
        updateDataIfNeeded();
    });

    $("#addImage").addEventListener("click", function() {
        const $newline = newImageLine();
        currentLineElement.insertAdjacentElement("afterend", $newline);
        hideContextMenu();
        updateDataIfNeeded();
    });

    $("#addDiagram").addEventListener("click", function() {
        const $newline = newDiagramLine();
        currentLineElement.insertAdjacentElement("afterend", $newline);
        hideContextMenu();
        updateDataIfNeeded();
    });
}

export { createContextMenu }