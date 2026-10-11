# SmartCity AI Command Center

Real-time AI-powered urban surveillance, traffic analytics, and public safety command center with multi-entity collision detection, neural inference, and 4K CCTV monitoring.

## Features

- **Live Surveillance** — 52 camera feeds with real-time AI object detection (vehicles, pedestrians, animals)
- **Multi-Entity Collision Detection** — Vehicle↔Vehicle, Vehicle↔Pedestrian, Vehicle↔Animal accident & near-miss detection with Time-To-Collision (TTC) computation
- **Traffic Analytics** — Hourly volume/speed curves, zone congestion heatmaps, vehicle classification breakdown
- **Neural Inference Engine** — Trained T-GCN traffic speed predictor and CrashSense 5-class incident risk classifier running real-time Softmax forward passes
- **Public Safety Alerts** — Incident logging with forensic snapshots, severity classification, and emergency dispatch protocols
- **Reports & Export** — Date-range analytics with CSV/PDF telemetry export

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts
- **AI Models:** T-GCN (Spatio-Temporal Graph Convolution), CrashSense Neural Classifier, Kinematic Collision Classifier
- **Data Sources:** Caltrans PeMS D7 (228 stations), Shenzhen T-GCN Speed Matrix (2,976 intervals), YOLOv8+ByteTrack (23,801 detections), Pascal VOC annotations

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run automated tests (68 tests)
npm test

# Preview production build
npm run preview
```

## Video Assets Setup (Required for CCTV Feeds)

Video files are excluded from the repository due to GitHub's 100MB file size limit. The app will gracefully fall back to procedural synthetic CCTV streams if videos are not present.

To enable real video playback, place your `.mp4` / `.mov` files in `public/videos/`:

```
public/videos/
├── cam_downtown_cmc.mp4
├── cam_traffic_zone.mp4
├── cam_harbour_logistics.mp4
├── cam_ai_stream.mov          (4K 60fps)
└── ... (other camera feeds)
```

## Project Structure

```
src/
├── components/
│   ├── overview/          # Dashboard KPIs, GIS map, charts
│   ├── surveillance/      # Live camera grid, camera inspection modal
│   ├── traffic/           # Traffic analytics, AI model hub
│   ├── alerts/            # Public safety incident log
│   ├── cameras/           # Camera inventory & telemetry
│   ├── reports/           # Compliance reports & data export
│   ├── common/            # CCTV player, synthetic stream, toast
│   ├── layout/            # Sidebar, topbar, emergency banner
│   └── settings/          # Application settings
├── context/               # React context (CommandCenterContext)
├── data/
│   ├── realDataset.ts     # Integrated real dataset (52 cameras, alerts, traffic)
│   └── trainedModels.ts   # Neural network trained weight matrices
├── services/
│   ├── dataService.ts     # KPI calculations, reporting, CSV export
│   ├── modelInferenceService.ts  # Neural forward-pass inference engine
│   └── trackingStabilizer.ts     # Object tracking, de-jitter, collision detection
├── types/                 # TypeScript type definitions
└── lib/                   # Utility functions
tests/                     # Automated test suites (68 tests)
public/
├── data/                  # integrated_dataset.json
├── models/                # Trained model weight artifacts (JSON)
├── incidents/             # Forensic snapshot images
└── videos/                # CCTV video feeds (git-ignored)
```

## Trained Models

| Model | Architecture | Training Data | Artifact |
|:--|:--|:--|:--|
| T-GCN Traffic Predictor | Graph Convolution + GRU | Shenzhen speed matrix (156 nodes, 2,976 intervals) | `public/models/tgcn_traffic_model.json` |
| CrashSense Incident Classifier | MLP 5→32→5 (Softmax) | 23,801 vehicle kinematic vectors | `public/models/accident_risk_model.json` |
| Kinematic Collision Classifier | MLP 5→32→4 (Softmax) | Multi-entity pairwise interaction features | `public/models/kinematic_collision_model.json` |

## License

Private project.
