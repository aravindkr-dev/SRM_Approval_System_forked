# Budget Check Status Fix

## Issue
Accountant was unable to approve requests with status `budget_check` (old workflow status) because the UI only supported the new parallel verification statuses.

## Root Cause
The ApprovalModal component was missing UI handling for the legacy `budget_check` status that some existing requests still have.

## Solution
1. **Added UI Support for `budget_check` Status**
   - Added dedicated UI section for accountant when status is `budget_check`
   - Includes budget allocated, budget spent, and calculated available budget fields
   - Proper validation for required budget fields

2. **Updated Validation Logic**
   - Extended budget field validation to include `budget_check` status
   - Ensures accountant must provide valid budget data before approval

3. **Enhanced API Route**
   - Added specific handling for `budget_check` status in approval API
   - Validates budget data server-side
   - Routes to VP approval if budget available, Dean review if not

4. **Updated UI Exclusion Logic**
   - Prevents accountant from seeing generic UI when in `budget_check` status
   - Ensures they see the specialized budget verification interface

5. **Fixed Approval Engine Authorization**
   - Added missing transitions for legacy `budget_check` status
   - Added accountant role authorization for `budget_check` approvals
   - Added rejection capabilities for legacy workflow statuses
   - Added logic to handle `budget_check` status in `getNextStatus` method

## Files Modified
- `components/ApprovalModal.tsx` - Added UI support and validation
- `app/api/requests/[id]/approve/route.ts` - Added API handling
- `lib/approval-engine.ts` - Added legacy workflow transitions and authorization

## Testing
The accountant should now be able to:
1. See proper budget verification UI for `budget_check` status
2. Enter budget allocated and spent amounts
3. Successfully approve the request
4. Have the request route correctly based on budget availability

## Backward Compatibility
This fix maintains full backward compatibility with existing requests that have the old `budget_check` status while supporting the new parallel verification workflow.