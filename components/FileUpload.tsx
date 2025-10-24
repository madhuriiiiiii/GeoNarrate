
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './IconComponents';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true); // Keep it true while hovering
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);


  return (
    <label
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative block w-full max-w-lg mx-auto p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
        isDragging ? 'border-blue-400 bg-blue-900/50 scale-105' : 'border-gray-600 hover:border-blue-500 hover:bg-gray-800'
      }`}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <UploadIcon className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-lg font-semibold text-white">
          <span className="text-blue-400">Click to upload</span> or drag and drop
        </p>
        <p className="mt-1 text-sm text-gray-400">PNG, JPG, or WEBP</p>
      </div>
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
    </label>
  );
};

export default FileUpload;
