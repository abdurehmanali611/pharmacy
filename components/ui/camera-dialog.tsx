"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, RefreshCw, SwitchCamera, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CameraDialog({
  open,
  onOpenChange,
  onCapture,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startingCamera, setStartingCamera] = useState(false);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startStream = async (mode: "environment" | "user") => {
    stopStream();
    setError(null);
    setStartingCamera(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported on this browser or device.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "Camera access was denied. Please allow camera permissions in your browser settings."
            : err.message
          : "Unable to start camera device.";
      setError(message);
    } finally {
      setStartingCamera(false);
    }
  };

  useEffect(() => {
    if (open && !capturedDataUrl) {
      void startStream(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [open, facingMode, capturedDataUrl]);

  const handleSnap = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        setCapturedDataUrl(dataUrl);
        stopStream();
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    void startStream(facingMode);
  };

  const handleConfirm = () => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `photo_${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    onCapture(file);
    onOpenChange(false);
    setCapturedDataUrl(null);
    setCapturedBlob(null);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          stopStream();
          setCapturedDataUrl(null);
          setCapturedBlob(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg border-white/12 bg-[#08101e] p-5 text-white shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Camera className="h-5 w-5 text-apex-orange-light" />
            Device Camera
          </DialogTitle>
          <DialogDescription className="text-xs text-white/60">
            {capturedDataUrl
              ? "Review your photo before saving it to the record."
              : "Position the item or document within the viewfinder and capture."}
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-2 aspect-4/3 w-full overflow-hidden rounded-2xl border border-white/12 bg-black/60 shadow-inner">
          {capturedDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedDataUrl}
              alt="Captured item"
              className="h-full w-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {startingCamera ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-white/80">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin text-apex-orange-light" />
                  Accessing camera…
                </div>
              ) : null}
              {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center">
                  <p className="text-sm font-semibold text-red-300">Camera Unavailable</p>
                  <p className="text-xs text-white/65">{error}</p>
                </div>
              ) : null}
            </>
          )}

          {!capturedDataUrl && !error && !startingCamera ? (
            <div className="absolute top-3 right-3">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={toggleFacingMode}
                className="border-white/20 bg-black/50 text-white backdrop-blur hover:bg-black/75"
                title="Switch front/back camera"
              >
                <SwitchCamera className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-2 sm:justify-between">
          {capturedDataUrl ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetake}
                className="gap-1.5 border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
                Retake
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                className="gap-1.5 bg-emerald-600 font-semibold text-white hover:bg-emerald-500"
              >
                <Check className="h-4 w-4" />
                Use Photo
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-white/70 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={Boolean(error || startingCamera)}
                onClick={handleSnap}
                className="gap-2 bg-apex-orange font-semibold text-white shadow-lg hover:bg-apex-orange-light disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                Snap Photo
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
