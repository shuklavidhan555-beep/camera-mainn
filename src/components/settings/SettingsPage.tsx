import React, { useState } from 'react';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Contrast, 
  Volume2, 
  VolumeX, 
  Cpu, 
  Bell, 
  Save, 
  ShieldAlert, 
  Zap,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const SettingsPage: React.FC = () => {
  const { 
    theme, 
    setTheme, 
    soundEnabled, 
    setSoundEnabled, 
    emergencyBannerOpen, 
    setEmergencyBannerOpen,
    triggerSimulatedAlert,
    showToast 
  } = useCommandCenter();

  const [yoloConfidence, setYoloConfidence] = useState(85);
  const [nmsThreshold, setNmsThreshold] = useState(45);
  const [enableOcr, setEnableOcr] = useState(true);
  const [enableTrajectory, setEnableTrajectory] = useState(true);
  const [enableGeoFence, setEnableGeoFence] = useState(true);

  const handleSaveSettings = () => {
    showToast('Configuration Saved', 'AI model inference parameters and control room settings updated.', 'success');
  };

  return (
    <div className="space-y-5 max-w-5xl animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">System Configuration & AI Model Parameters</h2>
            <p className="text-xs text-slate-400">
              Fine-tune vision thresholding, theme profiles, audio alerts, and surveillance nodes
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Save className="w-3.5 h-3.5" /> Save Changes
        </button>
      </div>

      {/* Theme Selection Section */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Contrast className="w-4 h-4 text-cyan-400" /> Control Room Visual Theme
          </div>
          <span className="text-xs font-mono text-cyan-400 uppercase">
            Active: {theme}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Select between default command-center dark mode, high-contrast pure black & white, or crisp clean white.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Theme Option 1: Dark Command */}
          <div
            onClick={() => setTheme('dark')}
            className={cn(
              "p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2",
              theme === 'dark'
                ? "border-cyan-500 bg-slate-900 shadow-md ring-1 ring-cyan-500/50"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-cyan-400" /> Dark Command (Default)
              </span>
              {theme === 'dark' && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Charcoal/near-black background, slate panels, cyan/blue accents, warning amber & critical red.
            </p>
          </div>

          {/* Theme Option 2: Pure Monochrome Black & White */}
          <div
            onClick={() => setTheme('monochrome')}
            className={cn(
              "p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2",
              theme === 'monochrome'
                ? "border-white bg-[#141414] shadow-md ring-1 ring-white"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Contrast className="w-3.5 h-3.5 text-white" /> Pure Monochrome B&W
              </span>
              {theme === 'monochrome' && <span className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              High-contrast stark surveillance aesthetic. Pitch black #000, white borders, pure monochrome telemetry.
            </p>
          </div>

          {/* Theme Option 3: Clean White Light */}
          <div
            onClick={() => setTheme('light')}
            className={cn(
              "p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2",
              theme === 'light'
                ? "border-cyan-600 bg-slate-200 text-slate-900 shadow-md ring-1 ring-cyan-600"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Clean White Theme
              </span>
              {theme === 'light' && <span className="w-2 h-2 rounded-full bg-cyan-600" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Clean white & slate dashboard, high readability for bright control room environments.
            </p>
          </div>
        </div>
      </div>

      {/* AI Computer Vision Parameters */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Cpu className="w-4 h-4 text-cyan-400" /> Edge Vision Models & Neural Pipeline
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> TensorRT Accelerated
          </span>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-slate-300">YOLO Object Confidence Threshold</span>
              <span className="text-cyan-400 font-bold">{yoloConfidence}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              value={yoloConfidence}
              onChange={(e) => setYoloConfidence(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Filters bounding boxes below this confidence to eliminate false positives.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-slate-300">NMS (Non-Maximum Suppression)</span>
              <span className="text-cyan-400 font-bold">0.{nmsThreshold}</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              value={nmsThreshold}
              onChange={(e) => setNmsThreshold(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Overlap suppression for dense traffic intersections.
            </span>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <label className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between cursor-pointer text-xs">
            <span className="text-slate-300 font-mono">License Plate OCR</span>
            <input
              type="checkbox"
              checked={enableOcr}
              onChange={(e) => setEnableOcr(e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <label className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between cursor-pointer text-xs">
            <span className="text-slate-300 font-mono">Pedestrian Trajectory</span>
            <input
              type="checkbox"
              checked={enableTrajectory}
              onChange={(e) => setEnableTrajectory(e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <label className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between cursor-pointer text-xs">
            <span className="text-slate-300 font-mono">GeoFence Boundaries</span>
            <input
              type="checkbox"
              checked={enableGeoFence}
              onChange={(e) => setEnableGeoFence(e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>
        </div>
      </div>

      {/* Audio & Alert Preferences */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Bell className="w-4 h-4 text-cyan-400" /> Control Room Notification Controls
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between cursor-pointer text-xs"
          >
            <div>
              <div className="text-white font-mono font-bold flex items-center gap-2">
                {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                Control Room Sound Synthesis
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Play subtle audio chime on alert confirmation and critical hazard detection
              </p>
            </div>
            <div className={cn(
              "w-8 h-4 rounded-full transition-colors relative",
              soundEnabled ? "bg-cyan-600" : "bg-slate-700"
            )}>
              <div className={cn(
                "w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform",
                soundEnabled ? "right-0.5" : "left-0.5"
              )} />
            </div>
          </div>

          <div 
            onClick={() => setEmergencyBannerOpen(!emergencyBannerOpen)}
            className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between cursor-pointer text-xs"
          >
            <div>
              <div className="text-white font-mono font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Critical Surveillance Alert Banner
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Show persistent header warning when Priority 1 incidents are unresolved
              </p>
            </div>
            <div className={cn(
              "w-8 h-4 rounded-full transition-colors relative",
              emergencyBannerOpen ? "bg-red-600" : "bg-slate-700"
            )}>
              <div className={cn(
                "w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform",
                emergencyBannerOpen ? "right-0.5" : "left-0.5"
              )} />
            </div>
          </div>

          <div 
            onClick={() => triggerSimulatedAlert()}
            className="p-3.5 rounded-lg bg-red-950/20 border border-red-500/40 hover:bg-red-950/40 flex items-center justify-between cursor-pointer text-xs transition-colors"
          >
            <div>
              <div className="text-white font-mono font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Real-Time Incident Telemetry Probe
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Execute live vision alert injection with Sentinel CCTV footage replay
              </p>
            </div>
            <button
              type="button"
              className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-mono font-bold shrink-0 ml-2"
            >
              STREAM NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
