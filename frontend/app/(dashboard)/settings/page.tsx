"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const [userData, companyData] = await Promise.all([
        api.users.getMe(token),
        api.company.get(token),
      ]);

      setUser(userData);
      setCompany(companyData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await api.users.updateMe(token, user);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await api.company.update(token, company);
      setMessage("Company profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.startsWith("Error")
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-green-50 text-green-600 border border-green-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* User Profile */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Profile</h2>

        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={user?.first_name || ""}
                onChange={(e) => setUser({ ...user, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={user?.last_name || ""}
                onChange={(e) => setUser({ ...user, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Frequency
            </label>
            <select
              value={user?.email_frequency || "daily"}
              onChange={(e) => setUser({ ...user, email_frequency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="never">Never</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Save User Profile"}
          </button>
        </form>
      </div>

      {/* Company Profile */}
      {company && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Company Profile</h2>

          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={company.name || ""}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NAICS Codes
              </label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-md bg-gray-50">
                {company.naics_codes?.map((code: string) => (
                  <span
                    key={code}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {code}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                To update NAICS codes, please contact support
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capabilities Statement
              </label>
              <textarea
                value={company.capabilities || ""}
                onChange={(e) => setCompany({ ...company, capabilities: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? "Saving..." : "Save Company Profile"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
