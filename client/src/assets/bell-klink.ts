// Generate bell klink sound using Web Audio API
export function playBellKlinkSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillators untuk sound klink yang bagus
    const now = audioContext.currentTime;
    
    // Frekuensi untuk nada yang enak
    const frequencies = [800, 1200, 1600]; // Triple frequency untuk bell effect
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      oscillator.frequency.value = freq;
      oscillator.type = "sine";
      
      // Connect nodes
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      
      // Envelope: quick attack, exponential decay
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      // Start dan stop
      oscillator.start(now + index * 0.05);
      oscillator.stop(now + 0.4);
    });
  } catch (err) {
    // Silent fail jika audio context tidak tersedia
    console.warn("Audio context not available", err);
  }
}
