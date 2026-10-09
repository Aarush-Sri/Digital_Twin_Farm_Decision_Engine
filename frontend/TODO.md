# Farm Canvas & Decision Engine Frontend - Task Tracker

- [x] Scaffold Vite + React 19 project in `frontend/`
- [x] Install dependencies (`lucide-react`, `framer-motion`, Tailwind CSS, `vitest`, `@testing-library/react`)
- [x] Configure Tailwind CSS & PostCSS
- [x] Define Farm item data models & intuitive color schemes in `src/types/farm.js`
- [x] Implement deterministic state reducer & context in `src/context/`
- [x] Build Header with controls (Snap to Grid, Canvas Stats, Reset Canvas)
- [x] Build left Sidebar palette with draggable farm items (`grass`, `tree`, `fence`, `water`, `wheat`, `carrot`)
- [x] Build interactive FarmCanvas drop-zone with coordinates & grid backdrop
- [x] Build FarmItem with smooth spring animations (`framer-motion`)
- [x] Implement on-canvas 8-point resize handles & interactive dimension controls
- [x] Implement floating DimensionBadge toolbar for active piece
- [x] Fix dimension extension & resize handler payload mismatch
- [x] Realistic scale system: 1m = 40px (Tree 1×1m, Crops/Grass 2×2m, Fence thin & long, Water canal)
- [x] Overlaying hierarchy logic: Fence sits above Water; Water can never cover Fence
- [x] Unit test suite (17/17 passing, 100% pass rate)
- [x] Live Vite dev server running at `http://localhost:5173/`
