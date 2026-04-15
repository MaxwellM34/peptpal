/**
 * Guided tutorial overlay system.
 *
 * The tutorial runs as an overlay over the real app UI instead of as a
 * separate full-screen experience. Each step points at a real UI element
 * (a "hotspot") registered by the screen that owns it. The overlay:
 *   - Dims the screen with a cutout (spotlight) around the hotspot
 *   - Shows the mascot + a speech bubble positioned relative to the hotspot
 *   - Lets the user tap the spotlight to progress (performing the real
 *     action), or tap Next/Skip
 *
 * Screens register hotspots via `useTutorialHotspot(id, ref)` on a
 * TouchableOpacity / View. The hook measures the element and reports its
 * bounds to the context on layout change or screen focus.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { View } from 'react-native';

export interface HotspotBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TutorialStep {
  id: string;
  /** Hotspot id to spotlight. null = centered intro/outro. */
  hotspotId: string | null;
  /** Route the user should be on for this step. Overlay will wait to appear
   *  until current route matches (or can navigate itself if `autoNavigate`). */
  expectedRoute?: string;
  /** Message shown in the speech bubble. */
  message: string;
  /** Mascot position relative to the hotspot: 'above' | 'below' (default below). */
  mascotPosition?: 'above' | 'below';
  /** How the user advances: 'tap_hotspot' lets them tap the real UI; 'next_button' requires tapping the overlay Next button. */
  advanceMode?: 'tap_hotspot' | 'next_button';
}

interface TutorialContextValue {
  active: boolean;
  stepIndex: number;
  currentStep: TutorialStep | null;
  hotspots: Map<string, HotspotBounds>;
  registerHotspot: (id: string, bounds: HotspotBounds) => void;
  unregisterHotspot: (id: string) => void;
  start: () => void;
  next: () => void;
  skip: () => void;
  onHotspotTapped: (id: string) => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    hotspotId: null,
    message:
      "Sup. I'm PeptPal. I'll spotlight stuff as we go — tap the highlighted button, or hit Next to just walk through. Skip anytime.",
    advanceMode: 'next_button',
  },
  {
    id: 'open_settings',
    hotspotId: 'tab.settings',
    message: "First stop: Settings. Tap the ⚙️ tab. If you're already there, hit Next.",
    advanceMode: 'tap_hotspot',
  },
  {
    id: 'set_weight',
    hotspotId: 'settings.weight_input',
    expectedRoute: '/(tabs)/settings',
    message: 'Drop your weight in here. This drives every dose suggestion in the app.',
    advanceMode: 'next_button',
  },
  {
    id: 'pick_persona',
    hotspotId: 'settings.persona_list',
    expectedRoute: '/(tabs)/settings',
    message: "Pick a persona. Cautious beginner? Bodybuilder? It changes what dose range I'll show you.",
    advanceMode: 'next_button',
  },
  {
    id: 'go_inventory',
    hotspotId: 'tab.inventory',
    message: 'Now tap Inventory. When vials arrive in the mail, you log them here.',
    advanceMode: 'tap_hotspot',
  },
  {
    id: 'receive_shipment',
    hotspotId: 'inventory.receive_button',
    expectedRoute: '/(tabs)/inventory',
    message: '📦 Receive Shipment walks you through a new batch — vendor, photos, vials. I auto-label them BPC-157 #1, #2… so you know which to use first.',
    advanceMode: 'next_button',
  },
  {
    id: 'go_log',
    hotspotId: 'tab.log',
    message: 'Log injections here. I suggest the oldest reconstituted vial first (FIFO) and warn you if potency dropped.',
    advanceMode: 'tap_hotspot',
  },
  {
    id: 'levels_button',
    hotspotId: 'log.levels_button',
    expectedRoute: '/(tabs)/log',
    message: '📈 Levels shows estimated blood levels over time. Toggle ±band to see uncertainty. These curves are estimates — real variance is ±30%+.',
    advanceMode: 'next_button',
  },
  {
    id: 'go_community',
    hotspotId: 'tab.community',
    message: 'Community. Two streams — curated external consensus and pseudonymous PeptPal dose logs. Bloodwork-attached posts count 5×.',
    advanceMode: 'tap_hotspot',
  },
  {
    id: 'outro',
    hotspotId: null,
    message:
      "That's the core. Schedule has cycle planner + multi-peptide protocol builder. Inventory has live degradation charts per vial. Replay this tour anytime from Settings. Now go lift something.",
    advanceMode: 'next_button',
  },
];

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hotspots, setHotspots] = useState<Map<string, HotspotBounds>>(new Map());

  const registerHotspot = useCallback((id: string, bounds: HotspotBounds) => {
    setHotspots((m) => {
      const next = new Map(m);
      next.set(id, bounds);
      return next;
    });
  }, []);

  const unregisterHotspot = useCallback((id: string) => {
    setHotspots((m) => {
      const next = new Map(m);
      next.delete(id);
      return next;
    });
  }, []);

  const start = useCallback(() => {
    setStepIndex(0);
    setActive(true);
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= TUTORIAL_STEPS.length) {
        setActive(false);
        return i;
      }
      return i + 1;
    });
  }, []);

  const skip = useCallback(() => {
    setActive(false);
  }, []);

  const onHotspotTapped = useCallback(
    (id: string) => {
      if (!active) return;
      const step = TUTORIAL_STEPS[stepIndex];
      if (step?.hotspotId === id && step.advanceMode === 'tap_hotspot') {
        // Light haptic on tutorial advance — imported lazily to avoid
        // a hard dependency in this pure context file.
        void import('./haptics').then((m) => m.hapticTap()).catch(() => undefined);
        next();
      }
    },
    [active, stepIndex, next],
  );

  const currentStep = active ? TUTORIAL_STEPS[stepIndex] ?? null : null;

  const value = useMemo<TutorialContextValue>(
    () => ({
      active,
      stepIndex,
      currentStep,
      hotspots,
      registerHotspot,
      unregisterHotspot,
      start,
      next,
      skip,
      onHotspotTapped,
    }),
    [active, stepIndex, currentStep, hotspots, registerHotspot, unregisterHotspot, start, next, skip, onHotspotTapped],
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used within a TutorialProvider');
  return ctx;
}

