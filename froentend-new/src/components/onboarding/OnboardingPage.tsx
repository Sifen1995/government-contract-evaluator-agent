import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  FileText,
  DollarSign,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

interface CompanyData {
  name: string;
  legal_structure: string;
  uei: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  naics_codes: string[];
  set_asides: string[];
  capabilities: string;
  contract_value_min: number;
  contract_value_max: number;
  geographic_preferences: string[];
}

const STEPS = [
  { id: 1, title: "Company Info", icon: Building2, description: "Basic company details" },
  { id: 2, title: "Location", icon: MapPin, description: "Address and preferences" },
  { id: 3, title: "Capabilities", icon: FileText, description: "NAICS codes and certifications" },
  { id: 4, title: "Contract Size", icon: DollarSign, description: "Target contract values" },
];

const SET_ASIDE_OPTIONS = [
  { value: "8(a)", label: "8(a) Business Development" },
  { value: "WOSB", label: "Women-Owned Small Business" },
  { value: "SDVOSB", label: "Service-Disabled Veteran-Owned" },
  { value: "HUBZone", label: "HUBZone" },
  { value: "SDB", label: "Small Disadvantaged Business" },
  { value: "VOSB", label: "Veteran-Owned Small Business" },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [naicsInput, setNaicsInput] = useState("");

  const [formData, setFormData] = useState<CompanyData>({
    name: "",
    legal_structure: "LLC",
    uei: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    naics_codes: [],
    set_asides: [],
    capabilities: "",
    contract_value_min: 25000,
    contract_value_max: 500000,
    geographic_preferences: [],
  });

  const updateFormData = (field: keyof CompanyData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSetAside = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      set_asides: prev.set_asides.includes(value)
        ? prev.set_asides.filter((s) => s !== value)
        : [...prev.set_asides, value],
    }));
  };

  const addNaicsCode = () => {
    const code = naicsInput.trim();
    if (code && !formData.naics_codes.includes(code)) {
      updateFormData("naics_codes", [...formData.naics_codes, code]);
      setNaicsInput("");
    }
  };

  const removeNaicsCode = (code: string) => {
    updateFormData("naics_codes", formData.naics_codes.filter((c) => c !== code));
  };

  const toggleState = (state: string) => {
    setFormData((prev) => ({
      ...prev,
      geographic_preferences: prev.geographic_preferences.includes(state)
        ? prev.geographic_preferences.filter((s) => s !== state)
        : [...prev.geographic_preferences, state],
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await api.post("/company", formData);
      await refreshUser();
      toast({
        title: "Company profile created!",
        description: "Your profile is ready. Let's find you some opportunities!",
      });
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.detail || "Failed to create company profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return true; // Location is optional
      case 3:
        return formData.naics_codes.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="Your Company, LLC"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal_structure">Legal Structure</Label>
              <select
                id="legal_structure"
                value={formData.legal_structure}
                onChange={(e) => updateFormData("legal_structure", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="LLC">LLC</option>
                <option value="Corporation">Corporation</option>
                <option value="S-Corp">S-Corp</option>
                <option value="Sole Proprietor">Sole Proprietor</option>
                <option value="Partnership">Partnership</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="uei">UEI (Unique Entity Identifier)</Label>
              <Input
                id="uei"
                value={formData.uei}
                onChange={(e) => updateFormData("uei", e.target.value)}
                placeholder="12 character UEI"
                maxLength={12}
              />
              <p className="text-xs text-muted-foreground">
                Required for federal contracting. Get one at SAM.gov
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_street">Street Address</Label>
              <Input
                id="address_street"
                value={formData.address_street}
                onChange={(e) => updateFormData("address_street", e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_city">City</Label>
                <Input
                  id="address_city"
                  value={formData.address_city}
                  onChange={(e) => updateFormData("address_city", e.target.value)}
                  placeholder="Washington"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_state">State</Label>
                <select
                  id="address_state"
                  value={formData.address_state}
                  onChange={(e) => updateFormData("address_state", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select state</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_zip">ZIP Code</Label>
              <Input
                id="address_zip"
                value={formData.address_zip}
                onChange={(e) => updateFormData("address_zip", e.target.value)}
                placeholder="20001"
                maxLength={10}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>NAICS Codes *</Label>
              <div className="flex gap-2">
                <Input
                  value={naicsInput}
                  onChange={(e) => setNaicsInput(e.target.value)}
                  placeholder="e.g., 541512"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addNaicsCode())}
                />
                <Button type="button" variant="outline" onClick={addNaicsCode}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.naics_codes.map((code) => (
                  <span
                    key={code}
                    className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2"
                  >
                    {code}
                    <button onClick={() => removeNaicsCode(code)} className="hover:text-destructive">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Set-Aside Certifications</Label>
              <div className="grid grid-cols-2 gap-2">
                {SET_ASIDE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleSetAside(option.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      formData.set_asides.includes(option.value)
                        ? "bg-primary/20 border-primary text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capabilities">Capabilities Statement</Label>
              <Textarea
                id="capabilities"
                value={formData.capabilities}
                onChange={(e) => updateFormData("capabilities", e.target.value)}
                placeholder="Describe your company's core competencies, past performance, and unique value proposition..."
                rows={4}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Target Contract Value Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_value_min" className="text-sm text-muted-foreground">
                    Minimum
                  </Label>
                  <Input
                    id="contract_value_min"
                    type="number"
                    value={formData.contract_value_min}
                    onChange={(e) => updateFormData("contract_value_min", parseInt(e.target.value) || 0)}
                    placeholder="25000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_value_max" className="text-sm text-muted-foreground">
                    Maximum
                  </Label>
                  <Input
                    id="contract_value_max"
                    type="number"
                    value={formData.contract_value_max}
                    onChange={(e) => updateFormData("contract_value_max", parseInt(e.target.value) || 0)}
                    placeholder="500000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Geographic Preferences (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select states where you prefer to perform work
              </p>
              <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {US_STATES.map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => toggleState(state)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      formData.geographic_preferences.includes(state)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-2xl">GovAI</span>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-2 rounded transition-colors ${
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  variant="hero"
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  variant="hero"
                  onClick={handleSubmit}
                  disabled={isLoading || !canProceed()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
