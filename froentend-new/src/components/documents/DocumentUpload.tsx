import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getUploadUrl, createDocument, uploadFileToS3 } from "@/lib/documents";
import type { DocumentType } from "@/types/document";

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "capability_statement", label: "Capability Statement" },
  { value: "certification", label: "Certification" },
  { value: "past_performance", label: "Past Performance" },
  { value: "other", label: "Other" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("capability_statement");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");

      setUploadStatus("uploading");
      setUploadProgress(10);

      // Step 1: Get presigned URL
      const uploadData = await getUploadUrl({
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        document_type: documentType,
        file_size: selectedFile.size,
      });
      setUploadProgress(30);

      // Step 2: Upload to S3
      await uploadFileToS3(uploadData.upload_url, selectedFile);
      setUploadProgress(70);

      // Step 3: Create document record
      const document = await createDocument({
        document_type: documentType,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        s3_key: uploadData.s3_key,
      });
      setUploadProgress(100);

      return document;
    },
    onSuccess: () => {
      setUploadStatus("success");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded and is being processed.",
      });
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadStatus("idle");
        onUploadComplete?.();
      }, 1500);
    },
    onError: (error: Error) => {
      setUploadStatus("error");
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadStatus("idle");
    setUploadProgress(0);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
          ${selectedFile ? "bg-secondary/30" : ""}
        `}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <input
          id="file-upload"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex items-center justify-center gap-4">
            <FileText className="w-10 h-10 text-primary" />
            <div className="text-left">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Drop files here or click to upload
            </h3>
            <p className="text-sm text-muted-foreground">
              PDF, DOC, DOCX up to 10MB
            </p>
          </>
        )}
      </div>

      {/* Document Type Selector */}
      {selectedFile && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Document Type</label>
            <Select
              value={documentType}
              onValueChange={(value) => setDocumentType(value as DocumentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadStatus === "uploading" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Success State */}
      {uploadStatus === "success" && (
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="w-5 h-5" />
          <span>Upload complete!</span>
        </div>
      )}

      {/* Error State */}
      {uploadStatus === "error" && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>Upload failed. Please try again.</span>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && uploadStatus !== "uploading" && uploadStatus !== "success" && (
        <Button
          variant="hero"
          onClick={() => uploadMutation.mutate()}
          disabled={uploadMutation.isPending}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      )}
    </div>
  );
}
