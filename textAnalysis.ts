import { SpeechMetrics } from '../types';

const COMMON_FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'i mean',
  'honestly', 'literally', 'sort of', 'kind of', 'right', 'okay', 'anyway'
];

export function analyzeAnswerText(text: string, durationSeconds: number): SpeechMetrics {
  if (!text || text.trim().length === 0) {
    return {
      durationSeconds: Math.max(1, durationSeconds),
      wordCount: 0,
      wordsPerMinute: 0,
      fillerWordCount: 0,
      fillerWordsFound: [],
      repeatedWordsCount: 0,
      longPausesDetected: 0
    };
  }

  const cleanText = text.toLowerCase();
  const words = cleanText.replace(/[^\w\s]/gi, '').split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const validDuration = Math.max(1, durationSeconds);
  const wordsPerMinute = Math.round((wordCount / validDuration) * 60);

  // Detect filler words
  const fillersFound: string[] = [];
  let fillerCount = 0;

  COMMON_FILLER_WORDS.forEach((filler) => {
    const regex = new RegExp(`\\b${filler.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = cleanText.match(regex);
    if (matches) {
      fillerCount += matches.length;
      if (!fillersFound.includes(filler)) {
        fillersFound.push(filler);
      }
    }
  });

  // Detect consecutive repeated words (e.g., "I I think", "the the project")
  let repeatedWordsCount = 0;
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1] && words[i].length > 2) {
      repeatedWordsCount++;
    }
  }

  // Estimate hesitations / pauses based on punctuation clusters or low WPM with long duration
  let longPausesDetected = 0;
  const ellipsisCount = (text.match(/\.\.\.|\-\-/g) || []).length;
  longPausesDetected += ellipsisCount;

  if (validDuration > 30 && wordsPerMinute < 70) {
    longPausesDetected += Math.floor((30 - (wordsPerMinute / 3)) / 5);
  }

  return {
    durationSeconds: validDuration,
    wordCount,
    wordsPerMinute,
    fillerWordCount: fillerCount,
    fillerWordsFound: fillersFound,
    repeatedWordsCount,
    longPausesDetected: Math.max(0, longPausesDetected)
  };
}
