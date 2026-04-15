import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { format } from 'date-fns';
import {
  getProtocolSeed,
  scaleDose,
  kgToLbs,
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

export default function CommunityThread() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const seed = slug ? getProtocolSeed(slug) : undefined;
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
  const scaledConsensus = weightKg != null && topSnap
    ? (topSnap.median_mcg_per_kg_per_week * weightKg) / (posts[0]?.doses_per_week ?? 1)
    : null;

  return (
    <>
      <Stack.Screen options={{ title: seed.name }} />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Consensus header */}
          <View className="bg-surface-card rounded-2xl p-4 mb-4 border border-surface-border">
            <Text className="text-slate-200 font-bold mb-1">{seed.name} — community consensus</Text>
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
                  No community data yet. Showing the trial-seeded starting point:
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

          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-3 items-center mb-4"
            onPress={() => router.push({ pathname: '/(tabs)/community/new', params: { slug } })}
          >
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
              onUpvote={() => handleVote(p.id, 1)}
              onDownvote={() => handleVote(p.id, -1)}
              onReport={() => handleReport(p.id)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </>
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
