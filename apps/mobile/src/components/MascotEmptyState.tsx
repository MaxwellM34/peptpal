/**
 * Empty-state component with the PeptPal mascot. Use anywhere a screen
 * has nothing to render — gives users a visual + a hint of what to do.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { PeptPalMascot } from './PeptPalMascot';

export function MascotEmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 }}>
      <PeptPalMascot size={120} />
      <Text style={{ color: '#f1f5f9', fontWeight: '700', fontSize: 16, marginTop: 12, textAlign: 'center' }}>
        {title}
      </Text>
      <Text
        style={{
          color: '#94a3b8',
          fontSize: 12,
          marginTop: 6,
          textAlign: 'center',
          lineHeight: 18,
          maxWidth: 280,
        }}
      >
        {body}
      </Text>
    </View>
  );
}
