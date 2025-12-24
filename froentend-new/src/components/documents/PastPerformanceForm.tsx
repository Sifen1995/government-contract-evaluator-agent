import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  Building2,
  DollarSign,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { listPastPerformance, createPastPerformance, deletePastPerformance } from "@/lib/documents";
import type { PastPerformance, PastPerformanceCreate } from "@/types/document";

const PERFORMANCE_RATINGS = [
  { value: "Exceptional", label: "Exceptional" },
  { value: "Very Good", label: "Very Good" },
  { value: "Satisfactory", label: "Satisfactory" },
  { value: "Marginal", label: "Marginal" },
  { value: "Unsatisfactory", label: "Unsatisfactory" },
];

function formatCurrency(value: number | null) {
  if (!value) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getRatingColor(rating: string | null) {
  const colors: Record<string, string> = {
    Exceptional: "text-success",
    "Very Good": "text-primary",
    Satisfactory: "text-muted-foreground",
    Marginal: "text-warning",
    Unsatisfactory: "text-destructive",
  };
  return colors[rating || ""] || "text-muted-foreground";
}

function AddPastPerformanceDialog({
  onAdd,
}: {
  onAdd: (data: PastPerformanceCreate) => void;
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<PastPerformanceCreate>({
    contract_number: "",
    agency_name: "",
    contract_value: undefined,
    pop_start: "",
    pop_end: "",
    naics_codes: [],
    performance_rating: "",
    description: "",
  });
  const [naicsInput, setNaicsInput] = useState("");

  const handleSubmit = () => {
    onAdd(formData);
    setOpen(false);
    setFormData({
      contract_number: "",
      agency_name: "",
      contract_value: undefined,
      pop_start: "",
      pop_end: "",
      naics_codes: [],
      performance_rating: "",
      description: "",
    });
    setNaicsInput("");
  };

  const addNaicsCode = () => {
    if (naicsInput && !formData.naics_codes?.includes(naicsInput)) {
      setFormData({
        ...formData,
        naics_codes: [...(formData.naics_codes || []), naicsInput],
      });
      setNaicsInput("");
    }
  };

  const removeNaicsCode = (code: string) => {
    setFormData({
      ...formData,
      naics_codes: formData.naics_codes?.filter((c) => c !== code),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Record
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Past Performance Record</DialogTitle>
          <DialogDescription>
            Add a contract you've successfully completed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contractNumber">Contract Number</Label>
              <Input
                id="contractNumber"
                placeholder="e.g., W91234-20-C-0001"
                value={formData.contract_number || ""}
                onChange={(e) =>
                  setFormData({ ...formData, contract_number: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencyName">Agency Name</Label>
              <Input
                id="agencyName"
                placeholder="e.g., U.S. Army"
                value={formData.agency_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, agency_name: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractValue">Contract Value</Label>
            <Input
              id="contractValue"
              type="number"
              placeholder="e.g., 500000"
              value={formData.contract_value || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contract_value: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="popStart">Period of Performance Start</Label>
              <Input
                id="popStart"
                type="date"
                value={formData.pop_start || ""}
                onChange={(e) =>
                  setFormData({ ...formData, pop_start: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="popEnd">Period of Performance End</Label>
              <Input
                id="popEnd"
                type="date"
                value={formData.pop_end || ""}
                onChange={(e) =>
                  setFormData({ ...formData, pop_end: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Performance Rating</Label>
            <Select
              value={formData.performance_rating || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, performance_rating: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {PERFORMANCE_RATINGS.map((rating) => (
                  <SelectItem key={rating.value} value={rating.value}>
                    {rating.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>NAICS Codes</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter NAICS code"
                value={naicsInput}
                onChange={(e) => setNaicsInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNaicsCode())}
              />
              <Button type="button" variant="outline" onClick={addNaicsCode}>
                Add
              </Button>
            </div>
            {formData.naics_codes && formData.naics_codes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.naics_codes.map((code) => (
                  <Badge
                    key={code}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeNaicsCode(code)}
                  >
                    {code}
                    <span className="ml-1 text-destructive">&times;</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Describe the work performed..."
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PastPerformanceForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["past-performance"],
    queryFn: listPastPerformance,
  });

  const createMutation = useMutation({
    mutationFn: createPastPerformance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["past-performance"] });
      toast({
        title: "Record added",
        description: "Your past performance record has been added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add record",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePastPerformance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["past-performance"] });
      toast({
        title: "Record removed",
        description: "The past performance record has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove record",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load records</h3>
        <p className="text-muted-foreground">Please try again later.</p>
      </Card>
    );
  }

  const records = data?.records || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Past Performance</h3>
          <p className="text-sm text-muted-foreground">
            Track your completed contracts and performance history
          </p>
        </div>
        <AddPastPerformanceDialog onAdd={(data) => createMutation.mutate(data)} />
      </div>

      {records.length === 0 ? (
        <Card variant="glass" className="p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No past performance records</h3>
          <p className="text-muted-foreground">
            Add your completed contracts to strengthen your AI evaluation scores.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {records.map((record) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card variant="interactive" className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {record.contract_number && (
                          <span className="font-mono font-medium text-primary">
                            {record.contract_number}
                          </span>
                        )}
                        {record.performance_rating && (
                          <Badge
                            variant="outline"
                            className={`flex items-center gap-1 ${getRatingColor(record.performance_rating)}`}
                          >
                            <Star className="w-3 h-3" />
                            {record.performance_rating}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                        {record.agency_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {record.agency_name}
                          </span>
                        )}
                        {record.contract_value && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(record.contract_value)}
                          </span>
                        )}
                        {record.pop_start && record.pop_end && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(record.pop_start).toLocaleDateString()} -{" "}
                            {new Date(record.pop_end).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {record.naics_codes && record.naics_codes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {record.naics_codes.map((code) => (
                            <Badge key={code} variant="secondary" className="text-xs">
                              {code}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {record.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {record.description}
                        </p>
                      )}
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Record</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this past performance record? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(record.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Remove"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
