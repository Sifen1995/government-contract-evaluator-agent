# GovAI - End-to-End Testing Documentation

> **Version**: 1.0
> **Last Updated**: 2024-12-22
> **Status**: IN PROGRESS
> **Tester**: Claude Code
> **Test Environment**: Local Development

---

## ⚠️ TESTING PROGRESS TRACKER - UPDATE BEFORE & AFTER EACH SESSION

> **IMPORTANT**: Update this section before and after each testing session to maintain continuity.
> If context is lost or we restart, check this section first to resume from the correct point.

### Current Session Status

| Field | Value |
|-------|-------|
| **Session Start** | 2024-12-23 |
| **Last Updated** | 2024-12-23 - Suite 10 COMPLETE, Suites 11-12 PARTIAL (blocked by bug) |
| **Current Test Suite** | Suite 11-12 blocked by pipeline bug |
| **Current Test Case** | Pipeline API returning 500 error |
| **Tests Completed** | 55+ (Suite 10 complete, Suites 11-12 partial) |
| **Tests Remaining** | ~10 (blocked by pipeline API bug) |
| **Blockers** | BUG-004: Pipeline route conflict; OpenAI key for AI eval |

### Quick Resume Instructions

1. **Before testing**: Read this section to know where we left off
2. **During testing**: Update "Current Test Case" after each test
3. **After session**: Update "Last Updated" and "Tests Completed"
4. **If context lost**: Check "Current Test Case" and resume from there

### Completed Test Suites Checklist

- [x] Suite 1: Authentication & User Management (9 tests) ✅
- [x] Suite 2: Company Profile & Onboarding (6 tests) ✅
- [x] Suite 3: Opportunity Discovery & Data Sources (6 tests) ⚠️ (2 bugs)
- [x] Suite 4: AI Evaluation & Scoring (7 tests) ⚠️ (needs OpenAI, match-score works)
- [x] Suite 5: Pipeline Management (8 tests) ⚠️ (blocked by BUG-004)
- [x] Suite 6: Email Notifications (5 tests) ✅ (scripts exist, unsubscribe works)
- [x] Suite 7: Analytics & Reporting (4 tests) ✅
- [x] Suite 8: Edge Cases & Error Handling (5 tests) ✅
- [x] Suite 9: Security & Access Control (4 tests) ✅
- [x] Suite 10: User Journey - Sarah (5 tests) ✅ (all 5 journeys tested via UI)
- [~] Suite 11: User Journey - Marcus (5 tests) ⚠️ (2/5 complete, blocked by pipeline bug)
- [~] Suite 12: User Journey - Jennifer (5 tests) ⚠️ (blocked by pipeline bug)

---

## Table of Contents

