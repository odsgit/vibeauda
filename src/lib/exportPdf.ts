import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import { renderSheetSvg } from './renderSheet';
import type { Part, SheetData } from '../types/sheet';

const PART_LABELS: Record<Part, string> = {
  vocal: '보컬',
  guitar1: '기타1',
  guitar2: '기타2',
  bass: '베이스',
  drum: '드럼',
  synth: '신스',
};

const PART_ORDER: Part[] = ['vocal', 'guitar1', 'guitar2', 'bass', 'drum', 'synth'];

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}

function renderToDetachedSvg(data: SheetData, part: Part): SVGSVGElement {
  const container = document.createElement('div');
  renderSheetSvg(container, data, part);
  const svg = container.querySelector('svg');
  if (!svg) throw new Error('악보 SVG 렌더링에 실패했습니다.');
  return svg;
}

async function addSheetPage(doc: jsPDF, data: SheetData, part: Part, isFirstPage: boolean) {
  const svg = renderToDetachedSvg(data, part);
  const width = Number(svg.getAttribute('width'));
  const height = Number(svg.getAttribute('height'));
  const orientation = width > height ? 'landscape' : 'portrait';

  if (!isFirstPage) {
    doc.addPage([width, height], orientation);
  }
  await svg2pdf(svg, doc, { x: 0, y: 0, width, height });
}

/** Exports the currently viewed part as a single-page PDF. */
export async function downloadPartPdf(title: string, part: Part, data: SheetData): Promise<void> {
  const svg = renderToDetachedSvg(data, part);
  const width = Number(svg.getAttribute('width'));
  const height = Number(svg.getAttribute('height'));
  // eslint-disable-next-line new-cap -- jsPDF is the library's exported class name
  const doc = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [width, height],
  });
  await svg2pdf(svg, doc, { x: 0, y: 0, width, height });
  doc.save(`${sanitizeFilename(title)}_${PART_LABELS[part]}.pdf`);
}

/** Exports all available parts as a multi-page PDF, one part per page. */
export async function downloadAllPartsPdf(
  title: string,
  parts: Partial<Record<Part, SheetData>>,
): Promise<void> {
  const available = PART_ORDER.filter((part) => parts[part]);
  if (available.length === 0) return;

  // eslint-disable-next-line new-cap -- jsPDF is the library's exported class name
  const doc = new jsPDF({ unit: 'pt' });
  await available.reduce(async (prev, part, i) => {
    await prev;
    await addSheetPage(doc, parts[part]!, part, i === 0);
  }, Promise.resolve());

  doc.save(`${sanitizeFilename(title)}_전체.pdf`);
}
