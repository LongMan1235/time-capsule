import { Image } from "expo-image";
import { Search } from "lucide-react-native";
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
  "Toronto trip"
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
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <Stagger delay={80}>
              <Text style={styles.eyebrow}>SEARCH</Text>
            </Stagger>
            <Stagger delay={180}>
              <Text style={styles.title}>Find a memory.</Text>
            </Stagger>
            <Stagger delay={300}>
              <View style={styles.searchBox}>
                <Search color={colors.muted} size={16} />
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
              </View>
            </Stagger>
            <Stagger delay={420}>
              <View style={styles.examples}>
                {examples.map((example) => (
                  <AnimatedPressable key={example} style={styles.chip} onPress={() => search(example)}>
                    <Text style={styles.chipText}>{example}</Text>
                  </AnimatedPressable>
                ))}
              </View>
            </Stagger>
            {results.length > 0 ? (
              <Text style={styles.resultsLabel}>{results.length} {results.length === 1 ? "match" : "matches"}</Text>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <Stagger delay={60 + index * 50}>
            <View style={styles.result}>
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" transition={300} />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailFallback]} />
              )}
              <View style={styles.resultBody}>
                <Text style={styles.resultTitle}>{item.caption ?? item.reason}</Text>
                <Text style={styles.resultMeta}>{Math.round(item.score * 100)}% · {item.reason}</Text>
              </View>
            </View>
          </Stagger>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 140, gap: 10 },
  eyebrow: { ...type.micro, color: colors.muted },
  title: { ...type.hero, color: colors.fog },
  searchBox: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14
  },
  input: { ...type.body, color: colors.fog, flex: 1 },
  examples: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card
  },
  chipText: { ...type.caption, color: colors.fog },
  resultsLabel: { ...type.micro, color: colors.muted, marginTop: 12 },
  result: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8
  },
  thumbnail: { width: 56, height: 56, borderRadius: radii.sm, backgroundColor: colors.dusk },
  thumbnailFallback: {},
  resultBody: { flex: 1, gap: 4, justifyContent: "center" },
  resultTitle: { ...type.body, color: colors.fog, fontWeight: "600" },
  resultMeta: { ...type.caption, color: colors.muted }
});
