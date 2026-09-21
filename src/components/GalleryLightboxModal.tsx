import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GalleryPhoto } from '../data/galleryData';

interface GalleryLightboxModalProps {
  photo: GalleryPhoto | null;
  photos?: GalleryPhoto[];
  onClose: () => void;
  onSelectPhoto?: (photo: GalleryPhoto) => void;
}

export const GalleryLightboxModal: React.FC<GalleryLightboxModalProps> = ({
  photo,
  photos = [],
  onClose,
  onSelectPhoto,
}) => {
  const currentIndex = photo && photos.length > 0 ? photos.findIndex((p) => p.id === photo.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < photos.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev && onSelectPhoto) {
      onSelectPhoto(photos[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, photos, onSelectPhoto]);

  const handleNext = useCallback(() => {
    if (hasNext && onSelectPhoto) {
      onSelectPhoto(photos[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, photos, onSelectPhoto]);

  useEffect(() => {
    if (!photo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, onClose, handlePrev, handleNext]);

  if (!photo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#051610]/85 p-4 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[26px] border border-white/15 bg-[#0e271f] text-white shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Tutup pratinjau"
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/90 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Navigation Prev */}
          {hasPrev && (
            <button
              onClick={handlePrev}
              aria-label="Foto sebelumnya"
              className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/90 active:scale-95"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Navigation Next */}
          {hasNext && (
            <button
              onClick={handleNext}
              aria-label="Foto berikutnya"
              className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/90 active:scale-95"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Image display */}
          <div className="relative flex max-h-[66vh] w-full items-center justify-center overflow-hidden bg-black/40">
            <img
              src={photo.src}
              alt={photo.title}
              className="h-full max-h-[66vh] w-full object-contain mx-auto"
            />
          </div>

          {/* Clean footer info (no badge clutter) */}
          <div className="border-t border-white/10 bg-[#0c241c] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#8de0c0]">
                <span className="font-semibold">{photo.location}</span>
                <span className="text-white/30">•</span>
                <span className="text-white/70">{photo.subtitle}</span>
              </div>
              {photos.length > 0 && currentIndex >= 0 && (
                <span className="text-[#80a996]">
                  Foto {currentIndex + 1} dari {photos.length}
                </span>
              )}
            </div>

            <h3 className="mt-2.5 text-lg font-bold text-white sm:text-2xl">
              {photo.title}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#c3dfd2]">
              {photo.description}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GalleryLightboxModal;
