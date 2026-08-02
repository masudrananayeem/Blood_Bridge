import { createPortal } from "react-dom";

// Wrap any modal's content with this instead of a plain `fixed inset-0` div.
// Rendering via a portal straight into <body> sidesteps a real CSS quirk:
// an ancestor with `transform`, `filter`, `backdrop-filter`, or
// `will-change` creates a new containing block for `position: fixed`
// descendants, which can make a modal render relative to that ancestor's
// box instead of the true viewport — showing up as a stray gap/line at the
// top of the page (e.g. under a sticky, blurred navbar) instead of a
// proper full-screen overlay.
export default function Modal({ children, onClose, className = "" }) {
  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 ${className}`}
      onClick={onClose}
    >
      {children}
    </div>,
    document.body
  );
}
