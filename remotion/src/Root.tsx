import React from 'react';
import { Composition } from 'remotion';
import { Props } from './lib/core';
import { Stage } from './Stage';

// The real props come from render.mjs (the job's track.json + the plan). These defaults only keep Studio alive.
const defaults: Props = {
  track: { fps: 30, width: 1080, height: 1920, frames: 150, duration: 5, audio: false, placeholder: true, face: [], top: [] },
  scenes: [{ start: 0, end: 5, set: 'studio', shot: 'wide' }],
  effects: [{ fx: 'mega-word', start: 0.2, end: 4.6, text: 'GIMANA', script: 'caranya' }],
};

export const Root: React.FC = () => (
  <Composition
    id="Gloss"
    component={Stage as unknown as React.FC<Record<string, unknown>>}
    defaultProps={defaults as unknown as Record<string, unknown>}
    durationInFrames={150} fps={30} width={1080} height={1920}
    calculateMetadata={({ props }) => {
      const p = props as unknown as Props;
      return { durationInFrames: Math.max(1, p.track.frames), fps: p.track.fps, width: p.track.width, height: p.track.height };
    }}
  />
);
