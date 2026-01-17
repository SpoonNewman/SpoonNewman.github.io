(() => {
  // Desired sequence (normalized)
  const target = [
    "ArrowUp", "ArrowUp",
    "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight",
    "ArrowLeft", "ArrowRight",
    "KeyA", "KeyB",
    "Escape"
  ];

  const buffer = [];
  const maxLen = target.length;

  // Optional: ignore typing when user is focused on an input/textarea
  const isTypingInField = (el) => {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return tag === "input" || tag === "textarea" || el.isContentEditable;
  };

  const onKeyDown = (e) => {
    if (isTypingInField(document.activeElement)) return;

    // Normalize to stable codes:
    // - Arrow keys -> "ArrowUp" etc
    // - Letters -> "KeyA" etc (works regardless of caps)
    // - Escape -> "Escape"
    const code = e.code || e.key; // fallback just in case

    buffer.push(code);
    if (buffer.length > maxLen) buffer.shift();

    // Check match
    const matched = buffer.length === maxLen && buffer.every((v, i) => v === target[i]);
    if (!matched) return;

    // Trigger the easter egg
    triggerEasterEgg();
    buffer.length = 0; // reset so it doesn't immediately retrigger
  };

  function triggerEasterEgg() {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "egg-overlay egg-scanlines";

  // Title text (plain text; not the copyrighted logo)
  const title = document.createElement("div");
  title.className = "egg-title";
  title.textContent = "GRADIUS"; // <- change this to anything later

  overlay.appendChild(title);
  document.body.appendChild(overlay);

  // Remove after animation
  setTimeout(() => overlay.remove(), 1500);
}


  window.addEventListener("keydown", onKeyDown, { passive: true });
})();
