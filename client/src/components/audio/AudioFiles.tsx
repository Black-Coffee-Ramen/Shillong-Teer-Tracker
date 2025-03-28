import React, { useEffect } from "react";

// This component will programmatically create audio elements in the DOM
// This approach avoids needing to upload actual audio files
export default function AudioFiles() {
  useEffect(() => {
    // Create all audio elements on mount
    createAudioElements();
    
    // Clean up on unmount
    return () => {
      removeAudioElements();
    };
  }, []);
  
  // Create all audio elements
  const createAudioElements = () => {
    // Win sound (celebratory)
    const winSound = createOscillatorSound({
      frequency: [440, 554, 659, 880], // A major chord ascending
      type: "triangle",
      duration: 1.5,
      volumeProfile: [0, 0.8, 0.8, 0],
      id: "win"
    });
    
    // Near miss sound (descending)
    const nearMissSound = createOscillatorSound({
      frequency: [440, 415, 392, 370], // Descending notes
      type: "sine",
      duration: 1.2,
      volumeProfile: [0, 0.6, 0.3, 0],
      id: "near-miss"
    });
    
    // Info sound (simple ding)
    const infoSound = createOscillatorSound({
      frequency: [523.25], // C5
      type: "sine",
      duration: 0.3,
      volumeProfile: [0, 0.5, 0],
      id: "info"
    });
    
    // Warning sound (two-tone)
    const warningSound = createOscillatorSound({
      frequency: [392, 392], // G4 repeated
      type: "square",
      duration: 0.6,
      gap: 0.1,
      volumeProfile: [0, 0.5, 0],
      id: "warning"
    });
    
    // Error sound (dissonant)
    const errorSound = createOscillatorSound({
      frequency: [196, 185], // Dissonant interval
      type: "sawtooth",
      duration: 0.8,
      volumeProfile: [0, 0.6, 0.4, 0],
      id: "error"
    });
  };
  
  // Remove all audio elements
  const removeAudioElements = () => {
    const audioElements = document.querySelectorAll('audio[data-generated="true"]');
    audioElements.forEach((el) => el.remove());
  };
  
  return null; // No visible UI
}

// Helper to create oscillator-based sounds and save as audio elements
interface OscillatorSoundOptions {
  frequency: number[];   // Array of frequencies to play in sequence
  type: OscillatorType;  // "sine", "square", "sawtooth", "triangle"
  duration: number;      // Total duration in seconds
  volumeProfile: number[]; // Volume profile (0-1) matched to % of duration
  gap?: number;          // Gap between notes in seconds
  id: string;            // ID for the audio element
}

function createOscillatorSound(options: OscillatorSoundOptions): HTMLAudioElement {
  // Get existing audio element or create a new one
  let audioElement = document.getElementById(`sound-${options.id}`) as HTMLAudioElement;
  
  if (audioElement) {
    return audioElement;
  }
  
  // Create a new audio element
  audioElement = document.createElement("audio");
  audioElement.id = `sound-${options.id}`;
  audioElement.dataset.generated = "true";
  
  // Create audio context and destination
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioDestination = audioContext.createMediaStreamDestination();
  const mediaRecorder = new MediaRecorder(audioDestination.stream);
  const audioChunks: BlobPart[] = [];
  
  // Set up recorder
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
  
  // When recording stops, create an audio element with the recorded sound
  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
    const audioUrl = URL.createObjectURL(audioBlob);
    audioElement.src = audioUrl;
    document.body.appendChild(audioElement);
  };
  
  // Start recording
  mediaRecorder.start();
  
  // Play the oscillator sequence
  let startTime = audioContext.currentTime;
  const gap = options.gap || 0;
  
  options.frequency.forEach((freq, index) => {
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = options.type;
    oscillator.frequency.value = freq;
    
    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioDestination);
    
    // Calculate note duration
    const noteDuration = options.duration / options.frequency.length;
    const noteStart = startTime + (index * (noteDuration + gap));
    const noteEnd = noteStart + noteDuration;
    
    // Apply volume profile
    options.volumeProfile.forEach((volume, vIndex) => {
      const timePoint = noteStart + (noteDuration * (vIndex / (options.volumeProfile.length - 1)));
      gainNode.gain.setValueAtTime(volume, timePoint);
    });
    
    // Schedule oscillator
    oscillator.start(noteStart);
    oscillator.stop(noteEnd);
    
    // Update for next note
    if (index === options.frequency.length - 1) {
      // Stop recording after the last note
      setTimeout(() => {
        mediaRecorder.stop();
      }, (noteEnd + 0.5 - audioContext.currentTime) * 1000);
    }
  });
  
  return audioElement;
}