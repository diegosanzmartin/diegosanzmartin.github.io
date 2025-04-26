import { $, $$ } from './myjquery.js';
import { updateCurrentFile } from './editorGetData.js';

// Crear el menú contextual para las tablas
const $tableContextMenu = document.createElement("div");
$tableContextMenu.classList.add("context-menu", "table-context-menu");
$tableContextMenu.innerHTML = `
    <ul>
        <li id="addRowAbove">
            <img src="./icons/addRowBot.svg"> Añadir fila arriba
        </li>
        <li id="addRowBelow">
            <img src="./icons/addRowUp.svg"> Añadir fila abajo
        </li>
        <li id="deleteRow">
            <img src="./icons/deleteRow.svg"> Eliminar fila
        </li>
        <li class="divider"></li>
        <li id="addColumnLeft">
            <img src="./icons/addColumnLeft.svg"> Añadir columna izquierda
        </li>
        <li id="addColumnRight">
            <img src="./icons/addColumnRight.svg"> Añadir columna derecha
        </li>
        <li id="deleteColumn">
            <img src="./icons/deleteColumn.svg"> Eliminar columna
        </li>
    </ul>
`;

// Variables para controlar el estado
let currentCell = null;
let currentTable = null;
let currentRow = null;
let currentColumnIndex = -1;
let currentRowIndex = -1;
let isHeaderRow = false;
let dataService = null;

/**
 * Inicializa el menú contextual para las tablas
 */
export function initTableContextMenu(dataServiceInstance) {
    // Store reference to data service if provided
    if (dataServiceInstance) {
        dataService = dataServiceInstance;
    }
    
    // Añadir al DOM si no existe
    if (!document.querySelector('.table-context-menu')) {
        document.body.appendChild($tableContextMenu);
    }
    
    // Capturar eventos de clic derecho en celdas de tabla
    document.addEventListener('contextmenu', handleTableContextMenu);
    
    // Ocultar menú en clic fuera
    document.addEventListener('click', (e) => {
        if (!$tableContextMenu.contains(e.target)) {
            hideTableContextMenu();
        }
    });
    
    // Añadir event listeners a las opciones del menú
    setupTableMenuListeners();
}

/**
 * Maneja el evento contextmenu en celdas de tabla
 */
function handleTableContextMenu(e) {
    // Verificar si el clic fue en una celda de tabla
    const cell = e.target.closest('th, td');
    if (!cell) return;
    
    e.preventDefault();
    
    // Guardar referencias
    currentCell = cell;
    currentTable = cell.closest('table');
    currentRow = cell.closest('tr');
    isHeaderRow = cell.tagName.toLowerCase() === 'th';
    
    // Determinar índices
    const cells = Array.from(currentRow.children);
    currentColumnIndex = cells.indexOf(cell);
    
    const rows = isHeaderRow 
        ? [currentRow] 
        : Array.from(currentTable.querySelector('tbody').querySelectorAll('tr'));
    currentRowIndex = isHeaderRow ? 0 : rows.indexOf(currentRow) + 1; // +1 para tener en cuenta el header
    
    // Mostrar menú
    showTableContextMenu(e.pageX, e.pageY);
}

/**
 * Muestra el menú contextual de tabla en las coordenadas dadas
 */
function showTableContextMenu(x, y) {
    $tableContextMenu.style.top = `${y}px`;
    $tableContextMenu.style.left = `${x}px`;
    $tableContextMenu.style.display = "block";
}

/**
 * Oculta el menú contextual de tabla
 */
function hideTableContextMenu() {
    $tableContextMenu.style.display = "none";
    // Resetear variables
    currentCell = null;
    currentTable = null;
    currentRow = null;
    currentColumnIndex = -1;
    currentRowIndex = -1;
    isHeaderRow = false;
}

/**
 * Update the data if needed
 */
function updateDataIfNeeded() {
    if (dataService) {
        // Update the current file in the data service
        updateCurrentFile(dataService);
    }
}

/**
 * Configura los listeners para las opciones del menú
 */
