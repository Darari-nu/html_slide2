
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SlideList } from './components/SlideList';
import { CodeEditor } from './components/CodeEditor';
import { PreviewPane } from './components/PreviewPane';
import { PresentationView } from './components/PresentationView';
import type { Slide, SelectionRange } from './types';
import { DEFAULT_SLIDE_CONTENT } from './constants';
import { PlayIcon, UploadIcon, DownloadIcon, SunIcon, MoonIcon } from './components/Icons';

type PresentationTheme = 'white' | 'black';

const App: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>(() => {
    const savedSlides = localStorage.getItem('slides');
    if (savedSlides) {
      try {
        const parsedSlides = JSON.parse(savedSlides);
        if (Array.isArray(parsedSlides) && parsedSlides.every(
          (slide: any) => 
            typeof slide === 'object' && slide !== null &&
            typeof slide.id === 'string' &&
            typeof slide.title === 'string' &&
            typeof slide.htmlContent === 'string'
          )
        ) {
          return parsedSlides;
        }
      } catch (e) {
        console.error("Error parsing slides from localStorage:", e);
      }
    }
    return [
      { id: Date.now().toString(), title: 'Slide 1', htmlContent: DEFAULT_SLIDE_CONTENT }
    ];
  });

  const [activeSlideId, setActiveSlideId] = useState<string | null>(slides.length > 0 ? slides[0].id : null);
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentationSlideIndex, setPresentationSlideIndex] = useState(0);
  const [presentationTheme, setPresentationTheme] = useState<PresentationTheme>(() => {
    return (localStorage.getItem('presentationTheme') as PresentationTheme) || 'white';
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('slides', JSON.stringify(slides));
  }, [slides]);

  useEffect(() => {
    localStorage.setItem('presentationTheme', presentationTheme);
  }, [presentationTheme]);

  const handleAddSlide = useCallback(() => {
    const newSlideId = Date.now().toString();
    const newSlide: Slide = {
      id: newSlideId,
      title: `Slide ${slides.length + 1}`,
      htmlContent: DEFAULT_SLIDE_CONTENT,
    };
    setSlides(prevSlides => [...prevSlides, newSlide]);
    setActiveSlideId(newSlideId);
    setSelectionRange(null);
  }, [slides.length]);

  const handleDeleteSlide = useCallback((slideIdToDelete: string) => {
    setSlides(prevSlides => {
      const currentDeletingIndex = prevSlides.findIndex(s => s.id === slideIdToDelete);
      const newSlides = prevSlides.filter(slide => slide.id !== slideIdToDelete);
      
      if (activeSlideId === slideIdToDelete) {
        if (newSlides.length > 0) {
          const nextActiveIndex = Math.max(0, Math.min(currentDeletingIndex, newSlides.length - 1));
          setActiveSlideId(newSlides[nextActiveIndex]?.id || null);
        } else {
          setActiveSlideId(null);
        }
      }
      return newSlides;
    });
    setSelectionRange(null);
  }, [activeSlideId]);

  const handleUpdateSlideContent = useCallback((slideId: string, newContent: string) => {
    setSlides(prevSlides =>
      prevSlides.map(slide =>
        slide.id === slideId ? { ...slide, htmlContent: newContent } : slide
      )
    );
     const h1Match = newContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
     if (h1Match && h1Match[1]) {
       const newTitle = h1Match[1].replace(/<[^>]+>/g, '').trim().substring(0,30); // Strip HTML tags from title
       setSlides(prevSlides =>
         prevSlides.map(slide =>
           slide.id === slideId ? { ...slide, title: newTitle || `Slide ${prevSlides.findIndex(s => s.id === slideId) + 1}` } : slide
         )
       );
     }
  }, []);

  const activeSlide = slides.find(slide => slide.id === activeSlideId);
  const activeSlideIndex = slides.findIndex(slide => slide.id === activeSlideId);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || !event.data || event.data.type !== 'previewElementClicked') {
        return;
      }
      
      const { outerHTML } = event.data;
      if (activeSlide && outerHTML) {
        const code = activeSlide.htmlContent;
        const startIndex = code.indexOf(outerHTML);
        if (startIndex !== -1) {
          setSelectionRange({ start: startIndex, end: startIndex + outerHTML.length });
        } else {
          setSelectionRange(null);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [activeSlide, iframeRef]);

  const handleStartPresentation = () => {
    const startIndex = activeSlideIndex !== -1 ? activeSlideIndex : 0;
    if (slides.length > 0) {
      setPresentationSlideIndex(startIndex);
      setIsPresenting(true);
    } else {
      alert("No slides to present. Please create some slides first.");
    }
  };

  const handleExitPresentation = useCallback(() => {
    setIsPresenting(false);
    if (slides[presentationSlideIndex]) {
      setActiveSlideId(slides[presentationSlideIndex].id);
    }
     if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
    }
  }, [slides, presentationSlideIndex, setIsPresenting, setActiveSlideId]);

  const handleNavigatePresentation = useCallback((newIndex: number) => {
    setPresentationSlideIndex(newIndex);
  }, [setPresentationSlideIndex]);

  const handleExportSlides = useCallback(() => {
    if (slides.length === 0) {
      alert("No slides to export.");
      return;
    }
    const dataStr = JSON.stringify(slides, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'slides_export.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [slides]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedSlides = JSON.parse(text);

        if (
          Array.isArray(importedSlides) &&
          importedSlides.every(
            (slide: any) =>
              typeof slide === 'object' &&
              slide !== null &&
              typeof slide.id === 'string' &&
              typeof slide.title === 'string' &&
              typeof slide.htmlContent === 'string'
          )
        ) {
          setSlides(importedSlides);
          setActiveSlideId(importedSlides.length > 0 ? importedSlides[0].id : null);
          setSelectionRange(null);
          alert(`Successfully imported ${importedSlides.length} slide(s).`);
        } else {
          alert('Invalid slide file format. Please select a valid JSON file.');
        }
      } catch (error) {
        console.error('Error importing slides:', error);
        alert('Failed to import slides. The file may be corrupted or in an incompatible format.');
      }
    };
    reader.onerror = () => {
      alert('Error reading the file.');
    };
    reader.readAsText(file);
    if(event.target) event.target.value = '';
  };


  if (isPresenting) {
    return (
      <PresentationView
        slides={slides}
        currentSlideIndex={presentationSlideIndex}
        onExit={handleExitPresentation}
        onNavigate={handleNavigatePresentation}
        theme={presentationTheme}
      />
    );
  }
  
  const themeButtonBaseClasses = "w-1/2 flex items-center justify-center text-sm py-2 px-3 rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] font-medium";
  const themeButtonInactiveClasses = "bg-transparent text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[rgba(var(--color-primary-rgb),0.05)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]";


  return (
    <div className="flex h-screen w-screen bg-[var(--color-base)] text-[var(--color-text-primary)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-[var(--color-white)] p-4 flex flex-col overflow-y-auto border-r border-[var(--color-border)] shadow-md">
        <div className="space-y-3 mb-4">
            <button
                onClick={handleImportClick}
                className="w-full flat-button secondary"
                aria-label="Import slides from JSON file"
            >
                <UploadIcon className="w-5 h-5 mr-2" />
                Import Slides
            </button>
            <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileSelected}
                style={{ display: 'none' }}
                aria-hidden="true"
            />
            <button
                onClick={handleExportSlides}
                disabled={slides.length === 0}
                className="w-full flat-button secondary"
                aria-label="Export slides to JSON file"
            >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Export Slides
            </button>
             <hr className="border-[var(--color-border)] my-3" />
            <button
                onClick={handleStartPresentation}
                disabled={slides.length === 0}
                className="w-full flat-button accent3"
                aria-label="Start presentation"
            >
                <PlayIcon className="w-5 h-5 mr-2" />
                Present
            </button>
            <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 text-center">Presentation Background</p>
              <div className="flex space-x-2 items-center">
                <button 
                  onClick={() => setPresentationTheme('white')} 
                  className={`${themeButtonBaseClasses} ${
                    presentationTheme === 'white' 
                      ? 'bg-[var(--color-primary)] text-[var(--color-white)] border border-[var(--color-primary)] shadow-sm' 
                      : themeButtonInactiveClasses
                  }`}
                  aria-pressed={presentationTheme === 'white'}
                >
                  <SunIcon className="w-4 h-4 mr-1.5"/> White
                </button>
                <button 
                  onClick={() => setPresentationTheme('black')} 
                   className={`${themeButtonBaseClasses} ${
                    presentationTheme === 'black' 
                      ? 'bg-[var(--color-text-primary)] text-[var(--color-white)] border border-[var(--color-text-primary)] shadow-sm' 
                      : themeButtonInactiveClasses
                  }`}
                  aria-pressed={presentationTheme === 'black'}
                >
                   <MoonIcon className="w-4 h-4 mr-1.5"/> Black
                </button>
              </div>
            </div>
        </div>
        <SlideList
          slides={slides}
          activeSlideId={activeSlideId}
          onSelectSlide={(id) => { setActiveSlideId(id); setSelectionRange(null);}}
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
        />
      </div>
      
      {/* Main Content Area (Editor & Preview) */}
      <div className="flex-1 flex flex-col bg-[var(--color-base)] overflow-hidden">
        {activeSlide ? (
          <CodeEditor
            htmlContent={activeSlide.htmlContent}
            onChangeContent={(newContent) => handleUpdateSlideContent(activeSlide.id, newContent)}
            selectionRange={selectionRange}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--color-text-secondary)] opacity-75 p-4">
            <p className="text-xl text-center">Select a slide to edit or create a new one.</p>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col bg-[var(--color-base)] overflow-hidden border-l border-[var(--color-border)]">
         {activeSlide ? (
          <PreviewPane htmlContent={activeSlide.htmlContent} ref={iframeRef} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--color-text-secondary)] opacity-75 bg-[var(--color-white)] p-4">
             <p className="text-xl text-center">Preview will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
