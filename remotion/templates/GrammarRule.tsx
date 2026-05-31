import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  rule:        string;
  explanation: string;
  examples:    string[];
  cefrLevel:   string;
  title?:      string;
}

export const GrammarRule: React.FC<Props> = ({
  rule        = "",
  explanation = "",
  examples    = [],
  cefrLevel   = "B1",
  title       = "Grammar Rule",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timings (frames)
  const BADGE_START       = 0;
  const TITLE_START       = 8;
  const RULE_BOX_START    = 22;
  const EXPLANATION_START = 42;
  const EXAMPLES_START    = 60;

  function entrance(startFrame: number, duration = 20) {
    const local = Math.max(0, frame - startFrame);
    return {
      opacity:   interpolate(local, [0, duration], [0, 1], { extrapolateRight: "clamp" }),
      transform: `translateX(${interpolate(local, [0, duration], [-32, 0], { extrapolateRight: "clamp" })}px)`,
    };
  }

  const badgeScale = spring({ frame: Math.max(0, frame - BADGE_START), fps, config: { damping: 14, mass: 0.5 } });

  return (
    <AbsoluteFill
      style={{
        background:  "linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%)",
        fontFamily:  "'Segoe UI', Arial, sans-serif",
        padding:     56,
        display:     "flex",
        flexDirection: "column",
        gap:         22,
        overflow:    "hidden",
      }}
    >
      {/* Badge */}
      <div
        style={{
          transform:       `scale(${Math.min(badgeScale, 1)})`,
          transformOrigin: "left center",
          display:         "inline-flex",
          alignItems:      "center",
          gap:             8,
          background:      "rgba(255,255,255,0.15)",
          border:          "1px solid rgba(255,255,255,0.2)",
          borderRadius:    999,
          padding:         "5px 16px",
          fontSize:        13,
          color:           "rgba(255,255,255,0.9)",
          fontWeight:      600,
          width:           "fit-content",
        }}
      >
        📹 Grammar Rule · {cefrLevel}
      </div>

      {/* Title */}
      <h1 style={{ fontSize: 38, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2, ...entrance(TITLE_START) }}>
        {title}
      </h1>

      {/* Rule box */}
      <div
        style={{
          background:   "rgba(255,255,255,0.12)",
          borderRadius: 14,
          padding:      "20px 26px",
          ...entrance(RULE_BOX_START),
        }}
      >
        <div style={{ fontSize: 12, color: "#34d399", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>
          Rule
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#fff" }}>{rule}</div>
      </div>

      {/* Explanation */}
      {explanation && (
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 1.65, ...entrance(EXPLANATION_START) }}>
          {explanation}
        </div>
      )}

      {/* Examples */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {examples.slice(0, 4).map((ex, i) => {
          const local = Math.max(0, frame - (EXAMPLES_START + i * 12));
          return (
            <div
              key={i}
              style={{
                opacity:      interpolate(local, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
                transform:    `translateX(${interpolate(local, [0, 15], [-24, 0], { extrapolateRight: "clamp" })}px)`,
                padding:      "10px 16px",
                background:   "rgba(255,255,255,0.08)",
                borderLeft:   "3px solid #34d399",
                borderRadius: "0 8px 8px 0",
                fontSize:     15,
                color:        "rgba(255,255,255,0.9)",
              }}
            >
              {ex}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
