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
    // Placeholder action: tasteful, reversible, and funny-ish
    // Swap this later for whatever you want.
    const msg = document.createElement("div");
    msg.textContent = "✨ Easter egg unlocked. You found the secret handshake.";
    msg.setAttribute("role", "status");
    msg.style.position = "fixed";
    msg.style.left = "50%";
    msg.style.top = "16px";
    msg.style.transform = "translateX(-50%)";
    msg.style.padding = "10px 14px";
    msg.style.border = "1px solid var(--line)";
    msg.style.borderRadius = "12px";
    msg.style.background = "var(--bg)";
    msg.style.color = "var(--text)";
    msg.style.zIndex = "2000";
    msg.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";

    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3500);

    // Example "funny" effect (subtle): invert accent color briefly
    const root = document.documentElement;
    root.classList.add("egg");
    setTimeout(() => root.classList.remove("egg"), 2000);
  }

  window.addEventListener("keydown", onKeyDown, { passive: true });
})();
