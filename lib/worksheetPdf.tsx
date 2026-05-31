/**
 * Server-side @react-pdf/renderer template for printable worksheets.
 * Called from the /api/export/pdf route only — never imported client-side.
 */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { WorksheetSection, WorksheetSectionContent } from "@/types/worksheet";

// Register a clean system font
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
    { src: "Helvetica-Oblique", fontStyle: "italic" },
  ],
});

const INDIGO = "#4F46E5";
const DARK   = "#1E1B4B";
const MUTED  = "#6B7280";
const LIGHT  = "#EEF2FF";
const BORDER = "#E5E7EB";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 48,
    lineHeight: 1.5,
  },
  // Header
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: DARK },
  headerSub:   { fontSize: 9, color: MUTED, marginTop: 2 },
  headerLine:  { height: 2, backgroundColor: INDIGO, marginTop: 8 },
  // Section
  section:        { marginBottom: 16 },
  sectionHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  sectionTitle:   { fontSize: 11, fontWeight: "bold", color: DARK },
  sectionPoints:  { fontSize: 9, color: MUTED },
  instructions:   { fontSize: 9, color: MUTED, fontStyle: "italic", marginBottom: 6 },
  // Content
  passage:      { fontSize: 10, lineHeight: 1.6, marginBottom: 8, backgroundColor: LIGHT, padding: 8, borderRadius: 3 },
  questionRow:  { flexDirection: "row", gap: 4, marginBottom: 5 },
  qNum:         { fontSize: 10, color: MUTED, width: 14 },
  qText:        { fontSize: 10, flex: 1 },
  blank:        { borderBottomWidth: 1, borderBottomColor: BORDER, height: 16, flex: 1, marginLeft: 4 },
  wordBank:     { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6, padding: 6, backgroundColor: LIGHT, borderRadius: 3 },
  wordBankItem: { fontSize: 9, color: INDIGO, borderWidth: 1, borderColor: "#C7D2FE", padding: "2 6", borderRadius: 3 },
  // Vocabulary table
  vocabRow:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 4, gap: 8 },
  vocabWord:    { fontSize: 10, fontWeight: "bold", color: DARK, width: 90 },
  vocabDef:     { fontSize: 10, flex: 1 },
  vocabEx:      { fontSize: 9, color: MUTED, flex: 1, fontStyle: "italic" },
  // Matching
  matchCol:     { flex: 1 },
  matchItem:    { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  matchLabel:   { fontSize: 10, width: 16, color: MUTED },
  matchText:    { fontSize: 10, flex: 1 },
  matchBox:     { width: 20, height: 16, borderWidth: 1, borderColor: BORDER, borderRadius: 2 },
  // Writing
  writingBox:   { borderWidth: 1, borderColor: BORDER, borderRadius: 3, height: 80, marginTop: 6, padding: 4 },
  guidanceItem: { fontSize: 9, color: MUTED, marginBottom: 2 },
  // MC
  optionRow:    { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  optionCircle: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: BORDER },
  // Footer
  footer:       { position: "absolute", bottom: 24, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between" },
  footerText:   { fontSize: 8, color: MUTED },
  pageNum:      { fontSize: 8, color: MUTED },
});

// ── Section renderers ────────────────────────────────────────────────────────

