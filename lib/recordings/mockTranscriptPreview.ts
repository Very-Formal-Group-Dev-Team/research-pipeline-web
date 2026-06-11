/**
 * TEMPORARY — set to false (or delete this file) when finished styling the transcript UI.
 */
import type { RecordingDetailResponse, TranscriptionArchiveSegment } from '@/lib/api/recordings';

export const USE_MOCK_TRANSCRIPT_FOR_STYLING = true;

const MOCK_CREATED_AT = '2026-06-11T13:21:17.000Z';

const MOCK_SEGMENTS: TranscriptionArchiveSegment[] = [
  {
    id: 'mock-segment-1',
    text: 'Good morning, everyone. Today we will walk through the adaptive learning tutor prototype and the natural language processing pipeline behind it.',
    start_ms: 0,
    end_ms: 9200,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-2',
    text: 'The system listens to student questions, classifies intent, and routes each query to the most relevant lesson segment in the course module.',
    start_ms: 9200,
    end_ms: 18400,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-3',
    text: 'For the defense demo, we recorded gated voice audio separately from the screen capture so reviewers can follow both the presentation and the transcript.',
    start_ms: 18400,
    end_ms: 27600,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-4',
    text: 'Early tests show stronger engagement when feedback is immediate, but we still need to evaluate accuracy across noisier classroom environments.',
    start_ms: 27600,
    end_ms: 36800,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-5',
    text: 'Next, I will seek to the methodology section in the video so we can align each transcript line with the corresponding slide.',
    start_ms: 36800,
    end_ms: 44200,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-6',
    text: 'Thank you. We are ready for questions on model training, dataset curation, and how advisers can review annotated transcripts after the meeting.',
    start_ms: 44200,
    end_ms: 52800,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-7',
    text: 'Our methodology combines transformer-based intent detection with a lightweight retrieval layer so the tutor can surface lecture notes without retraining the full model each week.',
    start_ms: 52800,
    end_ms: 62100,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-8',
    text: 'We evaluated three baselines: keyword search, a generic chatbot without course context, and the adaptive tutor with gated enrollment data from the pilot section.',
    start_ms: 62100,
    end_ms: 71400,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-9',
    text: 'Panelist question: how do you prevent the model from hallucinating citations when a student asks about a reading that is not in the uploaded corpus?',
    start_ms: 71400,
    end_ms: 79800,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-10',
    text: 'We constrain answers to retrieved passages and return an explicit “not covered in course materials” response when confidence falls below the configured threshold.',
    start_ms: 79800,
    end_ms: 88900,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-11',
    text: 'The screen recording you are watching includes slide transitions, but the transcript lines map only to spoken narration captured from the gated microphone track.',
    start_ms: 88900,
    end_ms: 97600,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-12',
    text: 'Latency averaged around one point four seconds end to end in our campus network tests, which was acceptable for office-hour style interactions but not for live lecture pacing.',
    start_ms: 97600,
    end_ms: 106800,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-13',
    text: 'Student feedback highlighted that timestamped transcripts helped them review confusing explanations, especially when they could click a line and jump back to that moment in the recording.',
    start_ms: 106800,
    end_ms: 116500,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-14',
    text: 'For privacy, voice audio is stored separately from video, and only meeting participants with archive access can open the synced transcript in Archivum.',
    start_ms: 116500,
    end_ms: 125200,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-15',
    text: 'Planned next steps include adviser review workflows, speaker labeling in the editor workspace, and exporting annotated transcripts for inclusion in the final paper appendix.',
    start_ms: 125200,
    end_ms: 134600,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-16',
    text: 'We will also run a larger evaluation with two sections next term to compare retention outcomes against the control group that only received static PDF handouts.',
    start_ms: 134600,
    end_ms: 143800,
    created_at: MOCK_CREATED_AT,
  },
  {
    id: 'mock-segment-17',
    text: 'If there are no further questions, we will conclude the demo. Thank you again for your time and for reviewing the adaptive learning tutor prototype.',
    start_ms: 143800,
    end_ms: 151000,
    created_at: MOCK_CREATED_AT,
  },
];

const MOCK_FULL_TEXT = MOCK_SEGMENTS.map((segment) => segment.text).join('\n\n');

export function applyMockTranscriptPreview(detail: RecordingDetailResponse): RecordingDetailResponse {
  if (!USE_MOCK_TRANSCRIPT_FOR_STYLING) return detail;

  return {
    ...detail,
    recording: {
      ...detail.recording,
      transcription_status: 'completed',
      transcription_error: null,
    },
    transcription: {
      id: detail.transcription?.id || 'mock-transcription-preview',
      full_text: MOCK_FULL_TEXT,
      language: 'en',
      transcribed_at: detail.transcription?.transcribed_at || MOCK_CREATED_AT,
    },
    segments: MOCK_SEGMENTS,
  };
}
