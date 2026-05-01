import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './SignatureCanvas.css';

interface SignatureCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onEmpty: (isEmpty: boolean) => void;
}

export default function SignatureCanvas({ canvasRef, onEmpty }: SignatureCanvasProps) {
  const { t } = useTranslation();
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);

  const getPos = (
    e: MouseEvent | TouchEvent,
    canvas: HTMLCanvasElement,
  ): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return { x: 0, y: 0 };
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const onStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const { x, y } = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      const { x, y } = getPos(e, canvas);
      ctx.lineTo(x, y);
      ctx.stroke();
      if (!hasDrawn.current) {
        hasDrawn.current = true;
        onEmpty(false);
      }
    };

    const onEnd = () => { isDrawing.current = false; };

    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onEnd);
    canvas.addEventListener('mouseleave', onEnd);
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd);

    return () => {
      canvas.removeEventListener('mousedown', onStart);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onEnd);
      canvas.removeEventListener('mouseleave', onEnd);
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onEnd);
    };
  }, [canvasRef, onEmpty]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onEmpty(true);
  }, [canvasRef, onEmpty]);

  return (
    <div className="sig-canvas-wrapper">
      <canvas ref={canvasRef} className="sig-canvas" width={560} height={140} />
      <button type="button" className="sig-canvas__clear" onClick={clear}>
        {t('contract.clearSignature')}
      </button>
    </div>
  );
}
