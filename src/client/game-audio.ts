import type { Topping } from './game-data';

type ToppingSound = {
  startFrequency: number;
  endFrequency: number;
  duration: number;
  waveform: OscillatorType;
};

const TOPPING_SOUNDS: Record<Topping, ToppingSound> = {
  blueberry: {
    startFrequency: 560,
    endFrequency: 260,
    duration: 0.11,
    waveform: 'sine',
  },
  strawberry: {
    startFrequency: 470,
    endFrequency: 210,
    duration: 0.13,
    waveform: 'triangle',
  },
  syrup: {
    startFrequency: 420,
    endFrequency: 190,
    duration: 0.2,
    waveform: 'sine',
  },
  cream: {
    startFrequency: 650,
    endFrequency: 360,
    duration: 0.16,
    waveform: 'sine',
  },
  butter: {
    startFrequency: 330,
    endFrequency: 170,
    duration: 0.12,
    waveform: 'triangle',
  },
};

const MUSIC_NOTES = [
  523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46,
];
const BASS_NOTES = [130.81, 146.83, 164.81, 146.83];

const playTone = (
  audioContext: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  volumeLevel: number,
  waveform: OscillatorType
): OscillatorNode => {
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();

  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  volume.gain.setValueAtTime(0.0001, startAt);
  volume.gain.exponentialRampToValueAtTime(volumeLevel, startAt + 0.025);
  volume.gain.exponentialRampToValueAtTime(
    0.0001,
    startAt + duration
  );

  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
  return oscillator;
};

export const startBackgroundMusic = (
  audioContext: AudioContext
): (() => void) => {
  let noteIndex = 0;
  const activeNotes = new Set<OscillatorNode>();

  const playNextNote = () => {
    if (audioContext.state !== 'running') return;

    const startAt = audioContext.currentTime + 0.02;
    const melody = MUSIC_NOTES[noteIndex % MUSIC_NOTES.length];
    if (melody) {
      const note = playTone(audioContext, melody, startAt, 0.3, 0.075, 'sine');
      activeNotes.add(note);
      note.addEventListener('ended', () => activeNotes.delete(note), {
        once: true,
      });
    }

    if (noteIndex % 4 === 0) {
      const bass = BASS_NOTES[Math.floor(noteIndex / 4) % BASS_NOTES.length];
      if (bass) {
        const note = playTone(
          audioContext,
          bass,
          startAt,
          0.72,
          0.035,
          'triangle'
        );
        activeNotes.add(note);
        note.addEventListener('ended', () => activeNotes.delete(note), {
          once: true,
        });
      }
    }

    noteIndex += 1;
  };

  playNextNote();
  const timerId = window.setInterval(playNextNote, 360);

  return () => {
    window.clearInterval(timerId);
    for (const note of activeNotes) {
      try {
        note.stop();
      } catch {
        // A note may finish between the cleanup check and stop call.
      }
    }
    activeNotes.clear();
  };
};

export const playFlipSound = (
  audioContext: AudioContext,
  successful: boolean
): void => {
  const startAt = audioContext.currentTime + 0.01;
  if (successful) {
    playTone(audioContext, 587.33, startAt, 0.22, 0.18, 'triangle');
    playTone(audioContext, 783.99, startAt + 0.08, 0.28, 0.14, 'sine');
    return;
  }

  playTone(audioContext, 196, startAt, 0.22, 0.14, 'triangle');
};

export const playToppingSound = (
  audioContext: AudioContext,
  topping: Topping
): void => {
  const sound = TOPPING_SOUNDS[topping];
  const drops = topping === 'syrup' ? 3 : 1;

  for (let index = 0; index < drops; index += 1) {
    const startAt = audioContext.currentTime + index * 0.07;
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();

    oscillator.type = sound.waveform;
    oscillator.frequency.setValueAtTime(sound.startFrequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(
      sound.endFrequency,
      startAt + sound.duration
    );
    volume.gain.setValueAtTime(0.0001, startAt);
    volume.gain.exponentialRampToValueAtTime(0.22, startAt + 0.012);
    volume.gain.exponentialRampToValueAtTime(0.0001, startAt + sound.duration);

    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + sound.duration);
  }
};
