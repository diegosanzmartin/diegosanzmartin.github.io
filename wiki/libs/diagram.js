import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@latest/dist/mermaid.esm.min.mjs";
import elkLayouts from "https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@latest/dist/mermaid-layout-elk.esm.min.mjs";

async function renderDiagram($theme, $layout, $code, $diagram) {
    const init = `%%{ init: { "flowchart": { "defaultRenderer": "${$layout.value}" } } }%%\n`;

    mermaid.registerLayoutLoaders(elkLayouts);
    mermaid.initialize({
        startOnLoad: false,
        theme: $theme.value,
    });

    try {
        const { svg } = await mermaid.render('generated-diagram', init + $code.innerText.trim());
        $diagram.innerHTML = svg;
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export { renderDiagram }