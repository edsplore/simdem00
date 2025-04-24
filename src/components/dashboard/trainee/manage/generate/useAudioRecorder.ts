// hooks/useAudioRecorder.ts
import { useState, useRef, useCallback } from "react";
import { convertAudioToText } from "../../../../../services/simulation_script";

interface AudioRecorderProps {
  onTranscriptionReceived?: (text: string) => void;
  apiEndpoint?: string;
  mimeType?: string;
  userId?: string;
}

export const useAudioRecorder = ({
  onTranscriptionReceived,
  apiEndpoint = "/api/convert/audio-to-text",
  mimeType = "audio/webm",
  userId = "user123",
}: AudioRecorderProps = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start recording audio
  const startRecording = useCallback(async () => {
    try {
      // Reset state
      audioChunksRef.current = [];
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start recording",
      );
      console.error("Recording error:", err);
    }
  }, [mimeType]);

  // Stop recording and send audio for transcription
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) {
      return;
    }

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        try {
          setIsRecording(false);
          setIsProcessing(true);

          // Get all tracks from the stream and stop them
          const tracks = mediaRecorderRef.current!.stream.getTracks();
          tracks.forEach((track) => track.stop());

          // Create a blob from recorded chunks
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType,
          });

          // Send to backend for transcription
          await sendAudioForTranscription(audioBlob);

          resolve();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to process recording",
          );
          console.error("Processing error:", err);
          resolve();
        } finally {
          setIsProcessing(false);
        }
      };

      // Stop the recorder
      mediaRecorderRef.current!.stop();
    });
  }, [isRecording, mimeType]);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) {
      return;
    }

    // Stop all tracks
    const tracks = mediaRecorderRef.current.stream.getTracks();
    tracks.forEach((track) => track.stop());

    // Clear chunks and reset state
    audioChunksRef.current = [];
    setIsRecording(false);

    // Don't process the recording
    mediaRecorderRef.current.onstop = null;
    mediaRecorderRef.current.stop();
  }, [isRecording]);

  // Send audio to backend using our new convertAudioToText function
  const sendAudioForTranscription = async (audioBlob: Blob) => {
    try {
      // Use our new function from simulation_script.ts
      const response = await convertAudioToText(userId, audioBlob);

      // Handle the transcription result
      if (response && response.text) {
        // Just trim any leading/trailing whitespace
        const transcribedText = response.text.trim();

        if (onTranscriptionReceived) {
          onTranscriptionReceived(transcribedText);
        }
        return transcribedText;
      } else {
        throw new Error("Invalid response from transcription service");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to transcribe audio",
      );
      console.error("Transcription error:", err);
      throw err;
    }
  };

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};
