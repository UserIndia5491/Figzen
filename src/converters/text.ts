import type {
  ConversionContext,
  SceneNode
} from '../exporter/types';

import {
  escapeText
} from '../exporter/serializer';

import {
  createNode
} from './base';

import {
  getSolidColor,
  warn
} from './utils';

export function convertText(
  node: TextNode,
  context: ConversionContext
): SceneNode {
  const sceneNode = createNode(
    node.name,
    'Label',
    node
  );

  sceneNode.properties.push({
    key: 'text',
    value: `"${escapeText(node.characters)}"`
  });

  if (
    node.fontSize !== figma.mixed &&
    typeof node.fontSize === 'number'
  ) {
    sceneNode.properties.push({
      key: 'theme_override_font_sizes/font_size',
      value: String(
        Math.round(node.fontSize)
      )
    });
  } else {
    warn(
      context,
      node.name,
      'Mixed font sizes are not fully supported.'
    );
  }

  const color =
    getSolidColor(node.fills);

  if (color) {
    sceneNode.properties.push({
      key: 'theme_override_colors/font_color',
      value: color
    });
  }

  if (
    node.textAlignHorizontal === 'CENTER'
  ) {
    sceneNode.properties.push({
      key: 'horizontal_alignment',
      value: '1'
    });
  }

  if (
    node.textAlignHorizontal === 'RIGHT'
  ) {
    sceneNode.properties.push({
      key: 'horizontal_alignment',
      value: '2'
    });
  }

  return sceneNode;
}