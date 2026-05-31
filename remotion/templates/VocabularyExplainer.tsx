import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Word { word: string; definition: string; example?: string; }

interface Props {
  words:     Word[];
  cefrLevel: string;
  title?:    string;
}

const FRAMES_PER_WORD = 45;   // 1.5 s per word at 30 fps
const INTRO_FRAMES    = 30;   // 1 s intro

function WordCard({ word, frame, delay }: { word: Word; frame: number; delay: number }) {
  const { fps } = useVideoConfig();

  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const translateY = interpolate(localFrame, [0, 20], [30, 0], { extrapolateRight: "clamp" });
  const scale = spring({ frame: localFrame, fps, config: { damping: 14, mass: 0.6, stiffness: 180 } });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${Math.min(scale, 1)})`,
        background: "rgba(255,255,255,0.12)",
        border:     "1px solid rgba(255,255,255,0.2)",
        borderRadius: 16,
        padding:    "24px 28px",
        display:    "flex",
        flexDirection: "column",
        gap:        8,
      }}
    >
      <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
        {word.word}
      </span>
      <span style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
        {word.definition}
      </span>
      {word.example && (
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
          &ldquo;{word.example}&rdquo;
        </span>
      )}
    </div>
  );
}

export const VocabularyExplainer: React.FC<Props> = ({
  words     = [],
  cefrLevel = "B1",
  title     = "Vocabulary",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title entrance
  const titleOpacity   = interpolate(frame, [0, 20],  [0, 1], { extrapolateRight: "clamp" });
  const titleTranslate = interpolate(frame, [0, 25],  [-20, 0], { extrapolateRight: "clamp" });
  const badgeScale     = spring({ frame, fps, config: { damping: 12, mass: 0.5 } });

  const displayWords = words.slice(0, 6);

  return (
    <AbsoluteFill
      style={{
        background:  "linear-gradient(135deg,#1e3a8a 0%,#1e40af 50%,#3730a3 100%)",
        fontFamily:  "'Segoe UI', Arial, sans-serif",
        padding:     56,
        display:     "flex",
        flexDirection: "column",
        gap:         28,
        overflow:    "hidden",
      }}
    >
      {/* Badge */}
      <div
        style={{
          transform:        `scale(${Math.min(badgeScale, 1)})`,
          transformOrigin:  "left center",
          display:          "inline-flex",
          alignItems:       "center",
          gap:              8,
          background:       "rgba(255,255,255,0.15)",
          border:           "1px solid rgba(255,255,255,0.2)",
          borderRadius:     999,
          padding:          "5px 16px",
          fontSize:         13,
          color:            "rgba(255,255,255,0.9)",
          fontWeight:       600,
          width:            "fit-content",
        }}
      >
        📹 Vocabulary Explainer · {cefrLevel}
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize:    40,
          fontWeight:  800,
          color:       "#fff",
          opacity:     titleOpacity,
          transform:   `translateY(${titleTranslate}px)`,
          lineHeight:  1.15,
          margin:      0,
        }}
      >
        {title}
      </h1>

      {/* Word grid */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap:                 16,
          flex:                1,
        }}
      >
        {displayWords.map((w, i) => (
          <WordCard
            key={i}
            word={w}
            frame={frame}
            delay={INTRO_FRAMES + i * (FRAMES_PER_WORD / displayWords.length)}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
