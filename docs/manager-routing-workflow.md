# Manager Routing Workflow

## Overview
Updated the workflow so that after both SOP verifier and accountant complete their verifications, the request returns to the manager who then makes the routing decision to VP or Dean.

## New Workflow Flow

### 1. Initial Manager Review
- Manager receives new request at `manager_review` status
- Manager sends to parallel verification (both SOP and accountant)
- Status changes to `parallel_verification`

### 2. Parallel Verification
- **SOP Verifier**: Provides SOP reference number and approves
- **Accountant**: Checks budget availability and approves
- Both can work simultaneously

### 3. Return to Manager
- After **both** verifications complete, request returns to `manager_review` status
- Manager now sees "Verifications Complete - Route Decision" UI
- Manager has two routing options:
  - **Budget Available** → Send to VP
  - **Budget Not Available** → Send to Dean

### 4. Manager Routing Decision
- Manager reviews both SOP reference and budget availability
- Makes informed routing decision based on complete information
- Sends to appropriate next step in workflow

## UI Changes

### Manager Interface
- **Before Verifications**: Shows "Send to SOP & Budget Verification" option
- **After Verifications**: Shows routing decision options with context about completed verifications

### Detection Logic
The system detects completed verifications by checking request history for:
- SOP verification completion (SOP reference provided)
- Budget verification completion (budget availability confirmed)

## API Changes

### Verification Completion Routing
- `SOP_COMPLETED` + Accountant approval → `MANAGER_REVIEW`
- `BUDGET_COMPLETED` + SOP approval → `MANAGER_REVIEW`
- Legacy `BUDGET_CHECK` approval → `MANAGER_REVIEW`

### Manager Routing Actions
- `budget_available` action → `VP_APPROVAL`
- `budget_not_available` action → `DEAN_REVIEW`

## Benefits

1. **Manager Control**: Manager maintains oversight of routing decisions
2. **Complete Information**: Manager sees both SOP reference and budget status before routing
3. **Workflow Integrity**: Ensures both verifications happen before proceeding
4. **Clear Responsibility**: Manager is responsible for final routing decision based on verification results

## Files Modified
- `components/ApprovalModal.tsx` - Added manager routing UI after verifications
- `app/api/requests/[id]/approve/route.ts` - Updated verification completion routing
- `app/dashboard/requests/[id]/page.tsx` - Pass request data to modal
- `lib/approval-engine.ts` - Added manager routing transitions

## Testing Scenarios

1. **New Request**: Manager → Parallel Verification → Back to Manager → VP/Dean
2. **SOP First**: SOP completes → Accountant completes → Back to Manager
3. **Accountant First**: Accountant completes → SOP completes → Back to Manager
4. **Legacy Requests**: Old `budget_check` status → Back to Manager for routing