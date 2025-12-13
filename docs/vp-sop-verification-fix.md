# VP SOP Verification Fix

## Issue
A request reached VP approval status without SOP verification being completed (no SOP reference number provided). This happened because the old workflow allowed accountant approval to route directly to VP without ensuring SOP verification was complete.

## Root Cause
In the legacy workflow, `budget_check` status could route directly to `vp_approval` without checking if SOP verification had been completed first. This created a gap where requests could bypass SOP verification entirely.

## Solution

### 1. Prevention (API Route Fix)
Updated the `budget_check` approval logic to check if SOP verification has been completed before routing to VP:

```typescript
// Check if SOP verification has been completed (has SOP reference)
const hasSopVerification = requestRecord.sopReference || 
  requestRecord.history.some((h: any) => h.sopReference && h.sopReference !== 'Not Available');

if (!hasSopVerification) {
  // SOP verification not done yet, send to SOP verification first
  nextStatus = RequestStatus.SOP_VERIFICATION;
} else {
  // SOP already done, route based on budget availability
  nextStatus = budgetAvailable ? RequestStatus.VP_APPROVAL : RequestStatus.DEAN_REVIEW;
}
```

### 2. Recovery (VP Send Back Option)
Added ability for VP to send requests back to SOP verification if they notice missing SOP reference:

- **UI**: VP now has "Send Back to SOP Verification" option in approval modal
- **API**: New `send_to_sop` action that routes from `vp_approval` back to `sop_verification`
- **Engine**: Added transition allowing VP to send back to SOP verification

### 3. Workflow Integrity
- Ensures SOP verification always happens before VP approval
- Maintains backward compatibility with existing requests
- Provides recovery mechanism for requests that bypassed SOP verification

## Files Modified
- `app/api/requests/[id]/approve/route.ts` - Added SOP verification check and send_to_sop action
- `components/ApprovalModal.tsx` - Added VP option to send back to SOP verification
- `lib/approval-engine.ts` - Added VP → SOP verification transition

## Usage
1. **For new requests**: System automatically ensures SOP verification happens before VP approval
2. **For existing requests at VP**: VP can use "Send Back to SOP Verification" option to get missing SOP reference
3. **SOP Verifier**: Will receive the request back and can provide the required SOP reference number

## Testing
1. VP should see the "Send Back to SOP Verification" option when processing requests
2. Selecting this option should route the request back to SOP verification status
3. SOP verifier should then be able to provide the reference number
4. After SOP verification, request should flow back through the normal workflow