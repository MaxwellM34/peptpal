import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, Rect, Ellipse, G } from 'react-native-svg';

/**
 * PeptPal — the meme-chad mascot that guides users through onboarding.
 *
 * Built as an SVG so it scales without pixelation. Designed in the
 * "gigachad" silhouette tradition: sharp jawline, blank gaze, confident.
 * Swap this component out later for a real illustrated version or Lottie
 * animation — the prop interface is deliberately minimal so it's easy.
 */
export interface PeptPalMascotProps {
  size?: number;
  /** Small idle animation when true. */
  animated?: boolean;
}

export function PeptPalMascot({ size = 160, animated = true }: PeptPalMascotProps) {
  const bob = useRef(new Animated.Value(0)).current;

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

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <Animated.View style={{ transform: [{ translateY }], alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Neck */}
        <Rect x={82} y={150} width={36} height={30} fill="#d6b69a" />
        {/* Shoulders */}
        <Path d="M 40 200 Q 40 160 100 155 Q 160 160 160 200 Z" fill="#1e293b" />
        {/* Head silhouette — angular gigachad outline */}
        <Path
          d="M 100 30
             L 70 42
             L 55 70
             L 52 100
             L 58 130
             L 70 150
             L 95 158
             L 105 158
             L 130 150
             L 142 130
             L 148 100
             L 145 70
             L 130 42 Z"
          fill="#e8c9a8"
          stroke="#a67e5a"
          strokeWidth={1.5}
        />
        {/* Hair — side swept */}
        <Path
          d="M 65 42
             Q 80 20 110 20
             Q 135 22 140 45
             Q 120 35 100 38
             Q 80 40 65 42 Z"
          fill="#6b4a2e"
        />
        {/* Jaw shadow */}
        <Path
          d="M 65 130
             Q 100 168 135 130
             Q 130 150 100 158
             Q 70 150 65 130 Z"
          fill="#c9a581"
          opacity={0.5}
        />
        {/* Eyebrows */}
        <Path d="M 70 85 L 90 80" stroke="#2d1e12" strokeWidth={3} strokeLinecap="round" />
        <Path d="M 110 80 L 130 85" stroke="#2d1e12" strokeWidth={3} strokeLinecap="round" />
        {/* Eyes — narrow, blank chad gaze */}
        <Ellipse cx={80} cy={95} rx={4} ry={2.5} fill="#2d1e12" />
        <Ellipse cx={120} cy={95} rx={4} ry={2.5} fill="#2d1e12" />
        {/* Nose */}
        <Path d="M 100 100 L 97 115 L 103 115 Z" fill="#c9a581" />
        {/* Mouth — smug straight line */}
        <Path d="M 88 132 L 112 132" stroke="#6b3f28" strokeWidth={2} strokeLinecap="round" />
        {/* Jawline accent */}
        <Path
          d="M 60 120 L 70 148 L 100 158 L 130 148 L 140 120"
          stroke="#a67e5a"
          strokeWidth={1}
          fill="none"
        />
        {/* Neck muscle */}
        <Path d="M 82 160 L 88 180 M 118 160 L 112 180" stroke="#b58862" strokeWidth={1.5} opacity={0.5} />
      </Svg>
    </Animated.View>
  );
}

/**
 * Speech bubble that slides in from a configurable side.
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
      {/* Pointer triangle */}
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
