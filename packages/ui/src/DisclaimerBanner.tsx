import React from 'react';
import { View, Text } from 'react-native';

export function DisclaimerBanner() {
  return (
    <View className="bg-warning-900/30 border border-warning-700/50 rounded-xl px-4 py-3 mb-4">
      <Text className="text-warning-400 text-xs leading-relaxed">
        ⚠️ This information is for harm reduction purposes only. It is not medical advice. Consult a
        healthcare professional before using any substance.
      </Text>
    </View>
  );
}
