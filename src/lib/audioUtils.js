const playTone = (frequency, duration, type = 'sine') => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (!audioContext) {
    console.error("Web Audio API is not supported in this browser.");
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);

  oscillator.start(audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
  oscillator.stop(audioContext.currentTime + duration);
};

export const playClockInSound = () => {
  playTone(1000, 0.2, 'sine');
};

export const playClockOutSound = () => {
  playTone(500, 0.5, 'sine');
};