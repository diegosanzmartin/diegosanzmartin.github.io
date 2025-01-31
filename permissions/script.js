// Variables globales
let roles = {};
let permissions = {};
let commonPermissions = {};

// Elementos DOM
const table = document.getElementById("table");
const thead = document.getElementById("thead");
const textElement = document.getElementById("text");
const itemsElement = document.getElementById("items");
const searchElement = document.getElementById('search');

// Función para parsear consultas regex
function parseRegexQuery(query) {
    const regexMatch = query.match(/^\/(.*)\/([gimuy]*)$/);
    try {
        if (regexMatch) {
            const [, pattern, flags] = regexMatch;
            return new RegExp(pattern, flags);
        }
        console.log('Regex válido:', query);
        return new RegExp(query, 'i');
    } catch (e) {
        console.error('Regex inválido:', e);
        return new RegExp('', 'i');
    }
}

// Función de búsqueda con regex
function searchRegex(query, data) {
    // Si la consulta contiene ",", la dividimos en varias consultas
    const queries = query.includes(',') ? query.split(',').map(q => q.trim()) : [query];

    // Array para almacenar todos los resultados
    let allResults = [];

    // Aplicar cada consulta por separado
    queries.forEach(q => {
        const regex = parseRegexQuery(q);
        const results = Object.keys(data).filter(key => regex.test(key));
        allResults = allResults.concat(results);
    });

    // Eliminar duplicados (si es necesario)
    const uniqueResults = [...new Set(allResults)];

    return uniqueResults;
}

