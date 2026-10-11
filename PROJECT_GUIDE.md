# SmartCity Command Center | AI Surveillance & Traffic Operations Platform

A modern, responsive, control-room dashboard built for an **AI-Driven Smart City Platform** focused on urban video surveillance, automated traffic flow management, and public safety analytics.

The application runs live locally at: `http://localhost:5173/`

---

## 🏛️ Project Architecture & Tech Stack

- **Framework**: React 19 + TypeScript
- **Styling & HUD Design**: Tailwind CSS with custom command-center color palettes (charcoal `#0a0d14`, slate `#161f33`, cyan `#06b6d4`, warning amber `#f59e0b`, critical red `#ef4444`, and stark black & white monochrome)
- **Icons**: Lucide React (`lucide-react`)
- **Data Visualizations**: Recharts (`recharts`)
- **Audio Synthesizer**: Web Audio API oscillator for authentic control-room chime/beeps on alert acknowledgment and emergency team dispatches
- **State & Telemetry Engine**: React Context (`CommandCenterContext`) with live ticker simulations, timecode clock, and instant global search

---

## 🚀 Key Pages & Features

### 1. Overview Dashboard
- **Top Emergency Warning Banner**: Persistent, dismissable alert bar for critical incidents with 1-click incident review and dispatch.
- **Top Command Bar**: 
  - City branding `SmartCity Command Center` (Sector 01)
  - Live second-by-second updating digital clock
  - Global Search with autocomplete for cameras, zones, and incidents
  - Theme Switcher: **Dark Command** (default), **Pure Monochrome B&W**, and **Clean White**
  - Audio alert synthesizer toggle
  - Live incident notification bell with dropdown
  - Operator Profile: *Chief Operator Chen (Sector 01 Duty)*
- **Four Core KPI Cards**:
  - **Active Cameras**: `48 / 52` (92.3% Operational status)
  - **Vehicles Detected Today**: `18,420` (+14.2% daily flow)
  - **Congestion Hotspots**: `6` active corridors (2 severe bottlenecks)
  - **Critical Safety Alerts**: `2` unresolved with pulsing beacon
- **Tactical Urban GIS Map Panel**:
  - Vector-based interactive city grid with arterial highways, bridges, waterways, and urban sectors
  - Interactive camera markers: green (normal), amber (warning), red (pulsing collision beacon)
  - Dynamic congestion heatmap overlays (Downtown Core, North Tunnel, Harbour)
  - Tactical Layer Toggles: *Cameras (52)*, *Heatmap*, *Incidents*, *Boundaries*
  - Corner radar sweep animation & interactive zoom controls
  - Hover tooltips showing vehicle count, pedestrian count, congestion score, and camera FPS
- **Live Camera Feeds (2×2 Quad View)**:
  - 4 high-priority CCTV streams: Grand Ave, Highway A1, Waterfront Bridge, Tech Corridor
  - Realistic video simulation: road geometry, moving vehicles, live timecodes, REC red dot, and FPS indicators
  - AI Bounding Boxes: Real-time labels (`CAR 97%`, `BUS 94%`, `PEDESTRIAN 98%`), license plate OCR tags, and violation indicators
  - On-feed quick controls: AI overlay toggle, night-vision mode, snapshot capture, full modal inspect
- **Right-side Priority Alerts Panel**:
  - Severity badges (Critical, High, Medium)
  - AI forensic explanations and location links
  - Action buttons: "View Feed" and "Acknowledge" with toast feedback
- **Bottom Telemetry Charts**:
  - Hourly Traffic Volume vs Historical baseline AreaChart
  - Vehicle Type Classification Donut Chart (Cars 64%, Two-Wheelers 16%, Buses 12%, Trucks 8%)
  - Congestion Index by Urban Zone BarChart

---

### 2. Live Surveillance Wall
- Switchable Grid Layouts: **2×2 Focused Quad**, **3×2 Matrix**, and **Detailed List Table**
- Comprehensive filtering:
  - Zone Filter (Downtown Core, Highway A1, Waterfront Bay, Tech Corridor, North Sector, Harbour District)
  - Status Filter (Online, Warning, Offline)
  - Incident Filter (Accidents, Wrong-Way, Overspeeding, Pedestrians, Parking)