function SectionBlock({ section }: { section: WorksheetSection }) {
  const c = section.content as WorksheetSectionContent & Record<string, unknown>;

  let body: React.ReactNode = null;

  switch (section.type) {
    case "reading-passage": {
      const rc = c as { passage?: string; comprehensionQuestions?: { question: string }[] };
      body = (
        <>
          {rc.passage && <Text style={s.passage}>{rc.passage}</Text>}
          {(rc.comprehensionQuestions ?? []).map((q, i) => (
            <View key={i} style={s.questionRow}>
              <Text style={s.qNum}>{i + 1}.</Text>
              <Text style={s.qText}>{q.question}</Text>
              <View style={s.blank} />
            </View>
          ))}
        </>
      );
      break;
    }

    case "gap-fill": {
      const gc = c as { text?: string; wordBank?: string[] };
      body = (
        <>
          <Text style={{ fontSize: 10, lineHeight: 1.8, marginBottom: 4 }}>{gc.text}</Text>
          {gc.wordBank && gc.wordBank.length > 0 && (
            <View style={s.wordBank}>
              <Text style={{ fontSize: 9, color: MUTED, marginRight: 4 }}>Word bank:</Text>
              {gc.wordBank.map((w, i) => (
                <Text key={i} style={s.wordBankItem}>{w}</Text>
              ))}
            </View>
          )}
        </>
      );
      break;
    }

    case "vocabulary": {
      const vc = c as { words?: { word: string; definition?: string; example?: string }[] };
      body = (
        <>
          <View style={[s.vocabRow, { borderTopWidth: 1, borderTopColor: BORDER }]}>
            <Text style={[s.vocabWord, { color: MUTED, fontSize: 9 }]}>WORD</Text>
            <Text style={[s.vocabDef, { color: MUTED, fontSize: 9 }]}>DEFINITION</Text>
            <Text style={[s.vocabEx, { color: MUTED, fontSize: 9 }]}>EXAMPLE</Text>
          </View>
          {(vc.words ?? []).map((w, i) => (
            <View key={i} style={s.vocabRow}>
              <Text style={s.vocabWord}>{w.word}</Text>
              <Text style={s.vocabDef}>{w.definition ?? ""}</Text>
              <Text style={s.vocabEx}>{w.example ?? ""}</Text>
            </View>
          ))}
        </>
      );
      break;
    }

    case "multiple-choice": {
      const mc = c as { questions?: { question: string; options: string[] }[] };
      body = (
        <>
          {(mc.questions ?? []).map((q, qi) => (
            <View key={qi} style={{ marginBottom: 8 }}>
              <Text style={s.qText}>{qi + 1}. {q.question}</Text>
              {q.options.map((opt, oi) => (
                <View key={oi} style={s.optionRow}>
                  <View style={s.optionCircle} />
                  <Text style={{ fontSize: 10 }}>{String.fromCharCode(65 + oi)}. {opt}</Text>
                </View>
              ))}
            </View>
          ))}
        </>
      );
      break;
    }

    case "matching": {
      const mc = c as { leftItems?: string[]; rightItems?: string[] };
      const left = mc.leftItems ?? [];
      const right = mc.rightItems ?? [];
      body = (
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={s.matchCol}>
            <Text style={{ fontSize: 9, color: MUTED, marginBottom: 4, fontWeight: "bold" }}>Column A</Text>
            {left.map((item, i) => (
              <View key={i} style={s.matchItem}>
                <Text style={s.matchLabel}>{i + 1}.</Text>
                <Text style={s.matchText}>{item}</Text>
                <View style={s.matchBox} />
              </View>
            ))}
          </View>
          <View style={s.matchCol}>
            <Text style={{ fontSize: 9, color: MUTED, marginBottom: 4, fontWeight: "bold" }}>Column B</Text>
            {right.map((item, i) => (
              <View key={i} style={s.matchItem}>
                <Text style={s.matchLabel}>{String.fromCharCode(65 + i)}.</Text>
                <Text style={s.matchText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      );
      break;
    }

    case "writing-prompt": {
      const wc = c as { prompt?: string; minWords?: number; maxWords?: number; guidancePoints?: string[] };
      body = (
        <>
          <Text style={{ fontSize: 10, marginBottom: 6 }}>{wc.prompt}</Text>
          {wc.guidancePoints && wc.guidancePoints.length > 0 && (
            <View style={{ marginBottom: 4 }}>
              {wc.guidancePoints.map((p, i) => (
                <Text key={i} style={s.guidanceItem}>• {p}</Text>
              ))}
            </View>
          )}
          {(wc.minWords || wc.maxWords) && (
            <Text style={{ fontSize: 9, color: MUTED, marginBottom: 4 }}>
              ({wc.minWords ?? 0}–{wc.maxWords ?? "?"} words)
            </Text>
          )}
          <View style={s.writingBox} />
        </>
      );
      break;
    }

    case "ordering": {
      const oc = c as { items?: string[] };
      body = (
        <>
          {(oc.items ?? []).map((item, i) => (
            <View key={i} style={s.questionRow}>
              <View style={[s.matchBox, { marginRight: 6 }]} />
              <Text style={{ fontSize: 10, flex: 1 }}>{item}</Text>
            </View>
          ))}
        </>
      );
      break;
    }

    case "discussion": {
      const dc = c as { questions?: string[] };
      body = (
        <>
          {(dc.questions ?? []).map((q, i) => (
            <View key={i} style={s.questionRow}>
              <Text style={s.qNum}>{i + 1}.</Text>
              <Text style={s.qText}>{q}</Text>
            </View>
          ))}
        </>
      );
      break;
    }

    default: {
      const ic = c as { text?: string };
      body = <Text style={{ fontSize: 10 }}>{ic.text ?? ""}</Text>;
    }
  }

  return (
    <View style={s.section} wrap={false}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{section.title}</Text>
        {section.points !== undefined && (
          <Text style={s.sectionPoints}>[{section.points} pts]</Text>
        )}
      </View>
      {section.instructions && (
        <Text style={s.instructions}>{section.instructions}</Text>
      )}
      {body}
    </View>
  );
}

// ── Document root ────────────────────────────────────────────────────────────

interface WorksheetPdfProps {
  title: string;
  className: string;
  cefrLevel: string;
  lessonTitle: string;
  sections: WorksheetSection[];
}

export function WorksheetPdf({ title, className, cefrLevel, lessonTitle, sections }: WorksheetPdfProps) {
  return (
    <Document title={title} author="Modern Classroom">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header} fixed>
          <Text style={s.headerTitle}>{title}</Text>
          <Text style={s.headerSub}>
            {className} · {cefrLevel} · {lessonTitle}
          </Text>
          <View style={s.headerLine} />
        </View>

        {/* Name / Date line */}
        <View style={{ flexDirection: "row", gap: 24, marginBottom: 16 }}>
          {["Name", "Date", "Class"].map((label) => (
            <View key={label} style={{ flexDirection: "row", gap: 4, flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 9, color: MUTED }}>{label}:</Text>
              <View style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: BORDER, height: 14 }} />
            </View>
          ))}
        </View>

        {/* Sections */}
        {sections.map((section) => (
          <SectionBlock key={section.id} section={section} />
        ))}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Modern Classroom · {className}</Text>
          <Text
            style={s.pageNum}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
