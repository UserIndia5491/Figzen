import type {
  FlattenedNode,
  SceneNode
} from './types';

import { getUniqueName } from './naming';

export function flattenScene(root: SceneNode): FlattenedNode[] {
  const output: FlattenedNode[] = [];

  flatten(
    root,
    null,
    output,
    new Set<string>(),
    true
  );

  return output;
}

function flatten(
  node: SceneNode,
  parentPath: string | null,
  output: FlattenedNode[],
  siblingNames: Set<string>,
  isRoot = false
): void {
  const resolvedName = isRoot
    ? node.name
    : getUniqueName(node.name, siblingNames);

  const resolvedNode: SceneNode = {
    ...node,
    name: resolvedName
  };

  output.push({
    node: resolvedNode,
    parentPath
  });

  const currentPath =
    parentPath === null
      ? '.'
      : parentPath === '.'
        ? resolvedName
        : `${parentPath}/${resolvedName}`;

  const childNames = new Set<string>();

  for (const child of node.children) {
    flatten(
      child,
      currentPath,
      output,
      childNames
    );
  }
}
