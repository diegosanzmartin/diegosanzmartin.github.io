import { $, $$ } from './myjquery.js';
import { getData } from './editorGetData.js';

/**
 * Clase para gestionar la actualización en tiempo real del nav-list
 */
export class NavUpdater {
    /**
     * Constructor
     * @param {DataService} dataService - El servicio de datos
     */
    constructor(dataService) {
        this.dataService = dataService;
        this.editor = $('editor');
        this.sidebarEl = document.querySelector('aside');
        this.initialized = false;
        this.navList = null;
        this.navSection = null;
        this.headerElements = [];
        this.mutationObserver = null;
    }

    /**
     * Inicializa el observador de navegación
     */
    init() {
        if (this.initialized) return;
        
        console.log("Initializing navigation updater...");
        
        // Configurar observador de mutaciones para detectar cambios en el editor
        this.setupMutationObserver();
        
        // Añadir listeners para eventos de edición en encabezados
        this.setupEditListeners();
        
        // Actualizar inicialmente la navegación
        this.updateNavigation();
        
        // Marcar como inicializado
        this.initialized = true;
    }

    /**
     * Configura el observador de mutaciones para detectar cambios en el editor
     */
    setupMutationObserver() {
        // Creamos un observador de mutaciones para detectar cuando se añaden/eliminan elementos
        this.mutationObserver = new MutationObserver((mutations) => {
            let shouldUpdateNav = false;
            
            mutations.forEach((mutation) => {
                // Si se añaden o eliminan nodos
                if (mutation.type === 'childList') {
                    // Verificar si alguno de los nodos añadidos/eliminados es un encabezado
                    const addedHeaders = Array.from(mutation.addedNodes).filter(node => 
                        node.nodeType === 1 && // Es un elemento
                        node.querySelector && // Tiene el método querySelector
                        (node.querySelector('h1, h2, h3') || // Contiene un encabezado
                         node.tagName && (node.tagName.toLowerCase() === 'h1' || 
                                          node.tagName.toLowerCase() === 'h2' || 
                                          node.tagName.toLowerCase() === 'h3'))
                    );
                    
                    const removedHeaders = Array.from(mutation.removedNodes).filter(node => 
                        node.nodeType === 1 && // Es un elemento
                        node.querySelector && // Tiene el método querySelector
                        (node.querySelector('h1, h2, h3') || // Contiene un encabezado
                         node.tagName && (node.tagName.toLowerCase() === 'h1' || 
                                          node.tagName.toLowerCase() === 'h2' || 
                                          node.tagName.toLowerCase() === 'h3'))
                    );
                    
                    if (addedHeaders.length > 0 || removedHeaders.length > 0) {
                        shouldUpdateNav = true;
                    }
                }
            });
            
            if (shouldUpdateNav) {
                this.updateNavigation();
            }
        });
        
        // Iniciar observación
        this.mutationObserver.observe(this.editor, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Configura listeners para eventos de edición en encabezados
     */
    setupEditListeners() {
        // Escuchar eventos de input en encabezados mediante delegación de eventos
        this.editor.addEventListener('input', (e) => {
            const target = e.target;
            
            // Verificar si el evento ocurrió en un encabezado
            if (target.tagName && (target.tagName.toLowerCase() === 'h1' || 
                                   target.tagName.toLowerCase() === 'h2' || 
                                   target.tagName.toLowerCase() === 'h3')) {
                // Actualizar la navegación con un pequeño retraso para permitir que el texto termine de cambiar
                setTimeout(() => this.updateNavigation(), 100);
            }
        });

        // También actualizamos cuando se hace clic en un encabezado para navegar
        this.editor.addEventListener('click', (e) => {
            const line = e.target.closest('line');
            if (line && (line.querySelector('h1') || line.querySelector('h2') || line.querySelector('h3'))) {
                const id = line.getAttribute('data-id');
                this.highlightActiveNavItem(id);
            }
        });
    }

    /**
     * Resalta el elemento de navegación activo
     * @param {string} id - ID del encabezado activo
     */
    highlightActiveNavItem(id) {
        if (!this.navList) return;
        
        // Quitar resaltado de todos los elementos
        const navItems = this.navList.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        // Resaltar el elemento correspondiente
        const activeItem = this.navList.querySelector(`.nav-item[data-id="${id}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    /**
     * Actualiza la lista de navegación
     */
    updateNavigation() {
        console.log("Updating navigation...");
        
        // Obtener todos los elementos de encabezado del editor
        const headers = this.getHeadersFromEditor();
        
        // Si no hay encabezados, no necesitamos hacer nada
        if (headers.length === 0) {
            // Si ya existe una sección de navegación, actualízala
            const existingNavSection = this.sidebarEl.querySelector('.nav-section');
            if (existingNavSection) {
                const noHeaders = document.createElement('p');
                noHeaders.textContent = 'No headers found';
                noHeaders.className = 'no-headers';
                
                // Limpiar la sección de navegación existente
                existingNavSection.innerHTML = '';
                
                // Añadir mensaje de no headers
                existingNavSection.appendChild(noHeaders);
            }
            return;
        }
        
        // Buscar o crear la sección de navegación
        let navSection = this.sidebarEl.querySelector('.nav-section');
        if (!navSection) {
            navSection = document.createElement('div');
            navSection.className = 'nav-section';
            
            // Añadir al sidebar
            const exportSection = this.sidebarEl.querySelector('.export-section');
            if (exportSection) {
                this.sidebarEl.insertBefore(navSection, exportSection);
            } else {
                this.sidebarEl.appendChild(navSection);
            }
        } else {
            // Limpiar la sección de navegación existente
            navSection.innerHTML = '';
        }
        
        // Crear nueva lista de navegación
        const navList = document.createElement('ul');
        navList.className = 'nav-list';
        
        // Añadir elementos de navegación
        headers.forEach(header => {
            const navItem = document.createElement('li');
            navItem.className = `nav-item nav-${header.type}`;
            navItem.textContent = header.text;
            navItem.setAttribute('data-id', header.id);
            
            // Scroll al encabezado cuando se hace clic
            navItem.addEventListener('click', () => {
                const headerEl = document.querySelector(`line[data-id="${header.id}"]`);
                if (headerEl) {
                    headerEl.scrollIntoView({ behavior: 'smooth' });
                    this.highlightActiveNavItem(header.id);
                }
            });
            
            navList.appendChild(navItem);
        });
        
        // Añadir la lista a la sección de navegación
        navSection.appendChild(navList);
        
        // Guardar referencias
        this.navList = navList;
        this.navSection = navSection;
    }

    /**
     * Obtiene todos los encabezados del editor
     * @returns {Array} Array de objetos de encabezado
     */
    getHeadersFromEditor() {
        const headers = [];
        
        // Obtener todas las líneas que contienen encabezados
        const headerLines = Array.from(this.editor.querySelectorAll('line')).filter(line => 
            line.querySelector('h1, h2, h3')
        );
        
        // Procesar cada línea
        headerLines.forEach(line => {
            const id = line.getAttribute('data-id');
            let headerElement = null;
            let type = null;
            
            // Determinar el tipo de encabezado
            if (line.querySelector('h1')) {
                headerElement = line.querySelector('h1');
                type = 'h1';
            } else if (line.querySelector('h2')) {
                headerElement = line.querySelector('h2');
                type = 'h2';
            } else if (line.querySelector('h3')) {
                headerElement = line.querySelector('h3');
                type = 'h3';
            }
            
            if (headerElement && type) {
                headers.push({
                    id: id,
                    type: type,
                    text: headerElement.textContent || 'Untitled',
                    element: headerElement
                });
            }
        });
        
        return headers;
    }

    /**
     * Detiene el observador de mutaciones
     */
    cleanup() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
    }
}
