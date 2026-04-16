import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { format } from 'date-fns';
import { Card, Badge } from '@peptpal/ui';
import { getBatch, parsePhotos, type BatchRow } from '../../../../src/db/batches';
import { getInventoryItems } from '../../../../src/db/inventory';
import { resolvePhotoUri } from '../../../../src/lib/photos';
import { PhotoViewerModal } from '../../../../src/components/PhotoViewerModal';
import type { InventoryItem } from '@peptpal/core';

export default function BatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [batch, setBatch] = useState<BatchRow | null>(null);
  const [vials, setVials] = useState<InventoryItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    const bid = parseInt(id, 10);
    void (async () => {
      const [b, inv] = await Promise.all([getBatch(bid), getInventoryItems()]);
      setBatch(b);
      setVials(inv.filter((i) => (i as InventoryItem & { batch_id?: number | null }).batch_id === bid));
    })();
  }, [id]);

  if (!batch) return null;
  const photos = parsePhotos(batch.photos_json);

  return (
    <>
      <Stack.Screen options={{ title: `Batch #${batch.id}` }} />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Card className="mb-4">
            <Text className="text-white font-bold text-lg mb-1">
              {batch.vendor ?? 'Unknown vendor'}
            </Text>
            <Text className="text-slate-400 text-xs">
              Received {format(new Date(batch.received_at), 'MMM d, yyyy')}
            </Text>
            {batch.notes && (
              <Text className="text-slate-300 text-xs mt-2 leading-5">{batch.notes}</Text>
            )}
            {photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                <View className="flex-row gap-2">
                  {photos.map((p, i) => (
                    <TouchableOpacity key={i} onPress={() => setViewerIndex(i)}>
                      <Image
                        source={{ uri: resolvePhotoUri(p) }}
                        style={{ width: 110, height: 110, borderRadius: 10 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
            <PhotoViewerModal
              visible={viewerIndex != null}
              photos={photos}
              initialIndex={viewerIndex ?? 0}
              onClose={() => setViewerIndex(null)}
            />
          </Card>

          <Text className="text-slate-200 font-bold mb-2">
            Vials in this batch ({vials.length})
          </Text>
          {vials.map((v) => {
            const labelNum = (v as InventoryItem & { label_number?: number | null }).label_number;
            return (
              <TouchableOpacity
                key={v.id}
                className="bg-surface-card rounded-xl p-3 mb-2 border border-surface-border"
                onPress={() => router.push(`/(tabs)/inventory/${v.id}`)}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-white font-semibold">
                      {v.peptide_name}{labelNum ? ` #${labelNum}` : ''}
                    </Text>
                    <Text className="text-slate-400 text-xs mt-0.5">
                      {v.vial_size_mg} mg · {v.reconstituted ? 'Reconstituted' : 'Sealed'}
                    </Text>
                  </View>
                  <Badge variant={v.reconstituted ? 'warning' : 'success'}>
                    {v.reconstituted ? 'Open' : 'Sealed'}
                  </Badge>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
