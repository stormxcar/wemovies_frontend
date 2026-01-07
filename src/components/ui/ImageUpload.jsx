import React, { useState, useRef } from "react";
import { toast } from "react-toastify";

const ImageUpload = ({
  onImageChange,
  currentImageUrl = "",
  label = "Ảnh thumbnail",
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  className = "",
}) => {
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const [uploadType, setUploadType] = useState("url"); // 'url' or 'file'
  const [urlInput, setUrlInput] = useState(currentImageUrl);
  const fileInputRef = useRef(null);

  const handleTypeChange = (type) => {
    setUploadType(type);
    if (type === "url") {
      setPreviewUrl(urlInput);
      onImageChange({ type: "url", value: urlInput });
    } else {
      setPreviewUrl("");
      onImageChange({ type: "file", value: null });
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setUrlInput(url);
    if (uploadType === "url") {
      setPreviewUrl(url);
      onImageChange({ type: "url", value: url });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size
      if (file.size > maxSize) {
        toast.error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);

      onImageChange({ type: "file", value: file });
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    setUrlInput("");
    if (uploadType === "file") {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    onImageChange({ type: "url", value: "" });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Upload Type Selector */}
      <div className="flex space-x-4">
        <label className="flex items-center">
          <input
            type="radio"
            name="uploadType"
            value="url"
            checked={uploadType === "url"}
            onChange={() => handleTypeChange("url")}
            className="mr-2"
          />
          URL
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="uploadType"
            value="file"
            checked={uploadType === "file"}
            onChange={() => handleTypeChange("file")}
            className="mr-2"
          />
          Upload File
        </label>
      </div>

      {/* URL Input */}
      {uploadType === "url" && (
        <input
          type="url"
          value={urlInput}
          onChange={handleUrlChange}
          placeholder="Nhập URL ảnh..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      )}

      {/* File Upload */}
      {uploadType === "file" && (
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleFileButtonClick}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Chọn file
          </button>
          <span className="text-sm text-gray-500">
            {fileInputRef.current?.files[0]?.name || "Chưa chọn file"}
          </span>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-32 h-32 object-cover border border-gray-300 rounded-md"
            onError={() => {
              setPreviewUrl("");
              toast.error("Không thể tải ảnh. Vui lòng kiểm tra URL.");
            }}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