// Función para cargar datos JSON
async function fetchJsonFiles() {
    try {
        const [rolesResponse, permissionsResponse] = await Promise.all([
            fetch('./gcp_roles.json'),
            fetch('./gcp_perm.json')
        ]);

        if (!rolesResponse.ok || !permissionsResponse.ok) {
            throw new Error('Error al cargar los archivos JSON');
        }

        roles = await rolesResponse.json();
        permissions = await permissionsResponse.json();
	searchPermissions('.*');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función auxiliar para inicializar tabla
function initializeTable(headers) {
    thead.innerHTML = headers.map(header => `<th>${header}</th>`).join('');
    table.innerHTML = "";
}

function validateNumber(number) {
    if (number <= 0) {
        number = 1;
    }

    if (!Number.isInteger(number)) {
        number = Math.floor(number);
    }

    return number;
}

function getCommon(results) {
    let commonRoles = null;

    results.forEach((e) => {
        const roles = permissions[e];
        if (commonRoles === null) {
            commonRoles = new Set(Object.keys(roles));
        } else {
            const currentRoles = new Set(Object.keys(roles));
            commonRoles = new Set([...commonRoles].filter(role => currentRoles.has(role)));
        }
    });

    const common = {};
    if (commonRoles !== null) {
        const firstKey = results[0];
        commonRoles.forEach(role => {
            common[role] = permissions[firstKey][role];
        });
    }

    const result = {
        [results.join(', ')]: common
    };

    commonPermissions = result;
}

// Función auxiliar para realizar búsquedas
function performSearch(data, query, typeLabel) {
    const itemsLimit = validateNumber(itemsElement.value);
    const totalResults = searchRegex(query, data)
    const results = totalResults.slice(0, itemsLimit);

    itemsElement.value = itemsLimit;

    showLimit = itemsLimit > totalResults.length ? totalResults.length : itemsLimit

    textElement.textContent = `${showLimit} / ${totalResults.length} ${typeLabel}`;
    return results;
}

// Factory function para crear formateadores de tabla
const createTableFormatter = (config) => function(results) {
    results.forEach(result => {
        const data = config.getData(result);
        const items = config.getItems(data);
        const minRows = 5;
        const rowSpan = items.length > minRows ? items.length + 1 : items.length;

        // Crear fila principal
        const firstRow = document.createElement("tr");
        firstRow.innerHTML = config.getFirstRow(result, data, items[0], rowSpan);
        table.appendChild(firstRow);

        // Crear filas adicionales
        const hiddenRows = [];
        for (let i = 1; i < items.length; i++) {
            const row = document.createElement("tr");
            const isHidden = i >= minRows;
            row.innerHTML = config.getRowContent(items[i], data, isHidden);
            row.querySelectorAll('td').forEach(td => {
                if (isHidden) td.style.display = 'none';
            });
            table.appendChild(row);
            if (isHidden) hiddenRows.push(row);
        }

        // Agregar fila "mostrar más"
        if (hiddenRows.length > 0) {
            const showMoreRow = document.createElement("tr");
            showMoreRow.style.cursor = 'pointer';
            showMoreRow.innerHTML = `<td class="showmore" colspan="${config.colSpan}">+ Show ${hiddenRows.length} more</td>`;
            showMoreRow.addEventListener('click', () => {
                hiddenRows.forEach(row => {
                    row.querySelectorAll('td').forEach(td => td.style.display = '');
                });
                const tds = showMoreRow.querySelectorAll('td');
                tds.forEach(td => td.style.display = "none");
            });
            table.appendChild(showMoreRow);
        }
    });
};

// Configuraciones para diferentes tipos de datos
const permissionsFormatter = createTableFormatter({
    getData: result => permissions[result],
    getItems: data => Object.keys(data),
    getFirstRow: (result, data, firstItem, rowSpan) => `
        <td rowspan="${rowSpan}">${result}</td>
        <td class="pointer" onclick="searchRoles('${firstItem}')">${firstItem}</td>
        <td>${data[firstItem]}</td>
    `,
    getRowContent: (item, data) => `
        <td class="pointer" onclick="searchRoles('${item}')">${item}</td>
        <td>${data[item]}</td>
    `,
    colSpan: 2
});

const rolesFormatter = createTableFormatter({
    getData: result => roles[result],
    getItems: data => data.permissions.length === 0 ? [''] : data.permissions,
    getFirstRow: (result, data, firstItem, rowSpan) => `
        <td rowspan="${rowSpan}">${result}</td>
        <td rowspan="${rowSpan}">${data.group}</td>
        <td class="pointer" onclick="searchPermissions('${firstItem}')">${firstItem}</td>
    `,
    getRowContent: item => `
        <td class="pointer" onclick="searchPermissions('${item}')">${item}</td>
    `,
    colSpan: 1
});

const commonPermissionsFormatter = createTableFormatter({
    getData: result => commonPermissions[result],
    getItems: data => Object.keys(data),
    getFirstRow: (result, data, firstItem, rowSpan) => `
        <td rowspan="${rowSpan}">${result}</td>
        <td class="pointer" onclick="searchRoles('${firstItem}')">${firstItem}</td>
        <td>${data[firstItem]}</td>
    `,
    getRowContent: (item, data) => `
        <td class="pointer" onclick="searchRoles('${item}')">${item}</td>
        <td>${data[item]}</td>
    `,
    colSpan: 2
});

// Funciones de búsqueda
function searchPermissions(query) {
    initializeTable(['ID', 'Rol', 'Nº Permissions']);
    const results = performSearch(permissions, query, 'permissions');
    if (query.includes(',')) {
        getCommon(results);
        commonPermissionsFormatter([results.join(', ')]);
    }
    else
        permissionsFormatter(results);
}

function searchRoles(query) {
    initializeTable(['ID', 'Grupo', 'Permissions']);
    const results = performSearch(roles, query, 'roles');
    rolesFormatter(results);
}

// Event listeners
searchElement.addEventListener('input', event => {
    const query = event.target.value.trim();
    const type = document.getElementById("type").value;
    if (query) {
        type === 'permissions' ? searchPermissions(query) : searchRoles(query);
    }
});

// Event listeners
itemsElement.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        const query = searchElement.value.trim();
        const type = document.getElementById("type").value;
        type === 'permissions' ? searchPermissions(query) : searchRoles(query);
    }
});

// Cargar datos al iniciar
window.addEventListener('load', fetchJsonFiles);
