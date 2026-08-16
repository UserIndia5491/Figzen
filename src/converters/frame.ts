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

export function convertFrame(
  node: FrameNode | GroupNode | SectionNode,
  context: ConversionContext
): SceneNode {
  const sceneNode = createNode(
    node.name,
    'Control',
    node
  );

  sceneNode.children =
    convertChildren(
      node.children,
      context
    );

  if (
    'layoutMode' in node &&
    node.layoutMode !== 'NONE'
  ) {
    sceneNode.properties.push({
      key: 'metadata/figzen_layout_mode',
      value: `"${node.layoutMode}"`
    });
  }

  return sceneNode;
}