# Remove VP Send Back to SOP Option

## Change
Removed the "Send Back to SOP Verification" option from the VP approval page to simplify the workflow.

## Rationale
The VP should focus on their approval decision rather than managing SOP verification details. If SOP verification is incomplete, it should be handled at the manager level during the parallel verification phase.

## Changes Made

### 1. ApprovalModal Component (`components/ApprovalModal.tsx`)

**Removed VP-specific option:**
```typescript
// Before
<option value="approve">Approve</option>
{userRole === 'vp' && <option value="send_to_sop">Send Back to SOP Verification</option>}
<option value="reject">Reject</option>

// After  
<option value="approve">Approve</option>
<option value="reject">Reject</option>
```

**Removed conditional UI:**
```typescript
// Removed this entire section
{action === 'send_to_sop' && userRole === 'vp' && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
    <p className="text-sm text-yellow-700">
      ⚠️ This will send the request back to SOP Verifier to provide the required SOP reference number.
    </p>
  </div>
)}
```

### 2. API Route (`app/api/requests/[id]/approve/route.ts`)

**Removed from action validation:**
```typescript
// Before
if (!['approve', 'reject', 'clarify', 'forward', 'budget_available', 'budget_not_available', 'send_to_sop'].includes(action))

// After
if (!['approve', 'reject', 'clarify', 'forward', 'budget_available', 'budget_not_available'].includes(action))
```

**Removed action handling:**
```typescript
// Removed this entire case
case 'send_to_sop':
  if (user.role === UserRole.VP && requestRecord.status === RequestStatus.VP_APPROVAL) {
    nextStatus = RequestStatus.SOP_VERIFICATION;
    actionType = ActionType.CLARIFY;
  }
  break;
```

### 3. Approval Engine (`lib/approval-engine.ts`)

**Removed transition:**
```typescript
// Removed this transition
{ from: RequestStatus.VP_APPROVAL, to: RequestStatus.SOP_VERIFICATION, requiredRole: UserRole.VP },
```

## Impact

### VP Workflow Simplified
**Before:**
- VP could approve, reject, or send back to SOP verification
- Added complexity to VP decision-making process

**After:**
- VP can only approve or reject
- Cleaner, more focused workflow
- VP focuses on their approval authority

### SOP Verification Handling
- SOP verification issues should be resolved during parallel verification phase
- Manager is responsible for ensuring proper SOP verification before routing to VP
- VP receives requests only when SOP verification is properly completed

## Benefits

1. **Simplified VP Role**: VP focuses on approval/rejection decisions
2. **Cleaner Workflow**: Removes backward flow from VP to SOP
3. **Better Separation**: Each role has clear responsibilities
4. **Reduced Complexity**: Fewer workflow paths to manage

## Alternative Handling
If SOP verification is incomplete or incorrect:
1. **At Manager Level**: Manager should catch this during parallel verification review
2. **At SOP Level**: SOP verifier should provide proper reference or mark as not available
3. **Process Improvement**: Focus on getting verification right the first time

## Status: ✅ COMPLETE

VP approval page now only shows Approve/Reject options, simplifying the workflow and removing the send back to SOP verification option.