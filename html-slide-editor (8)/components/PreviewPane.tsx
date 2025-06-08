
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface PreviewPaneProps {
  htmlContent: string;
}

const PreviewPane = forwardRef<HTMLIFrameElement, PreviewPaneProps>(({ htmlContent }, ref) => {
  const localIframeRef = useRef<HTMLIFrameElement>(null);
  useImperativeHandle(ref, () => localIframeRef.current as HTMLIFrameElement);
  
  const iframeElementClickScript = `
    <script>
      document.body.addEventListener('click', function(event) {
        let target = event.target;
        let chosenElement = null;
        const significantTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE', 'FIGURE', 'ARTICLE', 'SECTION', 'ASIDE', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'TABLE', 'UL', 'OL', 'IMG', 'BUTTON', 'A', 'SPAN'];
        
        let current = target;
        for (let i = 0; i < 7 && current && current !== document.body; i++) {
          const currentTagName = current.tagName.toUpperCase();
          if (significantTags.includes(currentTagName) || current.classList.length > 0 || Object.keys(current.dataset).length > 0) {
            chosenElement = current;
            break;
          }
          if (currentTagName === 'DIV' && (current.parentElement === document.body || current.classList.length > 0 || Object.keys(current.dataset).length > 0)) {
              chosenElement = current;
              break;
          }
          if (!current.parentElement) break;
          current = current.parentElement;
        }

        if (!chosenElement && target && target !== document.body) {
          chosenElement = target; 
        }
        
        if (chosenElement && chosenElement !== document.body) {
          window.parent.postMessage({
            type: 'previewElementClicked',
            outerHTML: chosenElement.outerHTML,
          }, '*');
        }
      }, true);
    </script>
  `;

  // Base styles for the iframe content to match the flat theme
  const flatIframeStyles = `
    <style>
      :root {
        --color-base-rgb: 249,249,249;
        --color-primary-rgb: 74,144,226;
        --color-text-primary-rgb: 51,51,51;
        --font-sans: 'Roboto', 'Lato', sans-serif; /* Consistent with main app */
      }
      body { 
        margin: 0; 
        min-height: 100vh;
        width: 100vw; 
        overflow: auto; 
        background-color: rgb(var(--color-base-rgb)); 
        color: rgb(var(--color-text-primary-rgb));
        font-family: var(--font-sans);
        line-height: 1.6;
      }
      /* Clickable cursor for elements */
      h1, h2, h3, h4, h5, h6, p, li, div, span, img, a, button { 
        cursor: pointer; 
      }
      ::selection { /* Selection highlight inside iframe */
        background-color: rgb(var(--color-primary-rgb), 0.3); /* Lighter primary for selection */
        color: inherit;
      }
      ::-moz-selection {
        background-color: rgb(var(--color-primary-rgb), 0.3);
        color: inherit;
      }
    </style>
  `;

  const srcDocContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <script src="https://cdn.tailwindcss.com"></script>
      ${flatIframeStyles}
    </head>
    <body>
      ${htmlContent}
      ${iframeElementClickScript}
    </body>
    </html>
  `;

  useEffect(() => {
    const iframe = localIframeRef.current;
    if (iframe) {
      iframe.srcdoc = srcDocContent;
    }
  }, [htmlContent, srcDocContent]); // srcDocContent dependency added

  return (
    <iframe
      ref={localIframeRef}
      title="Slide Preview"
      className="w-full h-full border-none bg-[var(--color-base)]"
      sandbox="allow-scripts allow-same-origin"
    />
  );
});

PreviewPane.displayName = 'PreviewPane';
export { PreviewPane };