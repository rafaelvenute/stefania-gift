import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';
const input = process.argv[2];
if (!input) throw new Error('Pass the absolute path to the original 1017.mp4. The source remains unchanged.');
mkdirSync('public/media', { recursive: true });
const run = (args) => {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Media conversion failed');
};
run(['-i', input, '-map', '0:v:0', '-map', '0:a:0', '-vf', 'scale=720:1280', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-maxrate', '2400k', '-bufsize', '4800k', '-profile:v', 'main', '-level', '3.1', '-pix_fmt', 'yuv420p', '-force_key_frames', '20.3', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-map_metadata', '-1', 'public/media/trailer-mobile.mp4']);
run(['-i', 'public/media/trailer-mobile.mp4', '-t', '20.3', '-c', 'copy', '-movflags', '+faststart', 'public/media/intro-studios-mobile.mp4']);
run(['-ss', '20.3', '-i', 'public/media/trailer-mobile.mp4', '-c', 'copy', '-movflags', '+faststart', 'public/media/bollywood-ticket-mobile.mp4']);
run(['-ss', '0.1', '-i', 'public/media/trailer-mobile.mp4', '-frames:v', '1', '-c:v', 'libwebp', '-quality', '85', 'public/media/intro-poster.webp']);
run(['-ss', '21.5', '-i', 'public/media/trailer-mobile.mp4', '-frames:v', '1', '-c:v', 'libwebp', '-quality', '85', 'public/media/bollywood-poster.webp']);
run(['-sseof', '-1', '-i', 'public/media/trailer-mobile.mp4', '-vf', 'reverse', '-frames:v', '1', '-c:v', 'libwebp', '-quality', '92', 'public/media/envelope-final-frame.webp']);
console.log('Two film slots, a continuous rendition and three stills prepared.');
