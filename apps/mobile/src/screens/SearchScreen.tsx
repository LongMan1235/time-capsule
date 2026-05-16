import { Image } from "expo-image";
import { Search, Sparkles, Wand2 } from "lucide-react-native";
import { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import type { MemorySearchResult } from "@time-capsule/shared";
import { api } from "../api/client";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { Screen } from "../components/Screen";
import { Stagger } from "../components/Stagger";
import { colors, radii, type } from "../design/theme";

const examples = [
  "Photos of me and Amal",
  "Nighttime party photos",
  "Snowboarding videos",
  "Toronto trip",
  "Pictures with four people",
  "When everyone is smiling"
];

export function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemorySearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(text = query) {
    setQuery(text);
    if (!text.trim()) return;
    setLoading(true);
    try {
      const response = await api<{ results: MemorySearchResult[] }>("/search", { method: "POST", body: JSON.stringify({ query: text }) });
      setResults(response.results);
    } catch (error) {
      Alert.alert("Search needs setup", error instanceof Error ? error.message : "Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <FlatList
        data={results}
        keyExtractor={(item) => item.mediaId}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <Stagger delay={80}>
              <Text style={styles.eyebrow}>SMART SEARCH</Text>
            </Stagger>
            <Stagger delay={180}>
              <Text style={styles.title}>Find the memory{"\n"}you almost forgot.</Text>
            </Stagger>
            <Stagger delay={300}>
              <View style={styles.searchBox}>
                <Search color={colors.gold} size={18} />
                <TextInput
                  style={styles.input}
                  placeholder="Ask for a memory…"
                  placeholderTextColor={colors.mutedDim}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={() => search()}
                  selectionColor={colors.gold}
                  returnKeyType="search"
                />
                {loading ? <Wand2 color={colors.gold} size={16} /> : null}
              </View>
            </Stagger>
            <Stagger delay={420}>
              <Text style={styles.suggestLabel}>Try one of these</Text>
            </Stagger>
            <Stagger delay={520}>
              <View style={styles.examples}>
                {examples.map((example, index) => (
                  <AnimatedPressable
                    key={example}
                    style={[styles.chip, index % 2 === 0 ? styles.chipAlt : null]}
                    onPress={() => search(example)}
                  >
                    <Sparkles color={index % 2 === 0 ? colors.gold : colors.fog} size={12} />
                    <Text style={[styles.chipText, index % 2 === 0 ? styles.chipTextAccent : null]}>{example}</Text>
                  </AnimatedPressable>
                ))}
              </View>
            </Stagger>
            {results.length > 0 ? (
              <Stagger delay={120}>
                <Text style={styles.resultsLabel}>{results.length} {results.length === 1 ? "match" : "matches"}</Text>
              </Stagger>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <Stagger delay={80 + index * 60}>
            <View style={styles.result}>
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" transition={300} />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailFallback]}>
                  <Sparkles color={colors.gold} size={18} />
                </View>
              )}
              <View style={styles.resultBody}>
                <Text style={styles.resultTitle}>{item.caption ?? item.reason}</Text>
                <View style={styles.resultMetaRow}>
                  <View style={styles.scoreDot} />
                  <Text style={styles.resultMeta}>{Math.round(item.score * 100)}% match · {item.reason}</Text>
                </View>
              </View>
            </View>
          </Stagger>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 140, gap: 12 },
  eyebrow: { ...type.micro, color: colors.gold },
  title: { ...type.hero, color: colors.fog },
  searchBox: {
    minHeight: 58,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineBright,
    backgroundColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16
  },
  input: { ...type.subtitle, color: colors.fog, flex: 1 },
  suggestLabel: { ...type.micro, color: colors.muted },
  examples: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  chipAlt: { borderColor: "rgba(232,194,107,0.32)", backgroundColor: "rgba(232,194,107,0.08)" },
  chipText: { ...type.caption, color: colors.fog, fontWeight: "700" },
  chipTextAccent: { color: colors.gold },
  resultsLabel: { ...type.micro, color: colors.muted, marginTop: 12 },
  result: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10
  },
  thumbnail: { width: 64, height: 64, borderRadius: radii.sm, backgroundColor: colors.dusk },
  thumbnailFallback: { alignItems: "center", justifyContent: "center" },
  resultBody: { flex: 1, gap: 6, justifyContent: "center" },
  resultTitle: { ...type.subtitle, color: colors.fog, fontWeight: "700" },
  resultMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  scoreDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  resultMeta: { ...type.caption, color: colors.muted }
});
