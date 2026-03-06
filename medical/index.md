---
layout: default
---

<link rel="stylesheet" href="/assets/style.css">

<button id="themeToggle" class="theme-toggle" type="button" aria-label="Toggle theme">
  🌙 Dark
</button>

<script>
  (function () {
    const key = "theme";
    const btn = document.getElementById("themeToggle");
    if (!btn) return;

    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const stored = localStorage.getItem(key);
    const initial = stored || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", initial);

    function updateButton(theme) {
      btn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
    }
    updateButton(initial);

    btn.addEventListener("click", function () {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(key, next);
      updateButton(next);
    });
  })();
</script>

# Rease Kessler

> Pre-med student with a software engineering background. Currently enrolled for an associates of science in Bridge Valley Techincal Community College, and plan to transfer to WVU to get a Bachelors degree in Biology.

## Medical Interests

- Anesthesiology
- Emergency medicine
- Critical Care

## Experience & Skills

N/A

## Education

- Bridge Valley Techincal Community College

## Links

- Email: rease.dev.h42dk@passmail.net
- [Developer](https://www.rease.dev)
