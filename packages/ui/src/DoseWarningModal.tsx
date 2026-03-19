import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';

interface DoseWarningModalProps {
  visible: boolean;
  peptideName: string;
  doseMcg: number;
  maxDoseMcg: number;
  percentOfMax: number;
  onAcknowledge: () => void;
  onCancel: () => void;
}

export function DoseWarningModal({
  visible,
  peptideName,
  doseMcg,
  maxDoseMcg,
  percentOfMax,
  onAcknowledge,
  onCancel,
}: DoseWarningModalProps) {
  const [checked, setChecked] = useState(false);

  return (
    <Modal title="⚠️ Dose Warning" visible={visible} unclosable>
      <View className="gap-4">
        <View className="bg-danger-900/40 border border-danger-700 rounded-xl p-4">
          <Text className="text-danger-400 font-bold text-base mb-1">
            Dose exceeds reference maximum
          </Text>
          <Text className="text-slate-300 text-sm leading-relaxed">
            The entered dose of{' '}
            <Text className="text-white font-bold">{doseMcg} mcg</Text> for{' '}
            <Text className="text-white font-bold">{peptideName}</Text> is{' '}
            <Text className="text-danger-400 font-bold">{percentOfMax.toFixed(0)}%</Text> of the
            documented maximum ({maxDoseMcg} mcg).
          </Text>
        </View>

        <Text className="text-slate-400 text-sm leading-relaxed">
          This information is for harm reduction purposes only. Reference maximums are community-sourced
          and not medical guidance. Exceeding them may carry unknown risks.
        </Text>

        <TouchableOpacity
          className="flex-row items-start gap-3 p-3 bg-surface-elevated rounded-xl"
          onPress={() => setChecked(!checked)}
          activeOpacity={0.8}
        >
          <View
            className={`w-5 h-5 rounded border-2 mt-0.5 items-center justify-center flex-shrink-0 ${
              checked ? 'bg-danger-600 border-danger-600' : 'border-surface-border'
            }`}
          >
            {checked && <Text className="text-white text-xs font-bold">✓</Text>}
          </View>
          <Text className="text-slate-300 text-sm flex-1 leading-relaxed">
            I understand this dose exceeds the documented maximum. I take full responsibility for this decision.
          </Text>
        </TouchableOpacity>

        <View className="flex-row gap-3">
          <Button variant="secondary" className="flex-1" onPress={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            disabled={!checked}
            onPress={onAcknowledge}
          >
            Log Anyway
          </Button>
        </View>
      </View>
    </Modal>
  );
}
