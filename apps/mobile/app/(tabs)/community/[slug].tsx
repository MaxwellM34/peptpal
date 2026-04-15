import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { format } from 'date-fns';
import {
  getProtocolSeed,
  scaleDose,
  kgToLbs,
  PERSONAS,
  PERSONA_ORDER,
  getExternalProtocol,
  TIER_DEFINITIONS,
  type PersonaKey,
  type ExternalProtocol,
} from '@peptpal/core';
import {
  listDoseLogPosts,
  getConsensus,
  voteOnPost,
  reportPost,
  type DoseLogPostOut,
  type ConsensusSnapshotOut,
} from '../../../src/api/client';
import { getUserProfile } from '../../../src/db/profile';
import { getClientUuid } from '../../../src/lib/clientId';

type Tab = 'internal' | 'external';

export default function CommunityThread() {
  const { slug, tab } = useLocalSearchParams<{ slug: string; tab?: string }>();
  const router = useRouter();
  const seed = slug ? getProtocolSeed(slug) : undefined;

  const [activeTab, setActiveTab] = useState<Tab>((tab as Tab) === 'external' ? 'external' : 'internal');
  const [persona, setPersona] = useState<PersonaKey>('health_optimizer');

  const [posts, setPosts] = useState<DoseLogPostOut[]>([]);
  const [consensus, setConsensus] = useState<ConsensusSnapshotOut[]>([]);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await getUserProfile();
      const w = profile?.weight_kg ?? null;
      setWeightKg(w);
      if (profile?.activity_level && (profile.activity_level as PersonaKey) in PERSONAS) {
        setPersona(profile.activity_level as PersonaKey);
      }
      const [p, c] = await Promise.all([
        listDoseLogPosts(slug),
        getConsensus(slug, w ?? undefined),
      ]);
      setPosts(p);
      setConsensus(c);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { void load(); }, [load]);

  async function handleVote(post_id: number, value: 1 | -1) {
    try {
      const uuid = await getClientUuid();
      await voteOnPost(post_id, uuid, value);
      await load();
    } catch (e) {
      Alert.alert('Vote failed', String(e));
    }
  }

  async function handleReport(post_id: number) {
    Alert.alert('Report post', 'Why are you reporting this?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Vendor shilling', onPress: () => sendReport(post_id, 'vendor') },
      { text: 'Dangerous dose', onPress: () => sendReport(post_id, 'dangerous') },
      { text: 'Spam', onPress: () => sendReport(post_id, 'spam') },
    ]);
  }

  async function sendReport(post_id: number, reason: string) {
    const uuid = await getClientUuid();
    await reportPost(post_id, uuid, reason);
    await load();
  }

  if (!seed) return null;

  const topSnap = consensus[0];

  return (
    <>
      <Stack.Screen options={{ title: seed.name }} />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Tab switcher */}
          <View className="flex-row bg-surface-card rounded-xl p-1 mb-4 border border-surface-border">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'internal' ? 'bg-primary-600' : ''}`}
              onPress={() => setActiveTab('internal')}
            >
              <Text className={`text-xs font-semibold ${activeTab === 'internal' ? 'text-white' : 'text-slate-400'}`}>
                💬 PeptPal ({posts.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'external' ? 'bg-primary-600' : ''}`}
              onPress={() => setActiveTab('external')}
            >
              <Text className={`text-xs font-semibold ${activeTab === 'external' ? 'text-white' : 'text-slate-400'}`}>
                🌐 Wider Web
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'internal' ? (
            <InternalTab
              seed={seed}
              topSnap={topSnap}
              weightKg={weightKg}
              posts={posts}
              loading={loading}
              error={error}
              onUpvote={(id) => handleVote(id, 1)}
              onDownvote={(id) => handleVote(id, -1)}
              onReport={handleReport}
              onShare={() => router.push({ pathname: '/(tabs)/community/new', params: { slug } })}
            />
          ) : (
            <ExternalTab
              slug={slug!}
              persona={persona}
              onPersonaChange={setPersona}
              weightKg={weightKg}
              seedName={seed.name}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function InternalTab({
  seed,
  topSnap,
  weightKg,
  posts,
  loading,
  error,
  onUpvote,
  onDownvote,
  onReport,
  onShare,
}: {
  seed: ReturnType<typeof getProtocolSeed>;
  topSnap: ConsensusSnapshotOut | undefined;
  weightKg: number | null;
  posts: DoseLogPostOut[];
  loading: boolean;
  error: string | null;
  onUpvote: (id: number) => void;
  onDownvote: (id: number) => void;
  onReport: (id: number) => void;
  onShare: () => void;
}) {
  if (!seed) return null;
  const scaledConsensus = weightKg != null && topSnap
    ? (topSnap.median_mcg_per_kg_per_week * weightKg) / (posts[0]?.doses_per_week ?? 1)
    : null;

  return (
    <>
      <View className="bg-surface-card rounded-2xl p-4 mb-4 border border-surface-border">
        <Text className="text-slate-200 font-bold mb-1">{seed.name} — PeptPal consensus</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 16 }} />
        ) : topSnap ? (
          <>
            <View className="flex-row gap-3 mt-2">
              <Stat label="Median" value={`${topSnap.median_mcg_per_kg_per_week.toFixed(2)} mcg/kg/wk`} />
              <Stat label="P25–P75" value={`${topSnap.p25_mcg_per_kg_per_week.toFixed(1)}–${topSnap.p75_mcg_per_kg_per_week.toFixed(1)}`} />
              <Stat label="n" value={String(topSnap.n_posts)} />
            </View>
            {scaledConsensus != null && (
              <Text className="text-slate-300 text-xs mt-3 leading-5">
                Scaled to your weight: <Text className="text-primary-400 font-bold">
                  ~{Math.round(scaledConsensus)} mcg
                </Text> per dose.
              </Text>
            )}
            {topSnap.low_confidence && (
              <Text className="text-amber-400 text-[10px] mt-2">⚠ n&lt;5 — low confidence consensus.</Text>
            )}
            {topSnap.minority_protocols.length > 0 && (
              <View className="mt-3 pt-3 border-t border-surface-border">
                <Text className="text-slate-400 text-[10px] uppercase font-semibold mb-1">Dissenting protocols</Text>
                {topSnap.minority_protocols.map((m, i) => (
                  <Text key={i} className="text-slate-300 text-xs mb-1">
                    • <Text className="capitalize">{m.label}</Text>: {m.median_mcg_per_kg_per_week.toFixed(2)} mcg/kg/wk
                    ({Math.round(m.weight_share * 100)}% · n={m.n})
                  </Text>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <Text className="text-slate-400 text-sm mt-2">
              No PeptPal data yet. Showing the trial-seeded starting point:
            </Text>
            {weightKg != null ? (
              <Text className="text-primary-400 text-base font-bold mt-1">
                ~{Math.round(scaleDose(seed.startingDose, { weightKg }).scaledDoseMcg)} mcg · {seed.startingDose.frequency}
              </Text>
            ) : (
              <Text className="text-primary-400 text-base font-bold mt-1">
                {seed.startingDose.doseMcg} mcg · {seed.startingDose.frequency}
              </Text>
            )}
          </>
        )}
      </View>

      <TouchableOpacity className="bg-primary-600 rounded-xl py-3 items-center mb-4" onPress={onShare}>
        <Text className="text-white font-bold">+ Share Your Protocol</Text>
      </TouchableOpacity>

      {error && (
        <View className="bg-red-900/30 border border-red-800 rounded-xl p-3 mb-4">
          <Text className="text-red-300 text-xs">{error}</Text>
        </View>
      )}

      <Text className="text-slate-200 font-bold mb-2">Recent dose logs</Text>

      {posts.length === 0 && !loading && (
        <View className="bg-surface-card rounded-2xl p-6 items-center">
          <Text className="text-slate-400 text-sm">No posts yet.</Text>
          <Text className="text-slate-500 text-xs mt-1">Be the first to share.</Text>
        </View>
      )}

      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          onUpvote={() => onUpvote(p.id)}
          onDownvote={() => onDownvote(p.id)}
          onReport={() => onReport(p.id)}
        />
      ))}
    </>
  );
}

