import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  RefreshCw,
  Loader2,
  X,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getStaleEvaluationCount, rescoreAllStale } from "@/lib/opportunities";

export function StaleEvaluationAlert() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDismissed, setIsDismissed] = useState(false);

  const { data: staleData, isLoading } = useQuery({
    queryKey: ["stale-evaluations"],
    queryFn: getStaleEvaluationCount,
    refetchInterval: 60000, // Refetch every minute
  });

  const rescoreMutation = useMutation({
    mutationFn: rescoreAllStale,
    onSuccess: (data) => {
      toast({
        title: "Rescoring started",
        description: `${data.queued_count} evaluations queued for rescoring. This may take a few minutes.`,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["stale-evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Rescoring failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || isDismissed) return null;
  if (!staleData || staleData.stale_count === 0) return null;

  const stalePercentage = Math.round(
    (staleData.stale_count / staleData.total_evaluations) * 100
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-foreground">
                    Stale Evaluations Detected
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {staleData.stale_count} of {staleData.total_evaluations}{" "}
                    evaluations are older than {staleData.threshold_days} days
                    and may not reflect your current company profile.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{stalePercentage}% stale</span>
                    </div>
                    <Progress
                      value={stalePercentage}
                      className="w-24 h-1.5"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rescoreMutation.mutate()}
                  disabled={rescoreMutation.isPending}
                >
                  {rescoreMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rescoring...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Rescore All ({staleData.stale_count})
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDismissed(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
