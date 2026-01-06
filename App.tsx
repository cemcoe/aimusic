import React, { useState, useRef } from 'react';
import { Music, Edit3, Eye } from 'lucide-react';
import SheetMusic from './components/SheetMusic';
import Editor from './components/Editor';
import HeaderVisualizer from './components/HeaderVisualizer';
import { ViewMode } from './types';

// Initial Demo Song
const DEFAULT_ABC = `%abc-2.1
H:第一首曲子
X:1
T:半生缘浅怎奈时光匆
C:Traditional / Arr. by cemcoe
M:6/8
L:1/8
Q:3/8=50
K:Am
%%staves {1 2}
%%MIDI program 1 68  % Oboe (Vocal line)
%%MIDI program 2 0   % Piano
%
V:1 clef=treble name="Voice"
V:2 clef=bass name="Piano"
%
% --- Intro (前奏) ---
[V:1] z6 | z6 | z6 | z4 !mp! E2 |
[V:2] !mp! A,EA c3 | G,DG B3 | F,CF A3 | E,B,E ^G3 |
%
% --- Verse 1: Memory (第一遍：月下独酌) ---
[V:1] c2 d e>fe | d2 B G>AB | c2 A A>^GA | B2 ^G E2 B |
w: 1.月 朦 胧 寒 风 吹 落 了 梧 桐， 孤 灯 下 谁 在 忆 芳 容。 那
[V:2] A,EA cBA | G,DG BAG | F,CF AGF | E,B,E ^GAB |
%
[V:1] c2 d e>fe | d2 B G>AB | c>BA ^G>FG | A3 A2 z |
w: 旧 时 光 却 太 过 匆 匆， 消 散 在 茫 茫 烟 雨 中。
[V:2] A,EA cBA | G,DG BAG | F,CF E,B,E | A,EA A,2 z |
%
% --- Chorus 1 (副歌：替换原词，情感升华) ---
[V:1] g3 g>fe | d2 B G>AB | c2 A A>^GA | B2 ^G E3 |
w: 啊， 叹 浮 生 似 梦 难 留， 带 走 我 全 部 的 温 柔。
[V:2] C,G,C e3 | G,,D,G, d3 | F,,C,F, c3 | E,,B,,E, B,3 |
%
[V:1] g3 g>fe | d2 B G>AB | c>BA ^G>FG | A3 A2 z |
w: 只 留 下 无 尽 的 哀 愁， 和 这 杯 苦 涩 的 烈 酒。
[V:2] C,G,C e3 | G,,D,G, d3 | F,CF E,B,E | A,3 A,CE |
%
% --- Interlude (间奏) ---
[V:1] z6 | z6 | z6 | z6 |
[V:2] A,EA cde | d2 B GAB | cBA ^G^FE | E^GB e2 E |
%
[V:1] z6 | z6 | z6 | z4 !mf! E2 |
[V:2] F,A,C F3 | G,B,D G3 | E,^G,B, E3 | E,3 z3 |
%
% --- Verse 2: Regret (第二遍：时光难留) ---
[V:1] c2 d e>fe | d2 B G>AB | c2 A A>^GA | B2 ^G E2 B |
w: 2.誓 言 轻 许 却 最 难 相 守， 任 岁 月 悄 悄 地 流 走。 我
[V:2] !mf! A,2 A cBA | G,2 G BAG | F,2 F AGF | E,2 E ^GAB |
%
[V:1] c2 d e>fe | d2 B G>AB | c>BA ^G>FG | A3 A2 z |
w: 依 然 伫 立 在 冷 风 路 口， 盼 望 能 再 牵 你 的 手。
[V:2] A,EA cBA | G,DG BAG | F,CF E,B,E | A,EA A,2 z |
%
[V:1] g3 g>fe | d2 B G>AB | c2 A A>^GA | B2 ^G E3 |
w: 啊， 念 伊 人 似 梦 难 留， 带 走 我 全 部 的 温 柔。
[V:2] C,G,C ege | G,,D,G, dgd | F,,C,F, cfc | E,,B,,E, B,eB, |
%
[V:1] g3 g>fe | d2 B G>AB | c>BA ^G>FG | A3 A2 z |
w: 只 留 下 无 尽 的 哀 愁， 和 这 杯 苦 涩 的 烈 酒。
[V:2] C,G,C ege | G,,D,G, dgd | F,CF E,B,E | A,3 A,z2 |
%
% --- Instrumental Variation (变奏：高音吟唱，无歌词) ---
[V:1] !f! c'3 c'>ba | b2 g d>ef | e2 c A>Bc | B2 ^G E2 e |
[V:2] !f! A,CE A3 | G,B,D G3 | F,A,C F3 | E,^G,B, E3 |
%
[V:1] c'3 c'>ba | b2 g d>ef | e>dc B>AG | A3 A2 z |
[V:2] A,CE A3 | G,B,D G3 | F,2 A, E,2 ^G, | A,3 A,,2 z |
%
[V:1] g3 g>fe | d2 B G>AB | c2 A A>^GA | B2 ^G E3 |
[V:2] C,E,G, c3 | G,,B,,D, B,3 | F,,A,,C, A,3 | E,,^G,,B,, ^G,3 |
%
[V:1] g3 g>fe | d2 B G>AB | c>BA ^G>FG | A3 A2 !ff! E |
[V:2] C,E,G, c3 | G,,B,,D, B,3 | F,2 A, E,2 ^G, | A,3 z3 |
%
% --- Verse 3: Climax (第三遍：高潮爆发) ---
[V:1] c2 d e>fe | d2 B G>AB | c2 A A>^GA | B2 ^G E2 B |
w: 3.夜 朦 胧 寒 风 吹 落 了 梧 桐， 孤 灯 下 谁 在 忆 芳 容。 那
[V:2] !ff! [A,3E3A3] [A,3C3e3] | [G,3D3G3] [G,3B,3d3] | [F,3C3F3] [F,3A,3c3] | [E,3B,3E3] [E,3^G,3d3] |
%
[V:1] c2 d e>fe | d2 B G>AB | c>BA ^G>FG | A3 A2 z |
w: 旧 时 光 却 太 过 匆 匆， 消 散 在 茫 茫 烟 雨 中。
[V:2] [A,3E3A3] [A,3C3e3] | [G,3D3G3] [G,3B,3d3] | F,A,C E,^G,B, | A,3 A,,2 z |
%
% --- Chorus Reprise (副歌再现：问苍天) ---
[V:1] g3 g>fe | d2 B G>AB | c2 A A>^GA | B2 ^G E3 |
w: 啊， 问 苍 天 你 在 何 方？ 徒 留 我 寂 寞 和 凄 凉。
[V:2] C,G,C e3 | G,,D,G, d3 | F,,C,F, c3 | E,,B,,E, B,3 |
%
[V:1] g3 g>fe | d2 B G>AB | c>BA ^G>FG | A3 A2 z |
w: 若 今 生 无 缘 再 成 双， 愿 来 世 不 负 这 时 光。
[V:2] C,G,C e3 | G,,D,G, d3 | F,CF E,B,E | A,3 A,CE |
%
% --- Outro (尾声) ---
[V:1] !mp! c>BA ^G>FG | A3 F3 | E6- | E6 |]
w: 愿 来 世 不 负 这 时 光。 _
[V:2] !mp! F,3 E,3 | D,3 D,3 | C,3 B,,3 | [A,,6E,6A,6] |]`;

