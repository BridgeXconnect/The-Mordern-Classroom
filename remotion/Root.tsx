import { Composition } from "remotion";
import { VocabularyExplainer } from "./templates/VocabularyExplainer";
import { GrammarRule } from "./templates/GrammarRule";
import { ReadingStrategy } from "./templates/ReadingStrategy";

// TODO Phase 5: Register all Remotion compositions here
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VocabularyExplainer"
        component={VocabularyExplainer}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{ words: [], cefrLevel: "B1" }}
      />
      <Composition
        id="GrammarRule"
        component={GrammarRule}
        durationInFrames={180}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{ rule: "", explanation: "", examples: [], cefrLevel: "B1" }}
      />
      <Composition
        id="ReadingStrategy"
        component={ReadingStrategy}
        durationInFrames={120}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{ strategy: "", steps: [], cefrLevel: "B1" }}
      />
    </>
  );
};
