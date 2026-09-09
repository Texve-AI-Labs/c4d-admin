import React from "react";
import { MicrophoneIcon, PaperAirplaneIcon, StopIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { normalizeMimeType } from "@/utils/whatsapp/media";

const MIME_CANDIDATES = [
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
  "audio/webm;codecs=opus",
  "audio/webm",
  "video/webm;codecs=opus",
  "video/webm",
];

const getSupportedMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

const getExtension = (mimeType = "") => {
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("webm")) return "webm";
  return "ogg";
};

const getUploadMimeType = (mimeType = "") => {
  const normalized = normalizeMimeType(mimeType);
  if (normalized === "video/webm") return "video/webm";
  return normalized || "audio/webm";
};

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

export default function WhatsAppVoiceRecorder({ disabled, sending, onSendVoice, onRecordingChange }) {
  const [recording, setRecording] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [draft, setDraft] = React.useState(null);
  const [error, setError] = React.useState("");
  const recorderRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const chunksRef = React.useRef([]);
  const cancelledRef = React.useRef(false);

  React.useEffect(() => {
    onRecordingChange?.(recording);
  }, [recording, onRecordingChange]);

  React.useEffect(() => {
    if (!recording) return undefined;
    const timer = setInterval(() => setDuration((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  React.useEffect(
    () => () => {
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
      if (draft?.url) URL.revokeObjectURL(draft.url);
    },
    [draft?.url]
  );

  const reset = () => {
    setRecording(false);
    setDuration(0);
    recorderRef.current = null;
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    streamRef.current = null;
    chunksRef.current = [];
  };

  const clearDraft = () => {
    if (draft?.url) URL.revokeObjectURL(draft.url);
    setDraft(null);
  };

  const startRecording = async () => {
    if (disabled || sending || recording) return;
    setError("");
    clearDraft();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        setError("This browser cannot record a voice message. Upload an MP3, OGG, OPUS, AAC, AMR, or M4A audio file instead.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];
      cancelledRef.current = false;
      streamRef.current = stream;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const finalMimeType = recorder.mimeType || mimeType || "audio/ogg";
        const uploadMimeType = getUploadMimeType(finalMimeType);
        const blob = new Blob(chunksRef.current, { type: uploadMimeType });
        const shouldKeep = !cancelledRef.current && blob.size > 0;
        reset();
        if (shouldKeep) {
          const file = new File([blob], `voice-${Date.now()}.${getExtension(uploadMimeType)}`, {
            type: uploadMimeType,
          });
          setDraft({
            file,
            url: URL.createObjectURL(blob),
            duration,
          });
        }
      };

      recorder.start();
      setRecording(true);
      setDuration(0);
    } catch {
      reset();
      setError("Microphone permission is required to record a voice message.");
    }
  };

  const stopRecording = (shouldSend) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    cancelledRef.current = !shouldSend;
    recorder.stop();
  };

  const sendDraft = async () => {
    if (!draft?.file || sending) return;
    const file = draft.file;
    clearDraft();
    await onSendVoice?.(file, {
      mediaType: "VOICE",
      mimeType: normalizeMimeType(file.type) || "audio/webm",
      fileName: file.name || "voice.webm",
    });
  };

  if (draft) {
    return (
      <div className="flex min-w-[260px] items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-[#111b21] shadow-sm">
        <MicrophoneIcon className="h-4 w-4 shrink-0 text-[#008069]" />
        <audio src={draft.url} controls className="h-8 min-w-0 flex-1" />
        <button
          type="button"
          onClick={clearDraft}
          className="rounded-full p-1.5 text-[#54656f] hover:bg-[#f0f2f5]"
          aria-label="Discard voice message"
          title="Discard"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={sendDraft}
          disabled={sending}
          className="grid h-8 w-8 place-items-center rounded-full bg-[#00a884] text-white hover:bg-[#008069] disabled:opacity-50"
          aria-label="Send voice message"
          title="Send voice"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex min-w-[190px] items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-[#111b21] shadow-sm">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
        <span className="font-semibold text-[#008069]">{formatDuration(duration)}</span>
        <button
          type="button"
          onClick={() => stopRecording(false)}
          className="ml-auto rounded-full p-1 text-[#54656f] hover:bg-[#f0f2f5]"
          aria-label="Cancel voice recording"
          title="Cancel"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => stopRecording(true)}
          className="grid h-8 w-8 place-items-center rounded-full bg-[#00a884] text-white hover:bg-[#008069]"
          aria-label="Stop voice recording"
          title="Stop"
        >
          <StopIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled || sending}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#54656f] transition hover:bg-[#e7fce3] hover:text-[#008069] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Record voice message"
        title="Record voice"
      >
        <MicrophoneIcon className="h-5 w-5" />
      </button>
      {error && (
        <div className="absolute bottom-12 right-0 z-10 w-72 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900 shadow-lg">
          <div className="flex items-start gap-2">
            <span className="min-w-0 flex-1">{error}</span>
            <button type="button" onClick={() => setError("")} className="shrink-0 text-amber-700" aria-label="Dismiss voice error">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
