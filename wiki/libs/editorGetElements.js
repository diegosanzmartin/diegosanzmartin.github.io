function getH1Line($el) {
    return {
        id: $el.dataset.id,
        type: 'h1',
        value: $el.querySelector('h1')?.innerHTML || ''
    };
}

function getH2Line($el) {
    return {
        id: $el.dataset.id,
        type: 'h2',
        value: $el.querySelector('h2')?.innerHTML || ''
    };
}

function getH3Line($el) {
    return {
        id: $el.dataset.id,
        type: 'h3',
        value: $el.querySelector('h3')?.innerHTML || ''
    };
}

function getTextLine($el) {
    return {
        id: $el.dataset.id,
        type: 'text',
        value: $el.querySelector('text')?.innerHTML || ''
    };
}

function getDividerLine($el) {
    return {
        id: $el.dataset.id,
        type: 'divider'
    };
}

function getTableLine($el) {
    const table = $el.querySelector('table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    // Obtenemos las dimensiones actuales de la tabla
    const rows = 1 + (tbody?.querySelectorAll('tr').length || 0); // +1 para incluir la fila de encabezados
    const cols = thead?.querySelector('tr')?.querySelectorAll('th').length || 0;

    return {
        id: $el.dataset.id,
        type: 'table',
        rows: rows,
        cols: cols,
        value: table.innerHTML
    };
}

function getCodeLine($el) {
    return {
        id: $el.dataset.id,
        type: 'code',
        value: $el.querySelector('code')?.innerHTML || '',
        lang: $el.querySelector('select')?.value || 'text'
    };
}

function getImageLine($el) {
    return {
        id: $el.dataset.id,
        type: 'image',
        value: $el.querySelector("img:not(actions img)")?.getAttribute('src') || '',
        height: '80%'
    };
}

function getDiagramLine($el) {
    return {
        id: $el.dataset.id,
        type: 'diagram',
        value: $el.querySelector('code')?.innerHTML || '',
        layout: $el.querySelector('.layout')?.value || '',
        theme: $el.querySelector('.theme')?.value || '',
    };
}

export { getH1Line, getH2Line, getH3Line, getTextLine, getDividerLine, getTableLine, getCodeLine, getImageLine, getDiagramLine }