function setupTableMenuListeners() {
    // Añadir fila arriba
    $("#addRowAbove").addEventListener("click", () => {
        if (!currentTable) return;
        
        if (isHeaderRow) {
            // No se pueden añadir filas arriba del header
            console.log("No se pueden añadir filas arriba del encabezado");
            hideTableContextMenu();
            return;
        }
        
        addRow(currentRowIndex - 1); // -1 porque currentRowIndex ya incluye el header
        hideTableContextMenu();
        updateDataIfNeeded();
    });
    
    // Añadir fila abajo
    $("#addRowBelow").addEventListener("click", () => {
        if (!currentTable) return;
        
        addRow(currentRowIndex);
        hideTableContextMenu();
        updateDataIfNeeded();
    });
    
    // Eliminar fila
    $("#deleteRow").addEventListener("click", () => {
        if (!currentTable) return;
        
        if (isHeaderRow) {
            // No se puede eliminar el header
            console.log("No se puede eliminar la fila de encabezado");
            hideTableContextMenu();
            return;
        }
        
        // Si solo queda una fila en el cuerpo, no permitir eliminarla
        const bodyRows = currentTable.querySelector('tbody').querySelectorAll('tr');
        if (bodyRows.length <= 1) {
            console.log("La tabla debe tener al menos una fila en el cuerpo");
            hideTableContextMenu();
            return;
        }
        
        deleteRow(currentRowIndex - 1); // -1 para obtener el índice correcto en el cuerpo
        hideTableContextMenu();
        updateDataIfNeeded();
    });
    
    // Añadir columna a la izquierda
    $("#addColumnLeft").addEventListener("click", () => {
        if (!currentTable) return;
        
        addColumn(currentColumnIndex);
        hideTableContextMenu();
        updateDataIfNeeded();
    });
    
    // Añadir columna a la derecha
    $("#addColumnRight").addEventListener("click", () => {
        if (!currentTable) return;
        
        addColumn(currentColumnIndex + 1);
        hideTableContextMenu();
        updateDataIfNeeded();
    });
    
    // Eliminar columna
    $("#deleteColumn").addEventListener("click", () => {
        if (!currentTable) return;
        
        // Si solo queda una columna, no permitir eliminarla
        const headerCells = currentTable.querySelector('thead tr').querySelectorAll('th');
        if (headerCells.length <= 1) {
            console.log("La tabla debe tener al menos una columna");
            hideTableContextMenu();
            return;
        }
        
        deleteColumn(currentColumnIndex);
        hideTableContextMenu();
        updateDataIfNeeded();
    });
}

/**
 * Añade una fila en el índice especificado
 */
function addRow(index) {
    const tbody = currentTable.querySelector('tbody');
    const numCols = currentTable.querySelector('thead tr').querySelectorAll('th').length;
    const columnWidth = `${100 / numCols}%`;
    
    // Crear nueva fila
    const newRow = document.createElement('tr');
    for (let i = 0; i < numCols; i++) {
        const cell = document.createElement('td');
        cell.contentEditable = "true";
        cell.style.width = columnWidth;
        newRow.appendChild(cell);
    }
    
    // Insertar la fila
    const bodyRows = Array.from(tbody.querySelectorAll('tr'));
    if (index >= bodyRows.length) {
        tbody.appendChild(newRow);
    } else {
        tbody.insertBefore(newRow, bodyRows[index]);
    }
}

/**
 * Elimina la fila en el índice especificado
 */
function deleteRow(index) {
    const tbody = currentTable.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    
    if (index >= 0 && index < rows.length) {
        rows[index].remove();
    }
}

/**
 * Añade una columna en el índice especificado
 */
function addColumn(index) {
    // Obtener filas de la tabla
    const thead = currentTable.querySelector('thead');
    const tbody = currentTable.querySelector('tbody');
    const headerRow = thead.querySelector('tr');
    const bodyRows = tbody.querySelectorAll('tr');
    
    // Calcular nuevo ancho de columna
    const numCols = headerRow.querySelectorAll('th').length + 1; // +1 por la nueva columna
    const columnWidth = `${100 / numCols}%`;
    
    // Actualizar ancho de todas las celdas existentes
    updateAllColumnWidths(currentTable, numCols);
    
    // Añadir celda al encabezado
    const newHeaderCell = document.createElement('th');
    newHeaderCell.contentEditable = "true";
    newHeaderCell.style.width = columnWidth;
    
    // Determinar dónde insertar la nueva celda de encabezado
    const headerCells = Array.from(headerRow.querySelectorAll('th'));
    if (index >= headerCells.length) {
        headerRow.appendChild(newHeaderCell);
    } else {
        headerRow.insertBefore(newHeaderCell, headerCells[index]);
    }
    
    // Añadir celda a cada fila del cuerpo
    bodyRows.forEach(row => {
        const newCell = document.createElement('td');
        newCell.contentEditable = "true";
        newCell.style.width = columnWidth;
        
        const cells = Array.from(row.querySelectorAll('td'));
        if (index >= cells.length) {
            row.appendChild(newCell);
        } else {
            row.insertBefore(newCell, cells[index]);
        }
    });
}

/**
 * Elimina la columna en el índice especificado
 */
function deleteColumn(index) {
    // Obtener filas de la tabla
    const thead = currentTable.querySelector('thead');
    const tbody = currentTable.querySelector('tbody');
    const headerRow = thead.querySelector('tr');
    const bodyRows = tbody.querySelectorAll('tr');
    
    // Calcular nuevo ancho de columna
    const numCols = headerRow.querySelectorAll('th').length - 1; // -1 por la columna a eliminar
    const columnWidth = `${100 / numCols}%`;
    
    // Eliminar celda del encabezado
    const headerCells = headerRow.querySelectorAll('th');
    if (index >= 0 && index < headerCells.length) {
        headerCells[index].remove();
    }
    
    // Eliminar celda de cada fila del cuerpo
    bodyRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (index >= 0 && index < cells.length) {
            cells[index].remove();
        }
    });
    
    // Actualizar ancho de todas las celdas existentes
    updateAllColumnWidths(currentTable, numCols);
}

/**
 * Actualiza el ancho de todas las celdas de la tabla
 */
function updateAllColumnWidths(table, numCols) {
    const columnWidth = `${100 / numCols}%`;
    const cells = table.querySelectorAll('th, td');
    
    cells.forEach(cell => {
        cell.style.width = columnWidth;
    });
}