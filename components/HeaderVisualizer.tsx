import React, { useEffect, useRef } from 'react';

interface HeaderVisualizerProps {
  dataRef: React.MutableRefObject<Float32Array>;
  isActive?: boolean;
}

const HeaderVisualizer: React.FC<HeaderVisualizerProps> = ({ dataRef, isActive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    // Map 128 MIDI notes to fewer bars for visual clarity
    const BAR_COUNT = 64; 
    const BAR_WIDTH_FACTOR = 0.6; // Gap between bars
    
    // Smooth decay factor
    const DECAY = 0.92;

    const render = () => {
      // Resize canvas to match container if needed (handling DPI)
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }

      const width = rect.width;
      const height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Define visual style
      const barWidth = width / BAR_COUNT;
      
      // Draw bars
      for (let i = 0; i < BAR_COUNT; i++) {
        // We map the 128 MIDI notes to our BAR_COUNT
        // Focus mostly on the middle range (notes 30-100) where most music happens
        const midiIndexStart = Math.floor(30 + (i / BAR_COUNT) * 70);
        const midiIndexEnd = Math.floor(30 + ((i + 1) / BAR_COUNT) * 70);
        
        // Get max value in this frequency/pitch bucket
        let maxVal = 0;
        for (let j = midiIndexStart; j <= midiIndexEnd; j++) {
            if (j < dataRef.current.length) {
                maxVal = Math.max(maxVal, dataRef.current[j]);
            }
        }

        // Apply decay to the source data for the next frame
        // We do it per bucket or per note index. 
        // To keep it simple, we decay the rendered value's source indices here slightly
        // effectively creating the "falling" animation.
        for (let j = midiIndexStart; j <= midiIndexEnd; j++) {
             if (j < dataRef.current.length) {
                 dataRef.current[j] *= DECAY;
             }
        }

        if (maxVal > 0.01) {
          const barHeight = maxVal * height * 0.8; // Max 80% of header height
          const x = i * barWidth;
          const y = height - barHeight;

          // Gradient fill
          const gradient = ctx.createLinearGradient(0, height, 0, y);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)'); // Indigo-500 low opacity
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.4)'); // Indigo-500 higher opacity

          ctx.fillStyle = gradient;
          
          // Draw rounded top bar
          ctx.beginPath();
          ctx.roundRect(
            x + (barWidth * (1 - BAR_WIDTH_FACTOR)) / 2, 
            y, 
            barWidth * BAR_WIDTH_FACTOR, 
            barHeight + 5, // extend below fold 
            4 // border radius
          );
          ctx.fill();
        }
      }

      if (isActive) {
        animationId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, dataRef]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full opacity-60" />
    </div>
  );
};

export default HeaderVisualizer;