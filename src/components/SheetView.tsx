import { useEffect, useRef } from 'react';
import { renderSheetSvg } from '../lib/renderSheet';
import type { SheetViewProps } from '../types/sheet';

export default function SheetView({ data, part }: SheetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    renderSheetSvg(containerRef.current, data, part);
  }, [data, part]);

  return (
    <div style={{ overflowX: 'auto', width: '100%', background: '#fff', borderRadius: 8 }}>
      <div ref={containerRef} />
    </div>
  );
}
