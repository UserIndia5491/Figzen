function buildTscn(root, warnings) {
    const flat = [];
    flatten(root, null, flat);
    const lines = ['[gd_scene load_steps=1 format=3]', ''];
    for (const entry of flat) {
        const { node, parentPath } = entry;
        const parentPart = parentPath ? ` parent="${escapeTscn(parentPath)}"` : '';
        lines.push(`[node name="${escapeTscn(node.name)}" type="${node.type}"${parentPart}]`);
        if (!node.visible)
            lines.push('visible = false');
        lines.push(`offset_left = ${fmt(node.x)}`);
        lines.push(`offset_top = ${fmt(node.y)}`);
        lines.push(`offset_right = ${fmt(node.x + node.width)}`);
        lines.push(`offset_bottom = ${fmt(node.y + node.height)}`);
        if (node.type === 'ColorRect') {
            if (node.color)
                lines.push(`color = Color("${node.color}")`);
            else
                warnings.push({ node: node.name, message: 'No supported solid color found; Godot default ColorRect color is used.' });
        }
        if (node.type === 'Label') {
            lines.push(`text = "${escapeTscnString(node.text ?? '')}"`);
            if (node.fontSize)
                lines.push(`theme_override_font_sizes/font_size = ${Math.round(node.fontSize)}`);
        }
        lines.push('');
    }
    return lines.join('\n').trimEnd() + '\n';
}
function flatten(node, parentPath, out) {
    out.push({ node, parentPath });
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    for (const child of node.children)
        flatten(child, currentPath, out);
}
function colorFromSolidPaints(fills) {
    if (!Array.isArray(fills) || fills.length !== 1)
        return undefined;
    const paint = fills[0];
    if (!paint || paint.type !== 'SOLID' || paint.visible === false)
        return undefined;
    const r = clampByte((paint.color?.r ?? 0) * 255);
    const g = clampByte((paint.color?.g ?? 0) * 255);
    const b = clampByte((paint.color?.b ?? 0) * 255);
    const a = clampByte((paint.opacity ?? 1) * 255);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
}
function safeFilename(value) {
    return value.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^\.+|\.+$/g, '') || 'figzen-scene';
}
function escapeTscn(value) {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
function escapeTscnString(value) {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n');
}
function round(value) {
    return Math.round(value * 100) / 100;
}
function fmt(value) {
    const rounded = round(value);
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
function clampByte(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
}
function toHex(value) {
    return value.toString(16).padStart(2, '0');
}


figma.showUI(__html__, { width: 420, height: 480, themeColors: true });
figma.ui.onmessage = (message) => {
    if (message.type === 'export') {
        const frame = figma.currentPage.selection.find((node) => node.type === 'FRAME');
        if (!frame) {
            figma.ui.postMessage({ type: 'result', ok: false, error: 'Select a Figma Frame first.' });
            return;
        }
        try {
            const warnings = [];
            const root = convertNode(frame, warnings, true);
            const content = buildTscn(root, warnings);
            figma.ui.postMessage({
                type: 'result',
                ok: true,
                filename: `${safeFilename(frame.name || 'figzen-scene')}.tscn`,
                content,
                warnings
            });
        }
        catch (error) {
            figma.ui.postMessage({ type: 'result', ok: false, error: error instanceof Error ? error.message : String(error) });
        }
    }
    if (message.type === 'close')
        figma.closePlugin();
};
function convertNode(node, warnings, isRoot = false) {
    const type = mapType(node.type);
    if (!type)
        warnings.push({ node: node.name, message: `Unsupported Figma node type: ${node.type}; preserved as Control.` });
    const box = node.absoluteBoundingBox;
    const parentBox = !isRoot && node.parent && node.parent.absoluteBoundingBox ? node.parent.absoluteBoundingBox : null;
    const x = box && parentBox ? round(box.x - parentBox.x) : 0;
    const y = box && parentBox ? round(box.y - parentBox.y) : 0;
    const width = round(box?.width ?? 0);
    const height = round(box?.height ?? 0);
    const result = {
        name: node.name || 'Unnamed',
        type: type ?? 'Control',
        x,
        y,
        width,
        height,
        visible: node.visible !== false,
        children: []
    };
    if (Array.isArray(node.fills)) {
        const color = colorFromSolidPaints(node.fills);
        if (color)
            result.color = color;
        else if (node.fills.length > 0)
            warnings.push({ node: node.name, message: 'Only solid fills are exported; other fill types are ignored.' });
    }
    if (node.type === 'TEXT') {
        result.text = node.characters ?? '';
        if (typeof node.fontSize === 'number')
            result.fontSize = round(node.fontSize);
        if (node.fontName && node.fontName !== figma.mixed) {
            warnings.push({ node: node.name, message: 'Font family/weight is not exported in Phase 1; Godot default font is used.' });
        }
    }
    if (typeof node.opacity === 'number' && node.opacity !== 1) {
        warnings.push({ node: node.name, message: 'Opacity is not exported in Phase 1.' });
    }
    if (node.children && Array.isArray(node.children)) {
        for (const child of node.children)
            result.children.push(convertNode(child, warnings));
    }
    return result;
}
function mapType(figmaType) {
    switch (figmaType) {
        case 'FRAME': return 'Control';
        case 'RECTANGLE': return 'ColorRect';
        case 'TEXT': return 'Label';
        case 'COMPONENT':
        case 'INSTANCE': return 'Control';
        default: return null;
    }
}
function round(value) { return Math.round(value * 100) / 100; }
