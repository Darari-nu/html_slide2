import React from 'react';
import type { Slide } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface SlideListProps {
  slides: Slide[];
  activeSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onDeleteSlide: (id: string) => void;
}

export const SlideList: React.FC<SlideListProps> = ({
  slides,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
}) => {
  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onAddSlide}
        className="w-full flat-button text-[var(--color-white)] mb-4" // Relies on CSS for active state text and background
        aria-label="Add new slide"
      >
        <PlusIcon className="w-5 h-5 mr-2" /> {/* Icon color will be currentColor from button */}
        New Slide
      </button>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => onSelectSlide(slide.id)}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-150 group relative border
            ${
              activeSlideId === slide.id
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] shadow-md text-[var(--color-white)]' // Active: Primary background, white text
                : 'bg-[var(--color-white)] border-[var(--color-border)] hover:border-[var(--color-secondary)] hover:bg-[var(--color-secondary)] hover:bg-opacity-10 text-[var(--color-text-primary)]' // Non-active
            }`}
            style={{boxShadow: activeSlideId === slide.id ? '0 2px 5px rgba(var(--color-primary-rgb-r), var(--color-primary-rgb-g), var(--color-primary-rgb-b), 0.2)' : 'none'}}
          >
            {activeSlideId === slide.id && <div className="absolute top-0 left-0 h-full w-1.5 bg-[var(--color-primary)] rounded-l-md"></div>}
            <div className="flex justify-between items-center ml-1">
              <span className={`font-medium truncate text-sm flex-1 text-center 
                ${activeSlideId === slide.id 
                  ? 'text-[var(--color-white)]' // Active title text
                  : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]' // Non-active title text
                }`}
              >
                {index + 1}. {slide.title || `Slide ${index + 1}`}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); 
                  onDeleteSlide(slide.id);
                }}
                className={`ml-2 p-1.5 rounded-full transition-colors duration-150 
                  ${activeSlideId === slide.id 
                    ? 'opacity-75 text-[var(--color-white)] hover:opacity-100 hover:bg-[rgba(var(--color-white-rgb-r),var(--color-white-rgb-g),var(--color-white-rgb-b),0.2)]' // Active delete icon
                    : 'text-[var(--color-text-secondary)] opacity-60 group-hover:opacity-100 hover:text-[var(--color-accent-2)] hover:bg-[rgba(var(--color-accent-2-rgb-r),var(--color-accent-2-rgb-g),var(--color-accent-2-rgb-b),0.1)]' // Non-active delete icon
                  }`}
                aria-label={`Delete slide ${index + 1}`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
         {slides.length === 0 && (
          <p className="text-[var(--color-text-secondary)] opacity-80 text-center py-4 text-sm">No slides yet. Click 'New Slide' to start.</p>
        )}
      </div>
    </div>
  );
};