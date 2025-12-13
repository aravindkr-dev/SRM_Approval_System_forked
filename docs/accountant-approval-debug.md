# Accountant Approval Debugging Guide

## Issue
Accountant is getting "failed to process approval" error when trying to approve requests.

## Debugging Steps

### 1. Check Browser Console
- Open browser developer tools (F12)
- Go to Console tab
- Look for error messages when accountant submits approval
- Check Network tab for API request/response details

### 2. Check Server Logs
- Look for "Approve request error" messages in server console
- Check for validation errors or database issues
- Look for specific error details in the enhanced logging

### 3. Verify Request Status
- Ensure the request is in `parallel_verification` or `sop_completed` status
- Check that accountant role is properly assigned
- Verify the request exists and is accessible

### 4. Validate Budget Data
- Ensure Budget Allocated > 0
- Ensure Budget Spent >= 0
- Check that values are numbers, not strings

### 5. Check API Request Data
The following data should be sent to the API:
```json
{
  "action": "approve",
  "budgetAllocated": 10000,
  "budgetSpent": 2000,
  "budgetAvailable": 8000,
  "notes": "Budget verification complete"
}
```

## Common Issues and Solutions

### Issue 1: Budget Fields Not Provided
**Symptoms**: API returns "Valid budget allocated amount is required"
**Solution**: Ensure accountant fills in budget allocated field with value > 0

### Issue 2: Negative Budget Values
**Symptoms**: API returns "Valid budget spent amount is required (cannot be negative)"
**Solution**: Ensure budget spent is >= 0

### Issue 3: Wrong Request Status
**Symptoms**: API returns "Not authorized to approve this request"
**Solution**: Verify request is in correct status for accountant approval

### Issue 4: Role Permission Issues
**Symptoms**: 403 Forbidden error
**Solution**: Verify user has accountant role and proper permissions

## Testing Checklist

### ✅ Pre-Approval Checks
- [ ] Request is in `parallel_verification` status
- [ ] User has `accountant` role
- [ ] Budget fields are visible in UI
- [ ] Action is set to "approve"

### ✅ Budget Data Validation
- [ ] Budget Allocated > 0
- [ ] Budget Spent >= 0
- [ ] Budget Available = Allocated - Spent
- [ ] All values are numbers

### ✅ API Request Validation
- [ ] POST request to `/api/requests/[id]/approve`
- [ ] Includes required budget fields
- [ ] Action is "approve"
- [ ] Authentication headers present

### ✅ Expected Response
- [ ] Status 200 OK
- [ ] Updated request object returned
- [ ] Status changed to `budget_completed` or `institution_verified`
- [ ] Budget values saved in request document

## Manual Testing Steps

1. **Login as Accountant**
2. **Navigate to Request** in `parallel_verification` status
3. **Open Process Request Modal**
4. **Verify UI Shows**:
   - "Budget Verification" section
   - Action dropdown with "Complete Budget Verification"
   - Budget Allocated input field
   - Budget Spent input field
   - Budget Available (calculated)
5. **Fill Budget Data**:
   - Budget Allocated: 10000
   - Budget Spent: 2000
   - Notes: "Budget verified"
6. **Submit Approval**
7. **Verify Success**:
   - No error message
   - Modal closes
   - Request status updates
   - Page refreshes with new status

## API Endpoint Testing

### Test with curl:
```bash
curl -X POST http://localhost:3000/api/requests/[REQUEST_ID]/approve \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=[AUTH_TOKEN]" \
  -d '{
    "action": "approve",
    "budgetAllocated": 10000,
    "budgetSpent": 2000,
    "budgetAvailable": 8000,
    "notes": "Budget verification complete"
  }'
```

### Expected Response:
```json
{
  "_id": "...",
  "status": "budget_completed",
  "budgetAllocated": 10000,
  "budgetSpent": 2000,
  "budgetBalance": 8000,
  "history": [
    {
      "action": "approve",
      "actor": "...",
      "newStatus": "budget_completed",
      "budgetAllocated": 10000,
      "budgetSpent": 2000,
      "budgetBalance": 8000
    }
  ]
}
```

## Error Messages Reference

### Client-Side Validation Errors
- "Please enter a valid budget allocated amount."
- "Budget spent cannot be negative."

### Server-Side Validation Errors
- "Valid budget allocated amount is required"
- "Valid budget spent amount is required (cannot be negative)"
- "Not authorized to approve this request"
- "Request not found"

### Generic Errors
- "Failed to process approval"
- "Unauthorized"
- "Invalid action"

## Resolution Steps

1. **Check browser console for specific error**
2. **Verify budget fields are filled correctly**
3. **Ensure request is in correct status**
4. **Check user role and permissions**
5. **Test API endpoint directly if needed**
6. **Check server logs for detailed error information**