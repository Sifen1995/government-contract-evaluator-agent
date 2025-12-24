import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { listCertifications, createCertification, deleteCertification } from "@/lib/documents";
import type { Certification, CertificationCreate } from "@/types/document";

const CERTIFICATION_TYPES = [
  { value: "8A", label: "8(a) Business Development" },
  { value: "HUBZone", label: "HUBZone" },
  { value: "SDVOSB", label: "Service-Disabled Veteran-Owned" },
  { value: "VOSB", label: "Veteran-Owned Small Business" },
  { value: "WOSB", label: "Women-Owned Small Business" },
  { value: "EDWOSB", label: "Economically Disadvantaged WOSB" },
  { value: "SBA", label: "Small Business" },
  { value: "Other", label: "Other" },
];

function getStatusBadge(cert: Certification) {
  if (cert.status === "expired") {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Expired
      </Badge>
    );
  }
  if (cert.is_expiring_soon) {
    return (
      <Badge variant="outline" className="flex items-center gap-1 text-warning border-warning">
        <Clock className="w-3 h-3" />
        Expiring in {cert.days_until_expiration} days
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="flex items-center gap-1 text-success border-success">
      <CheckCircle className="w-3 h-3" />
      Active
    </Badge>
  );
}

function AddCertificationDialog({ onAdd }: { onAdd: (data: CertificationCreate) => void }) {
  const [open, setOpen] = useState(false);
  const [certType, setCertType] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  const handleSubmit = () => {
    if (!certType) return;
    onAdd({
      certification_type: certType,
      issued_date: issuedDate || undefined,
      expiration_date: expirationDate || undefined,
    });
    setOpen(false);
    setCertType("");
    setIssuedDate("");
    setExpirationDate("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Certification
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Certification</DialogTitle>
          <DialogDescription>
            Add a new small business certification to your profile.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="certType">Certification Type</Label>
            <Select value={certType} onValueChange={setCertType}>
              <SelectTrigger>
                <SelectValue placeholder="Select certification type" />
              </SelectTrigger>
              <SelectContent>
                {CERTIFICATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="issuedDate">Issued Date (Optional)</Label>
            <Input
              id="issuedDate"
              type="date"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expirationDate">Expiration Date (Optional)</Label>
            <Input
              id="expirationDate"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!certType}>
            Add Certification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CertificationsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["certifications"],
    queryFn: listCertifications,
  });

  const createMutation = useMutation({
    mutationFn: createCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      toast({
        title: "Certification added",
        description: "Your certification has been added to your profile.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add certification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      toast({
        title: "Certification removed",
        description: "The certification has been removed from your profile.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove certification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load certifications</h3>
        <p className="text-muted-foreground">Please try again later.</p>
      </Card>
    );
  }

  const certifications = data?.certifications || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Certifications</h3>
          <p className="text-sm text-muted-foreground">
            Manage your small business certifications
          </p>
        </div>
        <AddCertificationDialog onAdd={(data) => createMutation.mutate(data)} />
      </div>

      {certifications.length === 0 ? (
        <Card variant="glass" className="p-8 text-center">
          <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No certifications yet</h3>
          <p className="text-muted-foreground">
            Add your small business certifications to improve matching with set-aside opportunities.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {certifications.map((cert) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card variant="interactive" className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Award className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{cert.certification_type}</h4>
                          {getStatusBadge(cert)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {cert.issued_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Issued: {new Date(cert.issued_date).toLocaleDateString()}
                            </span>
                          )}
                          {cert.expiration_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires: {new Date(cert.expiration_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Certification</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this certification? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(cert.id)}
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
