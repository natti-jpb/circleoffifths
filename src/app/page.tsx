"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// --- Music Data ---

const MAJOR_CHORDS = ["C","G","D","A","E","B","F#/Gb","Db","Ab","Eb","Bb","F"];
const MINOR_CHORDS = ["Am","Em","Bm","F#m","C#m","G#m","Ebm","Bbm","Fm","Cm","Gm","Dm"];

const CHORD_NOTES: Record<string, string[]> = {
  C:["C","E","G"],G:["G","B","D"],D:["D","F#","A"],A:["A","C#","E"],
  E:["E","G#","B"],B:["B","D#","F#"],"F#/Gb":["F#","A#","C#"],
  Db:["Db","F","Ab"],Ab:["Ab","C","Eb"],Eb:["Eb","G","Bb"],
  Bb:["Bb","D","F"],F:["F","A","C"],Am:["A","C","E"],Em:["E","G","B"],
  Bm:["B","D","F#"],"F#m":["F#","A","C#"],"C#m":["C#","E","G#"],
  "G#m":["G#","B","D#"],Ebm:["Eb","Gb","Bb"],Bbm:["Bb","Db","F"],
  Fm:["F","Ab","C"],Cm:["C","Eb","G"],Gm:["G","Bb","D"],Dm:["D","F","A"],
};

// Guitar chord voicings as note names with octaves (for soundfont playback)
const GUITAR_CHORD_NOTES: Record<string, string[]> = {
  C:["C3","E3","G3","C4","E4"],
  G:["G2","B2","D3","G3","B3","D4"],
  D:["D3","A3","D4","F#4"],
  A:["A2","E3","A3","C#4","E4"],
  E:["E2","B2","E3","G#3","B3","E4"],
  B:["B2","F#3","B3","D#4","F#4"],
  "F#/Gb":["F#2","C#3","F#3","A#3","C#4"],
  Db:["Db3","Ab3","Db4","F4","Ab4"],
  Ab:["Ab2","Eb3","Ab3","C4","Eb4"],
  Eb:["Eb3","Bb3","Eb4","G4","Bb4"],
  Bb:["Bb2","F3","Bb3","D4","F4"],
  F:["F2","C3","F3","A3","C4","F4"],
  Am:["A2","E3","A3","C4","E4"],
  Em:["E2","B2","E3","G3","B3","E4"],
  Bm:["B2","F#3","B3","D4","F#4"],
  "F#m":["F#2","C#3","F#3","A3","C#4"],
  "C#m":["C#3","G#3","C#4","E4","G#4"],
  "G#m":["G#2","D#3","G#3","B3","D#4"],
  Ebm:["Eb3","Bb3","Eb4","Gb4","Bb4"],
  Bbm:["Bb2","F3","Bb3","Db4","F4"],
  Fm:["F2","C3","F3","Ab3","C4","F4"],
  Cm:["C3","G3","C4","Eb4","G4"],
  Gm:["G2","D3","G3","Bb3","D4"],
  Dm:["D3","A3","D4","F4"],
};

// Single note + octave for individual note playback
const NOTE_WITH_OCTAVE: Record<string, string> = {
  C:"C4","C#":"C#4",Db:"Db4",D:"D4","D#":"D#4",Eb:"Eb4",
  E:"E4",F:"F4","F#":"F#4",Gb:"Gb4",G:"G3","G#":"G#3",
  Ab:"Ab3",A:"A3","A#":"A#3",Bb:"Bb3",B:"B3",
};

// --- Fingering data ---
interface ChordFingering {
  frets: number[]; fingers: number[]; barreAt?: number; startFret: number;
}

