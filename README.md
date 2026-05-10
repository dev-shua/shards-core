# SHARDS Core

**Required dependency for all SHARDS modules.**

SHARDS Core provides the shared UI foundation used across the SHARDS module suite — a floating dock, a window manager that integrates with Foundry's native z-index system, and a GM-only Tools panel that other modules can extend.

---

## What you get out of the box

Once installed and active, a small handle appears on the left side of your Foundry canvas. Clicking it opens the **Tools panel**, which includes:

- **Fade to black** — triggers a full-screen fade with a configurable duration (in seconds), synced across all connected clients. Useful for scene transitions or dramatic moments.

As you install other SHARDS modules, their tools and panels will appear here automatically.

---

## Installation

In Foundry VTT, go to **Add-on Modules → Install Module** and paste the manifest URL:

```
https://raw.githubusercontent.com/dev-shua/shards-core/main/public/module.json
```

---

## Compatibility

| Foundry VTT | Verified |
| ----------- | -------- |
| v13         | ✔        |
| v14         | ✔        |

System-agnostic — works with any game system.

---

## SHARDS Module Suite

SHARDS Core is the backbone of a suite of GM-facing tools built for the **Calderis** campaign. All modules below require SHARDS Core.

| Module                                                         | Description                                              |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| [SHARDS Calendar](https://github.com/dev-shua/shards-calendar) | In-world calendar with moon tracking and date formatting |

More modules coming.

---

## License

MIT
