import { useMemo, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { SCENARIO_LABELS, SCENARIO_ORDER } from "../eventViewer/scenarios";
import type {
  ScenarioId,
  EventDetail,
  ViewerPresentation,
} from "../eventViewer/types";
import { useEventViewer } from "../eventViewer/useEventViewer";

const C = {
  bg: "#0c0c0f",
  surface: "#16161d",
  border: "#2a2a34",
  text: "#f4f4f6",
  muted: "#9898a8",
  accent: "#8b7cff",
  live: "#ff3d5c",
  ok: "#3ecf8e",
  warn: "#ffb020",
};

function formatStart(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateIso;
  }
}

type Props = {
  scenario: ScenarioId;
  onChangeScenario: (s: ScenarioId) => void;
};

export function EventViewerScreen({
  scenario,
  onChangeScenario,
}: Readonly<Props>) {
  const {
    presentation,
    refresh,
    isRefreshing,
    simulateOffline,
    setSimulateOffline,
    simulateFailedRefresh,
    isOnline,
  } = useEventViewer(scenario);

  const body = useMemo(
    () => <PresentationBody presentation={presentation} onRetry={refresh} />,
    [presentation, refresh],
  );

  /** Vertically center sparse states between header and dev tray; keep event detail top-aligned. */
  const centerScrollContent =
    presentation.kind === "loading" ||
    presentation.kind === "offline" ||
    presentation.kind === "request_failed";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>LIV DOT</Text>
        <View style={styles.headerSpacer} />
        {isRefreshing ? <ActivityIndicator color={C.accent} /> : null}
        {!isOnline || simulateOffline ? (
          <Text style={styles.offlinePill}>
            {simulateOffline ? "Offline (demo)" : "No network"}
          </Text>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          centerScrollContent && styles.scrollContentCentered,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={C.accent}
          />
        }
      >
        {body}
      </ScrollView>

      <View style={styles.devTray}>
        <Text style={styles.devTitle}>Assessment demo — pick a scenario</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {SCENARIO_ORDER.map((id) => (
            <Pressable
              key={id}
              onPress={() => onChangeScenario(id)}
              style={[styles.chip, scenario === id && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  scenario === id && styles.chipTextActive,
                ]}
              >
                {SCENARIO_LABELS[id]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.devRow}>
          <Text style={styles.devLabel}>Simulate device offline</Text>
          <Switch
            value={simulateOffline}
            onValueChange={setSimulateOffline}
            trackColor={{ false: "#333", true: C.accent }}
          />
        </View>
        <Pressable style={styles.failButton} onPress={simulateFailedRefresh}>
          <Text style={styles.failButtonText}>
            Force next refresh to fail (503)
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function PresentationBody({
  presentation,
  onRetry,
}: Readonly<{
  presentation: ViewerPresentation;
  onRetry: () => void;
}>) {
  switch (presentation.kind) {
    case "loading":
      return (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={styles.loadingText}>Loading event…</Text>
          <Text style={styles.hint}>
            Slow networks stay on this state; pull to refresh after loading.
          </Text>
        </View>
      );
    case "offline":
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>You are offline</Text>
          <Text style={styles.cardBody}>{presentation.message}</Text>
          <Pressable style={styles.primaryBtn} onPress={onRetry}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </Pressable>
        </View>
      );
    case "request_failed":
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Something went wrong</Text>
          <Text style={styles.cardBody}>{presentation.message}</Text>
          <Pressable style={styles.primaryBtn} onPress={onRetry}>
            <Text style={styles.primaryBtnText}>Try again</Text>
          </Pressable>
        </View>
      );
    case "need_purchase":
      return (
        <EventChrome event={presentation.event}>
          <View style={styles.bannerMuted}>
            <Text style={styles.bannerTitle}>Ticket required</Text>
            <Text style={styles.bannerBody}>
              Purchase access to unlock the stream and replay for this event.
            </Text>
          </View>
          <Pressable style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Get tickets</Text>
          </Pressable>
        </EventChrome>
      );
    case "verification_pending":
      return (
        <EventChrome event={presentation.event}>
          <View style={[styles.bannerMuted, styles.bannerPending]}>
            <Text style={styles.bannerTitle}>Confirming your access…</Text>
            <Text style={styles.bannerBody}>
              Payment is processing or your ticket is syncing. This usually
              takes a few seconds; we will enable playback automatically.
            </Text>
            <ActivityIndicator color={C.warn} style={{ marginTop: 12 }} />
          </View>
          <Pressable style={styles.secondaryBtn} onPress={onRetry}>
            <Text style={styles.secondaryBtnText}>Refresh status</Text>
          </Pressable>
        </EventChrome>
      );
    case "verification_failed":
      return (
        <EventChrome event={presentation.event}>
          <View style={styles.bannerWarn}>
            <Text style={styles.bannerTitle}>
              We could not verify your ticket
            </Text>
            <Text style={styles.bannerBody}>
              Your purchase may have failed or this account does not match the
              order. Check your email or try restoring purchases.
            </Text>
          </View>
          <Pressable style={styles.primaryBtn} onPress={onRetry}>
            <Text style={styles.primaryBtnText}>Retry verification</Text>
          </Pressable>
        </EventChrome>
      );
    case "upcoming":
      return (
        <EventChrome event={presentation.event}>
          <View style={styles.bannerMuted}>
            <Text style={styles.bannerTitle}>Event has not started</Text>
            <Text style={styles.bannerBody}>
              The broadcast begins at {formatStart(presentation.event.startsAt)}
              . You can wait here — we will notify you when doors open.
            </Text>
          </View>
        </EventChrome>
      );
    case "live_ready":
      return (
        <EventChrome event={presentation.event}>
          <View style={styles.player}>
            <View style={styles.liveBadgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.playerHint}>Playback area (demo)</Text>
            <Text style={styles.playerSub}>
              In production this mounts the player; here we only communicate
              that the stream is authorized and ready.
            </Text>
            <Pressable style={styles.playCircle}>
              <Text style={styles.playIcon}>▶</Text>
            </Pressable>
          </View>
        </EventChrome>
      );
    case "live_unavailable":
      return (
        <EventChrome event={presentation.event}>
          <View style={styles.bannerWarn}>
            <Text style={styles.bannerTitle}>Live video unavailable</Text>
            <Text style={styles.bannerBody}>{presentation.reason}</Text>
          </View>
          <Pressable style={styles.primaryBtn} onPress={onRetry}>
            <Text style={styles.primaryBtnText}>Check again</Text>
          </Pressable>
        </EventChrome>
      );
    case "replay":
      return (
        <EventChrome event={presentation.event}>
          <View style={styles.player}>
            <Text style={styles.replayLabel}>REPLAY</Text>
            <Text style={styles.playerHint}>Recorded event</Text>
            {presentation.event.playback.replayDurationLabel ? (
              <Text style={styles.duration}>
                Runtime {presentation.event.playback.replayDurationLabel}
              </Text>
            ) : null}
            <Pressable style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Watch replay</Text>
            </Pressable>
          </View>
        </EventChrome>
      );
    case "ended_no_replay":
      return (
        <EventChrome event={presentation.event}>
          <View style={styles.bannerMuted}>
            <Text style={styles.cardTitle}>Event has ended</Text>
            <Text style={styles.cardBody}>
              {presentation.event.playback.liveUnavailableReason ??
                "There is no replay available for this event."}
            </Text>
          </View>
        </EventChrome>
      );
    default:
      return null;
  }
}

function EventChrome({
  event,
  children,
}: Readonly<{ event: EventDetail; children: ReactNode }>) {
  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
        <Text style={styles.eventMeta}>{formatStart(event.startsAt)}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  brand: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
  headerSpacer: { flex: 1 },
  offlinePill: {
    marginLeft: 10,
    color: C.warn,
    fontSize: 12,
    fontWeight: "600",
  },
  scroll: { flex: 1, paddingTop: 40 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: "center",
  },
  centerBlock: {
    paddingVertical: 24,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: C.text,
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    marginTop: 8,
    color: C.muted,
    fontSize: 13,
    textAlign: "center",
    maxWidth: 280,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardBody: {
    color: C.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  hero: {
    marginBottom: 20,
  },
  eventTitle: {
    color: C.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  eventSubtitle: {
    color: C.muted,
    fontSize: 16,
    marginBottom: 8,
  },
  eventMeta: {
    color: C.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  bannerMuted: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  bannerPending: {
    borderColor: "rgba(255,176,32,0.35)",
  },
  bannerWarn: {
    backgroundColor: "rgba(255,61,92,0.12)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,61,92,0.35)",
    marginBottom: 16,
  },
  bannerTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  bannerBody: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  primaryBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  secondaryBtnText: {
    color: C.text,
    fontSize: 15,
    fontWeight: "600",
  },
  player: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginBottom: 12,
  },
  liveBadgeRow: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.live,
  },
  liveText: {
    color: C.live,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  playerHint: {
    color: C.text,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  playerSub: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 260,
  },
  playCircle: {
    marginTop: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { color: C.text, fontSize: 22, marginLeft: 4 },
  replayLabel: {
    color: C.ok,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  duration: {
    color: C.muted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  devTray: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: "#08080a",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  devTitle: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chipsRow: {
    gap: 8,
    paddingBottom: 12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    borderColor: C.accent,
    backgroundColor: "rgba(139,124,255,0.2)",
  },
  chipText: { color: C.muted, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: C.text },
  devRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  devLabel: { color: C.muted, fontSize: 14 },
  failButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255,61,92,0.15)",
  },
  failButtonText: {
    color: C.live,
    fontSize: 13,
    fontWeight: "700",
  },
});
