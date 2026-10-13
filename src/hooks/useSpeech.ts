import { useState, useEffect, useRef, useCallback } from 'react';

// SpeechRecognition global types for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        // Start simulated audio pulse
        const simulateAudioWave = () => {
          setAudioLevel(0.3 + Math.random() * 0.7);
          animFrameRef.current = requestAnimationFrame(simulateAudioWave);
        };
        animFrameRef.current = requestAnimationFrame(simulateAudioWave);
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        stopListening();
      };

      recognition.onend = () => {
        stopListening();
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition setup failed:', e);
      setIsSupported(false);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
    };
  }, []);

  const startListening = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsSpeaking(false);
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // Recognition already running
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setAudioLevel(0);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
    }
  }, []);

  // Stop active speech (Interruption control)
  const interrupt = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Play audio either from Gemini Base64 WAV or Web Speech API fallback
  const speak = useCallback(
    async (text: string, base64Audio?: string) => {
      interrupt(); // cancel any active utterance first

      if (base64Audio) {
        try {
          const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
          audioPlayerRef.current = audio;
          setIsSpeaking(true);

          audio.onended = () => {
            setIsSpeaking(false);
            audioPlayerRef.current = null;
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            // Fallback to browser synthesis
            fallbackWebSpeech(text);
          };

          await audio.play();
          return;
        } catch (e) {
          console.warn('Base64 audio playback failed, falling back:', e);
        }
      }

      fallbackWebSpeech(text);
    },
    [interrupt]
  );

  const fallbackWebSpeech = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Strip markdown formatting symbols for cleaner voice
    const cleanText = text.replace(/[*_#`[\]()]/g, ' ').slice(0, 300);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return {
    isListening,
    transcript,
    setTranscript,
    isSpeaking,
    audioLevel,
    isSupported,
    startListening,
    stopListening,
    speak,
    interrupt,
  };
}
