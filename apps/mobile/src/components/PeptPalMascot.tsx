import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Path, Rect, Ellipse, Circle } from 'react-native-svg';

/**
 * PeptPal — the gigachad mascot that guides users through onboarding.
 *
 * Styled after the "mogging / clavicular" looksmaxxing aesthetic:
 *  - Chiseled angular jaw, hollow cheeks
 *  - Prominent zygomatic arches (cheekbones)
 *  - Visible clavicles on the upper chest
 *  - Blank confident gaze
 *
 * When `bonesmash` is true, a hammer periodically swings up and taps the
 * cheekbone with a small impact flash — homage to the bonesmashing meme.
 *
 * Swap this for a hand-drawn illustration or Lottie later — the prop
 * interface is intentionally minimal.
 */
export interface PeptPalMascotProps {
  size?: number;
  /** Idle bob animation. */
  animated?: boolean;
  /** Periodically swings a hammer toward the cheekbone (bonesmashing). */
  bonesmash?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function PeptPalMascot({ size = 160, animated = true, bonesmash = false }: PeptPalMascotProps) {
  const bob = useRef(new Animated.Value(0)).current;
  const hammerSwing = useRef(new Animated.Value(0)).current;
  const impactFlash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, bob]);

  useEffect(() => {
    if (!bonesmash) return;
    // Full cycle: rest → windup → strike → hold → retract → pause.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(3500), // resting
        Animated.timing(hammerSwing, { toValue: 0.4, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }), // windup
        Animated.timing(hammerSwing, { toValue: 1, duration: 120, easing: Easing.in(Easing.cubic), useNativeDriver: true }), // strike
        Animated.parallel([
          // Impact flash on strike
          Animated.sequence([
            Animated.timing(impactFlash, { toValue: 1, duration: 60, useNativeDriver: true }),
            Animated.timing(impactFlash, { toValue: 0, duration: 220, useNativeDriver: true }),
          ]),
          Animated.delay(260),
        ]),
        Animated.timing(hammerSwing, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }), // retract
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bonesmash, hammerSwing, impactFlash]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  // Hammer transform, as a fraction of the mascot size. These are overlaid in
  // an Animated.View because react-native-svg's <G> doesn't play well with
  // style-based transforms on all platforms.
  const hammerTranslateX = hammerSwing.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [size * 0.5, size * 0.3, size * 0.08],
  });
  const hammerTranslateY = hammerSwing.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [-size * 0.1, -size * 0.05, 0],
  });
  const hammerRotate = hammerSwing.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: ['-30deg', '-55deg', '25deg'],
  });

  return (
    <Animated.View style={{ transform: [{ translateY }], alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Shoulders + clavicle silhouette */}
        <Path d="M 30 200 Q 30 155 100 148 Q 170 155 170 200 Z" fill="#1e293b" />
        {/* Collarbone highlights (the "clavicular" part) */}
        <Path d="M 55 168 Q 80 158 100 160" stroke="#f1f5f9" strokeWidth={2} fill="none" opacity={0.9} />
        <Path d="M 100 160 Q 120 158 145 168" stroke="#f1f5f9" strokeWidth={2} fill="none" opacity={0.9} />
        <Path d="M 55 172 Q 80 164 100 165" stroke="#475569" strokeWidth={1} fill="none" opacity={0.8} />
        <Path d="M 100 165 Q 120 164 145 172" stroke="#475569" strokeWidth={1} fill="none" opacity={0.8} />

        {/* Trap muscle shading */}
        <Path d="M 100 148 Q 105 140 120 148 L 160 160 Z" fill="#0f172a" opacity={0.5} />
        <Path d="M 100 148 Q 95 140 80 148 L 40 160 Z" fill="#0f172a" opacity={0.5} />

        {/* Neck — chiseled sternocleidomastoids */}
        <Path d="M 82 148 L 86 175 L 92 175 L 94 150 Z" fill="#d6b69a" />
        <Path d="M 118 148 L 114 175 L 108 175 L 106 150 Z" fill="#d6b69a" />
        <Rect x={92} y={150} width={16} height={22} fill="#c9a581" />

        {/* Jaw / head — ultra-angular mog face */}
        <Path
          d="M 100 22
             L 72 34
             L 56 58
             L 48 84
             L 50 106
             L 58 128
             L 72 146
             L 95 156
             L 105 156
             L 128 146
             L 142 128
             L 150 106
             L 152 84
             L 144 58
             L 128 34 Z"
          fill="#e8c9a8"
          stroke="#8a6240"
          strokeWidth={1.5}
        />

        {/* Zygomatic arches — prominent cheekbone highlights */}
        <Path d="M 60 95 Q 75 108 85 110" stroke="#f5dcb8" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.95} />
        <Path d="M 140 95 Q 125 108 115 110" stroke="#f5dcb8" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.95} />
        {/* Cheekbone shadow below (hollow cheek) */}
        <Path d="M 62 115 Q 78 130 92 135" stroke="#a67e5a" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.5} />
        <Path d="M 138 115 Q 122 130 108 135" stroke="#a67e5a" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.5} />

        {/* Hair — sharp side-sweep undercut */}
        <Path
          d="M 68 34
             Q 80 14 110 16
             Q 140 18 144 44
             L 130 30
             Q 120 28 108 32
             Q 92 34 78 38
             Q 70 38 68 34 Z"
          fill="#4a3420"
        />
        <Path d="M 140 38 L 150 58 L 144 60 L 138 46 Z" fill="#4a3420" />

        {/* Forehead shadow */}
        <Path d="M 72 48 Q 100 40 130 48 L 128 58 Q 100 52 74 58 Z" fill="#d6b69a" opacity={0.4} />

        {/* Eyebrows — sharp, heavy */}
        <Path d="M 68 78 L 92 74" stroke="#2d1e12" strokeWidth={4} strokeLinecap="round" />
        <Path d="M 108 74 L 132 78" stroke="#2d1e12" strokeWidth={4} strokeLinecap="round" />

        {/* Eyes — hunter-eye narrow slits */}
        <Path d="M 72 92 Q 80 88 88 92" stroke="#2d1e12" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Path d="M 112 92 Q 120 88 128 92" stroke="#2d1e12" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Ellipse cx={80} cy={94} rx={3} ry={1.8} fill="#2d1e12" />
        <Ellipse cx={120} cy={94} rx={3} ry={1.8} fill="#2d1e12" />

        {/* Nose — straight aquiline ridge */}
        <Path d="M 100 92 L 96 118 L 100 122 L 104 118 Z" fill="#c9a581" stroke="#a67e5a" strokeWidth={0.8} />
        <Path d="M 93 124 Q 100 128 107 124" stroke="#8a6240" strokeWidth={1} fill="none" />

        {/* Philtrum */}
        <Path d="M 99 128 L 100 135 L 101 128" stroke="#8a6240" strokeWidth={0.6} fill="none" />

        {/* Mouth — smug flat line */}
        <Path d="M 88 140 L 112 140" stroke="#5a2e1a" strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M 90 142 L 110 142" stroke="#a67e5a" strokeWidth={0.8} strokeLinecap="round" opacity={0.7} />

        {/* Chin cleft + mandible angle */}
        <Path d="M 100 148 L 100 154" stroke="#8a6240" strokeWidth={1} strokeLinecap="round" />
        <Path d="M 60 120 L 72 146 L 100 156 L 128 146 L 140 120" stroke="#a67e5a" strokeWidth={1.2} fill="none" />
        {/* Masseter shadow */}
        <Path d="M 55 118 Q 60 135 74 145" stroke="#b58862" strokeWidth={2} fill="none" opacity={0.5} />
        <Path d="M 145 118 Q 140 135 126 145" stroke="#b58862" strokeWidth={2} fill="none" opacity={0.5} />

        {/* Impact flash on cheekbone — opacity animated when bonesmash fires */}
        {bonesmash && (
          <AnimatedCircle
            cx={140}
            cy={105}
            r={16}
            fill="#fef3c7"
            opacity={impactFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] })}
          />
        )}
      </Svg>

      {/* Hammer overlay — RN Animated transforms on a plain View so we can
          compose translate + rotate cleanly. Positioned absolutely over the
          SVG at the cheekbone location. */}
      {bonesmash && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            transform: [
              { translateX: hammerTranslateX },
              { translateY: hammerTranslateY },
              { rotate: hammerRotate },
            ],
          }}
        >
          <Svg width={size} height={size} viewBox="0 0 200 200">
            {/* Handle */}
            <Rect x={140} y={100} width={4} height={46} fill="#6b4a2e" rx={1} />
            <Rect x={141} y={100} width={1.2} height={46} fill="#8a6240" />
            {/* Head — steel block */}
            <Rect x={128} y={92} width={28} height={14} fill="#475569" rx={2} />
            <Rect x={128} y={92} width={28} height={3} fill="#64748b" rx={2} />
            <Rect x={128} y={103} width={28} height={3} fill="#334155" rx={2} />
            <Rect x={126} y={94} width={3} height={10} fill="#94a3b8" />
          </Svg>
        </Animated.View>
      )}
    </Animated.View>
  );
}

/**
 * Speech bubble that slides in with a pointer tail.
 */
export function SpeechBubble({
  children,
  from = 'right',
  visible = true,
}: {
  children: React.ReactNode;
  from?: 'left' | 'right';
  visible?: boolean;
}) {
  const translate = useRef(new Animated.Value(visible ? 0 : 40)).current;
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translate, {
        toValue: visible ? 0 : 40,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translate, opacity]);

  const translateX = translate.interpolate({
    inputRange: [0, 40],
    outputRange: [0, from === 'right' ? 40 : -40],
  });

  return (
    <Animated.View
      style={{
        transform: [{ translateX }],
        opacity,
        backgroundColor: '#1e293b',
        borderColor: '#3b82f6',
        borderWidth: 1.5,
        borderRadius: 18,
        padding: 14,
        marginHorizontal: 16,
      }}
    >
      <View
        style={{
          position: 'absolute',
          bottom: -8,
          [from === 'right' ? 'left' : 'right']: 24,
          width: 0,
          height: 0,
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderTopWidth: 10,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: '#3b82f6',
        }}
      />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Text style={{ color: '#3b82f6', fontWeight: '700' }}>PeptPal:</Text>
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </Animated.View>
  );
}
