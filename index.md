---
layout: default
---

<link rel="stylesheet" href="/assets/style.css">

<link rel="stylesheet" href="/assets/style.css">

<button id="themeToggle" class="theme-toggle" type="button" aria-label="Toggle theme">
  🌙 Dark
</button>

<script>
  (function () {
    const key = "theme";
    const btn = document.getElementById("themeToggle");
    if (!btn) return;

    // Determine system preference
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Apply stored theme or system default
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

<script src="/assets/easter-egg.js"></script>


# Rease Kessler

> I build projects to learn and explore ideas. While, I continue developing my skills to aid in proficiently wiritng software

## About

I build tools and projects that help me learn, by doing. My recent work includes a Rust-based CLI tool, infrastructure experiments with Terraform and cloud APIs, and side explorations in C#. I enjoy digging into systems, discovering how things work under the hood, and gaining experience across languages and environments.

**Note:** At this time, while I still hold a passion for writing software, I am pursuing a separate career path.

> This site is a rudimentary place to show some of my most interesting projects and to exhibit my foundation of knowledge.

## Projects

### [Drone-CLI](https://github.com/SpoonNewman/drone-cli.git)

This repository is a tandem effort with a close friend. I was tasked with building a CLI tool to interact with a drone over an API.  
Development is slow, but active.

**Tech: Rust**

---

### [Invincible](https://github.com/SpoonNewman/Invincible.git)

This repository was my attempt at making an *Invincible* fan game. It didn’t get too far and encountered a large number of challenges.

**Tech: C#, Wolfram, Unity**

---

### [The-Box](https://github.com/SpoonNewman/The-Box.git)

This repository was created to learn and practice Terraform.

**Tech: AWS, Terraform, Python, Docker**

---

### [Developer-Workspace](https://github.com/SpoonNewman/Developer-Workspace.git)

This was my original repository when I first began learning how to write code.

**Tech: Python, Powershell**

## Currently Interested In

- Systems programming
- Game development
- Tooling and automation

## Links

- [GitHub](https://github.com/spoonnewman)
- Email: rease.dev.h42dk@passmail.net
