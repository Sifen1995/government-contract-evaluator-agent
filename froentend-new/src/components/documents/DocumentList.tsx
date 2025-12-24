import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { listDocuments, getDownloadUrl, deleteDocument } from "@/lib/documents";
import type { Document, ExtractionStatus } from "@/types/document";

interface DocumentListProps {
  onViewSuggestions?: (documentId: string) => void;
}

function getExtractionStatusBadge(status: ExtractionStatus, isScanned: boolean) {
  const statusConfig = {
    pending: { icon: Clock, label: "Pending", variant: "secondary" as const },
    processing: { icon: Loader2, label: "Processing", variant: "secondary" as const },
    completed: { icon: CheckCircle, label: "Completed", variant: "default" as const },
    failed: { icon: AlertCircle, label: "Failed", variant: "destructive" as const },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {config.label}
      {isScanned && status === "completed" && " (OCR)"}
    </Badge>
  );
}

function getDocumentTypeLabel(type: string) {
  const labels: Record<string, string> = {
    capability_statement: "Capability Statement",
    certification: "Certification",
    past_performance: "Past Performance",
    other: "Other",
  };
  return labels[type] || type;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DocumentCard({
  document,
  onViewSuggestions,
}: {
  document: Document;
  onViewSuggestions?: (documentId: string) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadMutation = useMutation({
    mutationFn: () => getDownloadUrl(document.id),
    onSuccess: (data) => {
      window.open(data.download_url, "_blank");
    },
    onError: () => {
      toast({
        title: "Download failed",
        description: "Failed to download document",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDocument(document.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Document deleted",
        description: "The document has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadMutation.mutateAsync();
    setIsDownloading(false);
  };

  const hasSuggestions = document.extraction_status === "completed" && !document.suggestions_reviewed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card variant="interactive" className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{document.file_name}</h4>
                {hasSuggestions && (
                  <Badge variant="outline" className="flex items-center gap-1 text-primary border-primary">
                    <Sparkles className="w-3 h-3" />
                    Suggestions
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{getDocumentTypeLabel(document.document_type)}</Badge>
                <span>{formatFileSize(document.file_size)}</span>
                <span>•</span>
                <span>{formatDate(document.created_at)}</span>
              </div>
              <div className="mt-2">
                {getExtractionStatusBadge(document.extraction_status, document.is_scanned)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasSuggestions && onViewSuggestions && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewSuggestions(document.id)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Review
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Document</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{document.file_name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function DocumentList({ onViewSuggestions }: DocumentListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load documents</h3>
        <p className="text-muted-foreground">Please try again later.</p>
      </Card>
    );
  }

  const documents = data?.documents || [];

  if (documents.length === 0) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No documents uploaded yet</h3>
        <p className="text-muted-foreground">
          Upload documents to enable AI-powered profile suggestions
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onViewSuggestions={onViewSuggestions}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
