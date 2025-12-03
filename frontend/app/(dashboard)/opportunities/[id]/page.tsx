"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { formatDate, formatCurrency, getDaysUntil } from "@/lib/utils";
import type { OpportunityWithEvaluation } from "@/types";

export default function OpportunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [opportunity, setOpportunity] = useState<OpportunityWithEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOpportunity();
    }
  }, [params.id]);

  const fetchOpportunity = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response: any = await api.opportunities.get(token, params.id as string);
      setOpportunity(response);
    } catch (error) {
      console.error("Error fetching opportunity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token || !opportunity) return;

    try {
      await api.opportunities.save(token, opportunity.id);
      alert("Saved to pipeline!");
    } catch (error: any) {
      alert(error.message || "Failed to save");
    }
  };

  const handleDismiss = async () => {
    const token = localStorage.getItem("token");
    if (!token || !opportunity) return;

    try {
      await api.opportunities.dismiss(token, opportunity.id);
      router.push("/opportunities");
    } catch (error: any) {
      alert(error.message || "Failed to dismiss");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Opportunity not found</p>
        <Link href="/opportunities" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Opportunities
        </Link>
      </div>
    );
  }

  const eval = opportunity.evaluation;
  const daysRemaining = opportunity.response_deadline
    ? getDaysUntil(opportunity.response_deadline)
    : null;

  return (
    <div>
      <Link
        href="/opportunities"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Opportunities
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">{opportunity.title}</h1>

        <div className="flex items-center gap-4 mb-4">
          {opportunity.set_aside_type && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {opportunity.set_aside_type}
            </span>
          )}
          {opportunity.naics_code && (
            <span className="text-gray-600">NAICS: {opportunity.naics_code}</span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save to Pipeline
          </button>
          <button
            onClick={handleDismiss}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* AI Analysis */}
      {eval && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">AI Analysis</h2>
            <div className="text-4xl font-bold text-blue-600">{eval.fit_score}</div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Recommendation</div>
              <div className="text-xl font-semibold">{eval.recommendation} ✓</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Win Probability</div>
              <div className="text-xl font-semibold">{eval.win_probability}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2 text-green-700">Strengths</h3>
              <ul className="space-y-1">
                {eval.strengths?.map((strength, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-red-700">Weaknesses</h3>
              <ul className="space-y-1">
                {eval.weaknesses?.map((weakness, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-red-600">⚠</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-gray-700">{eval.executive_summary}</p>
          </div>
        </div>
      )}

      {/* Opportunity Details */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Opportunity Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Agency</div>
            <div className="font-medium">{opportunity.agency || "N/A"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Office</div>
            <div className="font-medium">{opportunity.office || "N/A"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Solicitation Number</div>
            <div className="font-medium">{opportunity.solicitation_number || "N/A"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Posted Date</div>
            <div className="font-medium">
              {opportunity.posted_date ? formatDate(opportunity.posted_date) : "N/A"}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Response Deadline</div>
            <div className="font-medium">
              {opportunity.response_deadline ? (
                <>
                  {formatDate(opportunity.response_deadline)}
                  {daysRemaining !== null && (
                    <span className="ml-2 text-red-600">
                      ({daysRemaining} days remaining)
                    </span>
                  )}
                </>
              ) : (
                "N/A"
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Estimated Value</div>
            <div className="font-medium">
              {opportunity.estimated_value_low && opportunity.estimated_value_high
                ? `${formatCurrency(opportunity.estimated_value_low)} - ${formatCurrency(
                    opportunity.estimated_value_high
                  )}`
                : "N/A"}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Notice Type</div>
            <div className="font-medium">{opportunity.notice_type || "N/A"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Set-Aside Type</div>
            <div className="font-medium">{opportunity.set_aside_type || "None"}</div>
          </div>
        </div>

        {opportunity.contact_name && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600 mb-1">Point of Contact</div>
            <div className="font-medium">{opportunity.contact_name}</div>
            {opportunity.contact_email && (
              <div className="text-sm text-gray-600">{opportunity.contact_email}</div>
            )}
            {opportunity.contact_phone && (
              <div className="text-sm text-gray-600">{opportunity.contact_phone}</div>
            )}
          </div>
        )}

        {opportunity.pop_city && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600 mb-1">Place of Performance</div>
            <div className="font-medium">
              {opportunity.pop_city}, {opportunity.pop_state} {opportunity.pop_zip}
            </div>
          </div>
        )}

        {opportunity.source_url && (
          <div className="mt-4">
            <a
              href={opportunity.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View on SAM.gov ↗
            </a>
          </div>
        )}
      </div>

      {/* Description */}
      {opportunity.description && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{opportunity.description}</p>
        </div>
      )}
    </div>
  );
}
