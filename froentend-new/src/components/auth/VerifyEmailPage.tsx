import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Sparkles, Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

type VerificationState = "loading" | "success" | "error" | "no-token";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [state, setState] = useState<VerificationState>(token ? "loading" : "no-token");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("no-token");
      return;
    }

    const verifyEmail = async () => {
      try {
        await api.post("/auth/verify-email", { token });
        setState("success");
        toast({
          title: "Email verified!",
          description: "Your email has been successfully verified. You can now log in.",
        });
      } catch (err: any) {
        setState("error");
        setErrorMessage(err.response?.data?.detail || "Verification failed. The link may have expired.");
        toast({
          title: "Verification failed",
          description: "The verification link is invalid or has expired.",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [token, toast]);

  const renderContent = () => {
    switch (state) {
      case "loading":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Verifying your email...</h2>
              <p className="text-muted-foreground">Please wait while we verify your email address.</p>
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
              <h2 className="text-xl font-semibold mb-2">Email Verified!</h2>
              <p className="text-muted-foreground">
                Your email has been successfully verified. You can now log in to your account.
              </p>
            </div>
            <Button variant="hero" className="w-full" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
              <p className="text-muted-foreground">{errorMessage}</p>
            </div>
            <div className="space-y-3">
              <Button variant="hero" className="w-full" asChild>
                <Link to="/login">Go to Login</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Need a new verification link?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Log in to resend
                </Link>
              </p>
            </div>
          </div>
        );

      case "no-token":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Check Your Email</h2>
              <p className="text-muted-foreground">
                We've sent a verification link to your email address. Click the link in the email to verify your account.
              </p>
            </div>
            <div className="space-y-3">
              <Button variant="hero" className="w-full" asChild>
                <Link to="/login">Back to Login</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try logging in to resend.
              </p>
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
            <CardTitle className="text-2xl">Email Verification</CardTitle>
            <CardDescription>Verify your email to access your account</CardDescription>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
