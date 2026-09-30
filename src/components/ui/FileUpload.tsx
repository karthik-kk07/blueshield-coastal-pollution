import React, { useRef, useState } from 'react';
import { UploadCloud, Image, X } from 'lucide-react';

export interface FileUploadProps {
  label?: string;
  helperText?: string;
  onFileSelect?: (file: File | null, previewUrl?: string) => void;
  accept?: string;
  maxSizeMb?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label = 'Upload Field Photo Evidence',
  helperText = 'Attach georeferenced photo of pollution, shoreline scale, or high-tide line (JPEG/PNG up to 10MB)',
  onFileSelect,
  accept = 'image/jpeg,image/png,image/webp',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    if (onFileSelect) onFileSelect(file, url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onFileSelect) onFileSelect(null);
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <span className="block text-xs font-medium text-slate-700">{label}</span>
      )}

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors
          ${
            dragActive
              ? 'border-[#0B2545] bg-slate-50'
              : 'border-slate-300 hover:border-slate-400 bg-white'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Coastal evidence preview"
              className="max-h-48 rounded border border-slate-200 object-cover mx-auto"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm"
              title="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="text-xs text-slate-600 mt-2 font-mono">{selectedFile?.name}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <div className="p-3 bg-slate-100 rounded-full text-slate-600">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-[#0B2545] hover:underline">
                Click to browse photo
              </span>
              <span className="text-xs text-slate-500"> or drag and drop</span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-xs">{helperText}</p>
          </div>
        )}
      </div>
    </div>
  );
};
