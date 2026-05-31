import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  strategy:  string;
  steps:     string[];
  cefrLevel: string;
  title?:    string;
}

export const ReadingStrategy: React.FC<Props> = ({
  strategy  = "",
  steps     = [],
  cefrLevel = "B1",
  title     = "Reading Strategy",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const BADGE_START    = 0;
  const TITLE_START    = 8;
  const CHIP_START     = 24;
  const STEPS_START    = 38;
  const FRAMES_PER_STEP = 14;

  function fadeUp(startFrame: number, duration = 18) {
    const local = Math.max(0, frame - startFrame);
    return {
      opacity:   interpolate(local, [0, duration], [0, 1], { extrapolateRight: "clamp" }),
      transform: `translateY(${interpolate(local, [0, duration], [20, 0], { extrapolateRight: "clamp" })}px)`,
    };
  }

  const badgeScale = spring({ frame: Math.max(0, frame - BADGE_START), fps, config: { damping: 14, mass: 0.5 } });

  return (
    <AbsoluteFill
      style={{
        background:  "linear-gradient(135deg,#7c2d12 0%,#92400e 50%,#b45309 100%)",
        fontFamily:  "'Segoe UI', Arial, sans-serif",
        padding:     56,
        display:     "flex",
        flexDirection: "column",
        gap:         24,
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
        📹 Reading Strategy · {cefrLevel}
      </div>

      {/* Title */}
      <h1 style={{ fontSize: 40, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2, ...fadeUp(TITLE_START) }}>
        {title}
      </h1>

      {/* Strategy chip */}
      <div
        style={{
          background:   "rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding:      "14px 22px",
          display:      "flex",
          alignItems:   "center",
          gap:          12,
          ...fadeUp(CHIP_START),
        }}
      >
        <span style={{ fontSize: 22 }}>📖</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#fbbf24" }}>{strategy}</span>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {steps.slice(0, 5).map((step, i) => {
          const local     = Math.max(0, frame - (STEPS_START + i * FRAMES_PER_STEP));
          const stepScale = spring({ frame: local, fps, config: { damping: 15, mass: 0.6 } });

          return (
            <div
              key={i}
              style={{
                display:   "flex",
                gap:       16,
                alignItems: "flex-start",
                opacity:   interpolate(local, [0, 12], [0, 1], { extrapolateRight: "clamp" }),
                transform: `translateX(${interpolate(local, [0, 14], [-28, 0], { extrapolateRight: "clamp" })}px)`,
              }}
            >
              <div
                style={{
                  width:          36,
                  height:         36,
                  borderRadius:   "50%",
                  background:     "#f97316",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  fontSize:       16,
                  fontWeight:     700,
                  color:          "#fff",
                  flexShrink:     0,
                  transform:      `scale(${Math.min(stepScale, 1)})`,
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", lineHeight: 1.55, paddingTop: 7 }}>
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
