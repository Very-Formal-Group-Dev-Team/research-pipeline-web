export interface MeetingAudioMixHandle {
  stream: MediaStream;
  setLocalMicOpen: (open: boolean) => void;
  close: () => Promise<void>;
}

/**
 * Mixes meeting tab audio (remote participants) with the local microphone.
 * When gateLocalMic is true, the local mic is muted in the mix until setLocalMicOpen(true).
 */
export async function createMeetingAudioMix(
  meetingAudioStream: MediaStream | null,
  localMicStream: MediaStream,
  options: { gateLocalMic?: boolean } = {},
): Promise<MeetingAudioMixHandle> {
  const audioContext = new AudioContext();
  await audioContext.resume();

  const destination = audioContext.createMediaStreamDestination();
  const sources: MediaStreamAudioSourceNode[] = [];

  if (meetingAudioStream?.getAudioTracks().length) {
    const meetingSource = audioContext.createMediaStreamSource(meetingAudioStream);
    meetingSource.connect(destination);
    sources.push(meetingSource);
  }

  const micSource = audioContext.createMediaStreamSource(localMicStream);
  const micGain = audioContext.createGain();
  micGain.gain.value = options.gateLocalMic ? 0 : 1;
  micSource.connect(micGain);
  micGain.connect(destination);
  sources.push(micSource);

  return {
    stream: destination.stream,
    setLocalMicOpen: (open: boolean) => {
      micGain.gain.value = open ? 1 : 0;
    },
    close: async () => {
      for (const source of sources) {
        source.disconnect();
      }
      micGain.disconnect();
      destination.disconnect();
      await audioContext.close();
    },
  };
}