const CHORD_FINGERINGS: Record<string, ChordFingering> = {
  C:       { frets:[-1,3,2,0,1,0], fingers:[0,3,2,0,1,0], startFret:0 },
  G:       { frets:[3,2,0,0,0,3],  fingers:[2,1,0,0,0,3], startFret:0 },
  D:       { frets:[-1,-1,0,2,3,2],fingers:[0,0,0,1,3,2], startFret:0 },
  A:       { frets:[-1,0,2,2,2,0], fingers:[0,0,1,2,3,0], startFret:0 },
  E:       { frets:[0,2,2,1,0,0],  fingers:[0,2,3,1,0,0], startFret:0 },
  B:       { frets:[-1,2,4,4,4,2], fingers:[0,1,2,3,4,1], barreAt:2, startFret:1 },
  "F#/Gb": { frets:[2,4,4,3,2,2], fingers:[1,3,4,2,1,1], barreAt:2, startFret:1 },
  Db:      { frets:[-1,4,3,1,2,1], fingers:[0,4,3,1,2,1], barreAt:1, startFret:0 },
  Ab:      { frets:[4,6,6,5,4,4], fingers:[1,3,4,2,1,1], barreAt:4, startFret:3 },
  Eb:      { frets:[-1,-1,1,3,4,3],fingers:[0,0,1,2,4,3], startFret:0 },
  Bb:      { frets:[-1,1,3,3,3,1], fingers:[0,1,2,3,4,1], barreAt:1, startFret:0 },
  F:       { frets:[1,3,3,2,1,1],  fingers:[1,3,4,2,1,1], barreAt:1, startFret:0 },
  Am:      { frets:[-1,0,2,2,1,0], fingers:[0,0,2,3,1,0], startFret:0 },
  Em:      { frets:[0,2,2,0,0,0],  fingers:[0,2,3,0,0,0], startFret:0 },
  Bm:      { frets:[-1,2,4,4,3,2], fingers:[0,1,3,4,2,1], barreAt:2, startFret:1 },
  "F#m":   { frets:[2,4,4,2,2,2], fingers:[1,3,4,1,1,1], barreAt:2, startFret:1 },
  "C#m":   { frets:[-1,4,6,6,5,4], fingers:[0,1,3,4,2,1], barreAt:4, startFret:3 },
  "G#m":   { frets:[4,6,6,4,4,4], fingers:[1,3,4,1,1,1], barreAt:4, startFret:3 },
  Ebm:     { frets:[-1,-1,1,3,4,2],fingers:[0,0,1,3,4,2], startFret:0 },
  Bbm:     { frets:[-1,1,3,3,2,1], fingers:[0,1,3,4,2,1], barreAt:1, startFret:0 },
  Fm:      { frets:[1,3,3,1,1,1],  fingers:[1,3,4,1,1,1], barreAt:1, startFret:0 },
  Cm:      { frets:[-1,3,5,5,4,3], fingers:[0,1,3,4,2,1], barreAt:3, startFret:2 },
  Gm:      { frets:[3,5,5,3,3,3], fingers:[1,3,4,1,1,1], barreAt:3, startFret:2 },
  Dm:      { frets:[-1,-1,0,2,3,1],fingers:[0,0,0,2,3,1], startFret:0 },
};

const STRING_NAMES = ["E","A","D","G","B","e"];

// Colors
const MAJOR_COLORS = ["#f2e6d9","#e8ddd0","#f0ddd4","#edd6d6","#e8d4df","#ddd4e8","#d4d8e8","#d4e2e8","#d4e8e0","#d9e8d4","#e2e8d4","#ede8d4"];
const MINOR_COLORS = ["#e6dace","#ddd2c5","#e4d1c8","#e1caca","#dcc8d3","#d1c8dc","#c8ccdc","#c8d6dc","#c8dcd4","#cddcc8","#d6dcc8","#e1dcc8"];
const MAJOR_HOVER = ["#e8d9c7","#ddd0bf","#e6d0c5","#e3c8c8","#dec6d2","#d0c6de","#c6cade","#c6d6de","#c6ded4","#cbdec6","#d0dec6","#e0dec6"];
const MINOR_HOVER = ["#dccdb9","#d0c4b0","#d8c3b4","#d5bcbc","#cfb9c5","#c3b9cf","#b9bdcf","#b9c8cf","#b9cfc6","#bfcfb9","#c8cfb9","#d5cfb9"];

// --- Guitar Style / Instrument Selection ---
type GuitarStyle = "nylon" | "steel" | "electric_clean" | "electric_jazz";

const SOUNDFONT_INSTRUMENTS: Record<GuitarStyle, string> = {
  nylon: "acoustic_guitar_nylon",
  steel: "acoustic_guitar_steel",
  electric_clean: "electric_guitar_clean",
  electric_jazz: "electric_guitar_jazz",
};

