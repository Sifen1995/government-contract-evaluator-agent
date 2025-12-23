/**
 * E2E Tests for Authority Mapping (TICKET-025)
 *
 * Test Cases:
 * - TC-AUTH-1: View recommended contacts on opportunity
 * - TC-AUTH-2: Copy contact email
 * - TC-AUTH-3: View top agencies on dashboard
 * - TC-AUTH-4: Filter opportunities by recommended agency
 * - TC-AUTH-5: View agency profile
 * - TC-AUTH-6: Agency match score explanation
 * - TC-AUTH-7: No contacts available empty state
 *
 * Run with Browser MCP tools
 */

export const authorityMappingTests = {
  name: 'Authority Mapping E2E Tests',

  tests: [
    {
      id: 'TC-AUTH-1',
      name: 'View recommended contacts on opportunity',
      steps: [
        'Navigate to /opportunities',
        'Click on an opportunity card',
        'Scroll to "Recommended Contacts" section',
        'Verify contracting officer card displayed',
        'Verify OSDBU contact card displayed (if available)'
      ],
      expectedResult: 'Contact cards show name, title, email, phone'
    },
    {
      id: 'TC-AUTH-2',
      name: 'Copy contact email',
      steps: [
        'Navigate to opportunity detail page',
        'Find contact card with email',
        'Click "Copy Email" button',
        'Verify clipboard feedback'
      ],
      expectedResult: 'Email copied to clipboard, toast shows "Email copied!"'
    },
    {
      id: 'TC-AUTH-3',
      name: 'View top agencies on dashboard',
      steps: [
        'Navigate to /dashboard',
        'Find "Top Agencies for Your Business" widget',
        'Verify top 5 agencies listed',
        'Verify match score percentage shown',
        'Verify opportunity count shown'
      ],
      expectedResult: 'Widget shows ranked agencies with match scores'
    },
    {
      id: 'TC-AUTH-4',
      name: 'Filter opportunities by recommended agency',
      steps: [
        'Navigate to /dashboard',
        'Click on agency in top agencies widget',
        'Verify navigation to agency profile',
        'Click "View Opportunities" button',
        'Verify filtered results'
      ],
      expectedResult: 'Opportunities filtered by selected agency'
    },
    {
      id: 'TC-AUTH-5',
      name: 'View agency profile',
      steps: [
        'Navigate to /agencies/{id}',
        'Verify agency name and abbreviation',
        'Verify small business goals section',
        'Verify key contacts list',
        'Verify external links (forecast, portal)'
      ],
      expectedResult: 'Full agency profile displayed with all sections'
    },
    {
      id: 'TC-AUTH-6',
      name: 'Agency match score explanation',
      steps: [
        'Navigate to /agencies/{id}',
        'Find "Match Score Breakdown" section',
        'Verify NAICS score shown',
        'Verify set-aside score shown',
        'Verify geographic score shown',
        'Verify award history score shown'
      ],
      expectedResult: 'Breakdown shows weighted component scores'
    },
    {
      id: 'TC-AUTH-7',
      name: 'No contacts available empty state',
      steps: [
        'Navigate to opportunity without agency contacts',
        'Check contacts section',
        'Verify appropriate empty state message'
      ],
      expectedResult: 'Message: "No additional contacts available" or similar'
    }
  ]
};
