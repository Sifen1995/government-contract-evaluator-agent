"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { formatDate, getDaysUntil } from "@/lib/utils";
import type { OpportunityWithEvaluation } from "@/types";

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<OpportunityWithEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [filters, setFilters] = useState({
    set_aside: "",
    agency: "",
    min_score: "",
    sort_by: "fit_score",
  });

  useEffect(() => {
    fetchOpportunities();
  }, [page, filters]);

  const fetchOpportunities = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const response: any = await api.opportunities.list(token, {
        page,
        page_size: 20,
        ...filters,
      });

      setOpportunities(response.items || []);
      setTotalPages(response.pages || 1);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (oppId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await api.opportunities.save(token, oppId);
      alert("Opportunity saved to pipeline!");
    } catch (error: any) {
      alert(error.message || "Failed to save");
    }
  };

  const handleDismiss = async (oppId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await api.opportunities.dismiss(token, oppId);
      setOpportunities(opportunities.filter((o) => o.id !== oppId));
    } catch (error: any) {
      alert(error.message || "Failed to dismiss");
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 75) return "bg-green-100 text-green-800";
    if (score >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Opportunities</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Set-Aside
            </label>
            <select
              value={filters.set_aside}
              onChange={(e) => setFilters({ ...filters, set_aside: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All</option>
              <option value="8(a)">8(a)</option>
              <option value="WOSB">WOSB</option>
              <option value="SDVOSB">SDVOSB</option>
              <option value="HUBZone">HUBZone</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agency
            </label>
            <input
              type="text"
              value={filters.agency}
              onChange={(e) => setFilters({ ...filters, agency: e.target.value })}
              placeholder="Search agency..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Score
            </label>
            <input
              type="number"
              value={filters.min_score}
              onChange={(e) => setFilters({ ...filters, min_score: e.target.value })}
              placeholder="0-100"
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sort_by}
              onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="fit_score">Fit Score</option>
              <option value="deadline">Deadline</option>
              <option value="posted_date">Posted Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
            {opportunities.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No opportunities found matching your filters.
              </div>
            ) : (
              opportunities.map((opp) => (
                <div key={opp.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/opportunities/${opp.id}`}
                        className="block hover:text-blue-600"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {opp.evaluation && (
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreBadgeColor(
                                opp.evaluation.fit_score
                              )}`}
                            >
                              {opp.evaluation.fit_score}
                            </span>
                          )}
                          <h3 className="font-semibold text-lg">{opp.title}</h3>
                        </div>
                      </Link>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="font-medium">{opp.agency}</span>
                        {opp.set_aside_type && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {opp.set_aside_type}
                          </span>
                        )}
                        <span>NAICS: {opp.naics_code}</span>
                        {opp.response_deadline && (
                          <span className="text-red-600 font-medium">
                            Due: {formatDate(opp.response_deadline)} (
                            {getDaysUntil(opp.response_deadline)} days)
                          </span>
                        )}
                      </div>

                      {opp.evaluation && (
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">
                            {opp.evaluation.recommendation}:
                          </span>{" "}
                          {opp.evaluation.executive_summary}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => handleDismiss(opp.id)}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleSave(opp.id)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <Link
                        href={`/opportunities/${opp.id}`}
                        className="px-4 py-2 text-sm bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
