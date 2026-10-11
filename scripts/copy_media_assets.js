import fs from 'fs';
import path from 'path';

const pubVideos = 'd:/system/public/videos';
const pubIncidents = 'd:/system/public/incidents';
fs.mkdirSync(pubVideos, { recursive: true });
fs.mkdirSync(pubIncidents, { recursive: true });

// Copy video files
const videoSources = [
  {
    src: 'd:/system/extracted_datasets/vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/sample/Input/CMC_input.mp4',
    dest: 'd:/system/public/videos/cam_downtown_cmc.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/sample/Input/traffic_zone_input.mp4',
    dest: 'd:/system/public/videos/cam_traffic_zone.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/vehicle_tracking/AI-Powered-Vehicle-Tracking-and-Speed-Estimation-main/sample/Input/industry_input.mp4',
    dest: 'd:/system/public/videos/cam_harbour_logistics.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/accident_detection/Accident-Detection-main/testing.mp4',
    dest: 'd:/system/public/videos/cam_highway_collision.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/accident_detection/Accident-Detection-main/testing2.mp4',
    dest: 'd:/system/public/videos/cam_intersection_incident.mp4'
  },
  {
    src: 'd:/system/extracted_datasets/accident_detection/Accident-Detection-main/Simulation Video.mp4',
    dest: 'd:/system/public/videos/cam_simulation_accident.mp4'
  }
];

for (const v of videoSources) {
  if (fs.existsSync(v.src)) {
    fs.copyFileSync(v.src, v.dest);
    console.log(`Copied ${path.basename(v.src)} -> ${path.basename(v.dest)} (${(fs.statSync(v.dest).size / (1024*1024)).toFixed(1)} MB)`);
  } else {
    console.log(`Missing video: ${v.src}`);
  }
}

// Copy image files
const imageSources = [
  {
    src: 'd:/system/extracted_datasets/accident_detection/Accident-Detection-main/Accident Detection.jpg',
    dest: 'd:/system/public/incidents/accident_detection.jpg'
  },
  {
    src: 'd:/system/extracted_datasets/accident_detection/Accident-Detection-main/testing1.jpg',
    dest: 'd:/system/public/incidents/testing1.jpg'
  },
  {
    src: 'd:/system/extracted_datasets/minipro/Minipro_dataset/Images/Datacluster Truck (2).jpg',
    dest: 'd:/system/public/incidents/illegal_parking_truck.jpg'
  },
  {
    src: 'd:/system/extracted_datasets/minipro/Minipro_dataset/Images/dc_bus_image_001402_sZX91PgOrs.jpg',
    dest: 'd:/system/public/incidents/bus_congestion.jpg'
  },
  {
    src: 'd:/system/extracted_datasets/minipro/Minipro_dataset/Images/Datacluster Auto (45).jpg',
    dest: 'd:/system/public/incidents/auto_two_wheeler.jpg'
  }
];

for (const img of imageSources) {
  if (fs.existsSync(img.src)) {
    fs.copyFileSync(img.src, img.dest);
    console.log(`Copied ${path.basename(img.src)} -> ${path.basename(img.dest)}`);
  } else {
    console.log(`Missing image: ${img.src}`);
  }
}
console.log('Video and image assets successfully prepared in public directory!');
