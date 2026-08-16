export function sanitizeGodotName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\/\\:\[\]"]/g, '_');

  return cleaned || 'Node';
}

export function getUniqueName(
  originalName: string,
  usedNames: Set<string>
): string {
  const baseName = sanitizeGodotName(originalName);

  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return baseName;
  }

  let suffix = 2;

  while (usedNames.has(`${baseName}${suffix}`)) {
    suffix += 1;
  }

  const uniqueName = `${baseName}${suffix}`;
  usedNames.add(uniqueName);

  return uniqueName;
}
