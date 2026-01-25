'use client';

import { useEffect } from 'react';

const useSmoothScroll = () => {
  useEffect(() => {
    // Native CSS scroll-behavior is already handled by the smooth-scroll class
    // This hook can be used for additional scroll enhancements

    // Add scroll event listeners for additional effects
    const handleScroll = () => {
      // Add any custom scroll effects here if needed
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return null;
};

export default useSmoothScroll;