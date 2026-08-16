import type {
  ConversionContext,
  SceneNode
} from '../exporter/types';

import {
  createNode
} from './base';

import {
  convertChildren
} from './index';

export function convertComponent(
  node: ComponentNode | InstanceNode | ComponentSetNode,
  context: ConversionContext
): SceneNode {
  const sceneNode = createNode(
    node.name,
    'Control',
    node
  );

  sceneNode.properties.push({
    key: 'metadata/figzen_component_type',
    value: `"${node.type}"`
  });

  if (
    'children' in node
  ) {
    sceneNode.children =
      convertChildren(
        node.children,
        context
      );
  }

  return sceneNode;
}