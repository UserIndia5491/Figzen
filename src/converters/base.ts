import type {
  SceneNode
} from '../exporter/types';

export function createNode(
  name: string,
  type: SceneNode['type'],
  figmaNode: SceneNodeLike
): SceneNode {
  return {
    name,
    type,
    x: figmaNode.x,
    y: figmaNode.y,
    width: figmaNode.width,
    height: figmaNode.height,
    visible: figmaNode.visible,
    rotation: degreesToRadians(
      figmaNode.rotation ?? 0
    ),
    opacity: figmaNode.opacity ?? 1,
    properties: [],
    children: []
  };
}

export interface SceneNodeLike {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  rotation?: number;
  opacity?: number;
}

function degreesToRadians(
  degrees: number
): number {
  return degrees * Math.PI / 180;
}