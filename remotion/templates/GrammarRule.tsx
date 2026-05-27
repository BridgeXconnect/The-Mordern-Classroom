import { AbsoluteFill } from "remotion";

// TODO Phase 5: Animated grammar rule explainer
interface Props {
  rule: string;
  explanation: string;
  examples: string[];
  cefrLevel: string;
}

export const GrammarRule: React.FC<Props> = ({ rule, cefrLevel }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#065f46",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: "bold" }}>{rule || "Grammar Rule"}</h1>
      <p style={{ fontSize: 24, opacity: 0.7 }}>Level: {cefrLevel} — TODO: Phase 5</p>
    </AbsoluteFill>
  );
};
