"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const LEGAL_STRUCTURES = ["LLC", "Corp", "Sole Prop", "Partnership"];
const SET_ASIDES = ["8(a)", "WOSB", "SDVOSB", "HUBZone", "Small Business"];
const VALUE_RANGES = [
  { label: "$0 - $100K", min: 0, max: 100000 },
  { label: "$100K - $1M", min: 100000, max: 1000000 },
  { label: "$1M - $10M", min: 1000000, max: 10000000 },
  { label: "$10M+", min: 10000000, max: null },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    legal_structure: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    uei: "",
    naics_codes: [] as string[],
    set_asides: [] as string[],
    capabilities: "",
    contract_value_min: 0,
    contract_value_max: null as number | null,
    geographic_preferences: [] as string[],
  });

  const [naicsInput, setNaicsInput] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSetAsideToggle = (setAside: string) => {
    if (formData.set_asides.includes(setAside)) {
      setFormData({
        ...formData,
        set_asides: formData.set_asides.filter((s) => s !== setAside),
      });
    } else {
      setFormData({
        ...formData,
        set_asides: [...formData.set_asides, setAside],
      });
    }
  };

  const handleAddNaics = () => {
    if (naicsInput && formData.naics_codes.length < 10) {
      setFormData({
        ...formData,
        naics_codes: [...formData.naics_codes, naicsInput],
      });
      setNaicsInput("");
    }
  };

  const handleRemoveNaics = (code: string) => {
    setFormData({
      ...formData,
      naics_codes: formData.naics_codes.filter((c) => c !== code),
    });
  };

  const handleValueRangeChange = (range: typeof VALUE_RANGES[0]) => {
    setFormData({
      ...formData,
      contract_value_min: range.min,
      contract_value_max: range.max,
    });
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      await api.company.create(token, formData);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create company profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Complete Your Profile</h1>
          <p className="text-center text-gray-600 mb-8">
            Tell us about your business to get personalized contract recommendations
          </p>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Step {step} of 3</span>
              <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Company Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Company Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Structure *
                </label>
                <select
                  name="legal_structure"
                  value={formData.legal_structure}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select...</option>
                  {LEGAL_STRUCTURES.map((structure) => (
                    <option key={structure} value={structure}>
                      {structure}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address_street"
                  value={formData.address_street}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="address_city"
                    value={formData.address_city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="address_state"
                    value={formData.address_state}
                    onChange={handleChange}
                    maxLength={2}
                    placeholder="CA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP *
                  </label>
                  <input
                    type="text"
                    name="address_zip"
                    value={formData.address_zip}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UEI (Optional)
                </label>
                <input
                  type="text"
                  name="uei"
                  value={formData.uei}
                  onChange={handleChange}
                  maxLength={12}
                  placeholder="SAM.gov UEI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Your SAM.gov Unique Entity Identifier</p>
              </div>
            </div>
          )}

          {/* Step 2: NAICS & Set-Asides */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">NAICS Codes & Certifications</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NAICS Codes * (up to 10)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={naicsInput}
                    onChange={(e) => setNaicsInput(e.target.value)}
                    placeholder="Enter 6-digit NAICS code"
                    maxLength={6}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddNaics}
                    disabled={formData.naics_codes.length >= 10 || !naicsInput}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.naics_codes.map((code) => (
                    <span
                      key={code}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {code}
                      <button
                        type="button"
                        onClick={() => handleRemoveNaics(code)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {formData.naics_codes.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">At least one NAICS code is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set-Aside Certifications (Optional)
                </label>
                <div className="space-y-2">
                  {SET_ASIDES.map((setAside) => (
                    <label key={setAside} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.set_asides.includes(setAside)}
                        onChange={() => handleSetAsideToggle(setAside)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm">{setAside}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Value Range *
                </label>
                <div className="space-y-2">
                  {VALUE_RANGES.map((range) => (
                    <label key={range.label} className="flex items-center">
                      <input
                        type="radio"
                        checked={
                          formData.contract_value_min === range.min &&
                          formData.contract_value_max === range.max
                        }
                        onChange={() => handleValueRangeChange(range)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Capabilities */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Capabilities</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capabilities Statement * (500 words max)
                </label>
                <textarea
                  name="capabilities"
                  value={formData.capabilities}
                  onChange={handleChange}
                  rows={10}
                  placeholder="Describe your company's core competencies, past performance, and unique value proposition..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.capabilities.split(" ").length} / 500 words
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !formData.name) {
                    setError("Please fill in required fields");
                    return;
                  }
                  if (step === 2 && formData.naics_codes.length === 0) {
                    setError("Please add at least one NAICS code");
                    return;
                  }
                  setError("");
                  setStep(step + 1);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !formData.capabilities}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Creating..." : "Complete Setup"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
