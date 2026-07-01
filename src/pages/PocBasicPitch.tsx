import { useCallback, useRef, useState } from 'react';
import { BasicPitch, noteFramesToTime, outputToNotesPoly } from '@spotify/basic-pitch';
import type { NoteEventTime } from '@spotify/basic-pitch';

const MODEL_URL = '/basic-pitch/model.json';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToNoteName(midi: number): string {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

type Status = 'idle' | 'decoding' | 'inferring' | 'done' | 'error';

export default function PocBasicPitch() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState<NoteEventTime[]>([]);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i)) {
      setErrorMsg('오디오 파일만 지원합니다.');
      setStatus('error');
      return;
    }

    setStatus('decoding');
    setProgress(0);
    setNotes([]);
    setElapsedMs(null);
    setErrorMsg('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new AudioContext({ sampleRate: 22050 });
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      await audioCtx.close();

      // Basic Pitch requires mono — mix down all channels by averaging
      const monoData = new Float32Array(decoded.length);
      for (let ch = 0; ch < decoded.numberOfChannels; ch += 1) {
        const channelData = decoded.getChannelData(ch);
        for (let i = 0; i < decoded.length; i += 1) {
          monoData[i] += channelData[i];
        }
      }
      for (let i = 0; i < monoData.length; i += 1) {
        monoData[i] /= decoded.numberOfChannels;
      }

      setStatus('inferring');
      const startTime = performance.now();

      const basicPitch = new BasicPitch(MODEL_URL);

      let frames: number[][] = [];
      let onsets: number[][] = [];
      let contours: number[][] = [];

      await basicPitch.evaluateModel(
        monoData,
        (f, o, c) => {
          frames = f;
          onsets = o;
          contours = c;
        },
        (pct) => setProgress(Math.round(pct * 100)),
      );

      const noteEvents = outputToNotesPoly(frames, onsets, 0.5, 0.3, 5);
      const noteEventTimes = noteFramesToTime(noteEvents);

      const elapsed = Math.round(performance.now() - startTime);

      // eslint-disable-next-line no-console
      console.log('[BasicPitch] notes:', JSON.stringify(noteEventTimes, null, 2));
      // eslint-disable-next-line no-console
      console.log('[BasicPitch] contours shape:', contours.length);
      // eslint-disable-next-line no-console
      console.log(`[BasicPitch] elapsed: ${elapsed}ms`);

      setNotes(noteEventTimes);
      setElapsedMs(elapsed);
      setStatus('done');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[BasicPitch] error:', err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const isProcessing = status === 'decoding' || status === 'inferring';

  return (
    <main
      style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px', fontFamily: 'monospace' }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>PoC: Basic Pitch</h1>
      <p style={{ color: '#888', marginBottom: 32, fontSize: 14 }}>
        오디오 파일 → MIDI 변환 정확도 검증
      </p>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !isProcessing && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !isProcessing && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        style={{
          border: `2px dashed ${isDragOver ? '#7c3aed' : '#555'}`,
          borderRadius: 12,
          padding: '48px 24px',
          textAlign: 'center',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          background: isDragOver ? 'rgba(124,58,237,0.05)' : 'transparent',
          transition: 'all 0.15s',
          marginBottom: 32,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {isProcessing ? (
          <div>
            <div style={{ marginBottom: 8 }}>
              {status === 'decoding' ? '오디오 디코딩 중...' : `추론 중... ${progress}%`}
            </div>
            <div style={{ background: '#333', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div
                style={{
                  background: '#7c3aed',
                  height: '100%',
                  width: `${status === 'decoding' ? 5 : progress}%`,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        ) : (
          <span style={{ color: '#aaa' }}>
            오디오 파일을 드래그하거나 클릭하여 선택
            <br />
            <small style={{ color: '#666' }}>MP3 · WAV · OGG · FLAC · M4A</small>
          </span>
        )}
      </div>

      {/* Error */}
      {status === 'error' && (
        <div style={{ color: '#f87171', marginBottom: 24 }}>오류: {errorMsg}</div>
      )}

      {/* Results */}
      {status === 'done' && (
        <div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16, fontSize: 14, color: '#aaa' }}>
            <span>
              감지된 노트: <strong style={{ color: '#fff' }}>{notes.length}개</strong>
            </span>
            <span>
              처리 시간: <strong style={{ color: '#7c3aed' }}>{elapsedMs}ms</strong>
            </span>
          </div>

          {notes.length === 0 ? (
            <p style={{ color: '#888' }}>감지된 노트가 없습니다. 임계값을 낮춰보세요.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#888' }}>
                    <th style={{ padding: '6px 12px' }}>#</th>
                    <th style={{ padding: '6px 12px' }}>음이름</th>
                    <th style={{ padding: '6px 12px' }}>MIDI</th>
                    <th style={{ padding: '6px 12px' }}>시작 (s)</th>
                    <th style={{ padding: '6px 12px' }}>길이 (s)</th>
                    <th style={{ padding: '6px 12px' }}>진폭</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((note, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '5px 12px', color: '#555' }}>{i + 1}</td>
                      <td style={{ padding: '5px 12px', color: '#c084fc', fontWeight: 'bold' }}>
                        {midiToNoteName(note.pitchMidi)}
                      </td>
                      <td style={{ padding: '5px 12px' }}>{note.pitchMidi}</td>
                      <td style={{ padding: '5px 12px' }}>{note.startTimeSeconds.toFixed(3)}</td>
                      <td style={{ padding: '5px 12px' }}>{note.durationSeconds.toFixed(3)}</td>
                      <td style={{ padding: '5px 12px' }}>{note.amplitude.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
