import { AbsoluteFill } from "remotion";

// TODO Phase 5: Animated reading strategy explainer (skimming, scanning, inference, etc.)
interface Props {
  strategy: string;
  steps: string[];
  cefrLevel: string;
}

export const ReadingStrategy: React.FC<Props> = ({ strategy, cefrLevel }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#7c2d12",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: "bold" }}>{strategy || "Reading Strategy"}</h1>
      <p style={{ fontSize: 24, opacity: 0.7 }}>Level: {cefrLevel} — TODO: Phase 5</p>
    </AbsoluteFill>
  );
};
