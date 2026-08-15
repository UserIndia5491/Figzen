 export interface ExportWarning {
   node: string;
   message: string;
 }

 export interface SerializableNode {
   name: string;
   type: 'Control' | 'ColorRect' | 'Label';
   x: number;
   y: number;
   width: number;
   height: number;
   visible: boolean;
   color?: string;
   text?: string;
   fontSize?: number;
   children: SerializableNode[];
 }

 export function buildTscn(root: SerializableNode, warnings: ExportWarning[]): string {
   const flat: Array<{ node: SerializableNode; parentPath: string | null }> = [];
-  flatten(root, null, flat);
+  flatten(root, null, flat, new Set<string>());

   const lines = ['[gd_scene load_steps=1 format=3]', ''];

   for (const entry of flat) {
     const { node, parentPath } = entry;
     const parentPart = parentPath
       ? ` parent="${escapeTscn(parentPath)}"`
       : '';

     lines.push(
       `[node name="${escapeTscn(node.name)}" type="${node.type}"${parentPart}]`
     );

     if (!node.visible) lines.push('visible = false');

     lines.push(`offset_left = ${fmt(node.x)}`);
     lines.push(`offset_top = ${fmt(node.y)}`);
     lines.push(`offset_right = ${fmt(node.x + node.width)}`);
     lines.push(`offset_bottom = ${fmt(node.y + node.height)}`);

     if (node.type === 'ColorRect') {
       if (node.color) {
         lines.push(`color = Color("${node.color}")`);
       } else {
         warnings.push({
           node: node.name,
           message:
             'No supported solid color found; Godot default ColorRect color is used.'
         });
       }
     }

     if (node.type === 'Label') {
       lines.push(`text = "${escapeTscnString(node.text ?? '')}"`);

       if (node.fontSize) {
         lines.push(
           `theme_override_font_sizes/font_size = ${Math.round(node.fontSize)}`
         );
       }
     }

     lines.push('');
   }

   return lines.join('\n').trimEnd() + '\n';
 }

 function flatten(
   node: SerializableNode,
   parentPath: string | null,
-  out: Array<{ node: SerializableNode; parentPath: string | null }>
+  out: Array<{ node: SerializableNode; parentPath: string | null }>,
+  usedNames: Set<string>
 ): void {
-  out.push({ node, parentPath });
+  /*
+   * Godot requires unique sibling names.
+   *
+   * The root is never renamed because it has no sibling.
+   * For every other node, the caller supplies the set of names already
+   * used by that node's siblings. The resolved name is therefore determined
+   * before it is used to construct paths for descendants.
+   */
+  const resolvedName = getUniqueName(node.name, usedNames);
+
+  const resolvedNode =
+    resolvedName === node.name
+      ? node
+      : {
+          ...node,
+          name: resolvedName
+        };
+
+  out.push({ node: resolvedNode, parentPath });

-  // Godot node paths are relative to the scene root.
-  //
-  // Root:
-  //   no parent attribute
-  //
-  // Direct child:
-  //   parent="."
-  //
-  // Grandchild:
-  //   parent="Parent"
-  //
-  // Great-grandchild:
-  //   parent="Parent/Child"
-  const currentPath =
-    parentPath === null
-      ? '.'
-      : parentPath === '.'
-        ? node.name
-        : `${parentPath}/${node.name}`;
+  // Godot node paths are relative to the scene root.
+  //
+  // Root:
+  //   no parent attribute
+  //
+  // Direct child:
+  //   parent="."
+  //
+  // Grandchild:
+  //   parent="Parent"
+  //
+  // Great-grandchild:
+  //   parent="Parent/Child"
+  //
+  // The root's name is never included in the path.
+  const currentPath =
+    parentPath === null
+      ? '.'
+      : parentPath === '.'
+        ? resolvedName
+        : `${parentPath}/${resolvedName}`;

+  const childNames = new Set<string>();
+
-  for (const child of node.children) {
-    flatten(child, currentPath, out);
+  for (const child of resolvedNode.children) {
+    flatten(child, currentPath, out, childNames);
   }
 }
+
+function getUniqueName(name: string, usedNames: Set<string>): string {
+  const baseName = name || 'Node';
+
+  if (!usedNames.has(baseName)) {
+    usedNames.add(baseName);
+    return baseName;
+  }
+
+  let suffix = 2;
+  let candidate = `${baseName}${suffix}`;
+
+  while (usedNames.has(candidate)) {
+    suffix += 1;
+    candidate = `${baseName}${suffix}`;
+  }
+
+  usedNames.add(candidate);
+  return candidate;
+}

 export function colorFromSolidPaints(
   fills: readonly any[]
 ): string | undefined {
   if (!Array.isArray(fills) || fills.length !== 1) return undefined;

   const paint = fills[0];

   if (!paint || paint.type !== 'SOLID' || paint.visible === false) {
     return undefined;
   }

   const r = clampByte((paint.color?.r ?? 0) * 255);
   const g = clampByte((paint.color?.g ?? 0) * 255);
   const b = clampByte((paint.color?.b ?? 0) * 255);
   const a = clampByte((paint.opacity ?? 1) * 255);

   return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
 }

 export function safeFilename(value: string): string {
   return (
     value
       .replace(/[^a-zA-Z0-9._-]+/g, '_')
       .replace(/^\.+|\.+$/g, '') || 'figzen-scene'
   );
 }

 function escapeTscn(value: string): string {
   return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
 }

 function escapeTscnString(value: string): string {
   return value
     .replace(/\\/g, '\\\\')
     .replace(/"/g, '\\"')
     .replace(/\r?\n/g, '\\n');
 }

 function round(value: number): number {
   return Math.round(value * 100) / 100;
 }

 function fmt(value: number): string {
   const rounded = round(value);

   return Number.isInteger(rounded)
     ? String(rounded)
     : rounded.toFixed(2);
 }

 function clampByte(value: number): number {
   return Math.max(0, Math.min(255, Math.round(value)));
 }

 function toHex(value: number): string {
   return value.toString(16).padStart(2, '0');
 }
