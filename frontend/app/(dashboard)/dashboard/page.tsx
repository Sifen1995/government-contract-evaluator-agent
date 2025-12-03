"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { formatDate, getDaysUntil } from "@/lib/utils";
import type { OpportunityWithEvaluation, PipelineStats } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<OpportunityWithEvaluation[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Fetch recent opportunities
      const oppsResponse: any = await api.opportunities.list(token, {
        page: 1,
        page_size: 10,
        sort_by: "fit_score",
        sort_order: "desc",
      });

      setOpportunities(oppsResponse.items || []);

      // Fetch pipeline stats
      const statsResponse: any = await api.pipeline.stats(token);
      setStats(statsResponse);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 75) return "bg-green-100 text-green-800";
    if (score >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getRecommendationBadge = (recommendation: string) => {
    const colors = {
      BID: "bg-green-500",
      REVIEW: "bg-yellow-500",
      NO_BID: "bg-red-500",
    };
    return colors[recommendation as keyof typeof colors] || "bg-gray-500";
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
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600 mb-1">New This Week</div>
          <div className="text-3xl font-bold text-blue-600">
            {opportunities.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Saved Total</div>
          <div className="text-3xl font-bold text-green-600">
            {stats?.total || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Pursuing</div>
          <div className="text-3xl font-bold text-orange-600">
            {stats?.pursuing || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Avg Fit Score</div>
          <div className="text-3xl font-bold text-purple-600">
            {opportunities.length > 0
              ? Math.round(
                  opportunities.reduce((sum, o) => sum + (o.evaluation?.fit_score || 0), 0) /
                    opportunities.length
                )
              : 0}
          </div>
        </div>
      </div>

      {/* New Opportunities */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">New Opportunities</h2>
          <Link
            href="/opportunities"
            className="text-blue-600 hover:underline text-sm"
          >
            View All →
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {opportunities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No opportunities found. Complete your profile to get matched with opportunities.
            </div>
          ) : (
            opportunities.slice(0, 5).map((opp) => (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="block p-6 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
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
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="font-medium">{opp.agency}</span>
                      {opp.set_aside_type && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {opp.set_aside_type}
                        </span>
                      )}
                      <span>NAICS: {opp.naics_code}</span>
                      {opp.response_deadline && (
                        <span className="text-red-600">
                          Due: {formatDate(opp.response_deadline)} (
                          {getDaysUntil(opp.response_deadline)} days)
                        </span>
                      )}
                    </div>
                    {opp.evaluation && (
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${getRecommendationBadge(
                            opp.evaluation.recommendation
                          )}`}
                        />
                        <span className="text-sm font-medium">
                          {opp.evaluation.recommendation}
                        </span>
                        <span className="text-sm text-gray-600">
                          - {opp.evaluation.executive_summary}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 text-blue-600">→</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
