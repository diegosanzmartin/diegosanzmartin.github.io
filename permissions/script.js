// Variables globales
let cloudProvider = "gcp";
const cloud = {
    "gcp": {
        "roles": {
            "header": ["ID", "Permissions"],
            "url": "./data/gcp_roles.json"
        },
        "permissions": {
            "header": ["ID", "Rol", "Nº Permissions"],
            "url": "./data/gcp_permissions.json"
        }
    },
    "aws": {
        "roles": {
            "header": ["ID", "Actions"],
            "url": "./data/aws_policies.json"
        },
        "permissions": {
            "header": ["ID", "Policy", "Nº Actions"],
            "url": "./data/aws_actions.json"
        }
    },
    "azure": {
        "roles": {
            "header": ["ID", "Actions"],
            "url": "./data/azure_roles.json"
        },
        "permissions": {
            "header": ["ID", "Rol", "Nº Actions"],
            "url": "./data/azure_actions.json"
        }
    }
};

let page = 1;
let maxPage = 1;
let roles = {};
let permissions = {};
let commonPermissions = {};

// Elementos DOM
const table = document.getElementById("table");
const thead = document.getElementById("thead");
const textElement = document.getElementById("text");
const itemsElement = document.getElementById("items");
const searchElement = document.getElementById('search');
const docElement = document.getElementById('doc');

const cloudProviders = {
    gcp: document.getElementById("gcp"),
    aws: document.getElementById("aws"),
    azure: document.getElementById("azure"),
};

// Función para parsear consultas regex
function parseRegexQuery(query) {
    const regexMatch = query.match(/^\/(.*)\/([gimuy]*)$/);
    try {
        if (regexMatch) {
            const [, pattern, flags] = regexMatch;
            return new RegExp(pattern, flags);
        }
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
            fetch(cloud[cloudProvider].roles.url),
            fetch(cloud[cloudProvider].permissions.url)
        ]);

        if (!rolesResponse.ok || !permissionsResponse.ok) {
            throw new Error('Error al cargar los archivos JSON');
        }

        roles[cloudProvider] = await rolesResponse.json();
        permissions[cloudProvider] = await permissionsResponse.json();
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
        const localRoles = permissions[cloudProvider][e];
        if (commonRoles === null) {
            commonRoles = new Set(Object.keys(localRoles));
        } else {
            const currentRoles = new Set(Object.keys(localRoles));
            commonRoles = new Set([...commonRoles].filter(role => currentRoles.has(role)));
        }
    });

    const common = {};
    if (commonRoles !== null) {
        const firstKey = results[0];
        commonRoles.forEach(role => {
            common[role] = permissions[cloudProvider][firstKey][role];
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
    const actualQuery = query.trim() === "" ? ".*" : query;
    const totalResults = searchRegex(actualQuery, data);

    const init = itemsLimit * (page - 1);
    const end = itemsLimit * page;
    const results = totalResults.slice(init, end);

    maxPage = Math.max(1, Math.ceil(totalResults.length / itemsLimit));

    itemsElement.value = itemsLimit;

    const showLimit = itemsLimit > totalResults.length ? totalResults.length : itemsLimit;

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
            showMoreRow.innerHTML = `<td colspan="${config.colSpan}">+ Show ${hiddenRows.length} more</td>`;
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

    const lastRow = document.createElement("tr");
    const prevPage = document.createElement("td");
    const nPage = document.createElement("td");
    const nextPage = document.createElement("td");

    prevPage.innerHTML = `◀ Prev Page`
    nPage.innerHTML = `${page} / ${maxPage}`
    nextPage.innerHTML = `Next Page ▶`

    if (page === 1) {
        prevPage.className = 'pageFin';
        nextPage.className = 'clickable';
    } else if (page === maxPage) {
        prevPage.className = 'clickable';
        nextPage.className = 'pageFin';
    } else {
        prevPage.className = 'clickable';
        nextPage.className = 'clickable';
    }

    prevPage.addEventListener('click', () => {
        if (page > 1) {
            page -= 1;
            setActiveCloud(cloudProvider);
            window.scrollTo(0, 0);
        }
    });

    nextPage.addEventListener('click', () => {
        if (page < maxPage) {
            page += 1;
            setActiveCloud(cloudProvider);
            window.scrollTo(0, 0);
        }
    });

    lastRow.appendChild(prevPage);
    lastRow.appendChild(nPage);
    lastRow.appendChild(nextPage);
    table.appendChild(lastRow);
};

// Configuraciones para diferentes tipos de datos
const permissionsFormatter = createTableFormatter({
    getData: result => permissions[cloudProvider][result],
    getItems: data => Object.keys(data).sort((a, b) => data[a] - data[b]),
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
    getData: result => roles[cloudProvider][result],
    getItems: data => data.permissions.length === 0 ? [''] : data.permissions,
    getFirstRow: (result, data, firstItem, rowSpan) => `
        <td rowspan="${rowSpan}">${result}</td>
        <td class="pointer" onclick="searchPermissions('${firstItem}')">${firstItem}</td>
    `,
    getRowContent: item => `
        <td class="pointer" onclick="searchPermissions('${item}')">${item}</td>
    `,
    colSpan: 1
});

const commonPermissionsFormatter = createTableFormatter({
    getData: result => commonPermissions[result],
    getItems: data => Object.keys(data).sort((a, b) => data[a] - data[b]),
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
    initializeTable(cloud[cloudProvider].permissions.header);
    const results = performSearch(permissions[cloudProvider], query, 'permissions');
    if (query.includes(',')) {
        getCommon(results);
        commonPermissionsFormatter([results.join(', ')]);
    }
    else
        permissionsFormatter(results);
}

function searchRoles(query) {
    initializeTable(cloud[cloudProvider].roles.header);
    const results = performSearch(roles[cloudProvider], query, 'roles');
    rolesFormatter(results);
}

function setActiveCloud(selected) {
    cloudProvider = selected;
    Object.keys(cloudProviders).forEach(key => {
        cloudProviders[key].className = key === selected ? "" : "nosel";
    });

    // Check if data for the selected cloud provider exists
    if (!roles[cloudProvider] || !permissions[cloudProvider]) {
        fetchJsonFiles();
    } else {
        const query = searchElement.value.trim();
        const type = document.getElementById("type").value;
        type === 'permissions' ? searchPermissions(query) : searchRoles(query);
    }
}

// Event listeners
searchElement.addEventListener('input', event => {
    page = 1;
    const query = event.target.value.trim();
    const type = document.getElementById("type").value;
    if (query) {
        type === 'permissions' ? searchPermissions(query) : searchRoles(query);
    }
});

itemsElement.addEventListener('input', event => {
    page = 1;
    const query = searchElement.value.trim();
    const type = document.getElementById("type").value;
    if (query) {
        type === 'permissions' ? searchPermissions(query) : searchRoles(query);
    }
});

docElement.addEventListener("click", function() {
    docUrl = "https://github.com/diegosanzmartin/diegosanzmartin.github.io/blob/main/permissions/README.md"
    window.open(docUrl, "_blank");
});

Object.keys(cloudProviders).forEach(cloudProvider => {
    cloudProviders[cloudProvider].addEventListener("click", () => setActiveCloud(cloudProvider));
});

// Cargar datos al iniciar
window.addEventListener('load', fetchJsonFiles);
