/**
 * Full-screen photo viewer with horizontal paging.
 * Tap to dismiss; swipe to navigate when multiple photos are passed.
 */
import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  StyleSheet,
} from 'react-native';
import { resolvePhotoUri } from '../lib/photos';

export function PhotoViewerModal({
  visible,
  photos,
  initialIndex = 0,
  onClose,
}: {
  visible: boolean;
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const { width, height } = Dimensions.get('window');
  const listRef = useRef<FlatList<string>>(null);
  const [index, setIndex] = useState(initialIndex);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <FlatList
          ref={listRef}
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => `${i}-${item}`}
          onMomentumScrollEnd={(e) => {
            setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ width, height }}>
              <Image
                source={{ uri: resolvePhotoUri(item) }}
                style={{ width, height }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        />
        <View style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.counter}>
            {index + 1} / {photos.length}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: 'white', fontSize: 22, fontWeight: '700' },
  counter: { color: 'white', fontSize: 13, fontWeight: '600' },
});