1. [Testing Overview](#1-testing-overview)
2. [Test Environment Setup](#2-test-environment-setup)
3. [Test Data Requirements](#3-test-data-requirements)
4. [Test Suite 1: Authentication & User Management](#4-test-suite-1-authentication--user-management)
5. [Test Suite 2: Company Profile & Onboarding](#5-test-suite-2-company-profile--onboarding)
6. [Test Suite 3: Opportunity Discovery & Data Sources](#6-test-suite-3-opportunity-discovery--data-sources)
7. [Test Suite 4: AI Evaluation & Scoring](#7-test-suite-4-ai-evaluation--scoring)
8. [Test Suite 5: Pipeline Management](#8-test-suite-5-pipeline-management)
9. [Test Suite 6: Email Notifications](#9-test-suite-6-email-notifications)
10. [Test Suite 7: Analytics & Reporting](#10-test-suite-7-analytics--reporting)
11. [Test Suite 8: Edge Cases & Error Handling](#11-test-suite-8-edge-cases--error-handling)
12. [Test Suite 9: Security & Access Control](#12-test-suite-9-security--access-control)
13. [**Test Suite 10: User Journey - Small Business Owner (Sarah)**](#13-test-suite-10-user-journey---small-business-owner-sarah)
14. [**Test Suite 11: User Journey - BD Manager (Marcus)**](#14-test-suite-11-user-journey---bd-manager-marcus)
15. [**Test Suite 12: User Journey - Proposal Manager (Jennifer)**](#15-test-suite-12-user-journey---proposal-manager-jennifer)
16. [Test Execution Log](#16-test-execution-log)
17. [Known Issues & Blockers](#17-known-issues--blockers)

---

## 1. Testing Overview

### 1.1 Purpose
This document provides comprehensive end-to-end testing scenarios for the GovAI platform, covering all features from the requirements document:

1. **Government Procurement API Integration** (Multi-source data ingestion)
2. **Government Contact Matchmaking & Authority Mapping**
3. **Business Registration & Secure Document Upload**
4. **AI-Powered Bid Readiness & Opportunity Scoring**
5. **AI Opportunity Intelligence Summary**
6. **End-to-End AI Decision Support Flow**

### 1.2 Test Coverage Summary

| Requirement | Status | Test Suite |
|-------------|--------|------------|
| Multi-Source API Integration | Implemented | Suite 3 |
| Automated Data Ingestion | Implemented | Suite 3 |
| Normalized Records | Implemented | Suite 3 |
| Search & Filtering | Implemented | Suite 3 |
| Business Profiles | Implemented | Suite 2 |

### 1.3 User Story Coverage

| Persona | User Story Document | Test Suite | # Tests |
|---------|---------------------|------------|---------|
| Small Business Owner (Sarah) | `docs/user-stories/small-business-owner.md` | Suite 10 | 5 journeys |
| BD Manager (Marcus) | `docs/user-stories/bd-manager.md` | Suite 11 | 5 journeys |
| Proposal Manager (Jennifer) | `docs/user-stories/proposal-manager.md` | Suite 12 | 5 journeys |

### 1.4 Success Metrics to Validate (from User Stories)

| Metric | Target | Test Suite |
|--------|--------|------------|
| Registration time | < 2 minutes | Suite 10 |
| Onboarding time | < 10 minutes | Suite 10 |
| Opportunities load time | < 3 seconds | Suite 10 |
| Time to understand requirements | < 30 minutes | Suite 12 |
| Time per qualification decision | < 5 minutes | Suite 11 |
| Missed deadlines | 0 | Suite 12 |
| Risk factors identified | 100% | Suite 12 |
| Lessons learned documented | 100% | Suite 12 |

### 1.5 Total Test Cases

| Suite | Name | Test Cases |
|-------|------|------------|
| Suite 1 | Authentication | 9 |
| Suite 2 | Company Profile | 6 |
| Suite 3 | Opportunity Discovery | 6 |
| Suite 4 | AI Evaluation | 7 |
| Suite 5 | Pipeline Management | 8 |
| Suite 6 | Email Notifications | 5 |
| Suite 7 | Analytics | 4 |
| Suite 8 | Edge Cases | 5 |
| Suite 9 | Security | 4 |
| Suite 10 | User Journey: Sarah | 5 |
| Suite 11 | User Journey: Marcus | 5 |
| Suite 12 | User Journey: Jennifer | 5 |
| **TOTAL** | | **69 test scenarios**

### 1.7 Requirements Coverage Matrix

> **Source**: `AI_Procurement_Platform_Updated_Requirements.docx.md`

| Req # | Requirement | Sub-Feature | Status | Test Coverage | Notes |
|-------|-------------|-------------|--------|---------------|-------|
| **1** | **Government Procurement API Integration** | | | | |
| 1.1 | Automated/scheduled data ingestion | | IMPLEMENTED | Suite 3: TC-3.1, TC-3.2 | Cron scripts in place |
| 1.2 | Normalized opportunity records | | IMPLEMENTED | Suite 3: TC-3.5 | Multi-source normalization |
| 1.3 | Search/filter by agency, NAICS, set-aside, etc. | | IMPLEMENTED | Suite 3: TC-3.2, TC-3.3 | Full filtering support |
| 1.4 | Lifecycle tracking (active, closed, etc.) | | IMPLEMENTED | Suite 3: TC-3.2 | Status field tracked |
| 1.5 | Eligibility for alerts, scoring, AI workflows | | IMPLEMENTED | Suite 4, 6 | Full AI pipeline |
| **2** | **Government Contact Matchmaking** | | | | |
| 2.1 | Analyze opportunity metadata | | PARTIAL | Suite 3: TC-3.6 | Data captured, no matching |
| 2.2 | Match businesses to authorities | | **NOT IMPLEMENTED** | - | See `docs/user-stories/future-features/authority-mapping.md` |
| 2.3 | Surface recommended contracting offices | | **NOT IMPLEMENTED** | - | See `docs/user-stories/future-features/authority-mapping.md` |
| 2.4 | Display authority recommendations | | **NOT IMPLEMENTED** | - | See `docs/user-stories/future-features/authority-mapping.md` |
| **3** | **Business Registration & Document Upload** | | | | |
| 3.1 | Business profile creation | | IMPLEMENTED | Suite 2: TC-2.2, TC-2.3, TC-2.4 | 3-step onboarding |
| 3.2 | Secure upload - Capability statements | | **NOT IMPLEMENTED** | - | See `docs/user-stories/future-features/document-management.md` |
| 3.3 | Secure upload - Certifications | | **NOT IMPLEMENTED** | - | See `docs/user-stories/future-features/document-management.md` |
| 3.4 | Secure upload - Past performance | | **NOT IMPLEMENTED** | - | See `docs/user-stories/future-features/document-management.md` |
| 3.5 | Document versioning | | **NOT IMPLEMENTED** | - | See `docs/user-stories/future-features/document-management.md` |
| 3.6 | Access control | | **NOT IMPLEMENTED** | - | See `docs/user-stories/future-features/document-management.md` |
| 3.7 | AI-readable document extraction | | **NOT IMPLEMENTED** | - | See `docs/user-stories/future-features/document-management.md` |
| **4** | **AI-Powered Bid Readiness Scoring** | | | | |
| 4.1 | Generate bid readiness score (0-100) | | IMPLEMENTED | Suite 4: TC-4.1, TC-4.4 | GPT-4 + rule-based |
| 4.2 | Score based on NAICS, past perf, certs | | IMPLEMENTED | Suite 4: TC-4.4 | Weighted scoring |
| 4.3 | Explain scoring rationale | | IMPLEMENTED | Suite 4: TC-4.3 | Strengths/weaknesses/reasoning |
| 4.4 | Recalculate dynamically on data changes | | PARTIAL | - | See `docs/user-stories/future-features/dynamic-rescoring.md` |
| **5** | **AI Opportunity Intelligence Summary** | | | | |
| 5.1 | Plain-language opportunity summary | | IMPLEMENTED | Suite 4: TC-4.6 | Executive summary field |
| 5.2 | Total estimated contract value | | IMPLEMENTED | Suite 3: TC-3.2 | Value fields in model |
| 5.3 | Issuing authority and jurisdiction | | IMPLEMENTED | Suite 3: TC-3.5 | Agency fields normalized |
| 5.4 | Business fit analysis | | IMPLEMENTED | Suite 4: TC-4.3 | Strengths/weaknesses |
| 5.5 | Strategic recommendation | | IMPLEMENTED | Suite 4: TC-4.7 | BID/NO_BID/RESEARCH |
| 5.6 | Final bid score with strengths/risks | | IMPLEMENTED | Suite 4: TC-4.1, TC-4.3 | Full analysis |
| **6** | **End-to-End AI Decision Support Flow** | | | | |
| 6.1 | Business registers and uploads documents | | PARTIAL | Suite 1, 2 | Register yes, docs no |
| 6.2 | Platform ingests opportunity data | | IMPLEMENTED | Suite 3 | Multi-source ingestion |
| 6.3 | AI matches opportunity to business/authority | | PARTIAL | Suite 4 | Business yes, authority no |
| 6.4 | AI scores bid readiness | | IMPLEMENTED | Suite 4 | Full scoring |
| 6.5 | Platform presents summary, value, score, rec | | IMPLEMENTED | Suite 4, UJ-10-12 | Complete UI |

### Coverage Summary

| Status | Count | Percentage |
|--------|-------|------------|
| IMPLEMENTED | 20 | 67% |
| PARTIAL | 4 | 13% |
| NOT IMPLEMENTED | 6 | 20% |
| **TOTAL** | **30** | 100% |

**For NOT IMPLEMENTED features, see**: `docs/user-stories/future-features/`

---

### 1.8 How to Use This Document

**Tracking Progress:**
- [ ] = Not Started
- [~] = In Progress
- [x] = Completed
- [!] = Failed / Blocked
- [S] = Skipped

**After Each Test:**
1. Update the checkbox status
2. Record the date/time in the execution log
3. Note any issues in the "Known Issues" section
4. If context resets, find your last completed test and resume from there

---

## 2. Test Environment Setup

### 2.1 Prerequisites Checklist

- [ ] Backend server running on `http://localhost:8000`
- [ ] Frontend server running on `http://localhost:3000` (or deployed URL)
- [ ] Database migrations applied (`alembic upgrade head`)
- [ ] Environment variables configured (.env file)
- [ ] SAM.gov API key configured
- [ ] OpenAI API key configured
- [ ] Email mode set (console for dev, sendgrid for production)

### 2.2 URLs to Test

| Component | URL | Status |
|-----------|-----|--------|
| Frontend Home | http://localhost:3000 | [ ] |
| Login Page | http://localhost:3000/login | [ ] |
| Register Page | http://localhost:3000/register | [ ] |
| Dashboard | http://localhost:3000/dashboard | [ ] |
| Opportunities | http://localhost:3000/opportunities | [ ] |
| Pipeline | http://localhost:3000/pipeline | [ ] |
| Settings | http://localhost:3000/settings | [ ] |
| Analytics | http://localhost:3000/analytics | [ ] |
| API Docs | http://localhost:8000/docs | [ ] |
| Health Check | http://localhost:8000/health | [ ] |

### 2.3 Browser MCP Setup

```
For testing with Browser MCP:
1. Ensure Playwright MCP server is connected
2. Use browser_navigate, browser_click, browser_snapshot for UI tests
3. Use WebFetch for API endpoint tests
```

---

## 3. Test Data Requirements

### 3.1 Test User Accounts

| User Type | Email | Password | Purpose |
|-----------|-------|----------|---------|
| New User | test.newuser@example.com | Test1234! | Registration flow |
| Verified User | test.verified@example.com | Test1234! | Main testing |
| Unverified User | test.unverified@example.com | Test1234! | Email verification |
| No Company User | test.nocompany@example.com | Test1234! | Onboarding redirect |

### 3.2 Test Company Profile

```json
{
  "name": "Test Government Contractor LLC",
  "legal_structure": "LLC",
  "uei": "TESTUE123456",
  "address_street": "123 Test Street",
  "address_city": "Washington",
  "address_state": "DC",
  "address_zip": "20001",
  "naics_codes": ["541511", "541512", "541519"],
  "set_asides": ["8(a)", "Small Business"],
  "capabilities": "We are a technology company specializing in software development, cloud services, and IT consulting for government agencies. Our team has extensive experience with federal contracts and maintains all required security clearances.",
  "contract_value_min": 100000,
  "contract_value_max": 5000000,
  "geographic_preferences": ["DC", "VA", "MD"]
}
```

### 3.3 Expected NAICS Codes for Testing

| NAICS Code | Description |
|------------|-------------|
| 541511 | Custom Computer Programming Services |
| 541512 | Computer Systems Design Services |
| 541519 | Other Computer Related Services |
| 541611 | Administrative Management Consulting |
| 236220 | Commercial and Institutional Building Construction |

---

## 4. Test Suite 1: Authentication & User Management

### TC-1.1: User Registration (Happy Path)

**Requirement**: Users can register for the platform

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/register` | Registration form displayed | [ ] |
| 2 | Enter first name: "Test" | Field accepts input | [ ] |
| 3 | Enter last name: "User" | Field accepts input | [ ] |
| 4 | Enter email: `test.newuser@example.com` | Field accepts valid email | [ ] |
| 5 | Enter password: "Test1234!" | Field accepts password | [ ] |
| 6 | Confirm password: "Test1234!" | Passwords match | [ ] |
| 7 | Click "Create account" | Loading state shown | [ ] |
| 8 | Wait for response | Success message: "Check your email" | [ ] |
| 9 | Check console/email | Verification link logged/sent | [ ] |

**Notes**: _______________

---

### TC-1.2: User Registration (Validation Errors)

**Requirement**: Form validation prevents invalid submissions

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Submit empty form | Required field errors shown | [ ] |
| 2 | Enter invalid email "notanemail" | Email validation error | [ ] |
| 3 | Enter password < 8 chars | "Password must be at least 8 characters" | [ ] |
| 4 | Enter mismatched passwords | "Passwords do not match" | [ ] |
| 5 | Use existing email | "Email already registered" error | [ ] |

**Notes**: _______________

---

### TC-1.3: Email Verification

**Requirement**: Users must verify email before full access

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Copy verification link from console/email | Token in URL | [ ] |
| 2 | Navigate to verification URL | Page loads, auto-verifies | [ ] |
| 3 | Check status | "Email verified successfully" | [ ] |
| 4 | Click "Go to login" | Redirected to login page | [ ] |

**Notes**: _______________

---

### TC-1.4: Email Verification (Invalid Token)

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/verify-email?token=invalidtoken` | Error shown | [ ] |
| 2 | Check error message | "Verification failed. The link may be expired." | [ ] |
| 3 | "Register again" button visible | Button displayed | [ ] |

**Notes**: _______________

---

### TC-1.5: User Login (Happy Path)

**Requirement**: Verified users can login

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/login` | Login form displayed | [ ] |
| 2 | Enter verified email | Field accepts input | [ ] |
| 3 | Enter correct password | Field accepts input | [ ] |
| 4 | Click "Sign in" | Loading state | [ ] |
| 5 | Wait for response | Redirected to dashboard | [ ] |
| 6 | Check user email in nav | Email displayed correctly | [ ] |

**Notes**: _______________

---

### TC-1.6: User Login (Error Cases)

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Enter wrong password | "Incorrect email or password" | [ ] |
| 2 | Enter non-existent email | "Incorrect email or password" | [ ] |
| 3 | Try unverified account | Login blocked OR verification prompt | [ ] |

**Notes**: _______________

---

### TC-1.7: Forgot Password Flow

**Requirement**: Users can reset forgotten passwords

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Click "Forgot password?" on login | Navigate to forgot-password | [ ] |
| 2 | Enter registered email | Field accepts input | [ ] |
| 3 | Click submit | "If the email exists, a reset link has been sent" | [ ] |
| 4 | Check console/email | Reset link logged/sent | [ ] |
| 5 | Navigate to reset link | Password reset form shown | [ ] |
| 6 | Enter new password (2x) | Form accepts input | [ ] |
| 7 | Submit | "Password reset successfully" | [ ] |
| 8 | Login with new password | Login succeeds | [ ] |

**Notes**: _______________

---

### TC-1.8: User Logout

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | While logged in, click "Logout" | Button triggers logout | [ ] |
| 2 | Check session | Token cleared | [ ] |
| 3 | Try accessing /dashboard | Redirected to login | [ ] |

**Notes**: _______________

---

### TC-1.9: Session Persistence

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Login successfully | Token stored | [ ] |
| 2 | Close browser tab | N/A | [ ] |
| 3 | Open new tab, go to /dashboard | Still logged in | [ ] |
| 4 | Refresh page | Session maintained | [ ] |

**Notes**: _______________

---

## 5. Test Suite 2: Company Profile & Onboarding

### TC-2.1: Onboarding Redirect (No Company)

**Requirement**: Users without company profile redirected to onboarding

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Login with user without company | Login succeeds | [ ] |
| 2 | Check redirect | Redirected to /onboarding | [ ] |
| 3 | Try accessing /dashboard directly | Redirected to /onboarding | [ ] |

**Notes**: _______________

---

### TC-2.2: Onboarding Step 1 - Company Information

**Requirement**: Collect basic company information

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /onboarding | Step 1 displayed | [ ] |
| 2 | Progress indicator shows "Step 1 of 3" | Correct step shown | [ ] |
| 3 | Enter company name: "Test Government Contractor LLC" | Field accepts input | [ ] |
| 4 | Select legal structure: "LLC" | Dropdown works | [ ] |
| 5 | Enter UEI: "TESTUE123456" | Field accepts 12 chars | [ ] |
| 6 | Enter address fields | All fields accept input | [ ] |
| 7 | Click "Next" without company name | Button disabled | [ ] |
| 8 | Fill required fields, click "Next" | Progress to Step 2 | [ ] |

**Notes**: _______________

---

### TC-2.3: Onboarding Step 2 - NAICS & Certifications

**Requirement**: Collect NAICS codes and set-aside certifications

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Verify on Step 2 | "NAICS Codes & Certifications" title | [ ] |
| 2 | Search NAICS codes | Type "541" shows filtered results | [ ] |
| 3 | Select up to 10 NAICS codes | Counter shows "Selected: X/10" | [ ] |
| 4 | Try selecting 11th code | Selection limited to 10 | [ ] |
| 5 | Select set-asides (8(a), Small Business) | Multiple selections work | [ ] |
| 6 | Select contract value range | Dropdown works | [ ] |
| 7 | Select geographic preferences | Multi-select works | [ ] |
| 8 | Click "Next" without NAICS | Button disabled | [ ] |
| 9 | Select at least 1 NAICS, click "Next" | Progress to Step 3 | [ ] |

**Notes**: _______________

---

### TC-2.4: Onboarding Step 3 - Capabilities

**Requirement**: Collect capabilities statement

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Verify on Step 3 | "Capabilities & Preferences" title | [ ] |
| 2 | Enter capabilities text | Textarea accepts input | [ ] |
| 3 | Word counter updates | Shows "X/500 words" | [ ] |
| 4 | Review summary displayed | Shows company name, NAICS count, certifications, location | [ ] |
| 5 | Click "Previous" | Returns to Step 2, data preserved | [ ] |
| 6 | Click "Next" again | Returns to Step 3, data preserved | [ ] |
| 7 | Click "Complete Onboarding" without capabilities | Button disabled | [ ] |
| 8 | Enter capabilities, click "Complete Onboarding" | Loading state, then redirect | [ ] |
| 9 | Check redirect destination | Redirected to /dashboard | [ ] |

**Notes**: _______________

---

### TC-2.5: Company Profile Update (Settings)

**Requirement**: Users can update company profile

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /settings | Company settings form displayed | [ ] |
| 2 | Current data pre-populated | All fields show saved values | [ ] |
| 3 | Edit company name | Field accepts changes | [ ] |
| 4 | Add new NAICS code | Multi-select allows addition | [ ] |
| 5 | Remove a certification | Item removed from selection | [ ] |
| 6 | Update capabilities | Textarea accepts changes | [ ] |
| 7 | Click "Save Changes" | Loading state | [ ] |
| 8 | Wait for response | "Company profile updated successfully!" | [ ] |
| 9 | Refresh page | Changes persisted | [ ] |

**Notes**: _______________

---

### TC-2.6: Email Preferences Update

**Requirement**: Users can control email notification frequency

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /settings | Email preferences section visible | [ ] |
| 2 | Current preference shown | Radio button selected | [ ] |
| 3 | Select "Real-time" | Radio updates | [ ] |
| 4 | Select "Daily Digest (Recommended)" | Radio updates | [ ] |
| 5 | Select "Weekly Summary" | Radio updates | [ ] |
| 6 | Select "No Emails" | Radio updates | [ ] |
| 7 | Click "Save Email Preferences" | Loading state | [ ] |
| 8 | Wait for response | "Email preferences updated successfully!" | [ ] |

**Notes**: _______________

---

## 6. Test Suite 3: Opportunity Discovery & Data Sources

### TC-3.1: Manual Discovery Trigger

**Requirement**: Users can trigger opportunity discovery manually

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /dashboard | Dashboard displayed | [ ] |
| 2 | Click "Trigger Manual Discovery" | Button shows loading state | [ ] |
| 3 | Wait for completion | Alert: "Discovery triggered!" | [ ] |
| 4 | Stats update after delay | Opportunity counts may change | [ ] |

**Notes**: _______________

---

### TC-3.2: View Live Opportunities

**Requirement**: View opportunities from SAM.gov and other sources

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /opportunities | Opportunities list displayed | [ ] |
| 2 | Verify "Live Opportunities" tab active | Tab highlighted | [ ] |
| 3 | Check opportunity cards | Title, department, NAICS, deadline shown | [ ] |
| 4 | Verify fit scores displayed | Score % shown for each | [ ] |
| 5 | Verify recommendation badges | BID/NO_BID/RESEARCH shown | [ ] |
| 6 | Check source badges | Federal/DC/Other badges shown | [ ] |

**Notes**: _______________

---

### TC-3.3: View Forecast Opportunities

**Requirement**: View upcoming forecast opportunities

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | On /opportunities page | Default view | [ ] |
| 2 | Click "Upcoming Forecasts" tab | Tab switches | [ ] |
| 3 | Check results | Forecast opportunities shown (or empty state) | [ ] |
| 4 | Verify "Forecast" badge | Orange outline badge visible | [ ] |
| 5 | Click on forecast opportunity | Should NOT navigate (or show info) | [ ] |

**Notes**: _______________

---

### TC-3.4: Opportunity Statistics

**Requirement**: Dashboard shows opportunity statistics

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | View dashboard stats | Stats cards displayed | [ ] |
| 2 | Check "Total Evaluated" | Number displayed | [ ] |
| 3 | Check "BID Recommendations" | Green number displayed | [ ] |
| 4 | Check "Average Fit Score" | Percentage displayed | [ ] |
| 5 | Check "Average Win Probability" | Percentage displayed | [ ] |
| 6 | Click on "Total Evaluated" card | Navigates to /opportunities | [ ] |
| 7 | Click on "BID Recommendations" card | Navigates to /opportunities?filter=BID | [ ] |

**Notes**: _______________

---

### TC-3.5: Multi-Source Data Verification

**Requirement**: Data from multiple sources displayed correctly

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Check for SAM.gov opportunities | "Federal" badge present | [ ] |
| 2 | Check for DC OCP opportunities | "DC" badge present (if available) | [ ] |
| 3 | Check source field in API | API returns source field | [ ] |
| 4 | Verify agency information | Issuing agency displayed | [ ] |

**Notes**: _______________

---

### TC-3.6: Contact Information Display

**Requirement**: Government contact information shown (Partial implementation)

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | View opportunity detail | Detail page loads | [ ] |
| 2 | Check for contact_name | Name displayed if available | [ ] |
| 3 | Check for contact_email | Email displayed if available | [ ] |
| 4 | Check for issuing_agency | Agency name displayed | [ ] |

**Notes**: _______________

---

## 7. Test Suite 4: AI Evaluation & Scoring

### TC-4.1: View AI Evaluation Details

**Requirement**: AI-powered bid readiness scoring

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to opportunity detail (/opportunities/{id}) | Page loads | [ ] |
| 2 | Check "AI Evaluation" card | Blue background card visible | [ ] |
| 3 | Verify fit score (0-100) | Score displayed as percentage | [ ] |
| 4 | Verify win probability (0-100) | Score displayed as percentage | [ ] |
| 5 | Verify recommendation badge | BID/NO_BID/RESEARCH shown | [ ] |

**Notes**: _______________

---

### TC-4.2: On-Demand Evaluation

**Requirement**: Lazy evaluation when viewing opportunity

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Find unevaluated opportunity (if any) | Opportunity without evaluation | [ ] |
| 2 | Click to view details | Detail page loads | [ ] |
| 3 | Check evaluation status | Either existing or new evaluation | [ ] |
| 4 | Verify score components | NAICS, cert, size, geo scores | [ ] |

**Notes**: _______________

---

### TC-4.3: Scoring Rationale

**Requirement**: Explain scoring rationale and gaps

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | View evaluated opportunity | Evaluation present | [ ] |
| 2 | Check reasoning field | Detailed explanation in API response | [ ] |
| 3 | Check strengths list | Array of strength items | [ ] |
| 4 | Check weaknesses list | Array of weakness items | [ ] |

**Notes**: _______________

---

### TC-4.4: Match Score Components

**Requirement**: Rule-based scoring breakdown

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Call API: GET /opportunities/{id}/match-score | Response returned | [ ] |
| 2 | Verify naics_score | Score 0-100 | [ ] |
| 3 | Verify cert_score | Score 0-100 | [ ] |
| 4 | Verify size_score | Score 0-100 | [ ] |
| 5 | Verify geo_score | Score 0-100 | [ ] |
| 6 | Verify deadline_score | Score 0-100 | [ ] |
| 7 | Verify overall fit_score | Weighted combination | [ ] |

**Notes**: _______________

---

### TC-4.5: Financial Analysis (GovRat Parity)

**Requirement**: Task-level cost breakdown and profit margins

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | View evaluated opportunity | Evaluation present | [ ] |
| 2 | Check estimated_profit field | Dollar amount in API | [ ] |
| 3 | Check profit_margin_percentage | Percentage in API | [ ] |
| 4 | Check cost_breakdown field | JSON object with tasks | [ ] |
| 5 | Verify cost_breakdown.tasks | Array of task objects | [ ] |
| 6 | Each task has name, description, estimated_cost, variance | Fields present | [ ] |

**Notes**: _______________

---

### TC-4.6: Executive Summary

**Requirement**: Plain-language opportunity summary

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | View evaluated opportunity | Evaluation present | [ ] |
| 2 | Check executive_summary field | 2-3 sentence summary | [ ] |
| 3 | Summary is human-readable | Plain language, not technical | [ ] |

**Notes**: _______________

---

### TC-4.7: Recommendation Logic

**Requirement**: BID/NO_BID/RESEARCH based on criteria

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Find opportunity with BID recommendation | fit_score >= 70, win_prob >= 40 | [ ] |
| 2 | Find opportunity with NO_BID | fit_score < 50 OR major gaps | [ ] |
| 3 | Find opportunity with RESEARCH | fit_score 50-69 OR missing info | [ ] |
| 4 | Verify recommendation logic is consistent | Recommendations match criteria | [ ] |

**Notes**: _______________

---

## 8. Test Suite 5: Pipeline Management

### TC-5.1: Add to Pipeline (From Detail Page)

**Requirement**: Users can track opportunities through bidding process

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to opportunity detail | Detail page loads | [ ] |
| 2 | Find "Pipeline" card | Card visible (not for forecasts) | [ ] |
| 3 | Select "Watching" from dropdown | Selection changes | [ ] |
| 4 | Add notes in textarea | Notes accepted | [ ] |
| 5 | Click "Save" | Loading state, then success | [ ] |
| 6 | Refresh page | Selection persisted | [ ] |

**Notes**: _______________

---

### TC-5.2: View Pipeline (Kanban Board)

**Requirement**: Kanban-style pipeline management

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /pipeline | Pipeline page loads | [ ] |
| 2 | Verify 4 columns visible | WATCHING, BIDDING, WON, LOST | [ ] |
| 3 | Check column counts | Numbers in column headers | [ ] |
| 4 | Previously saved opportunity appears | Card in correct column | [ ] |

**Notes**: _______________

---

### TC-5.3: Move Between Pipeline Stages

**Requirement**: Move opportunities through pipeline stages

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | On pipeline page, find card in WATCHING | Card visible | [ ] |
| 2 | Click Bidding icon (pencil) | Card moves to BIDDING | [ ] |
| 3 | Column counts update | Numbers change correctly | [ ] |
| 4 | Click Won icon (checkmark) | Card moves to WON | [ ] |
| 5 | Click Lost icon (X) | Card moves to LOST | [ ] |

**Notes**: _______________

---

### TC-5.4: Remove from Pipeline

**Requirement**: Remove opportunities from pipeline

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Find card in pipeline | Card visible | [ ] |
| 2 | Click "Remove" button | Confirmation dialog | [ ] |
| 3 | Confirm removal | Card disappears | [ ] |
| 4 | Navigate to /pipeline | Card no longer present | [ ] |

**Notes**: _______________

---

### TC-5.5: Pipeline Statistics

**Requirement**: View pipeline stats

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /pipeline | Stats cards visible | [ ] |
| 2 | Check "Total in Pipeline" | Correct count | [ ] |
| 3 | Check "Watching" count | Matches column | [ ] |
| 4 | Check "Bidding" count | Matches column | [ ] |
| 5 | Check "Won" count | Matches column | [ ] |
| 6 | Check "Lost" count | Matches column | [ ] |

**Notes**: _______________

---

### TC-5.6: Empty Pipeline State

**Requirement**: Appropriate message when pipeline empty

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Remove all items from pipeline | Empty pipeline | [ ] |
| 2 | Navigate to /pipeline | Empty state message | [ ] |
| 3 | "Your pipeline is empty" displayed | Message visible | [ ] |
| 4 | "Browse Opportunities" button | Button visible and works | [ ] |

**Notes**: _______________

---

### TC-5.7: Pipeline Card Details

**Requirement**: Cards show relevant information

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | View pipeline card | Card visible | [ ] |
| 2 | Title displayed | Truncated if long | [ ] |
| 3 | Recommendation badge | BID/NO_BID/RESEARCH | [ ] |
| 4 | Fit score displayed | "X% fit" | [ ] |
| 5 | Deadline displayed | Date shown | [ ] |
| 6 | Deadline warning for soon | Orange/red if <= 7 days | [ ] |
| 7 | Notes preview if exists | Truncated notes | [ ] |

**Notes**: _______________

---

### TC-5.8: Navigate from Pipeline to Detail

**Requirement**: Click card to view full details

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Click on pipeline card | Navigate to detail | [ ] |
| 2 | Verify correct opportunity | Same ID as clicked card | [ ] |
| 3 | Navigate back to pipeline | Previous state preserved | [ ] |

**Notes**: _______________

---

## 9. Test Suite 6: Email Notifications

### TC-6.1: Daily Digest Email (Console Mode)

**Requirement**: Daily digest with new recommendations

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Run `python scripts/send_daily_digest.py` | Script executes | [ ] |
| 2 | Check console output | Email content logged | [ ] |
| 3 | Verify subject line | "GovAI Daily Digest - X New BID Recommendations" | [ ] |
| 4 | Verify user stats included | Evaluated, BID count, pipeline count | [ ] |
| 5 | Verify new opportunities listed | Title, department, scores, deadline | [ ] |
| 6 | Verify deadline reminders | Upcoming deadlines listed | [ ] |
| 7 | Verify unsubscribe link | Link present | [ ] |

**Notes**: _______________

---

### TC-6.2: Deadline Reminder Email

**Requirement**: Reminders for upcoming deadlines

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Add opportunity with near deadline to BIDDING | Deadline within 7 days | [ ] |
| 2 | Run `python scripts/send_deadline_reminders.py` | Script executes | [ ] |
| 3 | Check console output | Reminder email logged | [ ] |
| 4 | Verify urgency color | Red/orange/blue based on days | [ ] |
| 5 | Verify opportunity details | Title, deadline, status | [ ] |

**Notes**: _______________

---

### TC-6.3: One-Click Unsubscribe

**Requirement**: Users can unsubscribe with one click

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Get unsubscribe link from email | Link contains token | [ ] |
| 2 | Navigate to unsubscribe URL | Auto-unsubscribe triggered | [ ] |
| 3 | Check status | "Successfully unsubscribed" | [ ] |
| 4 | Check user's email_frequency | Set to "none" | [ ] |

**Notes**: _______________

---

### TC-6.4: Unsubscribe Page (Manual)

**Requirement**: Manual unsubscribe flow

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /unsubscribe (no token) | Confirmation prompt | [ ] |
| 2 | "Are you sure?" message | Message displayed | [ ] |
| 3 | Click "Yes, unsubscribe me" | Button works | [ ] |
| 4 | Status updates | Error (no token) or success | [ ] |

**Notes**: _______________

---

### TC-6.5: Email Frequency Options

**Requirement**: Multiple notification frequency options

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /settings | Email section visible | [ ] |
| 2 | Verify "Real-time" option | Option available | [ ] |
| 3 | Verify "Daily Digest" option | Option available (recommended) | [ ] |
| 4 | Verify "Weekly Summary" option | Option available | [ ] |
| 5 | Verify "No Emails" option | Option available | [ ] |

**Notes**: _______________

---

## 10. Test Suite 7: Analytics & Reporting

### TC-7.1: Dashboard Analytics

**Requirement**: User-specific analytics on dashboard

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /dashboard | Dashboard loads | [ ] |
| 2 | Total Evaluated count | Number displayed | [ ] |
| 3 | BID Recommendations count | Green number | [ ] |
| 4 | Average Fit Score | Percentage | [ ] |
| 5 | Average Win Probability | Percentage | [ ] |

**Notes**: _______________

---

### TC-7.2: Opportunities Page Stats

**Requirement**: Stats on opportunities page

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /opportunities | Stats cards visible | [ ] |
| 2 | Total Evaluated stat | Correct count | [ ] |
| 3 | BID Recommendations stat | Correct count | [ ] |
| 4 | Avg Fit Score stat | Percentage | [ ] |
| 5 | Avg Win Probability stat | Percentage | [ ] |

**Notes**: _______________

---

### TC-7.3: Awards Analytics API

**Requirement**: Historical award data for benchmarking

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Call GET /api/v1/awards/stats | Response returned | [ ] |
| 2 | Check total_awards | Number | [ ] |
| 3 | Check total_award_value | Dollar amount | [ ] |
| 4 | Check avg_award_value | Dollar amount | [ ] |
| 5 | Check top_agencies | Array of agencies | [ ] |
| 6 | Check top_vendors | Array of vendors | [ ] |
| 7 | Check naics_breakdown | Array of NAICS codes | [ ] |

**Notes**: _______________

---

### TC-7.4: Pipeline Win Rate

**Requirement**: Calculate win rate from pipeline

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Call GET /api/v1/opportunities/pipeline/stats | Response returned | [ ] |
| 2 | Check win_rate field | Percentage or null | [ ] |
| 3 | Mark some as WON, some as LOST | Update pipeline | [ ] |
| 4 | Verify win_rate calculation | won / (won + lost) * 100 | [ ] |

**Notes**: _______________

---

## 11. Test Suite 8: Edge Cases & Error Handling

### TC-8.1: API Error Handling

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Call API without auth token | 401 Unauthorized | [ ] |
| 2 | Call API with invalid token | 401 Unauthorized | [ ] |
| 3 | Request non-existent opportunity | 404 Not Found | [ ] |
| 4 | Request another user's evaluation | 403 Forbidden | [ ] |

**Notes**: _______________

---

### TC-8.2: Rate Limiting

**Requirement**: API rate limiting to prevent abuse

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Attempt 6 registrations/minute | 5th+ blocked | [ ] |
| 2 | Attempt 11 logins/minute | 10th+ blocked | [ ] |
| 3 | Error message shown | "Too many requests" or similar | [ ] |

**Notes**: _______________

---

### TC-8.3: Long Form Input

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Enter very long company name (255+ chars) | Truncated or error | [ ] |
| 2 | Enter very long capabilities (2000+ words) | Handled gracefully | [ ] |
| 3 | Enter special characters in fields | Properly escaped | [ ] |

**Notes**: _______________

---

### TC-8.4: Network Errors

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Disconnect network during API call | Error message shown | [ ] |
| 2 | Reconnect, retry action | Action succeeds | [ ] |
| 3 | Slow network simulation | Loading states work | [ ] |

**Notes**: _______________

---

### TC-8.5: Empty States

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | New user with no evaluations | "No opportunities evaluated" message | [ ] |
| 2 | Empty pipeline | "Your pipeline is empty" message | [ ] |
| 3 | No matching NAICS opportunities | Appropriate empty state | [ ] |

**Notes**: _______________

---

## 12. Test Suite 9: Security & Access Control

### TC-9.1: Authentication Required

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Access /dashboard without login | Redirect to /login | [ ] |
| 2 | Access /opportunities without login | Redirect to /login | [ ] |
| 3 | Access /pipeline without login | Redirect to /login | [ ] |
| 4 | Access /settings without login | Redirect to /login | [ ] |
| 5 | Access /onboarding without login | Redirect to /login | [ ] |

**Notes**: _______________

---

### TC-9.2: Company Ownership

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Try updating another user's company | 403 or 404 | [ ] |
| 2 | Try viewing another user's evaluations | 403 or 404 | [ ] |
| 3 | Try modifying another user's pipeline | 403 or 404 | [ ] |

**Notes**: _______________

---

### TC-9.3: Input Validation

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | SQL injection in search fields | Query properly escaped | [ ] |
| 2 | XSS in capabilities field | HTML properly escaped | [ ] |
| 3 | Invalid UUID in URL | 400 or 404 error | [ ] |

**Notes**: _______________

---

### TC-9.4: Password Security

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Password not returned in API | No password_hash in responses | [ ] |
| 2 | Passwords properly hashed | Not stored in plain text | [ ] |
| 3 | Password reset token expires | Old tokens don't work | [ ] |

**Notes**: _______________

---

## 13. Test Suite 10: User Journey - Small Business Owner (Sarah)

> **Persona**: Sarah Chen - Owner of a 15-employee IT consulting firm
> **Certifications**: 8(a), WOSB
> **Goal**: Win first government contract
> **Reference**: `docs/user-stories/small-business-owner.md`

### UJ-10.1: Complete New User Journey (End-to-End)

**Scenario**: Sarah is new to government contracting and wants to explore opportunities.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | Visit GovAI website | Homepage loads | Clear value proposition shown | [ ] |
| 2 | Click "Get Started" / Register | Registration page | Form displayed | [ ] |
| 3 | Complete registration (< 2 min) | Success message | "Check your email" message | [ ] |
| 4 | Verify email | Verification success | "Email verified successfully" | [ ] |
| 5 | Login | Redirect to onboarding | Onboarding wizard shown | [ ] |

**Time Target**: Registration completes in under 2 minutes
**Notes**: _______________

---

### UJ-10.2: Company Onboarding (3-Step Wizard)

**Scenario**: Sarah sets up her company profile to receive relevant opportunities.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | Step 1: Enter "Chen IT Solutions" | Field accepts name | Required field validation | [ ] |
| 2 | Select legal structure: LLC | Dropdown works | Options: LLC, Corp, etc. | [ ] |
| 3 | Enter UEI number | Field accepts 12 chars | Format validation | [ ] |
| 4 | Enter business address | All fields work | State dropdown populated | [ ] |
| 5 | Click "Next" | Progress to Step 2 | Step indicator updates | [ ] |
| 6 | Step 2: Search NAICS "541511" | Results filtered | Intuitive search experience | [ ] |
| 7 | Select 3 NAICS codes | Multi-select works | Counter: "Selected: 3/10" | [ ] |
| 8 | Select certifications: 8(a), WOSB | Multi-select works | Clear certification labels | [ ] |
| 9 | Set contract range: $50K - $2M | Dropdown works | Range options available | [ ] |
| 10 | Select geographic: VA, MD, DC | Multi-select works | All states + Nationwide | [ ] |
| 11 | Click "Next" | Progress to Step 3 | Data preserved | [ ] |
| 12 | Step 3: Write capabilities (200 words) | Textarea accepts | Word counter updates | [ ] |
| 13 | Review summary shown | Summary visible | Name, NAICS count, certs shown | [ ] |
| 14 | Click "Complete Onboarding" | Loading then redirect | Redirect to dashboard | [ ] |

**Time Target**: Onboarding completes in under 10 minutes
**Notes**: _______________

---

### UJ-10.3: Reviewing AI-Evaluated Opportunities

**Scenario**: Sarah wants to find suitable contract opportunities.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | Navigate to Opportunities page | Page loads < 3 sec | List displayed | [ ] |
| 2 | See recommendation badges | BID (green), RESEARCH (yellow), NO_BID (red) | Colors correct | [ ] |
| 3 | Filter by "BID only" | Results filtered | Only BID recommendations shown | [ ] |
| 4 | Filter by min fit score 70% | Results filtered | Scores >= 70% only | [ ] |
| 5 | Click high-scoring opportunity | Detail page loads | Complete analysis shown | [ ] |
| 6 | Review Fit score | Score 0-100 displayed | Number prominently shown | [ ] |
| 7 | Review Win probability | Score 0-100 displayed | Number prominently shown | [ ] |
| 8 | Review Strengths | List of strengths | Actionable insights | [ ] |
| 9 | Review Weaknesses | List of weaknesses | Areas to address | [ ] |
| 10 | Review Key requirements | Requirements list | Clear list format | [ ] |
| 11 | Review Risk factors | Risk list | Explained clearly | [ ] |
| 12 | See Response deadline | Date prominently shown | Deadline visible | [ ] |

**Notes**: _______________

---

### UJ-10.4: Pipeline Management for New User

**Scenario**: Sarah wants to track opportunities she's interested in.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | On opportunity detail, select "WATCHING" | Dropdown updates | One-click saving | [ ] |
| 2 | Add note: "Review with team on Monday" | Note saved | Sufficient text space | [ ] |
| 3 | Click "Save" | Success feedback | "Changes saved" message | [ ] |
| 4 | Navigate to Pipeline page | Kanban board loads | Status columns visible | [ ] |
| 5 | See opportunity in WATCHING column | Card displayed | Title and details shown | [ ] |
| 6 | Move to BIDDING | Status changes | Card moves to new column | [ ] |
| 7 | Eventually mark as WON | Status changes | Card in WON column | [ ] |
| 8 | Check win rate updates | Stats recalculated | Win rate shown | [ ] |

**Notes**: _______________

---

### UJ-10.5: Email Notification Setup

**Scenario**: Sarah wants to stay informed without constantly checking.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | Go to Settings page | Email section visible | Preferences displayed | [ ] |
| 2 | Select "Daily Digest" | Radio selected | Clear option descriptions | [ ] |
| 3 | Save preferences | Success message | Settings saved | [ ] |
| 4 | (Next day) Receive daily email at 8 AM | Email arrives | Consistent timing | [ ] |
| 5 | Email contains BID recommendations | Content relevant | Title, scores, deadlines | [ ] |
| 6 | Email contains deadline reminders | Upcoming deadlines | Days until deadline | [ ] |
| 7 | Click link in email | Navigates to platform | Link works correctly | [ ] |
| 8 | Receive reminder 3 days before deadline | Reminder arrives | Timely notification | [ ] |

**Notes**: _______________

---

## 14. Test Suite 11: User Journey - BD Manager (Marcus)

> **Persona**: Marcus Johnson - BD Manager at 150-employee mid-size contractor
> **Certifications**: SDVOSB, HUBZone
> **Goal**: Increase win rate and efficiency of opportunity qualification
> **Reference**: `docs/user-stories/bd-manager.md`

### UJ-11.1: Efficient Opportunity Qualification

**Scenario**: Marcus needs to quickly assess large volumes of opportunities daily.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | Login to dashboard | Stats summary visible | Real-time statistics | [ ] |
| 2 | View: "45 new opportunities" | Count displayed | Matching NAICS | [ ] |
| 3 | View: "12 AI-recommended BIDs" | Count displayed | BID count | [ ] |
| 4 | View: "8 requiring RESEARCH" | Count displayed | RESEARCH count | [ ] |
| 5 | Filter by recommendation type | One-click filtering | Filter works | [ ] |
| 6 | Review BID recommendations first | Sorted list | Highest priority first | [ ] |
| 7 | Scan fit scores and win probabilities | Scores visible | Quick scan capability | [ ] |
| 8 | Time per qualification < 5 min | Fast workflow | 80% time reduction | [ ] |

**Target**: Qualify 50+ opportunities per day
**Notes**: _______________

---

### UJ-11.2: Deep Dive Analysis for Leadership

**Scenario**: Marcus needs to present qualified opportunities with justification.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | Select opportunity (Fit: 92%, Win: 75%) | Detail loads | High-potential opportunity | [ ] |
| 2 | Review Strengths | List shown | "SDVOSB set-aside", etc. | [ ] |
| 3 | Review Weaknesses | List shown | "Short timeline", etc. | [ ] |
| 4 | Review Key Requirements | List shown | "SECRET clearance", etc. | [ ] |
| 5 | Review Risk Factors | List shown | "Incumbent advantage", etc. | [ ] |
| 6 | Add personal notes | Notes saved | Context for team | [ ] |
| 7 | Save to pipeline as "BIDDING" | Status saved | Pipeline updated | [ ] |
| 8 | Analysis explains AI reasoning | Clear explanation | Decision support | [ ] |

**Notes**: _______________

---

### UJ-11.3: Pipeline Management for Team Portfolio

**Scenario**: Marcus manages a portfolio of opportunities at various stages.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | Open Pipeline view | Kanban board loads | Visual layout | [ ] |
| 2 | See WATCHING: 15 opportunities | Count correct | Monitoring stage | [ ] |
| 3 | See BIDDING: 8 opportunities | Count correct | Active proposals | [ ] |
| 4 | See WON: 3 (this quarter) | Count correct | Successes | [ ] |
| 5 | See LOST: 2 (this quarter) | Count correct | Losses | [ ] |
| 6 | View win rate: 60% | Auto-calculated | 3/(3+2) = 60% | [ ] |
| 7 | Drag opportunity WATCHING → BIDDING | Status changes | Drag-and-drop works | [ ] |
| 8 | Update notes with proposal status | Notes saved | History preserved | [ ] |

**Notes**: _______________

---

### UJ-11.4: Strategic Decision Making

**Scenario**: Marcus needs to prioritize limited BD resources.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | Review statistics dashboard | Stats displayed | Insights available | [ ] |
| 2 | Analyze BID: 25% of evaluated | Distribution shown | Recommendation breakdown | [ ] |
| 3 | Analyze RESEARCH: 30% need more analysis | Distribution shown | Middle category | [ ] |
| 4 | Analyze NO_BID: 45% not recommended | Distribution shown | Filtered out | [ ] |
| 5 | Compare NAICS code performance | If available | Performance insights | [ ] |
| 6 | Adjust company profile | Settings page | Refine matching | [ ] |
| 7 | Re-evaluation after profile change | Scores may change | Dynamic recalculation | [ ] |

**Notes**: _______________

---

### UJ-11.5: Proactive Opportunity Monitoring

**Scenario**: Marcus wants to stay ahead of competition.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | Configure real-time notifications | Settings saved | Frequency: real-time | [ ] |
| 2 | Receive immediate alert for BID | Alert arrives | High-value match | [ ] |
| 3 | Set deadline reminders (7, 3, 1 days) | Reminders work | Multiple touchpoints | [ ] |
| 4 | Use manual discovery trigger | Discovery runs | On-demand updates | [ ] |
| 5 | Track new opportunities throughout day | Updates visible | Fresh data | [ ] |

**Notes**: _______________

---

## 15. Test Suite 12: User Journey - Proposal Manager (Jennifer)

> **Persona**: Jennifer Williams - Proposal Manager at 500+ employee large contractor
> **Focus**: Quality proposals with high win rates
> **Goal**: Improve proposal quality using AI insights
> **Reference**: `docs/user-stories/proposal-manager.md`

### UJ-12.1: Receiving Qualified Opportunities from BD

**Scenario**: Jennifer receives opportunities that BD team has qualified.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | Login to GovAI | Dashboard loads | Access granted | [ ] |
| 2 | Filter Pipeline by "BIDDING" | Results filtered | Proposal development stage | [ ] |
| 3 | See opportunities assigned to proposal | List displayed | Clear view | [ ] |
| 4 | For each, review AI fit score | Scores visible | Decision context | [ ] |
| 5 | Review win probability | Scores visible | Probability estimate | [ ] |
| 6 | Review key requirements | List available | Extracted requirements | [ ] |
| 7 | Review risk factors | List available | Flagged risks | [ ] |
| 8 | Review BD manager notes | Notes visible | Searchable notes | [ ] |
| 9 | Sort by deadline | Sorted list | Priority view | [ ] |

**Notes**: _______________

---

### UJ-12.2: Understanding Requirements from AI Analysis

**Scenario**: Jennifer needs to quickly understand what the opportunity requires.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | Open opportunity detail | Page loads | Full analysis | [ ] |
| 2 | Review AI-extracted requirements | List shown | Clear listing | [ ] |
| 3 | Example: "SECRET clearance required" | Requirement visible | Specific detail | [ ] |
| 4 | Example: "5 years relevant experience" | Requirement visible | Specific detail | [ ] |
| 5 | Example: "AWS certification" | Requirement visible | Specific detail | [ ] |
| 6 | Review strengths to emphasize | Strengths list | Actionable | [ ] |
| 7 | Review weaknesses to address | Weaknesses list | Actionable | [ ] |
| 8 | Add notes about proposal strategy | Notes saved | Strategy documentation | [ ] |
| 9 | Link to original SAM.gov posting | Link works | Source document | [ ] |

**Time Target**: Understand requirements in < 30 minutes
**Notes**: _______________

---

### UJ-12.3: Risk Assessment Before Resource Commitment

**Scenario**: Jennifer needs to understand and mitigate risks.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | Review AI-identified risk factors | List shown | Risk visibility | [ ] |
| 2 | Example: "Incumbent has strong relationship" | Risk visible | Specific risk | [ ] |
| 3 | Example: "Aggressive timeline - 21 days" | Risk visible | Timeline concern | [ ] |
| 4 | Example: "Price likely key discriminator" | Risk visible | Pricing concern | [ ] |
| 5 | Document mitigation strategies in notes | Notes saved | Strategy capture | [ ] |
| 6 | Discuss with BD manager | (manual step) | Collaboration | [ ] |
| 7 | Make Go/No-Go recommendation | Decision made | Documented | [ ] |
| 8 | Update opportunity status | Status changed | Audit trail | [ ] |

**Target**: 100% risk factors identified pre-proposal
**Notes**: _______________

---

### UJ-12.4: Tracking Proposal Progress

**Scenario**: Jennifer tracks multiple active proposals.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | View Pipeline board | Board loads | Visual tracking | [ ] |
| 2 | Monitor BIDDING opportunities | Cards visible | Active proposals | [ ] |
| 3 | See "DOD IT Modernization" - Due 14 days | Deadline shown | Countdown visible | [ ] |
| 4 | See "VA Health Records" - Due 7 days | Deadline shown | Urgent highlight | [ ] |
| 5 | See "DHS Cybersecurity" - Due 21 days | Deadline shown | Future deadline | [ ] |
| 6 | Update notes with milestones | Notes saved | Progress tracking | [ ] |
| 7 | Receive deadline reminder emails | Emails arrive | Configurable | [ ] |
| 8 | Mark submitted proposals | Status updated | Submission tracking | [ ] |

**Target**: 0 missed deadlines
**Notes**: _______________

---

### UJ-12.5: Learning from Outcomes

**Scenario**: Jennifer wants to improve future proposals based on results.

| Step | Action | Expected Result | Acceptance Criteria | Status |
|------|--------|-----------------|---------------------|--------|
| 1 | Update status to WON or LOST | Status saved | Outcome recorded | [ ] |
| 2 | Add outcome notes for WIN | Notes saved | "Technical approach differentiated us" | [ ] |
| 3 | Add outcome notes for LOSS | Notes saved | "Price was too high" | [ ] |
| 4 | Review win rate statistics | Stats displayed | Auto-calculated | [ ] |
| 5 | Analyze correlation: AI scores vs outcomes | Analysis possible | Data-driven insights | [ ] |
| 6 | Historical data accessible | Data available | Export for analysis | [ ] |

**Target**: 100% lessons learned documented
**Notes**: _______________

---

## 16. Test Execution Log

| Date | Time | Test ID | Result | Tester | Notes |
|------|------|---------|--------|--------|-------|
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |

---

## 17. Known Issues & Blockers

### Issue Tracking

| ID | Severity | Description | Test Case | Status | Resolution |
|----|----------|-------------|-----------|--------|------------|
| BUG-001 | High | Pipeline endpoint: Evaluation model missing 'user_saved' attribute | TC-3.3 | **FIXED** | Added user_saved/user_notes columns to model + migration |
| BUG-002 | High | Match-score endpoint: MatchScoringService.compute_score() missing 'db' argument | TC-3.7 | **FIXED** | Added db argument to compute_score() calls |
| BUG-003 | Medium | Pipeline list: Evaluation.updated_at is property, not column | TC-5.2 | **FIXED** | Changed to use Evaluation.evaluated_at |
| BUG-004 | **High** | Pipeline API route conflict: `/pipeline` matched as `/{id}` with id="pipeline" causing UUID parse error | UJ-11.3, UJ-12 | **OPEN** | Route order in opportunities.py needs fix - specific routes before generic `/{id}` |

### Not Implemented Features (Expected to Fail)

These features are documented in requirements but not implemented:

1. **Secure Document Upload** - No file storage infrastructure
2. **Capability Statement PDF Upload** - Only text field available
3. **Certification Document Storage** - No document storage
4. **Past Performance Documents** - Not implemented
5. **Document Versioning** - N/A
6. **AI Document Extraction** - N/A
7. **Authority Matching Algorithm** - Contact data exists but no recommendation engine

---

## Appendix A: API Endpoints Reference

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/verify-email` - Verify email
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/me` - Update current user
- `GET /api/v1/auth/unsubscribe/{token}` - One-click unsubscribe

### Company
- `GET /api/v1/company/me` - Get user's company
- `POST /api/v1/company/` - Create company
- `PUT /api/v1/company/` - Update company
- `DELETE /api/v1/company/` - Delete company

### Opportunities
- `GET /api/v1/opportunities/` - List opportunities
- `GET /api/v1/opportunities/opportunities/{id}` - Get opportunity
- `GET /api/v1/opportunities/evaluations` - List evaluations
- `GET /api/v1/opportunities/evaluations/{id}` - Get evaluation
- `PUT /api/v1/opportunities/evaluations/{id}` - Update evaluation
- `GET /api/v1/opportunities/stats` - Get stats
- `GET /api/v1/opportunities/pipeline` - Get pipeline
- `GET /api/v1/opportunities/pipeline/stats` - Get pipeline stats
- `POST /api/v1/opportunities/opportunities/{id}/evaluate` - Evaluate opportunity
- `GET /api/v1/opportunities/opportunities/{id}/match-score` - Get match score
- `POST /api/v1/opportunities/actions/trigger-discovery` - Trigger discovery

### Awards
- `GET /api/v1/awards/` - List awards
- `GET /api/v1/awards/stats` - Get award stats

### Reference
- `GET /api/v1/reference/all` - Get all reference data

---

## Appendix B: Test Data Cleanup

After testing, run these SQL queries to clean up test data:

```sql
-- Delete test users
DELETE FROM users WHERE email LIKE 'test.%@example.com';

-- Delete test companies
DELETE FROM companies WHERE name LIKE 'Test %';

-- Delete associated evaluations (cascade should handle this)
-- DELETE FROM evaluations WHERE company_id NOT IN (SELECT id FROM companies);
```

---

## Appendix C: Resume Point Tracking

**Last Completed Test**: _______________
**Date/Time**: _______________
**Next Test to Run**: _______________
**Environment State**: _______________

---

*Document created for GovAI E2E Testing*
*Version 1.0 - 2024-12-22*
