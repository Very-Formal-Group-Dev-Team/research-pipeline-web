"use client";

import React, { useCallback, useRef, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { uploadCroppedAvatar } from '../lib/api/upload';
import { getCroppedImg } from '../lib/image/crop';

const MAX_AVATAR_BYTES = 10 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_AVATAR_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

function validateAvatarFile(file: File): string | null {
  const mime = file.type.trim().toLowerCase();
  if (!ALLOWED_AVATAR_TYPES.has(mime)) {
    return 'Please choose a JPG, PNG, or WEBP image.';
  }

  const extension = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    : '';
  if (!extension || !ALLOWED_AVATAR_EXTENSIONS.includes(extension)) {
    return 'Please choose a JPG, PNG, or WEBP image.';
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return 'Image must be 10 MB or smaller.';
  }

  return null;
}

type Props = {
  onUploaded?: (url: string) => void;
  initialSrc?: string | null;
};

export default function AvatarUploader({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropping, setCropping] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateAvatarFile(file);
    if (error) {
      setValidationError(error);
      setCropping(false);
      setImageSrc(null);
      e.target.value = '';
      return;
    }

    setValidationError(null);
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setCropping(true);
  };

  const onCropComplete = useCallback((area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const dataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      const res = await uploadCroppedAvatar(dataUrl);
      if (res.error) throw new Error(res.error);
      const url = res.data?.publicUrl || '';
      setCropping(false);
      setImageSrc(null);
      setValidationError(null);
      if (onUploaded) onUploaded(url);
    } catch (err) {
      console.error('Failed to upload cropped avatar', err);
      setValidationError(err instanceof Error ? err.message : 'Upload failed.');
    }
  };

  const handleCancel = () => {
    setCropping(false);
    setImageSrc(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={onFileChange}
        className="hidden"
      />
      <button type="button" onClick={() => inputRef.current?.click()} className="btn">Change avatar</button>
      {validationError ? (
        <p className="mt-2 text-sm text-archivumRed" role="alert">
          {validationError}
        </p>
      ) : null}

      {cropping && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded p-4 w-[90vw] max-w-lg">
            <div className="relative w-full h-80 bg-gray-200">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid={false}
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-56 h-56 rounded-full border-2 border-white shadow-lg" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex-1 mr-2">
                <label className="block text-sm">Zoom</label>
                <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={handleCancel}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
