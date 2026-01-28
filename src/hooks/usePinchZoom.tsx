import { useState, useCallback, useRef, TouchEvent, WheelEvent } from 'react';

interface PinchZoomState {
  scale: number;
  x: number;
  y: number;
}

interface TouchPoint {
  clientX: number;
  clientY: number;
}

interface UsePinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  onZoomChange?: (scale: number) => void;
}

export function usePinchZoom({
  minScale = 1,
  maxScale = 4,
  onZoomChange,
}: UsePinchZoomOptions = {}) {
  const [transform, setTransform] = useState<PinchZoomState>({ scale: 1, x: 0, y: 0 });
  const lastDistance = useRef<number | null>(null);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const lastDragPos = useRef<{ x: number; y: number } | null>(null);

  const getDistance = (touch1: TouchPoint, touch2: TouchPoint) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touch1: TouchPoint, touch2: TouchPoint) => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      lastDistance.current = getDistance(e.touches[0], e.touches[1]);
      lastCenter.current = getCenter(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1 && transform.scale > 1) {
      isDragging.current = true;
      lastDragPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [transform.scale]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && lastDistance.current !== null && lastCenter.current !== null) {
      e.preventDefault();
      const newDistance = getDistance(e.touches[0], e.touches[1]);
      const newCenter = getCenter(e.touches[0], e.touches[1]);
      
      const scaleDelta = newDistance / lastDistance.current;
      
      setTransform((prev) => {
        const newScale = Math.min(maxScale, Math.max(minScale, prev.scale * scaleDelta));
        
        // Calculate pan based on center movement
        const dx = newCenter.x - lastCenter.current!.x;
        const dy = newCenter.y - lastCenter.current!.y;
        
        onZoomChange?.(newScale);
        
        return {
          scale: newScale,
          x: newScale > 1 ? prev.x + dx : 0,
          y: newScale > 1 ? prev.y + dy : 0,
        };
      });
      
      lastDistance.current = newDistance;
      lastCenter.current = newCenter;
    } else if (e.touches.length === 1 && isDragging.current && lastDragPos.current && transform.scale > 1) {
      e.preventDefault();
      const dx = e.touches[0].clientX - lastDragPos.current.x;
      const dy = e.touches[0].clientY - lastDragPos.current.y;
      
      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      
      lastDragPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [maxScale, minScale, onZoomChange, transform.scale]);

  const handleTouchEnd = useCallback(() => {
    lastDistance.current = null;
    lastCenter.current = null;
    isDragging.current = false;
    lastDragPos.current = null;
    
    // Snap back if scale is close to 1
    setTransform((prev) => {
      if (prev.scale < 1.1) {
        onZoomChange?.(1);
        return { scale: 1, x: 0, y: 0 };
      }
      return prev;
    });
  }, [onZoomChange]);

  // Mouse wheel zoom for desktop
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
    
    setTransform((prev) => {
      const newScale = Math.min(maxScale, Math.max(minScale, prev.scale * scaleDelta));
      onZoomChange?.(newScale);
      
      return {
        scale: newScale,
        x: newScale > 1 ? prev.x : 0,
        y: newScale > 1 ? prev.y : 0,
      };
    });
  }, [maxScale, minScale, onZoomChange]);

  const resetZoom = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
    onZoomChange?.(1);
  }, [onZoomChange]);

  const isZoomed = transform.scale > 1;

  return {
    transform,
    isZoomed,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onWheel: handleWheel,
    },
    resetZoom,
  };
}
