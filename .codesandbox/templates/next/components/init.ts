import { useCallback } from 'react';
import * as fabric from 'fabric';

export function useLoadCanvas() {
  return useCallback((canvas: fabric.Canvas) => {
    canvas.setDimensions({
      width: 500,
      height: 500,
    });
    const text = new fabric.Text('fabric.js sandbox', {
      originX: 'center',
      top: 20,
    });
    canvas.add(text);
    canvas.centerObjectH(text);
    function animate(toState: 0 | 1) {
      text.animate(
        { scaleX: Math.max(toState, 0.1) * 2 },
        {
          onChange: () => canvas.renderAll(),
          onComplete: () => animate(Number(!toState) as 0 | 1),
          duration: 1000,
          easing: toState
            ? fabric.util.ease.easeInOutQuad
            : fabric.util.ease.easeInOutSine,
        }
      );
    }
    animate(1);
  }, []);
}
