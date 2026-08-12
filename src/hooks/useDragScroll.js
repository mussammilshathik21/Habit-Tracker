import { useRef } from "react";

/** Adds click-and-drag horizontal scrolling to a container, since we hide
 *  the native scrollbar for a cleaner look. Also swallows the click that
 *  would otherwise fire on whatever was under the cursor after a real drag
 *  (so dragging over a checkbox doesn't accidentally toggle it). */
export function useDragScroll() {
  const ref = useRef(null);
  const state = useRef({ down: false, startX: 0, startScroll: 0, moved: false });

  const onMouseDown = (e) => {
    const el = ref.current;
    if (!el) return;
    state.current = { down: true, startX: e.pageX, startScroll: el.scrollLeft, moved: false };
    el.classList.add("dragging");
  };

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el || !state.current.down) return;
    const dx = e.pageX - state.current.startX;
    if (Math.abs(dx) > 3) state.current.moved = true;
    el.scrollLeft = state.current.startScroll - dx;
  };

  const endDrag = () => {
    const el = ref.current;
    if (el) el.classList.remove("dragging");
    state.current.down = false;
  };

  const onClickCapture = (e) => {
    if (state.current.moved) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return {
    ref,
    dragHandlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp: endDrag,
      onMouseLeave: endDrag,
      onClickCapture,
    },
  };
}
