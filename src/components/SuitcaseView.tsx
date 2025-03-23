
import React, { useState, useEffect } from 'react';
import { useSuitcase } from '@/context/SuitcaseContext';
import { cn } from '@/lib/utils';
import { logError } from '@/utils/errorLogger';
import { AnimatePresence, motion } from 'framer-motion';

interface SuitcaseViewProps {
  className?: string;
  interactive?: boolean;
}

const SuitcaseView: React.FC<SuitcaseViewProps> = ({
  className,
  interactive = false
}) => {
  const { color, view } = useSuitcase();
  const [imgError, setImgError] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [currentView, setCurrentView] = useState(view);
  const [currentColor, setCurrentColor] = useState(color);
  
  // Update current view/color with animation when props change
  useEffect(() => {
    if (currentView !== view || currentColor !== color) {
      setIsChanging(true);
      // Wait for exit animation before updating the view/color
      const timer = setTimeout(() => {
        setCurrentView(view);
        setCurrentColor(color);
        setIsChanging(false);
      }, 200); // Match duration with animation
      
      return () => clearTimeout(timer);
    }
  }, [view, color, currentView, currentColor]);
  
  // Get the image URL based on color and view - using the correct repository
  const getImageUrl = () => {
    // Updated URL format to point to the 'models' repository
    return `https://raw.githubusercontent.com/Dr31K0/models/b284a7ad9445681838f7d343907e78e0a3b40ce5/suitcase-${currentColor}-${currentView}.png`;
  };
  
  // Fallback image if the specific combination doesn't exist
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    logError(`Image for ${currentColor} ${currentView} not found, using fallback`, 'SuitcaseView');
    console.log(`Image not found: ${getImageUrl()}`);
    setImgError(true);
    // Fallback to a known image in the repository
    e.currentTarget.src = `https://raw.githubusercontent.com/Dr31K0/models/b284a7ad9445681838f7d343907e78e0a3b40ce5/suitcase-purple-front.png`;
  };
  
  return (
    <div 
      className={cn(
        'relative rounded-xl overflow-hidden bg-crystal-light/30',
        interactive ? 'cursor-grab active:cursor-grabbing' : '',
        className
      )}
    >
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-crystal-purple/5 to-crystal-pink/5" />
      
      {/* Suitcase image with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentColor}-${currentView}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full h-full"
        >
          <img
            src={imgError ? `https://raw.githubusercontent.com/Dr31K0/models/b284a7ad9445681838f7d343907e78e0a3b40ce5/suitcase-purple-front.png` : getImageUrl()}
            alt={`${currentColor} suitcase ${currentView} view`}
            className="w-full h-full object-contain"
            style={{ mixBlendMode: 'multiply' }}
            onError={handleImageError}
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-white/20 to-transparent" />
      <div className="absolute top-0 left-0 w-full h-full bg-shimmer animate-shimmer" />
      
      {interactive && (
        <div className="absolute bottom-4 right-4 bg-black/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
          Drag to rotate
        </div>
      )}
    </div>
  );
};

export default SuitcaseView;
