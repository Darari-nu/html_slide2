
import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import type { Slide } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon, PlusIcon, MinusIcon, ArrowUpIcon, ArrowDownIcon, ArrowLeftSIcon, ArrowRightSIcon, ArrowPathIcon } from './Icons';

type PresentationTheme = 'white' | 'black';

interface PresentationViewProps {
  slides: Slide[];
  currentSlideIndex: number;
  onExit: () => void;
  onNavigate: (newIndex: number) => void;
  theme: PresentationTheme;
}

interface ExtractedParts {
  headContent: string;
  bodyContent: string;
}

function extractSlideParts(htmlString: string): ExtractedParts {
  const trimmedHtml = htmlString.trim();
  const isFullDoc = /<!DOCTYPE html|<html[^>]*>/i.test(trimmedHtml);

  if (!isFullDoc) {
    return { 
        headContent: '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script>', 
        bodyContent: trimmedHtml 
    };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmedHtml, 'text/html');
    
    let headElements: string[] = [];
    if (!doc.head.querySelector('meta[charset]')) {
        headElements.push('<meta charset="UTF-8">');
    }
    if (!doc.head.querySelector('meta[name="viewport"]')) {
        headElements.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }
    if (Array.from(doc.head.querySelectorAll('script')).every(s => !s.src.includes('cdn.tailwindcss.com'))) {
        headElements.push('<script src="https://cdn.tailwindcss.com"></script>');
    }
    
    doc.head.querySelectorAll('style, link[rel="stylesheet"], script, meta, title').forEach(el => {
      headElements.push(el.outerHTML);
    });
    
    const bodyInnerHTML = doc.body ? doc.body.innerHTML : '';
    
    return {
      headContent: headElements.join('\n'),
      bodyContent: bodyInnerHTML,
    };
  } catch (e) {
    console.error("Error parsing slide HTML, treating as fragment:", e);
    return { 
        headContent: '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script>', 
        bodyContent: trimmedHtml 
    };
  }
}