function ExternalTab({
  slug,
  persona,
  onPersonaChange,
  weightKg,
  seedName,
}: {
  slug: string;
  persona: PersonaKey;
  onPersonaChange: (k: PersonaKey) => void;
  weightKg: number | null;
  seedName: string;
}) {
  const ext = getExternalProtocol(slug, persona);
  const p = PERSONAS[persona];

  return (
    <>
      <Text className="text-slate-300 text-xs font-medium mb-2">Show protocol for:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2">
          {PERSONA_ORDER.map((k) => {
            const pp = PERSONAS[k];
            const active = persona === k;
            return (
              <TouchableOpacity
                key={k}
                className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1 ${
                  active
                    ? 'bg-primary-600 border-primary-500'
                    : 'bg-surface-elevated border-surface-border'
                }`}
                onPress={() => onPersonaChange(k)}
              >
                <Text style={{ fontSize: 12 }}>{pp.emoji}</Text>
                <Text className={`text-[11px] font-medium ${active ? 'text-white' : 'text-slate-300'}`}>
                  {pp.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="bg-surface-card rounded-2xl p-4 mb-4 border border-surface-border">
        <View className="flex-row items-center gap-2 mb-2">
          <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
          <Text className="text-white font-bold text-base flex-1">{p.label}</Text>
        </View>
        <Text className="text-slate-400 text-xs leading-5 mb-3">{p.philosophy}</Text>
      </View>

      {!ext && (
        <View className="bg-surface-card rounded-2xl p-6 items-center border border-surface-border">
          <Text className="text-slate-400 text-sm">No aggregated data for {seedName} + {p.label}.</Text>
          <Text className="text-slate-500 text-xs mt-1 text-center">
            Research is ongoing — external consensus seeds are being added incrementally.
          </Text>
        </View>
      )}

      {ext && ext.avoidReason && (
        <View className="bg-red-900/20 border border-red-800 rounded-2xl p-4 mb-4">
          <Text className="text-red-300 font-bold text-sm mb-1">⛔ Not recommended for this persona</Text>
          <Text className="text-red-200/80 text-xs leading-5">{ext.avoidReason}</Text>
        </View>
      )}

      {ext && !ext.avoidReason && (
        <ExternalProtocolCard ext={ext} weightKg={weightKg} />
      )}
    </>
  );
}

function ExternalProtocolCard({ ext, weightKg }: { ext: ExternalProtocol; weightKg: number | null }) {
  return (
    <View className="bg-surface-card rounded-2xl p-4 mb-4 border border-surface-border">
      <Text className="text-slate-200 font-bold mb-3">Community-reported protocol</Text>

      <View className="flex-row gap-3 mb-4">
        <Stat label="Starting" value={`${ext.doseMcgLow ?? '—'} mcg`} />
        <Stat label="Typical high" value={`${ext.doseMcgHigh ?? '—'} mcg`} />
        <Stat label="Freq" value={`${ext.dosesPerWeek ?? '—'}×/wk`} />
        {ext.cycleWeeks != null && <Stat label="Cycle" value={`${ext.cycleWeeks}wk`} />}
      </View>

      <Text className="text-slate-300 text-xs leading-5 mb-3">{ext.rationale}</Text>

      {weightKg != null && ext.doseMcgLow != null && ext.doseMcgHigh != null && (
        <View className="bg-primary-900/20 border border-primary-800 rounded-xl p-3 mb-3">
          <Text className="text-primary-300 text-[10px] uppercase font-semibold mb-1">At your weight</Text>
          <Text className="text-white text-sm font-semibold">
            Proportional range: {Math.round((ext.doseMcgLow * weightKg) / 80)}–
            {Math.round((ext.doseMcgHigh * weightKg) / 80)} mcg
          </Text>
          <Text className="text-slate-500 text-[10px] mt-1">
            (linearly scaled from typical 80 kg user)
          </Text>
        </View>
      )}

      <View className="border-t border-surface-border pt-3 mt-1">
        <Text className="text-slate-400 text-[10px] uppercase font-semibold mb-2">Sources</Text>
        {ext.sources.map((s, i) => {
          const tierDef = TIER_DEFINITIONS[s.tier];
          return (
            <TouchableOpacity
              key={i}
              disabled={!s.url}
              onPress={() => s.url && Linking.openURL(s.url)}
              className="flex-row items-start gap-2 mb-2"
            >
              <View className="bg-primary-900/40 border border-primary-800 rounded-full px-2 py-0.5 mt-0.5">
                <Text className="text-primary-300 text-[9px] font-semibold">Tier {s.tier}</Text>
              </View>
              <View className="flex-1">
                <Text className={`text-xs ${s.url ? 'text-primary-400' : 'text-slate-300'}`}>
                  {s.title}
                </Text>
                <Text className="text-slate-500 text-[10px]">{tierDef.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="text-slate-500 text-[10px] uppercase font-semibold">{label}</Text>
      <Text className="text-white font-bold text-sm">{value}</Text>
    </View>
  );
}

function PostCard({
  post,
  onUpvote,
  onDownvote,
  onReport,
}: {
  post: DoseLogPostOut;
  onUpvote: () => void;
  onDownvote: () => void;
  onReport: () => void;
}) {
  const evidenceBadges: string[] = [];
  if (post.bloodwork_attached) evidenceBadges.push('🩸 Bloodwork');
  if (post.body_composition_attached) evidenceBadges.push('📏 Body comp');
  if (post.batch_info_attached) evidenceBadges.push('🏷 Batch');
  if (post.longitudinal) evidenceBadges.push('📅 60+ days');

  const score = post.upvotes - post.downvotes;

  return (
    <View className="bg-surface-card rounded-2xl p-4 mb-3 border border-surface-border">
      <View className="flex-row justify-between mb-1">
        <Text className="text-slate-400 text-xs">
          {post.user_handle ?? 'anonymous'} · {Math.round(kgToLbs(post.user_weight_kg))} lb
        </Text>
        <Text className="text-slate-500 text-[10px]">
          {format(new Date(post.created_at), 'MMM d')}
        </Text>
      </View>
      <Text className="text-white text-base font-bold mb-1">
        {post.dose_mcg} mcg · {post.doses_per_week}×/wk
        {post.weeks_on ? ` · ${post.weeks_on} wk on` : ''}
      </Text>
      <Text className="text-slate-400 text-xs capitalize mb-2">{post.goal.replace(/_/g, ' ')}</Text>

      {evidenceBadges.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mb-2">
          {evidenceBadges.map((b) => (
            <View key={b} className="bg-emerald-900/30 border border-emerald-800 rounded-full px-2 py-0.5">
              <Text className="text-emerald-300 text-[10px]">{b}</Text>
            </View>
          ))}
        </View>
      )}

      {post.outcome_score != null && (
        <Text className="text-slate-300 text-xs mb-1">
          Outcome: {['Worse', 'Slightly worse', 'No change', 'Improved', 'Strong improvement'][post.outcome_score + 2]}
        </Text>
      )}
      {post.side_effect_severity != null && post.side_effect_severity > 0 && (
        <Text className="text-amber-400 text-xs mb-1">
          Side effects: {post.side_effect_severity}/10
        </Text>
      )}

      {post.body && <Text className="text-slate-300 text-xs leading-5 mt-2">{post.body}</Text>}

      {post.vendor_flagged && (
        <View className="bg-red-900/30 border border-red-800 rounded-lg p-2 mt-2">
          <Text className="text-red-300 text-[10px]">⚠ Flagged as vendor content — excluded from consensus.</Text>
        </View>
      )}

      <View className="flex-row items-center gap-3 mt-3 pt-3 border-t border-surface-border">
        <TouchableOpacity onPress={onUpvote} className="flex-row items-center gap-1">
          <Text className="text-slate-300 text-xs">▲</Text>
          <Text className="text-slate-300 text-xs">{post.upvotes}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDownvote} className="flex-row items-center gap-1">
          <Text className="text-slate-500 text-xs">▼</Text>
          <Text className="text-slate-500 text-xs">{post.downvotes}</Text>
        </TouchableOpacity>
        <Text className="text-slate-400 text-xs ml-2">{score > 0 ? `+${score}` : score}</Text>
        <TouchableOpacity onPress={onReport} className="ml-auto">
          <Text className="text-slate-500 text-xs">Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
