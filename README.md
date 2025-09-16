# EV Charging Hub – Autonomous Wireless Docking Demo

This project showcases an autonomous mobile robot navigating to an electric vehicle (EV) charging position and conceptually aligning wireless coils for efficient, contactless charging. It includes:

- A 2D SLAM-inspired obstacle avoidance + docking simulation
- A 3D dual‑camera navigation + alignment simulation (path planning, navigation, fine alignment, charging)
- Interactive 3D model viewer (placeholder until assets are added)

Built with Next.js App Router, React 19, `@react-three/fiber`, `@react-three/drei`, Framer Motion, and Tailwind CSS v4.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Simulations & Controls

### 2D SLAM + Docking (`SlamSim`)

Actions:

- Click inside the canvas: Move the EV target.
- Play / Pause: Toggle continuous simulation.
- Step: Advance one frame while paused.
- Stop/Reset: Reset robot + target + path.
- Speed slider: Scale translational velocity 0.25×–3×.
- Obstacles checkbox: Toggle avoidance.
- +Obstacle: Add a random obstacle; Reset Obstacles returns to defaults.

Visual Layers:

- Grid + path trail (green)
- Robot velocity vector (blue)
- Sensor FOV arc
- Dynamic phase indicator (Locate, Plan Path, Navigate & Avoid, Fine Alignment, Charging / Coupled)

### 3D Navigation (`RobotNav3D`)

Workflow:

1. (Optional) Click ground plane to reposition car target.
2. Press Plan to generate a simple L‑shaped path.
3. Play to navigate; robot transitions phases (Navigate → Fine Align → Charging).
4. Adjust car position and re‑Plan as needed.

Controls:

- Dual views: perspective (interactive OrbitControls) + orthographic top view.
- Plan / Play / Pause / Reset buttons.
- Speed slider (0.25×–3×).
- Move Car incremental nudges (+X, −X, +Z, −Z) or click ground.

### 3D Viewer (`ThreeViewer`)

Currently shows a procedural placeholder (torus knot). Replace with GLTF/GLB asset by swapping the `Placeholder` component.

## Development Notes

Hydration: All interactive simulations are client components (`"use client"`) or dynamically imported with `ssr: false` to avoid hydration mismatch from canvas / WebGL specifics.

Styling: A custom animated-style grid background (`.bg-grid`) uses layered gradients (dots + vertical + horizontal lines). If only horizontal lines appear in older browsers, the updated CSS adds explicit vertical grid lines.

## Next Improvements (Ideas)

- Real path planner (A*/RRT) with obstacle map
- Probabilistic sensor noise + localization uncertainty ellipse
- Import actual robot + EV geometry
- Charging efficiency heatmap visualization

## Scripts

Common scripts:

```bash
npm run dev     # start dev server
npm run build   # production build
npm start       # run built app
npm run lint    # lint
```

## License

Internal / Academic use – add a formal license if distributing.
