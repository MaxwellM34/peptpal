import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  type ModalProps as RNModalProps,
} from 'react-native';

interface ModalProps extends RNModalProps {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  /** If true, tapping the backdrop does not close the modal */
  unclosable?: boolean;
}

export function Modal({ title, onClose, children, unclosable = false, ...props }: ModalProps) {
  return (
    <RNModal transparent animationType="fade" statusBarTranslucent {...props}>
      <TouchableOpacity
        className="flex-1 bg-black/70 items-center justify-center px-4"
        activeOpacity={1}
        onPress={unclosable ? undefined : onClose}
      >
        <TouchableOpacity activeOpacity={1} className="w-full max-w-sm">
          <View className="bg-surface-card rounded-2xl overflow-hidden">
            <View className="px-5 py-4 border-b border-surface-border">
              <Text className="text-white text-lg font-bold">{title}</Text>
            </View>
            <View className="p-5">{children}</View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
}