export const PresentationView: React.FC<PresentationViewProps> = ({
  slides,
  currentSlideIndex,
  onExit,
  onNavigate,
  theme,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentSlide = slides[currentSlideIndex];
  const externalExitCalledRef = useRef(false);
  
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimerRef = useRef<number | null>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);


  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 3.0;
  const ZOOM_STEP = 0.1;
  const PAN_STEP = 30;

  const showControlsAndResetTimer = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    controlsTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 5000);
  }, []);

  useEffect(() => {
    showControlsAndResetTimer();
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [showControlsAndResetTimer, currentSlideIndex]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prevZoom => Math.min(MAX_ZOOM, prevZoom + ZOOM_STEP));
    showControlsAndResetTimer();
  }, [showControlsAndResetTimer]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prevZoom => Math.max(MIN_ZOOM, prevZoom - ZOOM_STEP));
    showControlsAndResetTimer();
  }, [showControlsAndResetTimer]);

  const handlePan = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    switch (direction) {
      case 'up': setOffsetY(prev => prev - PAN_STEP); break;
      case 'down': setOffsetY(prev => prev + PAN_STEP); break;
      case 'left': setOffsetX(prev => prev - PAN_STEP); break;
      case 'right': setOffsetX(prev => prev + PAN_STEP); break;
    }
    showControlsAndResetTimer();
  }, [PAN_STEP, showControlsAndResetTimer]);

  const handleResetView = useCallback(() => {
    setZoomLevel(1.0);
    setOffsetX(0);
    setOffsetY(0);
    showControlsAndResetTimer();
  }, [showControlsAndResetTimer]);


  useEffect(() => {
    externalExitCalledRef.current = false; 

    const handleExternalFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      if (!isCurrentlyFullscreen && !externalExitCalledRef.current) {
        externalExitCalledRef.current = true; 
        onExit(); 
      }
    };
    
    document.addEventListener('fullscreenchange', handleExternalFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleExternalFullscreenChange);
    };
  }, [onExit]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' && !(event.ctrlKey || event.metaKey)) goToNextSlide();
      else if (event.key === 'ArrowLeft' && !(event.ctrlKey || event.metaKey)) goToPrevSlide();
      else if (event.key === 'Escape') {
        if (!externalExitCalledRef.current) { externalExitCalledRef.current = true; onExit(); }
      } else if ((event.key === '+' || event.key === '=') && !event.shiftKey) handleZoomIn();
      else if (event.key === '-') handleZoomOut();
      else if (event.ctrlKey || event.metaKey) {
        if (event.key === 'ArrowUp') { event.preventDefault(); handlePan('up'); }
        else if (event.key === 'ArrowDown') { event.preventDefault(); handlePan('down'); }
        else if (event.key === 'ArrowLeft') { event.preventDefault(); handlePan('left'); }
        else if (event.key === 'ArrowRight') { event.preventDefault(); handlePan('right'); }
        else if (event.key === '0') { event.preventDefault(); handleResetView(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlideIndex, slides.length, onExit, onNavigate, handleZoomIn, handleZoomOut, handlePan, handleResetView]);

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) onNavigate(currentSlideIndex + 1);
    showControlsAndResetTimer();
  };

  const goToPrevSlide = () => {
    if (currentSlideIndex > 0) onNavigate(currentSlideIndex - 1);
    showControlsAndResetTimer();
  };

  const slideParts = useMemo(() => {
    if (!currentSlide) return { headContent: '', bodyContent: '' };
    return extractSlideParts(currentSlide.htmlContent);
  }, [currentSlide]);

  const isDarkTheme = theme === 'black';
  const iframeDefaultBg = isDarkTheme ? 'rgb(0,0,0)' : 'rgb(var(--color-base-rgb))';
  const iframeDefaultText = isDarkTheme ? 'rgb(220,220,220)' : 'rgb(var(--color-text-primary-rgb))';

  const srcDocContent = useMemo(() => {
    if (!currentSlide) return '';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      ${slideParts.headContent}
      <style>
        :root { 
            --color-base-rgb: ${isDarkTheme ? '0,0,0' : '249,249,249'};
            --color-text-primary-rgb: ${isDarkTheme ? '220,220,220' : '51,51,51'};
            --font-sans: 'Roboto', 'Lato', sans-serif;
        }
        body { 
            margin: 0; 
            min-height: 100vh;
            width: 100vw; 
            overflow: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: ${iframeDefaultBg}; 
            color: ${iframeDefaultText};
            font-family: var(--font-sans);
        }
        #slide-scaler-wrapper {
            width: 1280px; 
            height: 720px;
            min-height: 720px;
            transform-origin: center center;
            overflow: visible; 
            position: relative;
        }
      </style>
    </head>
    <body>
      <div id="slide-scaler-wrapper">
        ${slideParts.bodyContent}
      </div>
      <script>
        const scalerWrapper = document.getElementById('slide-scaler-wrapper');
        
        function applyTransform(zoom, x, y) {
          if (!scalerWrapper) return;
          scalerWrapper.style.transform = 'translateX(' + x + 'px) translateY(' + y + 'px) scale(' + zoom + ')';
        }

        window.addEventListener('message', (event) => {
          if (event.source !== window.parent || !event.data || event.data.type !== 'UPDATE_PRESENTATION_TRANSFORM') {
            return;
          }
          const { zoom, x, y } = event.data;
          applyTransform(zoom, x, y);
        });

        // Signal to parent that iframe is ready
        if (document.readyState === 'complete') {
          window.parent.postMessage({ type: 'PRESENTATION_IFRAME_READY' }, '*');
        } else {
          window.addEventListener('load', () => {
            window.parent.postMessage({ type: 'PRESENTATION_IFRAME_READY' }, '*');
          });
        }
      </script>
    </body>
    </html>
  `;
  }, [currentSlide, slideParts, isDarkTheme, iframeDefaultBg, iframeDefaultText]); // zoom, offset removed

  // Effect to set/reset iframe ready state
  useEffect(() => {
    setIsIframeReady(false); // Reset when srcDoc is about to change
  }, [srcDocContent]);

  // Listen for ready message from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source === iframeRef.current?.contentWindow && event.data?.type === 'PRESENTATION_IFRAME_READY') {
        setIsIframeReady(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); 

  // Post transform updates to iframe
  useEffect(() => {
    if (isIframeReady && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'UPDATE_PRESENTATION_TRANSFORM',
          zoom: zoomLevel,
          x: offsetX,
          y: offsetY,
        },
        '*'
      );
    }
  }, [isIframeReady, zoomLevel, offsetX, offsetY]);


  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && srcDocContent) {
      iframe.srcdoc = srcDocContent;
    }
  }, [srcDocContent]); 

  const mainViewBgClass = isDarkTheme ? 'bg-black' : 'bg-[var(--color-base)]';
  const controlTextColorClass = isDarkTheme ? 'text-gray-200' : 'text-[var(--color-text-primary)]';
  const controlBgClass = isDarkTheme ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-[var(--color-white)] hover:bg-opacity-90';
  const controlDisabledTextClass = isDarkTheme ? 'disabled:text-gray-500' : 'disabled:text-gray-400';
  const controlBaseButtonClasses = `p-2 sm:p-2.5 rounded-lg ${controlTextColorClass} transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm hover:shadow-md`;
  const controlDisabledButtonClasses = `disabled:opacity-60 disabled:cursor-not-allowed ${controlDisabledTextClass} ${isDarkTheme ? 'disabled:hover:bg-neutral-800' : 'disabled:hover:bg-[var(--color-white)]'} disabled:shadow-sm`;


  if (!currentSlide) {
    return (
      <div className={`fixed inset-0 ${mainViewBgClass} ${controlTextColorClass} flex flex-col items-center justify-center p-4`}>
        <p className="text-2xl mb-6">No Slide</p>
        <button
          onClick={() => {
            if (!externalExitCalledRef.current) { externalExitCalledRef.current = true; onExit(); }
          }}
          className={`flat-button ${isDarkTheme ? 'bg-red-700 hover:bg-red-600 text-white' : 'warning'}`}
          aria-label="Exit presentation"
        >
          Exit
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`fixed inset-0 ${mainViewBgClass} flex items-center justify-center ${controlTextColorClass} select-none`}
      onMouseMove={showControlsAndResetTimer}
      onFocus={showControlsAndResetTimer}
    >
      <iframe
        ref={iframeRef}
        title={`Presentation Slide ${currentSlideIndex + 1}`}
        className="w-full h-full border-none" 
        sandbox="allow-scripts allow-same-origin" 
      />

      {/* Navigation Controls Overlay */}
      <div className={`fixed inset-0 flex items-center justify-between p-3 sm:p-5 pointer-events-none transition-opacity duration-300 ease-in-out ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={goToPrevSlide}
          disabled={currentSlideIndex === 0}
          className={`${controlBaseButtonClasses} ${controlBgClass} ${controlDisabledButtonClasses} ${controlsVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
          aria-label="Previous Slide"
        >
          <ChevronLeftIcon className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
        <button
          onClick={goToNextSlide}
          disabled={currentSlideIndex === slides.length - 1}
          className={`${controlBaseButtonClasses} ${controlBgClass} ${controlDisabledButtonClasses} ${controlsVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
          aria-label="Next Slide"
        >
          <ChevronRightIcon className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>

       {/* Top Controls Bar */}
       <div className={`fixed top-0 left-0 right-0 p-3 sm:p-4 flex justify-between items-center bg-gradient-to-b ${isDarkTheme ? 'from-[rgba(0,0,0,0.7)]' : 'from-[rgba(var(--color-base-rgb),0.8)]'} to-transparent pointer-events-auto`}> 
          <button
            onClick={() => { if (!externalExitCalledRef.current) { externalExitCalledRef.current = true; onExit(); } }}
            className={`${controlBaseButtonClasses} ${isDarkTheme ? 'bg-neutral-800 hover:bg-red-700 hover:text-white focus:ring-red-500' : 'bg-[var(--color-white)] hover:bg-[var(--color-accent-2)] hover:text-[var(--color-white)] focus:ring-[var(--color-accent-2)]'}`}
            aria-label="Exit Presentation"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className={`flex items-center space-x-1 sm:space-x-2 transition-opacity duration-300 ease-in-out ${controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className={`flex items-center space-x-1 ${controlBgClass} px-2 py-1 rounded-lg shadow-sm`}>
              <button onClick={handleResetView} className={`${controlBaseButtonClasses} p-1 sm:p-1.5`} aria-label="Reset View (Ctrl+0)"> <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" /> </button>
              <button onClick={() => handlePan('left')} className={`${controlBaseButtonClasses} p-1 sm:p-1.5`} aria-label="Pan Left (Ctrl+Left)"> <ArrowLeftSIcon className="w-4 h-4 sm:w-5 sm:h-5" /> </button>
              <button onClick={() => handlePan('right')} className={`${controlBaseButtonClasses} p-1 sm:p-1.5`} aria-label="Pan Right (Ctrl+Right)"> <ArrowRightSIcon className="w-4 h-4 sm:w-5 sm:h-5" /> </button>
              <button onClick={() => handlePan('up')} className={`${controlBaseButtonClasses} p-1 sm:p-1.5`} aria-label="Pan Up (Ctrl+Up)"> <ArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5" /> </button>
              <button onClick={() => handlePan('down')} className={`${controlBaseButtonClasses} p-1 sm:p-1.5`} aria-label="Pan Down (Ctrl+Down)"> <ArrowDownIcon className="w-4 h-4 sm:w-5 sm:h-5" /> </button>
            </div>

            <div className={`flex items-center space-x-1 ${controlBgClass} px-2 py-1 rounded-lg shadow-sm`}>
              <button onClick={handleZoomOut} disabled={zoomLevel <= MIN_ZOOM} className={`${controlBaseButtonClasses} ${controlDisabledButtonClasses} p-1 sm:p-1.5`} aria-label="Zoom Out (-)"> <MinusIcon className="w-4 h-4 sm:w-5 sm:h-5" /> </button>
              <span className={`text-xs sm:text-sm font-medium ${controlTextColorClass} w-10 text-center tabular-nums`}> {Math.round(zoomLevel * 100)}% </span>
              <button onClick={handleZoomIn} disabled={zoomLevel >= MAX_ZOOM} className={`${controlBaseButtonClasses} ${controlDisabledButtonClasses} p-1 sm:p-1.5`} aria-label="Zoom In (+)"> <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" /> </button>
            </div>
          </div>

          <span className={`text-sm sm:text-base font-medium ${controlBgClass} ${controlTextColorClass} px-3 py-1.5 rounded-lg shadow-sm tabular-nums`}>
            {currentSlideIndex + 1} / {slides.length}
          </span>
      </div>
    </div>
  );
};
