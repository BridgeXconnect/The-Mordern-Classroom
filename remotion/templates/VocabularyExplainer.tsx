import { AbsoluteFill } from "remotion";

// TODO Phase 5: Animated vocabulary explainer video
// Shows words one-by-one with definition, example sentence, pronunciation cue
interface Props {
  words: { word: string; definition: string; example: string }[];
  cefrLevel: string;
}

export const VocabularyExplainer: React.FC<Props> = ({ words, cefrLevel }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1e40af",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: "bold" }}>Vocabulary — {cefrLevel}</h1>
      <p style={{ fontSize: 24, opacity: 0.7 }}>{words.length} words — TODO: Phase 5</p>
    </AbsoluteFill>
  );
};
