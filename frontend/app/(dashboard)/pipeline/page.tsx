"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";

const STATUSES = ["watching", "pursuing", "submitted", "won", "lost"];

export default function PipelinePage() {
  const router = useRouter();
  const [savedOpportunities, setSavedOpportunities] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedStatus]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const [pipelineData, statsData]: any = await Promise.all([
        api.pipeline.list(token, selectedStatus || undefined),
        api.pipeline.stats(token),
      ]);

      setSavedOpportunities(pipelineData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching pipeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (savedId: string, newStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Find the opportunity ID from the saved data
      const saved = savedOpportunities.find((s) => s.saved.id === savedId);
      if (!saved) return;

      await api.opportunities.updateStatus(token, saved.opportunity.id, newStatus);
      fetchData();
    } catch (error: any) {
      alert(error.message || "Failed to update status");
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
      <h1 className="text-3xl font-bold mb-8">Pipeline</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-8">
          {STATUSES.map((status) => (
            <div
              key={status}
              className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition"
              onClick={() => setSelectedStatus(status === selectedStatus ? "" : status)}
            >
              <div className="text-sm text-gray-600 capitalize mb-1">{status}</div>
              <div className="text-2xl font-bold">
                {stats[status as keyof typeof stats] || 0}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Opportunities */}
      <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
        {savedOpportunities.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No opportunities in your pipeline yet.{" "}
            <Link href="/opportunities" className="text-blue-600 hover:underline">
              Browse opportunities
            </Link>
          </div>
        ) : (
          savedOpportunities.map((item) => (
            <div key={item.saved.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    href={`/opportunities/${item.opportunity.id}`}
                    className="block hover:text-blue-600 mb-2"
                  >
                    <h3 className="font-semibold text-lg">{item.opportunity.title}</h3>
                  </Link>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="font-medium">{item.opportunity.agency}</span>
                    {item.opportunity.response_deadline && (
                      <span>
                        Due: {formatDate(item.opportunity.response_deadline)}
                      </span>
                    )}
                    {item.evaluation && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Score: {item.evaluation.fit_score}
                      </span>
                    )}
                  </div>

                  {item.saved.notes && (
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      <span className="font-medium">Notes:</span> {item.saved.notes}
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <select
                    value={item.saved.status}
                    onChange={(e) => handleStatusChange(item.saved.id, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
