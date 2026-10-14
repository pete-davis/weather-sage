import { useEffect, useRef, useState } from 'react';
import { Platform, RefreshControl, ScrollView, type ScrollViewProps } from 'react-native';

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
        // Never shown as refreshing: the platform's spinner lets go at once, and the reload has its
        // own cover, the splash.
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={Palette.text} />}>
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

  // The screen following the finger down is the only sign of the pull; letting go hands over to
  // the reload's own cover, the splash.
  return (
    <ScrollView ref={scrollView} {...props} style={[style, pull > 0 && { transform: [{ translateY: pull }] }]}>
      {children}
    </ScrollView>
  );
}
