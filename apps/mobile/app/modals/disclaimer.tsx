import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Modal } from '@peptpal/ui';
import { Button } from '@peptpal/ui';

interface DisclaimerModalProps {
  visible: boolean;
  onAcknowledge: () => void;
}

export function DisclaimerModal({ visible, onAcknowledge }: DisclaimerModalProps) {
  const [checked, setChecked] = useState(false);

  return (
    <Modal title="Welcome to PeptPal" visible={visible} unclosable>
      <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          <View className="bg-warning-900/30 border border-warning-700/50 rounded-xl p-4">
            <Text className="text-warning-400 font-bold text-base mb-2">
              Important Disclaimer
            </Text>
            <Text className="text-slate-300 text-sm leading-relaxed">
              PeptPal is a personal tracking tool for harm reduction purposes only. It does not
              provide medical advice. All reference data is community-sourced and informational.
            </Text>
          </View>

          <Text className="text-slate-300 text-sm leading-relaxed">
            Always consult a qualified healthcare professional before using any substance. Use of
            peptides may be illegal in your jurisdiction.
          </Text>

          <Text className="text-slate-400 text-sm leading-relaxed">
            This app stores all personal tracking data locally on your device. No data is ever sent
            to our servers. See the Privacy Policy in Settings for details.
          </Text>

          <TouchableOpacity
            className="flex-row items-start gap-3 p-3 bg-surface-elevated rounded-xl"
            onPress={() => setChecked(!checked)}
            activeOpacity={0.8}
          >
            <View
              className={`w-5 h-5 rounded border-2 mt-0.5 items-center justify-center flex-shrink-0 ${
                checked ? 'bg-primary-600 border-primary-600' : 'border-surface-border'
              }`}
            >
              {checked && <Text className="text-white text-xs font-bold">✓</Text>}
            </View>
            <Text className="text-slate-300 text-sm flex-1 leading-relaxed">
              I understand that PeptPal does not provide medical advice, and I take full
              responsibility for any substances I choose to use.
            </Text>
          </TouchableOpacity>

          <Button disabled={!checked} onPress={onAcknowledge} size="lg">
            I Understand — Continue
          </Button>
        </View>
      </ScrollView>
    </Modal>
  );
}

export default DisclaimerModal;
