import { LANGUAGES, DIAGRAM_THEMES, DIAGRAM_LAYOUTS } from './consts.js';
import { shortUUID } from './utils.js';
import { renderDiagram } from './diagram.js';

function createActionElement($line) {
    const $actions = document.createElement('actions');
    const $add = document.createElement('img');
    const $grab = document.createElement('img');
    const $delete = document.createElement('img');

    $add.className = "i";
    $add.style.left = "-40px";
    $add.src = "./icons/add.svg";

    $add.addEventListener("click", function () {
        const $newline = newTextLine();
        $line.insertAdjacentElement("afterend", $newline);
        $newline.querySelector("text").focus();
    });

    $grab.className = "i";
    $grab.style.left = "-20px";
    $grab.style.cursor = "grab";
    $grab.setAttribute('draggable', 'true');
    $grab.setAttribute('title', 'Arrastrar para reordenar');
    $grab.src = "./icons/grab.svg";
    
    // Evitar propagación de eventos que puedan interferir con el arrastre
    $grab.addEventListener('mousedown', function(e) {
        e.stopPropagation();
    });

    $delete.className = "i";
    $delete.style.left = "730px";
    $delete.src = "./icons/delete.svg";

    $delete.addEventListener("click", function () {
        $line.remove();
    });

    $actions.appendChild($add);
    $actions.appendChild($grab);
    $actions.appendChild($delete);

    return $actions;
}

function newTextLine({ id = shortUUID(), value = "" } = {}) {
    const $line = document.createElement('line');
    const $text = document.createElement('text');
    const $actions = createActionElement($line);

    $text.innerHTML = value;

    $line.setAttribute("data-id", id);
    $text.setAttribute("contenteditable", "true");

    $line.appendChild($actions);
    $line.appendChild($text);
    console.log({line: $line})
    return $line;
}

function newTableLine({ id = shortUUID(), rows = 2, cols = 3, value = "" } = {}) {
    const $line = document.createElement('line');
    $line.setAttribute("data-id", id);
    const $actions = createActionElement($line);

    // Creamos la tabla
    const $table = document.createElement('table');
    const columnWidth = `${100 / cols}%`;

    if (value.trim() !== "") {
        $table.innerHTML = value;
        // Aseguramos que las columnas tengan el ancho correcto
        updateColumnWidths($table, cols);
    } else {
        // Construir una nueva tabla desde cero
        createNewTable($table, rows, cols, columnWidth);
    }

    // Añadimos elementos a la línea
    $line.append($actions, $table);
    return $line;
}

// Función para crear una nueva tabla desde cero
function createNewTable($table, rows, cols, columnWidth) {
    const $thead = document.createElement('thead');
    const $tbody = document.createElement('tbody');

    // Crear fila de encabezados
    const $headerRow = document.createElement('tr');
    for (let i = 0; i < cols; i++) {
        const $th = document.createElement('th');
        $th.contentEditable = "true";
        $th.style.width = columnWidth;
        $headerRow.appendChild($th);
    }
    $thead.appendChild($headerRow);

    // Crear filas del cuerpo de la tabla
    for (let i = 0; i < rows - 1; i++) { // -1 porque el thead ya cuenta como una fila
        const $tr = document.createElement('tr');
        for (let j = 0; j < cols; j++) {
            const $td = document.createElement('td');
            $td.contentEditable = "true";
            $td.style.width = columnWidth;
            $tr.appendChild($td);
        }
        $tbody.appendChild($tr);
    }

    $table.append($thead, $tbody);
}

// Función para actualizar el ancho de las columnas
function updateColumnWidths($table, cols) {
    const columnWidth = `${100 / cols}%`;
    const cells = $table.querySelectorAll('th, td');
    
    cells.forEach(cell => {
        cell.style.width = columnWidth;
    });
}

function newDividerLine({ id = shortUUID() } = {}) {
    const $line = document.createElement('line');
    const $divider = document.createElement('hr');
    const $actions = createActionElement($line);

    $line.setAttribute("data-id", id);
    $divider.style.width = "50%%";
    $divider.style.margin = "8px auto";

    $line.appendChild($actions);
    $line.appendChild($divider);
    return $line;
}

function newH1Line({ id = shortUUID(), value = "" } = {}) {
    const $line = document.createElement('line');
    const $h1 = document.createElement('h1');
    const $actions = createActionElement($line);

    $h1.innerHTML = value;

    $line.setAttribute("data-id", id);
    $h1.setAttribute("contenteditable", "true");

    $line.appendChild($actions);
    $line.appendChild($h1);
    return $line;
}

