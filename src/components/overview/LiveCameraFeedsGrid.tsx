import React from 'react';
import { useCommandCenter } from '../../context/CommandCenterContext';
import { CCTVFeedPlayer } from '../common/CCTVFeedPlayer';
import { Video, ArrowRight } from 'lucide-react';

export const LiveCameraFeedsGrid: React.FC = () => {
  const { cameras, setActiveTab } = useCommandCenter();

  // Show the four key CCTV feeds: CAM-01, CAM-07, CAM-12, CAM-18
  const featuredCameras = cameras.slice(0, 4);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-4 flex flex-col shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Live Camera Feeds (Quad View)</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                YOLOv11 & OCR ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">High-priority multi-zone real-time optical streams</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('surveillance')}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-mono group"
        >
          <span>Expand to Full Matrix</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 2x2 CCTV Feeds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {featuredCameras.map((camera) => (
          <CCTVFeedPlayer
            key={camera.id}
            camera={camera}
            isDetailed={false}
          />
        ))}
      </div>
    </div>
  );
};
