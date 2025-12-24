import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Sparkles, Loader2, CheckCircle, XCircle, Mail, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

type UnsubscribeState = "confirm" | "loading" | "success" | "error";

export function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();

  const [state, setState] = useState<UnsubscribeState>("confirm");
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnsubscribe = async () => {
    if (!token) {
      setErrorMessage("Invalid unsubscribe link");
      setState("error");
      return;
    }

    setState("loading");
    try {
      await api.post("/auth/unsubscribe", { token });
      setState("success");
      toast({
        title: "Unsubscribed successfully",
        description: "You will no longer receive email notifications.",
      });
    } catch (err: any) {
      setState("error");
      setErrorMessage(err.response?.data?.detail || "Failed to unsubscribe. Please try again.");
      toast({
        title: "Unsubscribe failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    switch (state) {
      case "confirm":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
              <MailX className="w-8 h-8 text-warning" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Unsubscribe from emails?</h2>
              <p className="text-muted-foreground">
                You'll stop receiving all email notifications from GovAI, including daily digests and deadline reminders.
              </p>
            </div>
            <div className="space-y-3">
              <Button variant="destructive" className="w-full" onClick={handleUnsubscribe}>
                Yes, unsubscribe me
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/settings">No, manage my preferences instead</Link>
              </Button>
            </div>
          </div>
        );

      case "loading":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Processing...</h2>
              <p className="text-muted-foreground">Please wait while we update your preferences.</p>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Unsubscribed Successfully</h2>
              <p className="text-muted-foreground">
                You've been unsubscribed from all GovAI email notifications. You can re-enable notifications anytime from your settings.
              </p>
            </div>
            <div className="space-y-3">
              <Button variant="hero" className="w-full" asChild>
                <Link to="/settings">Manage Email Preferences</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/">Return to Home</Link>
              </Button>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Something Went Wrong</h2>
              <p className="text-muted-foreground">{errorMessage}</p>
            </div>
            <div className="space-y-3">
              <Button variant="hero" className="w-full" onClick={() => setState("confirm")}>
                Try Again
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/settings">Manage Settings Manually</Link>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-2xl">GovAI</span>
        </Link>

        <Card variant="glass" className="backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Email Preferences</CardTitle>
            <CardDescription>Manage your notification settings</CardDescription>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
