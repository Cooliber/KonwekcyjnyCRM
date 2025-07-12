import { useMutation } from "convex/react";
import {
  AlertTriangle,
  Camera,
  Check,
  Download,
  Eye,
  File,
  FileText,
  Image,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import {
  deleteFile,
  FILE_UPLOAD_CONFIG,
  getFileUrl,
  STORAGE_BUCKETS,
  uploadFileWithProgress,
} from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  url?: string;
  supabaseUrl?: string;
  supabasePath?: string;
  type: "equipment_photo" | "invoice" | "technical_drawing" | "document";
  bucket?: string;
  metadata?: {
    size: number;
    lastModified: number;
    type: string;
  };
}

interface FileUploadManagerProps {
  jobId?: string;
  contactId?: string;
  allowedTypes?: string[];
  maxFileSize?: number; // in MB
  onUploadComplete?: (files: FileUpload[]) => void;
}

export function FileUploadManager({
  jobId,
  contactId,
  allowedTypes = ["image/*", "application/pdf", ".doc", ".docx"],
  maxFileSize = 10,
  onUploadComplete,
}: FileUploadManagerProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Store file in Convex database
  const storeFileMetadata = useMutation(api.documents.create);

  // Production Supabase upload function
  const uploadToSupabase = async (
    file: File,
    type: string,
    uploadId: string
  ): Promise<{ url: string; path: string }> => {
    try {
      // Determine bucket based on file type
      const bucket = getBucketForFileType(type);

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `${jobId || contactId}/${timestamp}_${sanitizedName}`;

      // Upload with progress tracking
      const { data, error } = await uploadFileWithProgress(bucket, path, file, (progress) => {
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress } : u)));
      });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const publicUrl = getFileUrl(bucket, path);

      return { url: publicUrl, path };
    } catch (error) {
      console.error("Supabase upload error:", error);
      throw error;
    }
  };

  // Helper function to determine bucket based on file type
  const getBucketForFileType = (type: string): string => {
    switch (type) {
      case "equipment_photo":
        return STORAGE_BUCKETS.EQUIPMENT_PHOTOS;
      case "invoice":
        return STORAGE_BUCKETS.INVOICES;
      case "technical_drawing":
        return STORAGE_BUCKETS.TECHNICAL_DRAWINGS;
      default:
        return STORAGE_BUCKETS.DOCUMENTS;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Validate files
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
          toast.error(
            `${file.name} is too large. Maximum size is ${FILE_UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
          );
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      const newUploads: FileUpload[] = validFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: "uploading" as const,
        type: getFileType(file),
        bucket: getBucketForFileType(getFileType(file)),
        metadata: {
          size: file.size,
          lastModified: file.lastModified,
          type: file.type,
        },
      }));

      setUploads((prev) => [...prev, ...newUploads]);
      setIsUploading(true);

      // Upload files sequentially to avoid overwhelming the server
      for (const upload of newUploads) {
        try {
          // Upload to Supabase with progress tracking
          const { url, path } = await uploadToSupabase(upload.file, upload.type, upload.id);

          // Store metadata in Convex
          await storeFileMetadata({
            name: upload.file.name,
            fileSize: upload.file.size,
            mimeType: upload.file.type,
            category: mapTypeToCategory(upload.type),
            contactId: contactId || undefined,
            jobId: jobId || undefined,
            supabaseUrl: url,
            supabasePath: path,
            bucket: upload.bucket!,
            tags: generateAutoTags(upload.file.name, upload.type),
            accessLevel: "team" as const,
          });

          // Update with completed status
          setUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id
                ? {
                    ...u,
                    progress: 100,
                    status: "completed" as const,
                    supabaseUrl: url,
                    supabasePath: path,
                  }
                : u
            )
          );

          toast.success(`${upload.file.name} uploaded successfully`);
          onUploadComplete?.(url, upload.file.name);
        } catch (error) {
          console.error("Upload error:", error);
          setUploads((prev) =>
            prev.map((u) => (u.id === upload.id ? { ...u, status: "error" as const } : u))
          );
          toast.error(
            `Failed to upload ${upload.file.name}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      setIsUploading(false);

      if (onUploadComplete) {
        const completedUploads = uploads.filter((u) => u.status === "completed");
        onUploadComplete(completedUploads);
      }
    },
    [
      uploads,
      onUploadComplete,
      contactId,
      generateAutoTags,
      getBucketForFileType,
      getFileType,
      jobId,
      mapTypeToCategory,
      storeFileMetadata,
      uploadToSupabase,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize * 1024 * 1024,
    multiple: true,
  });

  // Helper functions for file processing
  const getFileType = (file: File): FileUpload["type"] => {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    if (fileType.startsWith("image/")) {
      return "equipment_photo";
    } else if (
      fileType === "application/pdf" ||
      fileName.includes("invoice") ||
      fileName.includes("faktura")
    ) {
      return "invoice";
    } else if (
      fileName.includes("drawing") ||
      fileName.includes("blueprint") ||
      fileName.includes("schema")
    ) {
      return "technical_drawing";
    }
    return "document";
  };

  const mapTypeToCategory = (type: FileUpload["type"]): string => {
    switch (type) {
      case "equipment_photo":
        return "photo";
      case "invoice":
        return "invoice";
      case "technical_drawing":
        return "manual";
      default:
        return "other";
    }
  };

  const generateAutoTags = (fileName: string, type: FileUpload["type"]): string[] => {
    const tags: string[] = [type];
    const lowerName = fileName.toLowerCase();

    // Add Warsaw district tags if detected
    const districts = ["śródmieście", "mokotów", "ochota", "wola", "żoliborz", "praga"];
    districts.forEach((district) => {
      if (lowerName.includes(district)) {
        tags.push(district);
      }
    });

    // Add equipment type tags
    const equipmentTypes = ["klimatyzacja", "wentylacja", "hvac", "split", "multi"];
    equipmentTypes.forEach((equipment) => {
      if (lowerName.includes(equipment)) {
        tags.push(equipment);
      }
    });

    return tags;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="w-5 h-5" />;
    if (file.type === "application/pdf") return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const removeUpload = async (id: string) => {
    const upload = uploads.find((u) => u.id === id);
    if (upload?.supabasePath && upload?.bucket) {
      try {
        await deleteFile(upload.bucket, upload.supabasePath);
      } catch (error) {
        console.error("Failed to delete file from Supabase:", error);
      }
    }
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  // Camera capture functionality
  const handleCameraCapture = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, []);

  const handleCameraChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        onDrop(Array.from(files));
      }
    },
    [onDrop]
  );

  // Manual file selection
  const handleFileSelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        onDrop(Array.from(files));
      }
    },
    [onDrop]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Paperclip className="w-5 h-5 mr-2" />
          File Upload Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Options */}
        <div className="flex gap-3 mb-4">
          <Button
            onClick={handleFileSelect}
            variant="outline"
            className="flex-1"
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Files
          </Button>
          <Button
            onClick={handleCameraCapture}
            variant="outline"
            className="flex-1"
            disabled={isUploading}
          >
            <Camera className="w-4 h-4 mr-2" />
            Take Photo
          </Button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraChange}
          className="hidden"
        />

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop files here...</p>
          ) : (
            <div>
              <p className="text-gray-600 font-medium mb-2">Drag & drop files here</p>
              <p className="text-sm text-gray-500">
                Supports: Images, PDFs, Documents (max{" "}
                {FILE_UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB each)
              </p>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploads.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Uploads</h4>
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0">{getFileIcon(upload.file)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{upload.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(upload.file.size)} • {upload.type.replace("_", " ")}
                  </p>
                  {upload.status === "uploading" && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center space-x-2">
                  {upload.status === "uploading" && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                  )}
                  {upload.status === "completed" && (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      {upload.supabaseUrl && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(upload.supabaseUrl, "_blank")}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = upload.supabaseUrl!;
                              link.download = upload.file.name;
                              link.click();
                            }}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  {upload.status === "error" && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  <Button variant="ghost" size="sm" onClick={() => removeUpload(upload.id)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Camera className="w-4 h-4 mr-2" />
            Take Photo
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Scan Document
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            From Cloud
          </Button>
        </div>

        {/* File Type Guidelines */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">File Organization</h5>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <Image className="w-4 h-4 text-blue-600" />
              <span>Equipment Photos</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Invoices & Receipts</span>
            </div>
            <div className="flex items-center space-x-2">
              <File className="w-4 h-4 text-blue-600" />
              <span>Technical Drawings</span>
            </div>
            <div className="flex items-center space-x-2">
              <Paperclip className="w-4 h-4 text-blue-600" />
              <span>General Documents</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
