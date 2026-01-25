"use client";

import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

const words = ['여행계획', '오늘 할 것', '아이디어', '이번주 프로젝트'];

// Function to decompose Korean text into individual jamo
const decomposeKorean = (text: string): string => {
  return text.normalize('NFD');
};

// Function to compose back for display
const composeKorean = (decomposed: string): string => {
  return decomposed.normalize('NFC');
};

const decomposedWords = words.map(decomposeKorean);

export function TypingAnimation() {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const decomposedWord = decomposedWords[currentIndex];
    const timeout = setTimeout(() => {
      if (isDeleting) {
        const composed = composeKorean(currentText);
        const newComposed = composed.substring(0, composed.length - 1);
        setCurrentText(decomposeKorean(newComposed));
        if (newComposed === '') {
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % words.length);
        }
      } else {
        setCurrentText(decomposedWord.substring(0, currentText.length + 1));
        if (currentText === decomposedWord) {
          setTimeout(() => setIsDeleting(true), 2000); // Pause before deleting
        }
      }
    }, isDeleting ? 120 : 50); // Adjust speed

    return () => clearTimeout(timeout);
  }, [currentText, currentIndex, isDeleting]);

  return (
    <div className="w-75 h-15 px-5 flex items-center rounded-2xl bg-linear-to-r from-black/50 to-transparent text-blue-500 text-2xl whitespace-nowrap">
      <Search className="w-7 h-7 mr-3" />
      {composeKorean(currentText)}
      <span className="ml-0.5 w-[1.5px] h-6 bg-blue-400 cursor-pulse" />
    </div>
  );
}