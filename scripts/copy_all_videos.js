import fs from 'fs';
import path from 'path';

const pubVideos = 'd:/system/public/videos';
const distVideos = 'd:/system/dist/videos';
fs.mkdirSync(pubVideos, { recursive: true });
fs.mkdirSync(distVideos, { recursive: true });

const videoSources = [
  {
    src: 'd:/system/extracted_datasets/vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/sample/Input/CMC_input.mp4',
    name: 'cam_downtown_cmc.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/sample/Input/traffic_zone_input.mp4',
    name: 'cam_traffic_zone.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/sample/Input/industry_input.mp4',
    name: 'cam_harbour_logistics.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/sample/Input/wild-input.mp4',
    name: 'cam_expressway_wild.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/sample/output/cmc_output.mp4',
    name: 'cam_cmc_tracked.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/sample/output/industry_output.mp4',
    name: 'cam_industry_gate.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/sample/output/wild_output.mp4',
    name: 'cam_wild_tracked.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/static/videos/welcome_frist.mp4',
    name: 'cam_corridor_flow.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/accident_detection/Accident-Detection-main/testing.mp4',
    name: 'cam_highway_collision.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/accident_detection/Accident-Detection-main/testing2.mp4',
    name: 'cam_intersection_incident.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/accident_detection/Accident-Detection-main/Simulation Video.mp4',
    name: 'cam_simulation_accident.mp4'
  }
];

for (const v of videoSources) {
  if (fs.existsSync(v.src)) {
    const destPub = path.join(pubVideos, v.name);
    const destDist = path.join(distVideos, v.name);
    fs.copyFileSync(v.src, destPub);
    fs.copyFileSync(v.src, destDist);
    console.log(`Copied ${v.name}: ${(fs.statSync(destPub).size / (1024 * 1024)).toFixed(2)} MB`);
  } else {
    console.warn(`Source video not found: ${v.src}`);
  }
}
console.log('Video assets setup complete!');