/**
 * Attach this to a screen's ScrollView / FlatList so that whenever the
 * tutorial is active (or advances a step), the screen snaps back to top.
 * Keeps hotspots near the top of the screen in view when the user navigates
 * to them mid-tutorial.
 *
 * Screens pass their scroll ref. Works with both ScrollView and FlatList.
 */
// Scroll ref type is deliberately loose — accepts ScrollView or any FlatList<T>.
export type ScrollResetRef = React.RefObject<
  { scrollTo?: (opts: { y: number; animated: boolean }) => void;
    scrollToOffset?: (opts: { offset: number; animated: boolean }) => void; } | null
>;

export function useTutorialScrollReset(scrollRef: ScrollResetRef) {
  const { active, stepIndex } = useTutorial();
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => {
      const node = scrollRef.current;
      if (!node) return;
      if (typeof node.scrollToOffset === 'function') {
        node.scrollToOffset({ offset: 0, animated: false });
      } else if (typeof node.scrollTo === 'function') {
        node.scrollTo({ y: 0, animated: false });
      }
    }, 80);
    return () => clearTimeout(t);
  }, [active, stepIndex, scrollRef]);
}

/**
 * Hook: attach to a real UI element to register it as a tutorial hotspot.
 *
 * Registers on every layout change — never gated on tutorial-active. If the
 * screen is mounted before the tutorial starts, its hotspots are still in the
 * registry so the overlay can spotlight them the moment the tutorial opens.
 *
 * Re-measures whenever the tutorial activates or the step index changes, in
 * case the UI shifted (keyboard, scroll, route transition).
 */
export function useTutorialHotspot(id: string) {
  const ref = useRef<View>(null);
  const { registerHotspot, unregisterHotspot, onHotspotTapped, active, stepIndex } = useTutorial();

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    // measureInWindow gives absolute coords across the screen, which is what
    // the overlay needs. Schedule on next tick so onLayout's view tree is settled.
    setTimeout(() => {
      node.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          registerHotspot(id, { x, y, width, height });
        }
      });
    }, 30);
  }, [id, registerHotspot]);

  // Re-measure when the tutorial opens or advances — layout can shift between
  // steps (keyboard dismisses, navigation transitions).
  useEffect(() => {
    if (!active) return;
    const t1 = setTimeout(measure, 100);
    const t2 = setTimeout(measure, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active, stepIndex, measure]);

  // Cleanup only on unmount.
  useEffect(() => {
    return () => unregisterHotspot(id);
  }, [id, unregisterHotspot]);

  const onPress = useCallback(() => {
    onHotspotTapped(id);
  }, [id, onHotspotTapped]);

  return { ref, onLayout: measure, onPress };
}
