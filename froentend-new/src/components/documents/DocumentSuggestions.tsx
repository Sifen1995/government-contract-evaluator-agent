import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  X,
  Loader2,
  AlertCircle,
  FileText,
  Building2,
  MapPin,
  DollarSign,
  Award,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getDocumentSuggestions, applySuggestions, markSuggestionsReviewed } from "@/lib/documents";
import type { DocumentSuggestions as DocumentSuggestionsType } from "@/types/document";

interface DocumentSuggestionsProps {
  documentId: string;
  onClose: () => void;
}

function getOcrQualityBadge(quality: string | null, confidence: number | null) {
  if (!quality) return null;

  const colors: Record<string, string> = {
    excellent: "bg-success/20 text-success",
    good: "bg-primary/20 text-primary",
    fair: "bg-warning/20 text-warning",
    poor: "bg-destructive/20 text-destructive",
  };

  return (
    <Badge className={colors[quality] || ""}>
      OCR: {quality} ({confidence ? `${(confidence * 100).toFixed(0)}%` : "N/A"})
    </Badge>
  );
}

export function DocumentSuggestions({ documentId, onClose }: DocumentSuggestionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for selected items
  const [selectedNaics, setSelectedNaics] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState<string>("");
  const [appendCapabilities, setAppendCapabilities] = useState(true);

  // Fetch suggestions
  const { data: suggestions, isLoading, error } = useQuery({
    queryKey: ["documents", documentId, "suggestions"],
    queryFn: () => getDocumentSuggestions(documentId),
    onSuccess: (data: DocumentSuggestionsType) => {
      // Pre-select all high confidence items
      setSelectedNaics(
        data.naics_codes
          .filter((n) => n.confidence >= 0.8)
          .map((n) => n.code)
      );
      setSelectedCerts(
        data.certifications
          .filter((c) => c.confidence >= 0.8)
          .map((c) => c.certification_type)
      );
      setSelectedLocations(data.locations);
      setCapabilities(data.capabilities || "");
    },
  });

  // Apply suggestions mutation
  const applyMutation = useMutation({
    mutationFn: () =>
      applySuggestions(documentId, {
        naics_codes: selectedNaics,
        certifications: selectedCerts,
        capabilities: capabilities,
        append_capabilities: appendCapabilities,
        geographic_preferences: selectedLocations,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["company"] });
      toast({
        title: "Suggestions applied",
        description: data.message,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to apply suggestions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark as reviewed mutation
  const reviewMutation = useMutation({
    mutationFn: () => markSuggestionsReviewed(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Marked as reviewed",
        description: "You can always come back to review suggestions later.",
      });
      onClose();
    },
  });

  const toggleNaics = (code: string) => {
    setSelectedNaics((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleCert = (type: string) => {
    setSelectedCerts((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error || !suggestions) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load suggestions</h3>
        <p className="text-muted-foreground mb-4">
          {suggestions?.extraction_status === "pending" || suggestions?.extraction_status === "processing"
            ? "Document is still being processed. Please check back later."
            : "There was an error extracting information from this document."}
        </p>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </Card>
    );
  }

  const hasAnyData =
    suggestions.naics_codes.length > 0 ||
    suggestions.certifications.length > 0 ||
    suggestions.capabilities ||
    suggestions.locations.length > 0;

  if (!hasAnyData) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No suggestions found</h3>
        <p className="text-muted-foreground mb-4">
          We couldn't extract any profile information from this document.
        </p>
        <Button variant="outline" onClick={() => reviewMutation.mutate()}>
          Mark as Reviewed
        </Button>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI-Extracted Suggestions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select the information you'd like to add to your company profile
          </p>
        </div>
        {suggestions.is_scanned && getOcrQualityBadge(suggestions.ocr_quality, suggestions.ocr_confidence)}
      </div>

      {/* NAICS Codes */}
      {suggestions.naics_codes.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Code className="w-4 h-4 text-primary" />
              NAICS Codes
            </CardTitle>
            <CardDescription>Industry classification codes found in the document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.naics_codes.map((naics) => (
              <label
                key={naics.code}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selectedNaics.includes(naics.code)}
                  onCheckedChange={() => toggleNaics(naics.code)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{naics.code}</span>
                    <Progress value={naics.confidence * 100} className="w-16 h-1" />
                    <span className="text-xs text-muted-foreground">
                      {(naics.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{naics.description}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {suggestions.certifications.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-4 h-4 text-primary" />
              Certifications
            </CardTitle>
            <CardDescription>Small business certifications identified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.certifications.map((cert) => (
              <label
                key={cert.certification_type}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selectedCerts.includes(cert.certification_type)}
                  onCheckedChange={() => toggleCert(cert.certification_type)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cert.certification_type}</span>
                    <Progress value={cert.confidence * 100} className="w-16 h-1" />
                    <span className="text-xs text-muted-foreground">
                      {(cert.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  {cert.expiration_date && (
                    <p className="text-sm text-muted-foreground">
                      Expires: {new Date(cert.expiration_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Locations */}
      {suggestions.locations.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4 text-primary" />
              Geographic Locations
            </CardTitle>
            <CardDescription>Service areas and locations mentioned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestions.locations.map((location) => (
                <Badge
                  key={location}
                  variant={selectedLocations.includes(location) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleLocation(location)}
                >
                  {selectedLocations.includes(location) && <Check className="w-3 h-3 mr-1" />}
                  {location}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capabilities */}
      {suggestions.capabilities && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-primary" />
              Capabilities
            </CardTitle>
            <CardDescription>Extracted capability statement text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={capabilities}
              onChange={(e) => setCapabilities(e.target.value)}
              rows={4}
              placeholder="Edit extracted capabilities..."
            />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={appendCapabilities}
                onCheckedChange={(checked) => setAppendCapabilities(!!checked)}
              />
              Append to existing capabilities (instead of replacing)
            </label>
          </CardContent>
        </Card>
      )}

      {/* Agencies & Contract Values (read-only info) */}
      {(suggestions.agencies.length > 0 || suggestions.contract_values.length > 0) && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4 text-primary" />
              Additional Information
            </CardTitle>
            <CardDescription>Other relevant details extracted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.agencies.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Agencies Mentioned</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.agencies.map((agency) => (
                    <Badge key={agency} variant="secondary">
                      {agency}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {suggestions.contract_values.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Contract Values</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.contract_values.map((value) => (
                    <Badge key={value} variant="outline" className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={() => reviewMutation.mutate()}>
          Skip for Now
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="hero"
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
          >
            {applyMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Apply Selected
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
