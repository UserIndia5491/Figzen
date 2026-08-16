import { buildTscn, createConversionContext, safeFilename } from './exporter';
import { convertNode } from './converters';

figma.showUI(__html__, { width: 420, height: 480, themeColors: true });

figma.ui.onmessage = (message: { type: string }) => {
  if (message.type === 'export') {
    const frame = figma.currentPage.selection.find((node: any) => node.type === 'FRAME');
    if (!frame) {
      figma.ui.postMessage({ type: 'result', ok: false, error: 'Select a Figma Frame first.' });
      return;
    }

    try {
      const context = createConversionContext();
      const root = convertNode(frame as FrameNode, context);
      const result = buildTscn(root, context);
      figma.ui.postMessage({
        type: 'result',
        ok: true,
        filename: `${safeFilename(frame.name || 'figzen-scene')}.tscn`,
        content: result.tscn,
        warnings: result.warnings
      });
    } catch (error) {
      figma.ui.postMessage({ type: 'result', ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (message.type === 'close') figma.closePlugin();
};
