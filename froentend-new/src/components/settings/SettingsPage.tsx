import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  User,
  Building2,
  FileText,
  Bell,
  Save,
  Loader2,
  Plus,
  X,
  Award,
  Briefcase,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getMyCompany, updateCompany } from "@/lib/company";
import api from "@/lib/api";
import type { CompanyUpdate } from "@/types/company";
import {
  DocumentUpload,
  DocumentList,
  DocumentSuggestions,
  CertificationsForm,
  PastPerformanceForm,
} from "@/components/documents";

const tabs = [
  { id: "profile", label: "Company Profile", icon: Building2 },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "past-performance", label: "Past Performance", icon: Briefcase },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: User },
];

export function SettingsPage() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  // Company profile state
  const [companyForm, setCompanyForm] = useState({
    name: "",
    uei: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    capabilities: "",
    naics_codes: [] as string[],
    set_asides: [] as string[],
  });
  const [newNaics, setNewNaics] = useState("");
  const [newSetAside, setNewSetAside] = useState("");

  // Document suggestions dialog
  const [suggestionsDocId, setSuggestionsDocId] = useState<string | null>(null);

  // Notification state
  const [emailFrequency, setEmailFrequency] = useState("daily");
  const [notifications, setNotifications] = useState({
    newOpportunities: true,
    bidReminders: true,
    deadlineAlerts: true,
    weeklyDigest: false,
  });

  // Account state
  const [accountForm, setAccountForm] = useState({
    first_name: "",
    last_name: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Fetch company data
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company", "me"],
    queryFn: getMyCompany,
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: (data: CompanyUpdate) => updateCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      toast({
        title: "Profile updated",
        description: "Your company profile has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update user settings mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { email_frequency?: string; first_name?: string; last_name?: string }) => {
      const response = await api.put("/auth/me", data);
      return response.data;
    },
    onSuccess: () => {
      refreshUser();
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  // Populate form when company data loads
  useEffect(() => {
    if (company) {
      setCompanyForm({
        name: company.name || "",
        uei: company.uei || "",
        address_street: company.address_street || "",
        address_city: company.address_city || "",
        address_state: company.address_state || "",
        address_zip: company.address_zip || "",
        capabilities: company.capabilities || "",
        naics_codes: company.naics_codes || [],
        set_asides: company.set_asides || [],
      });
    }
  }, [company]);

  // Populate account form when user loads
  useEffect(() => {
    if (user) {
      setAccountForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
      });
      setEmailFrequency(user.email_frequency || "daily");
    }
  }, [user]);

  const handleSaveProfile = () => {
    updateCompanyMutation.mutate(companyForm);
  };

  const addNaicsCode = () => {
    if (newNaics && !companyForm.naics_codes.includes(newNaics)) {
      setCompanyForm({
        ...companyForm,
        naics_codes: [...companyForm.naics_codes, newNaics],
      });
      setNewNaics("");
    }
  };

  const removeNaicsCode = (code: string) => {
    setCompanyForm({
      ...companyForm,
      naics_codes: companyForm.naics_codes.filter((c) => c !== code),
    });
  };

  const addSetAside = () => {
    if (newSetAside && !companyForm.set_asides.includes(newSetAside)) {
      setCompanyForm({
        ...companyForm,
        set_asides: [...companyForm.set_asides, newSetAside],
      });
      setNewSetAside("");
    }
  };

  const removeSetAside = (setAside: string) => {
    setCompanyForm({
      ...companyForm,
      set_asides: companyForm.set_asides.filter((s) => s !== setAside),
    });
  };

  const handleSaveNotifications = () => {
    updateUserMutation.mutate({ email_frequency: emailFrequency });
  };

  const handleSaveAccount = () => {
    updateUserMutation.mutate({
      first_name: accountForm.first_name,
      last_name: accountForm.last_name,
    });
  };

  const handleChangePassword = () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    // TODO: Implement password change API call
    toast({
      title: "Coming soon",
      description: "Password change functionality will be available soon.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your company profile and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="glass flex-wrap h-auto gap-2 p-2">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Company Profile */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {companyLoading ? (
                <Card variant="elevated">
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Skeleton className="h-10" />
                      <Skeleton className="h-10" />
                    </div>
                    <Skeleton className="h-10" />
                    <div className="grid gap-4 md:grid-cols-3">
                      <Skeleton className="h-10" />
                      <Skeleton className="h-10" />
                      <Skeleton className="h-10" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle>Company Information</CardTitle>
                      <CardDescription>
                        Basic information about your company
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Company Name</Label>
                          <Input
                            id="companyName"
                            value={companyForm.name}
                            onChange={(e) =>
                              setCompanyForm({ ...companyForm, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="uei">UEI</Label>
                          <Input
                            id="uei"
                            value={companyForm.uei}
                            onChange={(e) =>
                              setCompanyForm({ ...companyForm, uei: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                          id="address"
                          value={companyForm.address_street}
                          onChange={(e) =>
                            setCompanyForm({
                              ...companyForm,
                              address_street: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={companyForm.address_city}
                            onChange={(e) =>
                              setCompanyForm({
                                ...companyForm,
                                address_city: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={companyForm.address_state}
                            onChange={(e) =>
                              setCompanyForm({
                                ...companyForm,
                                address_state: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zip">ZIP Code</Label>
                          <Input
                            id="zip"
                            value={companyForm.address_zip}
                            onChange={(e) =>
                              setCompanyForm({
                                ...companyForm,
                                address_zip: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle>NAICS Codes</CardTitle>
                      <CardDescription>
                        Primary industry codes for matching opportunities
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {companyForm.naics_codes.map((code) => (
                          <Badge
                            key={code}
                            variant="secondary"
                            className="flex items-center gap-1 px-3 py-1"
                          >
                            {code}
                            <button
                              onClick={() => removeNaicsCode(code)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter NAICS code (e.g., 541511)"
                          value={newNaics}
                          onChange={(e) => setNewNaics(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addNaicsCode()}
                        />
                        <Button variant="outline" onClick={addNaicsCode}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle>Set-Aside Categories</CardTitle>
                      <CardDescription>
                        Small business designations and certifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {companyForm.set_asides.map((setAside) => (
                          <Badge
                            key={setAside}
                            variant="outline"
                            className="flex items-center gap-1 px-3 py-1"
                          >
                            {setAside}
                            <button
                              onClick={() => removeSetAside(setAside)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter set-aside (e.g., 8(a), HUBZone, SDVOSB)"
                          value={newSetAside}
                          onChange={(e) => setNewSetAside(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addSetAside()}
                        />
                        <Button variant="outline" onClick={addSetAside}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle>Capabilities</CardTitle>
                      <CardDescription>
                        Describe your company's core competencies
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="capabilities">Capabilities Statement</Label>
                        <Textarea
                          id="capabilities"
                          rows={6}
                          value={companyForm.capabilities}
                          onChange={(e) =>
                            setCompanyForm({
                              ...companyForm,
                              capabilities: e.target.value,
                            })
                          }
                          placeholder="Describe your company's capabilities, experience, and unique qualifications..."
                        />
                        <p className="text-xs text-muted-foreground">
                          This will be used by AI to match opportunities to your company.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      variant="hero"
                      onClick={handleSaveProfile}
                      disabled={updateCompanyMutation.isPending}
                    >
                      {updateCompanyMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Upload Documents</CardTitle>
                  <CardDescription>
                    Upload capability statements and certifications for AI-powered profile suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentUpload />
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Uploaded Documents</CardTitle>
                  <CardDescription>
                    Your uploaded capability statements and certifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentList onViewSuggestions={(id) => setSuggestionsDocId(id)} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Document Suggestions Dialog */}
            <Dialog open={!!suggestionsDocId} onOpenChange={() => setSuggestionsDocId(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Review AI Suggestions</DialogTitle>
                </DialogHeader>
                {suggestionsDocId && (
                  <DocumentSuggestions
                    documentId={suggestionsDocId}
                    onClose={() => setSuggestionsDocId(null)}
                  />
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Certifications */}
          <TabsContent value="certifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card variant="elevated">
                <CardContent className="pt-6">
                  <CertificationsForm />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Past Performance */}
          <TabsContent value="past-performance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card variant="elevated">
                <CardContent className="pt-6">
                  <PastPerformanceForm />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Email Preferences</CardTitle>
                  <CardDescription>
                    Choose how often you receive email notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { value: "realtime", label: "Real-time", desc: "Get notified immediately" },
                    { value: "daily", label: "Daily Digest", desc: "Summary at 8 AM" },
                    { value: "weekly", label: "Weekly Summary", desc: "Every Monday" },
                    { value: "none", label: "None", desc: "No email notifications" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                        emailFrequency === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {option.desc}
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="emailFrequency"
                        value={option.value}
                        checked={emailFrequency === option.value}
                        onChange={(e) => setEmailFrequency(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${
                          emailFrequency === option.value
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {emailFrequency === option.value && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Notification Types</CardTitle>
                  <CardDescription>
                    Choose which notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      key: "newOpportunities",
                      label: "New BID Opportunities",
                      desc: "When AI recommends you bid on a new opportunity",
                    },
                    {
                      key: "bidReminders",
                      label: "Bid Reminders",
                      desc: "Reminders for opportunities in your pipeline",
                    },
                    {
                      key: "deadlineAlerts",
                      label: "Deadline Alerts",
                      desc: "Upcoming response deadlines",
                    },
                    {
                      key: "weeklyDigest",
                      label: "Weekly Market Digest",
                      desc: "Market trends and insights",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({
                            ...prev,
                            [item.key]: checked,
                          }))
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  variant="hero"
                  onClick={handleSaveNotifications}
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Account */}
          <TabsContent value="account">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>
                    Your personal account information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={accountForm.first_name}
                        onChange={(e) =>
                          setAccountForm({ ...accountForm, first_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={accountForm.last_name}
                        onChange={(e) =>
                          setAccountForm({ ...accountForm, last_name: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email || ""}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Contact support to change your email address.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={handleSaveAccount}
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Update Profile"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your account password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, current_password: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, new_password: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={handleChangePassword}
                      disabled={!passwordForm.current_password || !passwordForm.new_password}
                    >
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
