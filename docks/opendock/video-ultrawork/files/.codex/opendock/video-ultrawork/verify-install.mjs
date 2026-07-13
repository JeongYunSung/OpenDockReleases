#!/usr/bin/env node
import { ffmpegVerificationMarker, verifiedFfmpegPath } from "./lib/process.mjs";

try {
  await verifiedFfmpegPath();
  console.log(`[video-ultrawork] FFmpeg integrity and version verified: ${ffmpegVerificationMarker}`);
} catch (error) {
  console.error(`[video-ultrawork] FFmpeg verification failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
