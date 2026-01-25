'use client';

import { useEffect } from 'react';

const useScrollAnimations = () => {
  useEffect(() => {
    const handleScroll = () => {
      // Get all elements with the fade-on-scroll class
      const elements = document.querySelectorAll('.fade-on-scroll');

      elements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150; // Trigger point for animation

        if (elementTop < window.innerHeight - elementVisible) {
          element.classList.add('visible');
        } else {
          element.classList.remove('visible');
        }
      });
    };

    // Initial call to handle elements that are already in view
    handleScroll();

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return null;
};

export default useScrollAnimations;