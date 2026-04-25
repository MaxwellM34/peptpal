import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Easing } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

/**
 * PeptPal — the gigachad mascot that guides users through onboarding.
 *
 * Rendered from a bundled PNG (assets/chad.png) wrapped in an Animated.View
 * for idle bobbing. When `bonesmash` is true, an SVG hammer overlay swings
 * in and taps the right cheekbone with an impact flash.
 */
export interface PeptPalMascotProps {
  size?: number;
  /** Idle bob animation. */
  animated?: boolean;
  /** Periodically swings a hammer toward the cheekbone (bonesmashing). */
  bonesmash?: boolean;
  /** Flip horizontally so he faces the opposite direction (e.g. toward a speech bubble on his right). */
  mirrored?: boolean;
  /** Render a small red dot at the hammer strike target — use for tuning placement. */
  showStrikeTarget?: boolean;
}

export function PeptPalMascot({
  size = 160,
  animated = true,
  bonesmash = false,
  mirrored = false,
  showStrikeTarget = false,
}: PeptPalMascotProps) {
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

  // Hammer strike target: local (0.36, 0.415) of size. Because the container
  // has scaleX:-1 when mirrored, this local position visually renders at
  // (0.64, 0.415) on chad's (mirrored) cheekbone. With rotate(25deg) around
  // view center, the hammer's hit tip lands there at (-0.27, -0.14).
  const hammerTranslateX = hammerSwing.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [size * 0.2, size * -0.1, size * -0.27],
  });
  const hammerTranslateY = hammerSwing.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [-size * 0.3, -size * 0.25, -size * 0.14],
  });
  const hammerRotate = hammerSwing.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: ['-30deg', '-55deg', '25deg'],
  });

  const flashOpacity = impactFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] });

  return (
    <Animated.View style={{ transform: [{ translateY }], alignItems: 'center' }}>
      <View style={{ width: size, height: size, transform: [{ scaleX: mirrored ? -1 : 1 }] }}>
        <Image
          source={require('../../assets/chad.png')}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />

        {showStrikeTarget && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: size * 0.36 - 3,
              top: size * 0.415 - 3,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#ef4444',
              borderWidth: 1,
              borderColor: '#fff',
            }}
          />
        )}

        {bonesmash && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: size * 0.27,
              top: size * 0.325,
              width: size * 0.18,
              height: size * 0.18,
              borderRadius: size * 0.09,
              backgroundColor: '#fef3c7',
              opacity: flashOpacity,
            }}
          />
        )}

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
              <Rect x={140} y={100} width={4} height={46} fill="#6b4a2e" rx={1} />
              <Rect x={141} y={100} width={1.2} height={46} fill="#8a6240" />
              <Rect x={128} y={92} width={28} height={14} fill="#475569" rx={2} />
              <Rect x={128} y={92} width={28} height={3} fill="#64748b" rx={2} />
              <Rect x={128} y={103} width={28} height={3} fill="#334155" rx={2} />
              <Rect x={126} y={94} width={3} height={10} fill="#94a3b8" />
            </Svg>
          </Animated.View>
        )}
      </View>
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
