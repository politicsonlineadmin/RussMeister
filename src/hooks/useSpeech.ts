'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CEFRLevel } from '@/types';
import { SPEECH_RATES } from '@/types';

// ─── Text-to-Speech Hook ──────────────────────────────────────

interface UseTTSReturn {
  speak: (text: string, level: CEFRLevel) => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' && 'speechSynthesis' in window
    );

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string, level: CEFRLevel) => {
      if (!isSupported) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = SPEECH_RATES[level];
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  return { speak, isSpeaking, isSupported };
}

// ─── Speech-to-Text Hook ──────────────────────────────────────

interface UseSTTReturn {
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  confidence: number;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
}

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as Record<string, unknown>;
  return (
    (win.SpeechRecognition as SpeechRecognitionConstructor | undefined) ??
    (win.webkitSpeechRecognition as SpeechRecognitionConstructor | undefined) ??
    null
  );
}

export function useSTT(): UseSTTReturn {
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    setIsSupported(getSpeechRecognition() !== null);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Clean up previous instance
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    setError(null);
    setTranscript('');
    setConfidence(0);

    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      if (result && result[0]) {
        setTranscript(result[0].transcript);
        setConfidence(result[0].confidence);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech was detected. Please try again.',
        'audio-capture': 'No microphone was found. Please check your settings.',
        'not-allowed': 'Microphone permission was denied.',
        aborted: 'Speech recognition was aborted.',
        network: 'A network error occurred.',
      };
      setError(errorMessages[event.error] ?? `Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setError('Failed to start speech recognition.');
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
    startListening,
    stopListening,
    transcript,
    confidence,
    isListening,
    isSupported,
    error,
  };
}
