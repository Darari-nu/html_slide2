
import React, { useRef, useEffect } from 'react';
import type { SelectionRange } from '../types';

interface CodeEditorProps {
  htmlContent: string;
  onChangeContent: (newContent: string) => void;
  selectionRange: SelectionRange | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  htmlContent,
  onChangeContent,
  selectionRange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectionRange && textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(() => {
        if(textareaRef.current) { 
           textareaRef.current.setSelectionRange(selectionRange.start, selectionRange.end);
            const textToSelection = textareaRef.current.value.substring(0, selectionRange.start);
            const lines = textToSelection.split('\n').length;
            
            const lineHeightStyle = window.getComputedStyle(textareaRef.current).lineHeight;
            let lineHeight = 20; // Default line height
            if (lineHeightStyle && lineHeightStyle !== 'normal') {
                lineHeight = parseFloat(lineHeightStyle);
            } else if (textareaRef.current.style.fontSize) {
                lineHeight = parseFloat(window.getComputedStyle(textareaRef.current).fontSize) * 1.4; // Estimate for 'normal'
            }

            const scrollTop = Math.max(0, (lines - 5) * lineHeight); // Try to center selection a bit
            textareaRef.current.scrollTop = scrollTop;
        }
      }, 0);
    }
  }, [selectionRange]);

  return (
    <textarea
      ref={textareaRef}
      value={htmlContent}
      onChange={(e) => onChangeContent(e.target.value)}
      className="w-full h-full p-4 bg-[var(--color-white)] text-[var(--color-text-primary)] border-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-mono text-sm resize-none leading-relaxed whitespace-pre flat-input"
      style={{ caretColor: 'var(--color-primary)' }}
      spellCheck="false"
      wrap="off"
      aria-label="HTML Code Editor"
    />
  );
};