"use client";

import { useRef, useState } from "react";

interface FileUploadFieldProps {
  onFileChange: (file: File | null) => void;
}

export function FileUploadField({ onFileChange }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setPreview(null);
      setFileName(null);
      onFileChange(null);
      return;
    }

    setFileName(file.name);
    onFileChange(file);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function handleRemove() {
    setPreview(null);
    setFileName(null);
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Arquivo (opcional)
      </label>

      {fileName ? (
        <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-40 object-contain rounded-lg mb-2"
            />
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 truncate max-w-[200px]">
              {fileName}
            </span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-500 text-sm hover:text-red-700 ml-2 flex-shrink-0"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 text-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
        >
          <svg
            className="w-8 h-8 mx-auto mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm">Toque para anexar imagem ou PDF</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