- **Detailed Camera Monitoring Modal**:
  - High-Definition CCTV stream with night vision, snapshot capture, and AI overlay toggles
  - Edge Inference Telemetry (Inference latency 38ms, Bitrate 4.85 Mbps, TLS 1.3 encryption)
  - Detected Objects Table with live confidence scores, speeds, and OCR plates
  - Temporal Event Audit Trail timeline
  - Soft stream reboot action with simulated recovery

---

### 3. Traffic Analytics & Mobility Intelligence
- Summary KPI metrics: Average Speed (42.8 km/h), Flow Rate (2,180 veh/hr), Total Vehicles (18,420), Congestion Index (74/100)
- Interactive Charts:
  - Multi-axis Hourly Volume vs Network Speed AreaChart
  - Weekly Congestion Index and Incident Rate AreaChart
  - Average Speed by Zone BarChart
  - Vehicle Category Breakdown
- **Active Bottlenecks Table**: Hotspot ID, location, congestion status, density score meter, average speed, and 1-click camera inspection

---

### 4. Public Safety Alerts & Emergency Dispatch
- Multi-tier severity tabs: All, Critical (2), High (2), Medium (2), and Acknowledged
- Filter pills by violation category:
  - Traffic Accident
  - Wrong-Way Vehicle
  - Overspeeding
  - Pedestrian in Restricted Area
  - Illegal Parking
- "Trigger Simulated Incident" button to demonstrate real-time alert ingestion and sound cues
- **Accident Detail Modal & Emergency Dispatch**:
  - High-priority collision evidence frame with detected vehicles & collision blast point
  - AI Forensic Assessment summary & temporal reconstruction timeline
  - Response Package Selector: EMS Ambulance, Highway Patrol, Fire & Rescue, Traffic Diversion
  - **"Dispatch Emergency Team"** action: Updates status to `DISPATCHED - Units en route (ETA 4 mins)` with control room audio cues

---

### 5. Camera Inventory & Telemetry
- Registry of all 52 municipal optical nodes
- Full specifications: RTSP stream URL, IP address, resolution (4K / 1080p), target FPS, active AI models (YOLOv11-Urban, PlateOCR-Pro, SpeedRadar-AI)
- Actions: Inspect Feed, Soft Reboot Stream, Calibrate AI Lens Matrix

---

### 6. Compliance & Audit Reports
- Date range filter: Today, Last 7 Days, Last 30 Days
- Export actions: **Export PDF Summary**, **Export CSV Dataset** with realistic simulated file preparation and toast confirmation
- Weekly operational metric preview chart (Incidents vs Flow Efficiency)
- ISO 37120 Smart City compliance statement and cryptographic audit disclosure

---

### 7. Settings & Edge AI Tuning
- Theme Selection: Dark Command (Default), Pure Monochrome B&W, and Clean White
- Edge AI Vision Parameters:
  - YOLO Confidence Threshold Slider (50% - 99%)
  - Non-Maximum Suppression (NMS) Overlap Slider
  - License Plate OCR, Pedestrian Trajectory, and GeoFence toggles
- Audio and Header Alert banner preferences

---

## 🎓 College Presentation Demo Guide

1. **Introduction**: Open the dashboard at `http://localhost:5173/`. Explain the role of an autonomous municipal command center integrating edge computer vision (YOLOv11) with urban GIS telemetry.
2. **Overview**: Point out the 4 KPI cards and explain how the system detected 18,420 vehicles today with 92.3% active camera uptime.
3. **Interactive Map**: Demonstrate the vector GIS map. Toggle layers (Cameras, Heatmap, Incidents). Hover over Grand Ave pin to show the incident tooltip.
4. **Live CCTV Feeds**: Point out the 2×2 grid showing live simulated feeds with animated bounding boxes, confidence %, and license plate OCR. Click the Night Vision toggle or Snapshot button.
5. **Emergency Incident Workflow**: 
   - Click "Inspect & Dispatch" on the Grand Ave collision card in the Priority Alerts panel.
   - Walk through the Accident Detail Modal: collision blast point, involved vehicles, forensic assessment, and timeline.
   - Click **"Dispatch Emergency Team"** to show instant status change to dispatched units with 4 min ETA.
6. **Themes**: Open the theme switcher in the TopBar to switch between **Dark Command** and **Pure Monochrome Black & White** to show adaptability for different operator environments.
