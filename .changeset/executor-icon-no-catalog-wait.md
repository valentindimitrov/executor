---
"@executor-js/ui": patch
---

The Executor app's tile shows the product icon at once instead of a loading skeleton until the
catalog arrives. Its icon never came from the catalog, but every fresh document waited for it, so
in the desktop app the tile blinked each time the window was reopened from the Dock.