const App: React.FC = () => {
  const [abcString, setAbcString] = useState<string>(DEFAULT_ABC);
  const [mobileView, setMobileView] = useState<ViewMode>(ViewMode.PREVIEW);
  const [isEditorVisible, setIsEditorVisible] = useState(true);

  // Shared state for visualization: Index = MIDI Pitch (0-127), Value = Energy (0.0 - 1.0)
  const visualizerDataRef = useRef(new Float32Array(128));

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden font-sans">
      
      {/* Header */}
      <header className="relative bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20 overflow-hidden">
        
        {/* Background Visualizer */}
        <HeaderVisualizer dataRef={visualizerDataRef} />

        {/* Content (Z-Index ensures it sits above visualizer) */}
        <div className="flex items-center gap-2 z-10 relative">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Music size={20} />
          </div>
          <h1 className="font-bold text-lg text-slate-800 tracking-tight">Sheet Music Composer</h1>
          
          {/* Desktop Editor Toggle */}
          {!isEditorVisible && (
             <button 
                onClick={() => setIsEditorVisible(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 ml-2 bg-slate-100/80 hover:bg-slate-200 backdrop-blur-sm text-slate-700 rounded-full text-sm font-medium transition-colors border border-slate-200"
             >
                <Edit3 size={16} />
                <span>Editor</span>
             </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 z-10 relative">
            <a 
                href="https://abcnotation.com/wiki/abc:standard:v2.1" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-slate-500 hover:text-indigo-600"
            >
                ABC Docs
            </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Editor Pane (Desktop: Left, Mobile: Conditional) */}
        <div className={`
            ${mobileView === ViewMode.EDITOR ? 'flex' : 'hidden'} 
            md:${isEditorVisible ? 'flex' : 'hidden'} md:w-1/3 lg:w-2/5 border-r border-slate-200 z-10
            absolute md:relative inset-0 bg-white
        `}>
          <Editor 
            value={abcString} 
            onChange={setAbcString} 
            onClose={() => {
                setMobileView(ViewMode.PREVIEW);
                setIsEditorVisible(false);
            }} 
          />
        </div>

        {/* Preview Pane (Desktop: Right, Mobile: Conditional) */}
        <div className={`
            ${mobileView === ViewMode.PREVIEW ? 'flex' : 'hidden'} 
            md:flex flex-1 flex-col bg-slate-50 relative z-0
        `}>
           <SheetMusic abcNotation={abcString} visualizerData={visualizerDataRef} />
           
           {/* Mobile View Toggle FAB */}
            <div className="md:hidden absolute bottom-6 right-6 z-50">
                <button
                    onClick={() => {
                        setMobileView(mobileView === ViewMode.PREVIEW ? ViewMode.EDITOR : ViewMode.PREVIEW);
                        setIsEditorVisible(true); // Ensure it's marked visible if toggled on mobile
                    }}
                    className="bg-slate-900 text-white p-4 rounded-full shadow-xl hover:bg-slate-800 transition-transform active:scale-95 flex items-center justify-center"
                >
                    {mobileView === ViewMode.PREVIEW ? <Edit3 size={24} /> : <Eye size={24} />}
                </button>
            </div>
        </div>
      </main>

    </div>
  );
};

export default App;