const STYLE_LABELS: Record<GuitarStyle, { name: string; desc: string }> = {
  nylon:          { name: "Nylon",    desc: "Classical acoustic, warm & mellow" },
  steel:          { name: "Steel",    desc: "Steel-string acoustic, bright & full" },
  electric_clean: { name: "Clean",    desc: "Electric clean tone" },
  electric_jazz:  { name: "Jazz",     desc: "Electric jazz, smooth & round" },
};

// --- Audio Engine using Soundfont ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SoundfontInstrument = any;

interface AudioEngine {
  ctx: AudioContext;
  instrument: SoundfontInstrument | null;
  loadedName: string | null;
  loading: boolean;
}

async function loadInstrument(engine: AudioEngine, instrumentName: string): Promise<SoundfontInstrument> {
  if (engine.loadedName === instrumentName && engine.instrument) {
    return engine.instrument;
  }

  engine.loading = true;
  // Dynamic import for soundfont-player (CJS module)
  const Soundfont = (await import("soundfont-player")).default;
  const inst = await Soundfont.instrument(engine.ctx, instrumentName as Parameters<typeof Soundfont.instrument>[1], {
    soundfont: "MusyngKite",
    format: "mp3",
  });
  engine.instrument = inst;
  engine.loadedName = instrumentName;
  engine.loading = false;
  return inst;
}

function playChord(
  instrument: SoundfontInstrument,
  noteNames: string[],
  strumDelay: number = 0.03,
) {
  const now = instrument.context?.currentTime ?? 0;
  noteNames.forEach((note, i) => {
    instrument.play(note, now + i * strumDelay, { duration: 2.5, gain: 3 });
  });
}

function playSingle(instrument: SoundfontInstrument, note: string) {
  instrument.play(note, 0, { duration: 2.0, gain: 4 });
}

// --- SVG Helpers ---
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, innerR: number, outerR: number, sa: number, ea: number) {
  const os = polarToCartesian(cx, cy, outerR, ea), oe = polarToCartesian(cx, cy, outerR, sa);
  const is_ = polarToCartesian(cx, cy, innerR, sa), ie = polarToCartesian(cx, cy, innerR, ea);
  const la = ea - sa > 180 ? 1 : 0;
  return `M ${os.x} ${os.y} A ${outerR} ${outerR} 0 ${la} 0 ${oe.x} ${oe.y} L ${is_.x} ${is_.y} A ${innerR} ${innerR} 0 ${la} 1 ${ie.x} ${ie.y} Z`;
}

