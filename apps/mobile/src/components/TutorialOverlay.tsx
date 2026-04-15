/**
 * Overlay that renders on top of the whole app when the tutorial is active.
 *
 * Visual layout:
 *   ┌──────────────────────────────────────────┐
 *   │        (dim surface, blocks taps)        │
 *   │                                          │
 *   │     ┌────────┐  ← spotlight cutout       │
 *   │     │ target │     (taps pass through)   │
 *   │     └────────┘                           │
 *   │                                          │
 *   │     [ 🧑 mascot + speech bubble ]        │
 *   │                                          │
 *   │     [ Skip ]           [ Next ]          │
 *   └──────────────────────────────────────────┘
 *
 * The cutout is rendered using four dim rectangles (top/bottom/left/right of
 * the hotspot). The hotspot region itself is a transparent touchable that
 * hands the real user's tap to the spotlighted UI element + advances the
 * tutorial. This avoids expensive mask operations while still blocking taps
 * everywhere except the spotlight.
 *
 * If the current step has `hotspotId: null`, the mascot floats centered and
 * the whole screen is dimmed (intro / outro steps).
 */
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { PeptPalMascot, SpeechBubble } from './PeptPalMascot';
import { useTutorial } from '../lib/tutorialContext';
import { markTutorialComplete } from '../db/tutorial';

const DIM = 'rgba(2, 6, 23, 0.82)';
const PAD = 8; // spotlight padding around the hotspot

export function TutorialOverlay() {
  const { active, currentStep, hotspots, next, skip, stepIndex } = useTutorial();
  const router = useRouter();
  const pathname = usePathname();
  const { width: screenW, height: screenH } = Dimensions.get('window');

  // Persist completion on skip / finish.
  useEffect(() => {
    if (!active && stepIndex > 0) {
      void markTutorialComplete();
    }
  }, [active, stepIndex]);

  // Auto-navigate if the step specifies an expectedRoute that we're not on.
  useEffect(() => {
    if (!active || !currentStep?.expectedRoute) return;
    if (pathname !== currentStep.expectedRoute) {
      try {
        router.push(currentStep.expectedRoute as never);
      } catch {
        // non-fatal; user can navigate manually
      }
    }
  }, [active, currentStep, pathname, router]);

  if (!active || !currentStep) return null;

  const hotspot = currentStep.hotspotId ? hotspots.get(currentStep.hotspotId) : null;

  // If the step needs a hotspot we can't find (screen not mounted, layout not
  // yet measured, etc), fall back to a centered mascot — don't block the
  // whole screen. The user can still see the app through the dim layer and
  // advance past the step.
  const spot = hotspot
    ? {
        x: Math.max(0, hotspot.x - PAD),
        y: Math.max(0, hotspot.y - PAD),
        w: hotspot.width + PAD * 2,
        h: hotspot.height + PAD * 2,
      }
    : null;

  // Mascot + bubble positioning relative to the hotspot.
  const mascotTopAreaBelow = spot
    ? spot.y + spot.h + 12 < screenH - 200
    : false;
  const mascotTop = spot
    ? currentStep.mascotPosition === 'above' || !mascotTopAreaBelow
      ? Math.max(60, spot.y - 220)
      : spot.y + spot.h + 12
    : screenH * 0.35;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Four dim panels around the spotlight. Each intercepts taps. */}
      {spot ? (
        <>
          {/* Top */}
          <DimPanel style={{ top: 0, left: 0, right: 0, height: spot.y }} onPress={() => {}} />
          {/* Left of spotlight */}
          <DimPanel style={{ top: spot.y, left: 0, width: spot.x, height: spot.h }} onPress={() => {}} />
          {/* Right of spotlight */}
          <DimPanel
            style={{
              top: spot.y,
              left: spot.x + spot.w,
              right: 0,
              height: spot.h,
            }}
            onPress={() => {}}
          />
          {/* Bottom */}
          <DimPanel
            style={{ top: spot.y + spot.h, left: 0, right: 0, bottom: 0 }}
            onPress={() => {}}
          />
          {/* Spotlight border (visual halo) */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: spot.y - 2,
              left: spot.x - 2,
              width: spot.w + 4,
              height: spot.h + 4,
              borderRadius: 16,
              borderWidth: 2.5,
              borderColor: '#3b82f6',
            }}
          />
        </>
      ) : (
        <DimPanel style={StyleSheet.absoluteFillObject} onPress={() => {}} />
      )}

      {/* Mascot + bubble */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: mascotTop,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <View style={{ marginRight: -10 }}>
            <PeptPalMascot size={110} bonesmash />
          </View>
          <View style={{ flex: 1 }}>
            <SpeechBubble>
              <Text style={{ color: '#f1f5f9', fontSize: 13, lineHeight: 18 }}>
                {currentStep.message}
              </Text>
              {currentStep.hotspotId && !hotspot && (
                <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>
                  (Can't find that control right now — hit Next to keep going.)
                </Text>
              )}
            </SpeechBubble>
          </View>
        </View>

        {/* Footer with skip + next */}
        <View style={{ flexDirection: 'row', marginTop: 16, paddingHorizontal: 4, alignItems: 'center' }}>
          <Text style={{ color: '#94a3b8', fontSize: 11 }}>
            Step {stepIndex + 1} / {/* total steps */}
            {' '}10
          </Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={skip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip tour</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={next} style={styles.nextBtn}>
            <Text style={styles.nextText}>
              {currentStep.advanceMode === 'tap_hotspot'
                ? 'Or Next →'
                : stepIndex === 9
                ? 'Done'
                : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function DimPanel({
  style,
  onPress,
}: {
  style: object;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={1}
      style={[{ position: 'absolute', backgroundColor: DIM }, style]}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(30,41,59,0.9)',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  skipText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 12,
  },
  nextBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
  },
  nextText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },
});
