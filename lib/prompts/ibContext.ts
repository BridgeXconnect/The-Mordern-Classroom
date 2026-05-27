import type { AtlSkill, CefrLevel } from "@prisma/client";

// IB Language B global contexts
export const IB_GLOBAL_CONTEXTS = [
  "Identities and Relationships",
  "Experiences",
  "Human Ingenuity",
  "Social Organisation",
  "Sharing the Planet",
] as const;

// ATL skill categories with sub-skills
export const ATL_SKILLS: Record<AtlSkill, { label: string; subSkills: string[] }> = {
  COMMUNICATION: {
    label: "Communication",
    subSkills: [
      "Reading, writing and using language to gather and communicate information",
      "Exchanging thoughts, messages and information effectively through interaction",
      "Using a variety of media to communicate with a range of audiences",
    ],
  },
  THINKING: {
    label: "Thinking",
    subSkills: [
      "Critical thinking: analysing and evaluating issues and ideas",
      "Creative thinking: generating novel ideas and considering new perspectives",
      "Transfer: using skills and knowledge in multiple contexts",
    ],
  },
  RESEARCH: {
    label: "Research",
    subSkills: [
      "Information literacy: accessing, evaluating and using information",
      "Media literacy: interacting with media to use and create ideas and information",
    ],
  },
  SOCIAL: {
    label: "Social",
    subSkills: [
      "Collaboration: working effectively and willingly with others",
      "Managing and resolving conflict constructively",
      "Developing cultural sensitivity",
    ],
  },
  SELF_MANAGEMENT: {
    label: "Self-management",
    subSkills: [
      "Organisation: managing time and tasks effectively",
      "Affective skills: managing state of mind and motivation",
      "Reflection: considering the process and outcomes of learning",
    ],
  },
};

// CEFR phase descriptors for IB Language B
export const IB_PHASE_DESCRIPTORS: Record<CefrLevel, {
  phase: string;
  receptive: string;
  productive: string;
  interaction: string;
}> = {
  L1: {
    phase: "Phase 1 (Pre-A1)",
    receptive: "Understands very short, simple texts consisting of high-frequency words and basic visual support.",
    productive: "Can write simple isolated words and phrases. Can produce very basic personal information.",
    interaction: "Can interact in a simple way, using familiar words, numbers and formulaic expressions.",
  },
  A1: {
    phase: "Phase 2 (A1)",
    receptive: "Understands familiar names, words and very simple sentences in notices, posters or catalogues.",
    productive: "Can write short, simple postcards and fill in forms with personal details.",
    interaction: "Can interact in a simple way provided the other person talks slowly, clearly and is prepared to help.",
  },
  A2: {
    phase: "Phase 3 (A2)",
    receptive: "Can understand short, simple texts on familiar matters of a concrete type.",
    productive: "Can write short, simple notes and messages relating to matters in areas of immediate need.",
    interaction: "Can communicate in simple and routine tasks requiring a simple and direct exchange of information.",
  },
  B1: {
    phase: "Phase 4 (B1)",
    receptive: "Can understand texts that consist mainly of high frequency everyday or job-related language.",
    productive: "Can write simple connected text on topics which are familiar or of personal interest.",
    interaction: "Can deal with most situations likely to arise whilst travelling in an area where the language is spoken.",
  },
  B2: {
    phase: "Phase 5 (B2)",
    receptive: "Can read articles and reports concerned with contemporary problems and the writer's attitudes.",
    productive: "Can write clear, detailed text on a wide range of subjects and explain a viewpoint on an issue.",
    interaction: "Can interact with a degree of fluency and spontaneity that makes regular interaction with native speakers possible.",
  },
};

// IB Language B text types (receptive and productive)
export const IB_TEXT_TYPES = [
  "article",
  "blog post",
  "advertisement",
  "brochure",
  "diary entry",
  "email",
  "formal letter",
  "informal letter",
  "instructions",
  "interview",
  "notice",
  "proposal",
  "report",
  "review",
  "speech",
] as const;

/**
 * Build the IB context block to inject into any generation prompt.
 * Call this function and append the result to your system prompt.
 */
export function buildIbContextBlock(
  cefrLevel: CefrLevel,
  atlSkills: AtlSkill[],
  ibTheme?: string
): string {
  const phase = IB_PHASE_DESCRIPTORS[cefrLevel];
  const atlContext = atlSkills
    .map((skill) => `- ${ATL_SKILLS[skill].label}: ${ATL_SKILLS[skill].subSkills[0]}`)
    .join("\n");

  return `
## IB Language B Framework Context

**Student Level:** ${phase.phase} (CEFR ${cefrLevel})
**Receptive Capability:** ${phase.receptive}
**Productive Capability:** ${phase.productive}
**Interaction Capability:** ${phase.interaction}

${ibTheme ? `**Global Context:** ${ibTheme}` : ""}

**ATL Skills to integrate:**
${atlContext}

**Instruction:** All content must be precisely calibrated to ${phase.phase} proficiency.
Vocabulary, sentence structures, and task complexity must be appropriate for this level.
Embed the ATL skills naturally — do not make them explicit to students.
`.trim();
}