// --- Guitar Diagram ---
function GuitarDiagram({ chord, onNoteClick, playingNote }: {
  chord: string | null; onNoteClick: (note: string) => void; playingNote: string | null;
}) {
  const fingering = chord ? CHORD_FINGERINGS[chord] : null;
  const notes = chord ? CHORD_NOTES[chord] : null;

  const numFrets = 5;
  const stringSpacing = 28;
  const fretSpacing = 40;
  const leftPad = 40;
  const topPad = 50;
  const totalW = leftPad + stringSpacing * 5 + 30;
  const totalH = topPad + fretSpacing * numFrets + 40;

  const FINGER_COLORS: Record<number, string> = { 1:"#c49a6c", 2:"#b08860", 3:"#9a7854", 4:"#8a6a48" };

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor:"#f0e8dc", border:"1px solid #ddd0c0" }}>
        {chord ? (
          <>
            <p className="text-center text-lg font-bold mb-1" style={{ color:"#5a3a1a" }}>{chord}</p>
            <p className="text-center text-xs mb-3" style={{ color:"#a09080" }}>
              {chord.includes("m") && !chord.includes("/") ? "minor" : "major"}
            </p>
          </>
        ) : (
          <p className="text-center text-sm mb-3" style={{ color:"#a09080" }}>Select a chord to see fingering</p>
        )}

        <svg width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`} className="mx-auto">
          {fingering && fingering.startFret === 0 ? (
            <rect x={leftPad-2} y={topPad-3} width={stringSpacing*5+4} height={5} rx={2} fill="#5a4030" />
          ) : fingering ? (
            <text x={leftPad-18} y={topPad+fretSpacing/2+4} textAnchor="middle" fontSize="12" fontWeight="600"
              fill="#7a6a5a" style={{ fontFamily:"var(--font-sans)" }}>{fingering.startFret+1}fr</text>
          ) : null}

          {Array.from({length:numFrets+1}).map((_,i) => (
            <line key={`f${i}`} x1={leftPad} y1={topPad+i*fretSpacing} x2={leftPad+stringSpacing*5} y2={topPad+i*fretSpacing}
              stroke={i===0&&(!fingering||fingering.startFret===0)?"#5a4030":"#c4b4a0"}
              strokeWidth={i===0&&(!fingering||fingering.startFret===0)?2:1} />
          ))}
          {Array.from({length:6}).map((_,i) => (
            <line key={`s${i}`} x1={leftPad+i*stringSpacing} y1={topPad} x2={leftPad+i*stringSpacing}
              y2={topPad+numFrets*fretSpacing} stroke="#a09080" strokeWidth={2.5-i*0.25} />
          ))}
          {STRING_NAMES.map((name,i) => (
            <text key={`l${i}`} x={leftPad+i*stringSpacing} y={topPad+numFrets*fretSpacing+20} textAnchor="middle"
              fontSize="10" fill="#a09080" style={{ fontFamily:"var(--font-mono)" }}>{name}</text>
          ))}

          {fingering && fingering.frets.map((fret,si) => {
            const x = leftPad + si * stringSpacing;
            if (fret===-1) return <text key={`m${si}`} x={x} y={topPad-14} textAnchor="middle" fontSize="14" fontWeight="700" fill="#b0a090" style={{fontFamily:"var(--font-sans)"}}>×</text>;
            if (fret===0) return <circle key={`o${si}`} cx={x} cy={topPad-14} r={6} fill="none" stroke="#8a7a6a" strokeWidth={1.5} />;
            const df = fret - fingering.startFret;
            const y = topPad + (df-0.5)*fretSpacing;
            const finger = fingering.fingers[si];
            if (fingering.barreAt===fret && finger===1) return null;
            return (
              <g key={`d${si}`}>
                <circle cx={x} cy={y} r={10} fill={FINGER_COLORS[finger]||"#8a6a48"} />
                <text x={x} y={y+1} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill="#fff"
                  style={{fontFamily:"var(--font-sans)"}}>{finger}</text>
              </g>
            );
          })}

          {fingering && fingering.barreAt!==undefined && (() => {
            const df = fingering.barreAt - fingering.startFret;
            const y = topPad + (df-0.5)*fretSpacing;
            let first=-1, last=-1;
            fingering.frets.forEach((f,i) => { if(f===fingering.barreAt&&fingering.fingers[i]===1){if(first===-1)first=i;last=i;} });
            if(first===-1||first===last) return null;
            const x1=leftPad+first*stringSpacing, x2=leftPad+last*stringSpacing;
            return <g key="barre"><rect x={x1-10} y={y-8} width={x2-x1+20} height={16} rx={8} fill="#c49a6c" />
              <text x={(x1+x2)/2} y={y+1} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill="#fff" style={{fontFamily:"var(--font-sans)"}}>1</text></g>;
          })()}
        </svg>

        {notes && (
          <div className="mt-3">
            <p className="text-xs text-center font-medium uppercase tracking-widest mb-2" style={{color:"#a09080"}}>Tap a note</p>
            <div className="flex gap-2 justify-center">
              {notes.map((note) => {
                const isActive = playingNote===note;
                return (
                  <button key={note} onClick={() => onNoteClick(note)}
                    className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95"
                    style={{
                      backgroundColor: isActive?"#e8d5be":"#faf5ee",
                      border: isActive?"2px solid #c49a6c":"1px solid #ddd0c0",
                      color: isActive?"#4a3020":"#5a4030",
                      boxShadow: isActive?"0 0 12px rgba(196,154,108,0.4)":"0 1px 3px rgba(0,0,0,0.05)",
                    }}>{note}</button>
                );
              })}
            </div>
            <p className="mt-2 text-center text-xs" style={{color:"#b0a090"}}>
              {chord&&chord.includes("m")&&!chord.includes("/") ? "Root — ♭3 — 5" : "Root — 3 — 5"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main ---
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeChord, setActiveChord] = useState<string|null>(null);
  const [playingNote, setPlayingNote] = useState<string|null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [style, setStyle] = useState<GuitarStyle>("nylon");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const engineRef = useRef<AudioEngine|null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Create or resume AudioContext — must be called from a user gesture on mobile
  const getEngine = useCallback(async () => {
    if (!engineRef.current) {
      const ctx = new AudioContext();
      engineRef.current = { ctx, instrument:null, loadedName:null, loading:false };
    }
    // Mobile browsers require resume() inside a user gesture handler
    if (engineRef.current.ctx.state === "suspended") {
      await engineRef.current.ctx.resume();
    }
    return engineRef.current;
  }, []);

  // Pre-load instrument when style changes (don't create AudioContext here — wait for user tap)
  useEffect(() => {
    if (!engineRef.current) return; // Only pre-load if engine already exists (user has tapped)
    const engine = engineRef.current;
    const instName = SOUNDFONT_INSTRUMENTS[style];
    setLoading(true);
    setReady(false);
    loadInstrument(engine, instName).then(() => {
      setLoading(false);
      setReady(true);
    });
  }, [style]);

  useEffect(() => {
    return () => { engineRef.current?.ctx.close(); };
  }, []);

  const handleChordClick = useCallback(async (chord: string) => {
    // getEngine is called inside the click handler — this satisfies mobile autoplay policy
    const engine = await getEngine();
    const instName = SOUNDFONT_INSTRUMENTS[style];
    setLoading(true);
    const inst = await loadInstrument(engine, instName);
    setLoading(false);
    setReady(true);
    const chordNotes = GUITAR_CHORD_NOTES[chord];
    if (!chordNotes) return;

    setActiveChord(chord);
    setIsPlaying(true);
    setPlayingNote(null);
    playChord(inst, chordNotes, 0.03);
    setTimeout(() => setIsPlaying(false), 2500);
  }, [getEngine, style]);

  const handleNoteClick = useCallback(async (note: string) => {
    const engine = await getEngine();
    const instName = SOUNDFONT_INSTRUMENTS[style];
    const inst = await loadInstrument(engine, instName);
    const noteWithOctave = NOTE_WITH_OCTAVE[note];
    if (!noteWithOctave) return;

    setPlayingNote(note);
    playSingle(inst, noteWithOctave);
    setTimeout(() => setPlayingNote(null), 1500);
  }, [getEngine, style]);

  const cx=250, cy=250, outerR=230, midR=165, innerR=100, seg=30;
  const notes = activeChord ? CHORD_NOTES[activeChord] : null;
  const isMinor = activeChord ? activeChord.includes("m")&&!activeChord.includes("/") : false;

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center" style={{backgroundColor:"#faf7f2"}}>
        <p className="text-sm" style={{color:"#a09080"}}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen select-none">
      <header className="pt-6 pb-2 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{color:"#5a4a3a"}}>
          Circle of Fifths
        </h1>
        <p className="mt-1 text-sm" style={{color:"#8a7a6a"}}>
          Click a chord to hear it and see the fingering
        </p>
      </header>

      {/* Collapsible info section */}
      <div className="flex flex-col items-center px-4">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200"
          style={{ color: "#7a6a5a", backgroundColor: showInfo ? "#f0e8dc" : "transparent", border: showInfo ? "1px solid #ddd0c0" : "1px solid transparent" }}
        >
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className="transition-transform duration-300"
            style={{ transform: showInfo ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          What is the Circle of Fifths?
        </button>

        <div
          className="overflow-hidden transition-all duration-500 ease-in-out"
          style={{ maxHeight: showInfo ? "600px" : "0px", opacity: showInfo ? 1 : 0 }}
        >
          <div
            className="mt-3 mb-2 rounded-2xl px-6 py-5 max-w-2xl text-sm leading-relaxed"
            style={{ backgroundColor: "#f0e8dc", border: "1px solid #ddd0c0", color: "#5a4a3a" }}
          >
            <h3 className="font-semibold text-base mb-2" style={{ color: "#4a3a2a" }}>
              A visual map of all 12 musical keys
            </h3>
            <p className="mb-3" style={{ color: "#6a5a4a" }}>
              The Circle of Fifths arranges every key by how closely they&apos;re related. Moving clockwise, each key is a <strong>perfect fifth</strong> above the previous one. The outer ring shows major keys; the inner ring shows their relative minors.
            </p>

            <h3 className="font-semibold text-base mb-2" style={{ color: "#4a3a2a" }}>
              How it works
            </h3>
            <p className="mb-3" style={{ color: "#6a5a4a" }}>
              Adjacent keys share the most notes — they differ by just one sharp or flat. The further apart two keys are on the circle, the more different they sound. Keys directly opposite each other are the most harmonically distant.
            </p>

            <h3 className="font-semibold text-base mb-2" style={{ color: "#4a3a2a" }}>
              How to use it for guitar
            </h3>
            <ul className="space-y-2" style={{ color: "#6a5a4a" }}>
              <li>
                <strong style={{ color: "#5a4030" }}>Chord progressions:</strong> Common progressions use neighboring chords. In the key of C, go one step clockwise (G) and one step counter-clockwise (F) to get the classic I–IV–V progression (C–F–G).
              </li>
              <li>
                <strong style={{ color: "#5a4030" }}>Relative minors:</strong> The inner ring shows each major key&apos;s relative minor — e.g., Am is the relative minor of C. They share the same notes but have a different feel.
              </li>
              <li>
                <strong style={{ color: "#5a4030" }}>Key signatures:</strong> Count clockwise from C to find how many sharps a key has. Count counter-clockwise for flats.
              </li>
              <li>
                <strong style={{ color: "#5a4030" }}>Songwriting:</strong> Pick any chord on the circle — its neighbors (both sides + its relative minor) are the chords that sound most natural together.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Guitar style selector */}
      <div className="flex flex-col items-center gap-2 py-3">
        <div className="flex gap-2 flex-wrap justify-center">
          {(Object.keys(SOUNDFONT_INSTRUMENTS) as GuitarStyle[]).map((s) => {
            const active = style===s;
            return (
              <button key={s} onClick={() => setStyle(s)}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: active?"#d4a574":"#f0e8dc", color: active?"#fff":"#6a5a4a",
                  border: active?"1px solid #b8956a":"1px solid #ddd0c0",
                  boxShadow: active?"0 2px 8px rgba(180,140,90,0.3)":"none",
                }}>{STYLE_LABELS[s].name}</button>
            );
          })}
        </div>
        <p className="text-xs" style={{color:"#a09080"}}>
          {STYLE_LABELS[style].desc}
          {loading && " — loading samples..."}
          {ready && !loading && " ✓"}
        </p>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 px-4 pb-6">
        {/* Guitar diagram — left */}
        <div className="flex-shrink-0 order-2 lg:order-1">
          <GuitarDiagram chord={activeChord} onNoteClick={handleNoteClick} playingNote={playingNote} />
          {activeChord && (
            <div className="mt-3 text-center">
              <button onClick={() => handleChordClick(activeChord)}
                className="px-5 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95"
                style={{backgroundColor:"#e8ddd0",border:"1px solid #d4c4b0",color:"#6a5a4a"}}
                onMouseEnter={(e) => {e.currentTarget.style.backgroundColor="#ddd0bf"}}
                onMouseLeave={(e) => {e.currentTarget.style.backgroundColor="#e8ddd0"}}>
                ♪ Strum {activeChord} again
              </button>
            </div>
          )}
        </div>

        {/* Circle of Fifths — right */}
        <div className="relative w-full max-w-[420px] lg:max-w-[480px] aspect-square order-1 lg:order-2">
          <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-lg">
            <circle cx={cx} cy={cy} r={outerR} fill="#f5efe6" stroke="#d4c4b0" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={midR} fill="#efe7db" stroke="#d4c4b0" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={innerR} fill="#f5efe6" stroke="#d4c4b0" strokeWidth="0.5" />

            {MAJOR_CHORDS.map((chord,i) => {
              const sa=i*seg, ea=sa+seg, isActive=activeChord===chord;
              const lp=polarToCartesian(cx,cy,(outerR+midR)/2,sa+seg/2);
              return (
                <g key={chord} className="cursor-pointer">
                  <path d={describeArc(cx,cy,midR,outerR,sa,ea)}
                    fill={isActive?MAJOR_HOVER[i]:MAJOR_COLORS[i]}
                    stroke={isActive?"#b8956a":"#d4c4b0"} strokeWidth={isActive?"1.5":"0.5"}
                    className="transition-all duration-200"
                    onMouseEnter={(e) => !isActive&&e.currentTarget.setAttribute("fill",MAJOR_HOVER[i])}
                    onMouseLeave={(e) => !isActive&&e.currentTarget.setAttribute("fill",MAJOR_COLORS[i])}
                    onClick={() => handleChordClick(chord)} />
                  <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={chord.length>2?"12":"15"} fontWeight={isActive?"700":"600"}
                    fill={isActive?"#5a3a1a":"#6a5a4a"} className="pointer-events-none"
                    style={{fontFamily:"var(--font-sans)"}}>{chord}</text>
                </g>
              );
            })}

            {MINOR_CHORDS.map((chord,i) => {
              const sa=i*seg, ea=sa+seg, isActive=activeChord===chord;
              const lp=polarToCartesian(cx,cy,(midR+innerR)/2,sa+seg/2);
              return (
                <g key={chord} className="cursor-pointer">
                  <path d={describeArc(cx,cy,innerR,midR,sa,ea)}
                    fill={isActive?MINOR_HOVER[i]:MINOR_COLORS[i]}
                    stroke={isActive?"#b8956a":"#d4c4b0"} strokeWidth={isActive?"1.5":"0.5"}
                    className="transition-all duration-200"
                    onMouseEnter={(e) => !isActive&&e.currentTarget.setAttribute("fill",MINOR_HOVER[i])}
                    onMouseLeave={(e) => !isActive&&e.currentTarget.setAttribute("fill",MINOR_COLORS[i])}
                    onClick={() => handleChordClick(chord)} />
                  <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={chord.length>3?"10":"12"} fontWeight={isActive?"700":"500"}
                    fill={isActive?"#5a3a1a":"#7a6a5a"} className="pointer-events-none"
                    style={{fontFamily:"var(--font-sans)"}}>{chord}</text>
                </g>
              );
            })}

            <circle cx={cx} cy={cy} r={innerR} fill="#f8f2ea" />
            {activeChord ? (
              <>
                <text x={cx} y={cy-20} textAnchor="middle" dominantBaseline="central"
                  fontSize="28" fontWeight="700" fill="#5a3a1a" style={{fontFamily:"var(--font-sans)"}}>{activeChord}</text>
                <text x={cx} y={cy+8} textAnchor="middle" dominantBaseline="central"
                  fontSize="11" fontWeight="500" fill="#8a7a6a" style={{fontFamily:"var(--font-sans)"}}>{isMinor?"minor":"major"}</text>
                <text x={cx} y={cy+30} textAnchor="middle" dominantBaseline="central"
                  fontSize="14" fontWeight="600" fill="#6a5a4a" style={{fontFamily:"var(--font-sans)"}}>{notes?.join(" — ")}</text>
              </>
            ) : (
              <>
                <text x={cx} y={cy-8} textAnchor="middle" dominantBaseline="central"
                  fontSize="13" fontWeight="500" fill="#a09080" style={{fontFamily:"var(--font-sans)"}}>tap a chord</text>
                <text x={cx} y={cy+12} textAnchor="middle" dominantBaseline="central"
                  fontSize="13" fontWeight="500" fill="#a09080" style={{fontFamily:"var(--font-sans)"}}>to play</text>
              </>
            )}

            {isPlaying && (
              <circle cx={cx} cy={cy} r={innerR-5} fill="none" stroke="#d4a574" strokeWidth="2" opacity="0.6">
                <animate attributeName="r" from={String(innerR-5)} to={String(innerR+10)} dur="0.8s" repeatCount="2" />
                <animate attributeName="opacity" from="0.6" to="0" dur="0.8s" repeatCount="2" />
              </circle>
            )}
          </svg>
        </div>
      </div>

      <footer className="pb-4 text-center">
        <p className="text-xs" style={{color:"#b0a090"}}>
          Real instrument samples via MusyngKite SoundFont — use headphones for best experience
        </p>
      </footer>
    </div>
  );
}
