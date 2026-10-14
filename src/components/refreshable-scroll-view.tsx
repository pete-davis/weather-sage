import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';

import { Palette } from '@/theme';

// How far to pull, after easing, before letting go reloads; and the most the content moves down.
const PULL_TO_REFRESH = 64;
const MAX_PULL = 96;
// The content moves less than the finger, which makes the pull feel like it has some weight.
const RESISTANCE = 0.5;

type Props = ScrollViewProps & {
  refreshing: boolean;
  onRefresh: () => void;
};

/**
 * A vertical ScrollView that reloads when pulled down from the top. On phones and tablets that is
 * the platform's own RefreshControl. On the web, where RefreshControl does nothing and the page
 * itself never scrolls for the browser to offer its own, the pull is followed by touch here.
 */
export function RefreshableScrollView({ refreshing, onRefresh, children, ...props }: Props) {
  if (Platform.OS !== 'web') {
    return (
      <ScrollView
        {...props}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.text} />}>
        {children}
      </ScrollView>
    );
  }
  return (
    <WebPullToRefresh refreshing={refreshing} onRefresh={onRefresh} {...props}>
      {children}
    </WebPullToRefresh>
  );
}

function WebPullToRefresh({ refreshing, onRefresh, children, style, ...props }: Props) {
  const scrollView = useRef<ScrollView>(null);
  const [pull, setPull] = useState(0);
  // Read by the touch handlers, which are attached once.
  const latest = useRef({ onRefresh, refreshing });
  useEffect(() => {
    latest.current = { onRefresh, refreshing };
  }, [onRefresh, refreshing]);

  useEffect(() => {
    const node = (scrollView.current as unknown as { getScrollableNode(): HTMLElement } | null)?.getScrollableNode();
    if (!node) return;
    let startY: number | null = null;
    let distance = 0;

    function onStart(event: TouchEvent) {
      // A pull only counts when it starts with the content scrolled to the very top.
      startY = node!.scrollTop <= 0 && !latest.current.refreshing ? event.touches[0].clientY : null;
      distance = 0;
    }
    function onMove(event: TouchEvent) {
      if (startY === null) return;
      const dy = event.touches[0].clientY - startY;
      if (dy <= 0 || node!.scrollTop > 0) {
        // Scrolling up into the content, not pulling.
        startY = dy <= 0 ? startY : null;
        distance = 0;
        setPull(0);
        return;
      }
      // Hold the page still while it is being pulled, rather than letting the browser bounce it.
      event.preventDefault();
      distance = Math.min(dy * RESISTANCE, MAX_PULL);
      setPull(distance);
    }
    function onEnd() {
      if (startY !== null && distance >= PULL_TO_REFRESH) latest.current.onRefresh();
      startY = null;
      distance = 0;
      setPull(0);
    }

    node.addEventListener('touchstart', onStart, { passive: true });
    // Not passive, so that it can stop the browser scrolling the page while pulling.
    node.addEventListener('touchmove', onMove, { passive: false });
    node.addEventListener('touchend', onEnd);
    node.addEventListener('touchcancel', onEnd);
    return () => {
      node.removeEventListener('touchstart', onStart);
      node.removeEventListener('touchmove', onMove);
      node.removeEventListener('touchend', onEnd);
      node.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  // While reloading, the spinner holds the space a full pull opened.
  const offset = refreshing ? PULL_TO_REFRESH : pull;
  const ready = pull >= PULL_TO_REFRESH;

  return (
    <View style={styles.container}>
      {offset > 0 && (
        <View style={[styles.indicator, { height: offset }]} pointerEvents="none">
          <ActivityIndicator
            color={Palette.text}
            animating={refreshing || ready}
            hidesWhenStopped={false}
            style={{ opacity: refreshing ? 1 : Math.min(1, pull / PULL_TO_REFRESH) }}
          />
        </View>
      )}
      <ScrollView ref={scrollView} {...props} style={[style, offset > 0 && { transform: [{ translateY: offset }] }]}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
