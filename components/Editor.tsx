import React from 'react';
import { X } from 'lucide-react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, onClose }) => {
  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      <div className="p-3 bg-slate-800 text-xs font-mono text-slate-400 border-b border-slate-700 flex justify-between items-center">
         <span className="font-bold text-slate-300">ABC Editor</span>
         <button 
           onClick={onClose} 
           className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100 transition-colors"
           title="Close Editor"
         >
           <X size={16} />
         </button>
      </div>
      <textarea
        className="flex-1 w-full bg-slate-900 text-slate-200 font-mono text-sm p-4 outline-none resize-none leading-relaxed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="X: 1&#10;T: Title&#10;K: C&#10;C D E F | G A B c |"
      />
    </div>
  );
};

export default Editor;