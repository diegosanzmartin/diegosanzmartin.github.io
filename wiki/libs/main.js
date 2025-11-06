import { Editor } from './editor.js';
import { Sidebar } from './sidebar.js';
import { DataService } from './dataService.js';
import { NavUpdater } from './navUpdater.js';

import { newImageLine } from './editorNewElements.js';
document.addEventListener('DOMContentLoaded', () => {
    const dataService = new DataService();
    const editor = new Editor(dataService);
    const sidebar = new Sidebar(dataService, editor);
    const navUpdater = new NavUpdater(dataService);

    dataService.loadData().then(() => {
        sidebar.render();
        editor.render();
        
        // Inicializar el actualizador de navegación después de cargar el contenido
        // Pequeña espera para asegurar que el DOM está completamente listo
        setTimeout(() => {
            navUpdater.init();
        }, 100);
    });

    document.addEventListener('keydown', (e) => {
        // Global keyboard shortcuts
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            dataService.saveData();
        }

        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            dataService.loadData().then(() => {
                // No es necesario hacer nada más aquí, los listeners se encargarán de actualizar la UI.
            });
        }
    });

    // Global paste event listener for images
    document.addEventListener('paste', (event) => {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        let imageFound = false;

        for (const item of items) {
            if (item.type.indexOf('image') === 0) {
                imageFound = true;
                event.preventDefault();
                const blob = item.getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const imageDataUrl = e.target.result;
                        const $newline = newImageLine({ value: imageDataUrl });

                        const $editor = document.querySelector('editor');
                        const targetLine = document.activeElement.closest('line');

                        if (targetLine) {
                            targetLine.insertAdjacentElement("afterend", $newline);
                        } else {
                            $editor.appendChild($newline);
                        }
                        $newline.dispatchEvent(new Event('input', { bubbles: true }));
                    };
                    reader.readAsDataURL(blob);
                }
                break; // Process only the first image found
            }
        }
    });

    // Actualizar nav cada vez que se guarda
    dataService.addEventListener('save-completed', () => {
        // Actualizar la navegación después de guardar
        navUpdater.updateNavigation();
    });

    // Guardar automáticamente cada 30 segundos
    setInterval(() => {
        dataService.saveData();
    }, 30000);
});