function newH2Line({ id = shortUUID(), value = "" } = {}) {
    const $line = document.createElement('line');
    const $h2 = document.createElement('h2');
    const $actions = createActionElement($line);

    $h2.innerHTML = value;

    $line.setAttribute("data-id", id);
    $h2.setAttribute("contenteditable", "true");

    $line.appendChild($actions);
    $line.appendChild($h2);
    return $line;
}

function newH3Line({ id = shortUUID(), value = "" } = {}) {
    const $line = document.createElement('line');
    const $h3 = document.createElement('h3');
    const $actions = createActionElement($line);

    $h3.innerHTML = value;

    $line.setAttribute("data-id", id);
    $h3.setAttribute("contenteditable", "true");

    $line.appendChild($actions);
    $line.appendChild($h3);
    return $line;
}

function newCodeLine({ id = shortUUID(), value = "", lang = "text" } = {}) {
    const $line = document.createElement('line');
    const $lang = document.createElement('select');
    const $code = document.createElement('code');
    const $actions = createActionElement($line);

    LANGUAGES.forEach(
        v => $lang.appendChild(
            Object.assign(
                document.createElement('option'),
                { value: v, text: v }
            )
        )
    );
    $lang.value = lang;

    $code.innerHTML = value;

    $line.setAttribute("data-id", id);
    $code.setAttribute("contenteditable", "true");
    $code.setAttribute("class", `language-${lang}`);

    $line.appendChild($actions);
    $line.appendChild($lang);
    $line.appendChild($code);
    return $line;
}

function newImageLine({ id = shortUUID(), value = "", height = "" } = {}) {
    const $line = document.createElement('line');
    const $img = document.createElement('img');
    const $actions = createActionElement($line);

    $img.src = value || './icons/image.svg'; // Placeholder if no value
    $img.style.height = height ? `${height}px` : 'auto';
    $img.style.maxWidth = '710px';
    $img.style.cursor = 'pointer';
    $line.setAttribute("data-id", id);
    $line.appendChild($actions);
    $line.appendChild($img);
    return $line;
}

function newDiagramLine({ id = shortUUID(), value = "", theme = "dark", layout = "elk" } = {}) {
    const createSelect = (options, value, className) => {
        const select = document.createElement('select');
        select.className = className;
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = option.textContent = opt;
            select.appendChild(option);
        });
        select.value = value;
        return select;
    };

    const toggleVisibility = (showDiagram) => {
        const showEditor = !showDiagram;
        $mode.src = showDiagram ? './icons/pencil.svg' : './icons/eye.svg';
        $mermaidCode.style.display = showEditor ? '' : 'none';
        $theme.style.display = showEditor ? '' : 'none';
        $layout.style.display = showEditor ? '' : 'none';
        $diagram.style.display = showDiagram ? '' : 'none';
    };

    const $line = document.createElement('line');
    const $mermaidCode = document.createElement('code');
    const $diagram = document.createElement('diagram');
    const $mode = document.createElement('img');
    const $theme = createSelect(DIAGRAM_THEMES, theme, 'theme');
    const $layout = createSelect(DIAGRAM_LAYOUTS, layout, 'layout');
    const $diagramMenu = document.createElement('diagram-menu');
    const $actions = createActionElement($line);

    $mode.src = './icons/eye.svg';
    $mode.className = 'icon';

    $mode.addEventListener('click', async () => {
        const isRendered = await renderDiagram($theme, $layout, $mermaidCode, $diagram);
        if (isRendered) {
            const showingCode = $mode.src.includes('eye');
            toggleVisibility(showingCode);
        } else {
            toggleVisibility(false);
        }
    });

    $mermaidCode.innerHTML = value;
    $mermaidCode.setAttribute("contenteditable", "true");
    $diagram.style.display = 'none';
    $line.setAttribute("data-id", id);

    // Render immediately if there's initial value
    if (value) {
        requestAnimationFrame(() => {
            renderDiagram($theme, $layout, $mermaidCode, $diagram).then(isRendered => {
                if (isRendered) toggleVisibility(true);
            });
        });
    }

    [$theme, $layout, $mode].forEach(el => $diagramMenu.appendChild(el));
    [$actions, $diagramMenu, $mermaidCode, $diagram].forEach(el => $line.appendChild(el));

    return $line;
}


export { newTextLine, newTableLine, newDividerLine, newH1Line, newH2Line, newH3Line, newCodeLine, newImageLine, newDiagramLine };