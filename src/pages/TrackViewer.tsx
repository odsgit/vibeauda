import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SheetView from '../components/SheetView';
import { transposeKey } from '../lib/transpose';
import { downloadAllPartsPdf, downloadPartPdf } from '../lib/exportPdf';
import type { ChordEvent, LyricLine, Part, SheetData } from '../types/sheet';

/* ─── Constants ─────────────────────────────────────── */

const PARTS: { id: Part; label: string }[] = [
  { id: 'vocal', label: '보컬' },
  { id: 'guitar1', label: '기타 1' },
  { id: 'guitar2', label: '기타 2' },
  { id: 'bass', label: '베이스' },
  { id: 'drum', label: '드럼' },
  { id: 'synth', label: '신스' },
];

const DELTA_MIN = -6;
const DELTA_MAX = 6;

/* ─── Props ─────────────────────────────────────────── */

interface TrackViewerProps {
  title: string;
  artist?: string;
  parts: Partial<Record<Part, SheetData>>;
  lyrics?: LyricLine[];
  chords?: ChordEvent[];
}

/* ─── Sub-components ────────────────────────────────── */

function ChordPanel({
  chords,
  bpm,
  timeSignature,
}: {
  chords: ChordEvent[];
  bpm: number;
  timeSignature: [number, number];
}) {
  const spb = 60 / bpm;
  const spm = timeSignature[0] * spb;

  return (
    <div className="rounded-xl bg-gray-900 p-4 mb-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        코드 진행
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {chords.map((chord) => {
          const measure = Math.floor(chord.startTime / spm) + 1;
          return (
            <div
              key={`chord-${chord.startTime}`}
              className="flex flex-shrink-0 flex-col items-center gap-1"
            >
              <span className="text-[10px] text-gray-600">마디 {measure}</span>
              <span className="min-w-[3rem] rounded-lg bg-violet-900/60 px-3 py-1.5 text-center text-sm font-bold text-violet-200 font-mono">
                {chord.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LyricsPanel({ lyrics }: { lyrics: LyricLine[] }) {
  return (
    <div className="rounded-xl bg-gray-900 p-4 mb-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">가사</p>
      <div className="space-y-1.5">
        {lyrics.map((line) => (
          <p key={`lyric-${line.startTime}`} className="text-sm leading-7 text-gray-200">
            {line.text}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ─── Page component ────────────────────────────────── */

export default function TrackViewer({ title, artist, parts, lyrics, chords }: TrackViewerProps) {
  const [activePart, setActivePart] = useState<Part>('vocal');
  const [delta, setDelta] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const sheetData = parts[activePart];
  const result = sheetData ? transposeKey(sheetData, activePart, delta) : null;

  const transposedParts = useMemo(() => {
    const out: Partial<Record<Part, SheetData>> = {};
    PARTS.forEach(({ id }) => {
      const data = parts[id];
      if (data) out[id] = transposeKey(data, id, delta).data;
    });
    return out;
  }, [parts, delta]);

  const handleDownloadPart = async () => {
    if (!result) return;
    setIsExporting(true);
    try {
      await downloadPartPdf(title, activePart, result.data);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadAll = async () => {
    setIsExporting(true);
    try {
      await downloadAllPartsPdf(title, transposedParts);
    } finally {
      setIsExporting(false);
    }
  };

  let deltaLabel = `${delta}`;
  if (delta === 0) deltaLabel = '원조';
  else if (delta > 0) deltaLabel = `+${delta}`;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 pb-4 pt-6">
        <div className="mx-auto max-w-5xl">
          <Link to="/" className="mb-4 inline-block text-xs text-gray-600 hover:text-gray-400">
            ← 홈으로
          </Link>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              {artist && <p className="mt-0.5 text-sm text-gray-500">{artist}</p>}
            </div>

            {/* Key slider */}
            <div className="flex items-center gap-3 pb-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                ΔKey
              </span>
              <input
                type="range"
                min={DELTA_MIN}
                max={DELTA_MAX}
                step={1}
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
                className="h-1.5 w-32 cursor-pointer accent-violet-500"
                aria-label="키 조절 슬라이더"
              />
              <span
                className={[
                  'w-10 text-center text-sm font-bold tabular-nums',
                  delta === 0 ? 'text-gray-500' : 'text-violet-400',
                ].join(' ')}
              >
                {deltaLabel}
              </span>
              {delta !== 0 && (
                <button
                  type="button"
                  onClick={() => setDelta(0)}
                  className="text-[11px] text-gray-600 hover:text-gray-400"
                >
                  초기화
                </button>
              )}
            </div>

            {/* PDF export */}
            <div className="flex items-center gap-2 pb-0.5">
              <button
                type="button"
                disabled={!result || isExporting}
                onClick={handleDownloadPart}
                className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                이 파트 PDF 다운로드
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadAll}
                className="rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                전체 6파트 PDF로 받기
              </button>
            </div>
          </div>

          {/* Guide banner */}
          {result?.guide && (
            <div className="mt-3 rounded-lg border border-amber-700/50 bg-amber-900/30 px-4 py-2 text-sm text-amber-300">
              {result.guide}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Tab bar */}
        <div role="tablist" aria-label="파트 선택" className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {PARTS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activePart === id}
              onClick={() => setActivePart(id)}
              className={[
                'flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium',
                'whitespace-nowrap transition-colors',
                activePart === id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {result ? (
          <div>
            {activePart === 'vocal' && (
              <>
                {chords && chords.length > 0 && (
                  <ChordPanel
                    chords={chords}
                    bpm={result.data.bpm}
                    timeSignature={result.data.timeSignature}
                  />
                )}
                {lyrics && lyrics.length > 0 && <LyricsPanel lyrics={lyrics} />}
              </>
            )}
            <SheetView data={result.data} part={activePart} />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-xl bg-gray-900 text-sm text-gray-600">
            이 파트의 데이터가 없습니다
          </div>
        )}
      </main>
    </div>
  );
}
