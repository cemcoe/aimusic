import React, { useEffect, useRef, useState } from 'react';
import abcjs from 'abcjs';
import { Play, Square, Loader2, FileAudio, FileMusic } from 'lucide-react';

interface SheetMusicProps {
  abcNotation: string;
  visualizerData?: React.MutableRefObject<Float32Array>;
}

const SheetMusic: React.FC<SheetMusicProps> = ({ abcNotation, visualizerData }) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null); // 'midi' | 'wav' | null
  const synthControlRef = useRef<any>(null); // abcjs synth instance
  const timingCallbacksRef = useRef<any>(null); // abcjs timing callbacks
  const audioContextRef = useRef<AudioContext | null>(null);

  // Re-render when notation changes
  useEffect(() => {
    if (paperRef.current && abcNotation) {
      abcjs.renderAbc(paperRef.current, abcNotation, {
        responsive: "resize",
        add_classes: true,
      });
    }
  }, [abcNotation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (synthControlRef.current) {
        try {
            synthControlRef.current.stop();
        } catch (e) {
            // ignore
        }
      }
      if (timingCallbacksRef.current) {
          timingCallbacksRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handlePlay = async () => {
    // Prevent race conditions with loading state
    if (isLoading || isExporting) return;

    if (isPlaying) {
      if (synthControlRef.current) {
        synthControlRef.current.stop();
      }
      if (timingCallbacksRef.current) {
        timingCallbacksRef.current.stop();
      }
      setIsPlaying(false);
      // Clean up cursor
      const cursors = paperRef.current?.querySelectorAll('.abcjs-cursor');
      cursors?.forEach(c => c.classList.remove('abcjs-cursor'));
      return;
    }

    if (abcjs.synth.supportsAudio()) {
      setIsLoading(true);
      try {
        // Reuse AudioContext to prevent running out of contexts
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
             audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        // Resume context if suspended (common browser policy requirement)
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const visualObj = abcjs.renderAbc(paperRef.current!, abcNotation, {
           responsive: "resize",
           add_classes: true
        });
        
        // If render failed or no visual object, abort
        if (!visualObj || visualObj.length === 0) {
            setIsLoading(false);
            return;
        }

        const synth = new abcjs.synth.CreateSynth();
        
        await synth.init({
          audioContext: audioContextRef.current,
          visualObj: visualObj[0],
        });
        
        await synth.prime();
        
        // Use TimingCallbacks to correctly detect the end of playback
        const timingCallbacks = new abcjs.TimingCallbacks(visualObj[0], {
            eventCallback: (event) => {
                if (event === null) {
                    // Playback finished
                    setIsPlaying(false);
                    const cursors = paperRef.current?.querySelectorAll('.abcjs-cursor');
                    cursors?.forEach(c => c.classList.remove('abcjs-cursor'));
                } else {
                    // Update cursor position
                    const cursors = paperRef.current?.querySelectorAll('.abcjs-cursor');
                    cursors?.forEach(c => c.classList.remove('abcjs-cursor'));
                    
                    let scrolled = false;

                    if (event.elements) {
                         event.elements.forEach((el: any) => {
                             // Handle different element structures returned by abcjs
                             const domEl = el.length ? el[0] : el;
                             if (domEl && domEl.classList) {
                                 domEl.classList.add('abcjs-cursor');

                                 // Auto-scroll logic: scroll container if cursor is near edge or out of view
                                 if (!scrolled && scrollContainerRef.current) {
                                     const container = scrollContainerRef.current;
                                     const elRect = domEl.getBoundingClientRect();
                                     const containerRect = container.getBoundingClientRect();
                                     
                                     // Check if element is significantly out of the comfortable view area (e.g., top/bottom 20%)
                                     // or simply completely out. 
                                     // Using a threshold helps keep context.
                                     const threshold = 60; // px
                                     
                                     const isAbove = elRect.top < containerRect.top + threshold;
                                     const isBelow = elRect.bottom > containerRect.bottom - threshold;

                                     if (isAbove || isBelow) {
                                         domEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                                         scrolled = true;
                                     }
                                 }
                             }
                         });
                    }

                    // Update Visualizer Data based on played notes
                    if (visualizerData && event.midiPitches) {
                        event.midiPitches.forEach((noteData: any) => {
                            // abcjs structure can be complex, typically noteData is object or number
                            const pitch = typeof noteData === 'number' ? noteData : noteData.pitch;
                            if (pitch && pitch >= 0 && pitch < 128) {
                                // "Strike" the bar: set energy to 1.0. 
                                // The visualizer component handles the decay.
                                visualizerData.current[pitch] = 1.0;
                            }
                        });
                    }
                }
            }
        });

        synthControlRef.current = synth;
        timingCallbacksRef.current = timingCallbacks;
        
        setIsLoading(false);
        setIsPlaying(true);
        
        await synth.start();
        timingCallbacks.start();
        
      } catch (error) {
        console.error("Audio playback error", error);
        setIsPlaying(false);
        setIsLoading(false);
      }
    } else {
      alert("Audio is not supported in this browser.");
    }
  };

  const handleDownloadMidi = () => {
     setIsExporting('midi');
     try {
        const midiBuffer = abcjs.synth.getMidiFile(abcNotation, { midiOutputType: 'binary' });
        const blob = new Blob([midiBuffer], { type: "audio/midi" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "music.midi";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
     } catch (e) {
        console.error(e);
        alert("Failed to generate MIDI");
     } finally {
        setIsExporting(null);
     }
  };

  const handleDownloadWav = async () => {
    setIsExporting('wav');
    let tempDiv: HTMLDivElement | null = null;
    
    try {
        // Step 1: Render visual object to a hidden div.
        tempDiv = document.createElement('div');
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        const visualObj = abcjs.renderAbc(tempDiv, abcNotation, {
            responsive: "resize"
        });

        if (!visualObj || visualObj.length === 0) {
            throw new Error("No music to render");
        }
        
        const tune = visualObj[0];

        // Step 2: Determine Duration via "Probe"
        // Strict adherence to requirement: 
        // 1. Do not rely on visualObj properties directly.
        // 2. Use synth.prime() to ensure SoundFonts are loaded.
        // 3. Get duration from the primed synth.
        
        let ctx = audioContextRef.current;
        if (!ctx || ctx.state === 'closed') {
             ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
             audioContextRef.current = ctx;
        }
        
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const probeSynth = new abcjs.synth.CreateSynth();
        
        // Initialize
        await probeSynth.init({
            audioContext: ctx,
            visualObj: tune,
            millisecondsPerMeasure: tune.millisecondsPerMeasure()
        });
        
        // CRITICAL: Prime the synth. This loads the actual audio buffers/SoundFonts.
        // Without this, the duration calculation might be incomplete or zero.
        await probeSynth.prime();
        
        // Now retrieve the duration.
        // Try documented .duration property first.
        let duration = (probeSynth as any).duration;
        
        // Fallback: Try to access underlying audio buffer if available (undocumented but requested).
        if (!duration && (probeSynth as any).audioBuffer) {
             duration = (probeSynth as any).audioBuffer.duration;
        }
        
        // Fallback: Calculate from encoded MIDI if synth failed (last resort).
        if (!duration) {
             const midi = abcjs.synth.getMidiFile(abcNotation, { midiOutputType: 'encoded' });
             if (midi && midi[0]) duration = midi[0].duration;
        }

        if (!duration || duration <= 0) {
             throw new Error("Could not determine audio duration.");
        }

        console.log(`WAV Export: Detected duration ${duration}s`);

        // Step 3: Setup Real OfflineAudioContext
        const tail = 2.0; 
        const totalDuration = duration + tail; 
        const sampleRate = 44100;
        
        // Ensure minimum length
        const lengthInSamples = Math.max(1024, Math.ceil(totalDuration * sampleRate));
        
        const offlineCtx = new OfflineAudioContext(2, lengthInSamples, sampleRate);

        // Monkey-patch resume()
        (offlineCtx as any).resume = async () => { return; };
        
        const renderSynth = new abcjs.synth.CreateSynth();
        
        // Step 4: Initialize Offline Synth with accurate duration context
        await renderSynth.init({
            audioContext: offlineCtx,
            visualObj: tune,
            millisecondsPerMeasure: tune.millisecondsPerMeasure()
        });
        
        await renderSynth.prime();
        
        renderSynth.start();

        // Step 5: Render
        const renderedBuffer = await offlineCtx.startRendering();
        
        // Check for silence
        let isSilent = true;
        for(let i=0; i<renderedBuffer.numberOfChannels; i++) {
            const data = renderedBuffer.getChannelData(i);
            for(let j=0; j<data.length; j+=1000) { 
                if(Math.abs(data[j]) > 0.0001) {
                    isSilent = false;
                    break;
                }
            }
            if(!isSilent) break;
        }

        if(isSilent) {
             console.warn("Rendered buffer appears to be silent.");
        }

        const wavBlob = audioBufferToWav(renderedBuffer);
        const url = window.URL.createObjectURL(wavBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "music.wav";
        document.body.appendChild(a);
        a.click();
        
        // Cleanup URL object
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);

    } catch (e) {
        console.error("WAV Export Error:", e);
        alert(`Failed to generate WAV: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
        if (tempDiv && document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
        }
        setIsExporting(null);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-white border-b sticky top-0 z-10 shadow-sm shrink-0 flex-wrap gap-2">
        <button
          onClick={handlePlay}
          disabled={isLoading || !!isExporting}
          className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isPlaying 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          } ${(isLoading || isExporting) ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
              <><Loader2 size={16} className="animate-spin" /> Loading</>
          ) : isPlaying ? (
              <><Square size={16} /> Stop</>
          ) : (
              <><Play size={16} /> Play</>
          )}
        </button>
        
        <div className="flex gap-2">
            <button 
                onClick={handleDownloadMidi}
                disabled={!!isExporting}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                title="Download Standard MIDI File"
            >
                {isExporting === 'midi' ? <Loader2 size={16} className="animate-spin" /> : <FileMusic size={16} />}
                MIDI
            </button>
            <button 
                onClick={handleDownloadWav}
                disabled={!!isExporting}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                title="Download WAV Audio File"
            >
                {isExporting === 'wav' ? <Loader2 size={16} className="animate-spin" /> : <FileAudio size={16} />}
                WAV
            </button>
        </div>
      </div>

      {/* Render Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-white p-4 min-h-[300px] flex items-start justify-center scroll-smooth"
      >
        <div id="paper" ref={paperRef} className="w-full max-w-5xl transition-opacity duration-300 ease-in-out" />
        {/* Helper text if empty */}
        {!abcNotation && (
            <div className="text-center text-slate-400 mt-20">
                <p>No music to render.</p>
                <p className="text-sm">Type ABC notation to compose.</p>
            </div>
        )}
      </div>
    </div>
  );
};

// Utility to convert AudioBuffer to WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const bufferLength = buffer.length;
    const byteRate = sampleRate * blockAlign;
    const dataByteCount = bufferLength * blockAlign;
    
    const bufferArray = new ArrayBuffer(44 + dataByteCount);
    const view = new DataView(bufferArray);
    
    // Writes a string into the dataview
    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataByteCount, true);
    writeString(8, 'WAVE');
    
    // fmt sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, format, true); // AudioFormat
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    
    // data sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataByteCount, true);
    
    // Write PCM samples
    // Interleave channels: L, R, L, R...
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < bufferLength; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            let sample = channels[ch][i];
            
            // Clip sample between -1 and 1
            sample = Math.max(-1, Math.min(1, sample));
            
            // Scale to 16-bit integer range
            // sample < 0 ? sample * 32768 : sample * 32767
            // Using bitwise OR 0 to ensure integer
            const intSample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
            
            view.setInt16(offset, intSample, true);
            offset += 2;
        }
    }
    
    return new Blob([bufferArray], { type: 'audio/wav' });
}

export default SheetMusic;