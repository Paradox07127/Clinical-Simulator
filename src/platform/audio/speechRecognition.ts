import { useState, useEffect, useRef } from 'react';

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const initRecognition = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    const browserLang = navigator.language || 'zh-CN';
    recognition.lang = browserLang.startsWith('zh') ? 'zh-CN' : 'en-US';


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'network') {
        alert('Speech recognition network error. This often happens if the browser\'s speech service is unavailable or blocked. Please try again or use a different browser (Chrome is recommended).');
      } else if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please check your browser permissions.');
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  };

  useEffect(() => {
    recognitionRef.current = initRecognition();
  }, []);

  const toggleListening = () => {
    if (!isSupported) {
      alert('Your browser does not support speech recognition. Please try Chrome or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        // Re-initialize to clear any previous error states
        recognitionRef.current = initRecognition();
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  const clearTranscript = () => setTranscript('');

  return { isListening, transcript, isSupported, toggleListening, clearTranscript };
}
