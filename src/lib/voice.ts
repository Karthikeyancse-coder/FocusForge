export const PREFERRED_VOICES = [
  "Microsoft Aria",
  "Microsoft Jenny",
  "Microsoft Sonia",
  "Google UK English Female",
  "Google US English",
  "Microsoft Ryan",
  "Microsoft Guy",
];

let voices: SpeechSynthesisVoice[] = [];

// Initialize voices
if (typeof window !== "undefined" && window.speechSynthesis) {
  voices = window.speechSynthesis.getVoices();
  
  // Voices are loaded asynchronously in some browsers
  window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
  };
}

export function getBestVoice(): SpeechSynthesisVoice | null {
  if (!voices.length) {
     if (typeof window !== "undefined" && window.speechSynthesis) {
         voices = window.speechSynthesis.getVoices();
     }
  }

  for (const preferred of PREFERRED_VOICES) {
    const match = voices.find((v) => v.name.includes(preferred));
    if (match) return match;
  }
  
  // Fallback to any english voice
  const enVoice = voices.find((v) => v.lang.startsWith("en-") && !v.name.includes("Zira"));
  if (enVoice) return enVoice;

  return voices[0] || null;
}

export function speakText(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const cleanText = text.replace(/[*_#`]/g, "");
  
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 0.95; // 0.92-0.96
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const bestVoice = getBestVoice();
  if (bestVoice) {
    utterance.voice = bestVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
