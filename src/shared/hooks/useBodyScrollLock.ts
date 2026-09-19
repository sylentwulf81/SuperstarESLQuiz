import { useEffect } from 'react';

let lockCount = 0;
let savedBodyOverflow = '';
let savedHtmlOverflow = '';
let savedBodyPaddingRight = '';
let lastTouchY = 0;

function isScrollable(el: Element, dy: number) {
  const style = window.getComputedStyle(el);
  const overflowY = style.overflowY;
  if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') return false;
  if (el.scrollHeight <= el.clientHeight + 1) return false;
  if (dy < 0) return el.scrollTop > 0;
  if (dy > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  return true;
}

function canScrollFromEvent(target: EventTarget | null, dy: number) {
  let node: Element | null = target instanceof Element ? target : null;
  while (node && node !== document.documentElement) {
    if (isScrollable(node, dy)) return true;
    node = node.parentElement;
  }
  return false;
}

function onWheel(event: WheelEvent) {
  if (canScrollFromEvent(event.target, event.deltaY)) return;
  event.preventDefault();
}

function onTouchStart(event: TouchEvent) {
  lastTouchY = event.touches[0]?.clientY ?? 0;
}

function onTouchMove(event: TouchEvent) {
  const y = event.touches[0]?.clientY ?? lastTouchY;
  const dy = lastTouchY - y;
  lastTouchY = y;
  if (canScrollFromEvent(event.target, dy)) return;
  event.preventDefault();
}

function applyLock() {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  savedBodyOverflow = document.body.style.overflow;
  savedHtmlOverflow = document.documentElement.style.overflow;
  savedBodyPaddingRight = document.body.style.paddingRight;
  document.documentElement.classList.add('modal-scroll-lock');
  document.body.classList.add('modal-scroll-lock');
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
  document.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
}

function releaseLock() {
  document.removeEventListener('wheel', onWheel);
  document.removeEventListener('touchstart', onTouchStart);
  document.removeEventListener('touchmove', onTouchMove);
  document.documentElement.classList.remove('modal-scroll-lock');
  document.body.classList.remove('modal-scroll-lock');
  document.documentElement.style.overflow = savedHtmlOverflow;
  document.body.style.overflow = savedBodyOverflow;
  document.body.style.paddingRight = savedBodyPaddingRight;
}

/**
 * Freeze the page behind a modal. Nested modals share one lock.
 * Inner panels with overflow:auto/scroll can still scroll.
 */
export function useBodyScrollLock(locked = true) {
  useEffect(() => {
    if (!locked) return;
    lockCount += 1;
    if (lockCount === 1) applyLock();
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) releaseLock();
    };
  }, [locked]);
}
