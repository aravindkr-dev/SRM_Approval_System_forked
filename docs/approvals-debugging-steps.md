# Approvals Debugging Steps

## Current Issue
Approvers are not able to see any requests on the approvals page.

## Debugging Changes Made

### 1. Added Debug Logs to Approvals API (`/app/api/approvals/route.ts`)
- Logs when API is called
- Logs current user details
- Logs filter being used
- Logs number of requests found
- Added dummy data fallback for testing

### 2. Added Debug Logs to Approvals Page (`/app/dashboard/approvals/page.tsx`)
- Logs when user fetch is called
- Logs current user details
- Logs when API request is made
- Logs API response data

### 3. Temporarily Disabled Role Restrictions
- Allowed requesters to access approvals page (for testing)
- Allowed requesters to call approvals API (for testing)

### 4. Created Debug Endpoints
- `GET /api/debug/status` - Shows all users, requests, and current user
- `GET /api/debug/create-test-user` - Shows existing users
- `POST /api/debug/create-test-user` - Creates test manager user

## Testing Steps

### Step 1: Access Approvals Page
Navigate to: `http://localhost:3000/dashboard/approvals`

### Step 2: Check Browser Console (F12)
Look for these debug messages:
```
[DEBUG] fetchCurrentUser called in approvals page
[DEBUG] Current user in approvals page: {role: "requester", ...}
[DEBUG] fetchApprovals called
[DEBUG] Making request to /api/approvals
[DEBUG] Response data: {...}
```

### Step 3: Check Server Terminal
Look for these debug messages:
```
[DEBUG] Approvals API called
[DEBUG] Current user: {role: "requester", ...}
[DEBUG] Filter being used: {...}
[DEBUG] Requests found: 0
[DEBUG] Returning X requests
```

## Possible Outcomes

### Outcome A: API Not Called
**Symptoms**: No server logs, no API calls in browser network tab
**Cause**: User redirection or page access issues
**Solution**: Check user role, ensure navigation works

### Outcome B: API Called, No Data
**Symptoms**: API logs show 0 requests found
**Cause**: No requests in database or filtering too restrictive
**Solutions**: 
- Create test requests
- Check database content
- Simplify filtering

### Outcome C: API Called, Has Data, Not Displayed
**Symptoms**: API returns data but page shows empty
**Cause**: Frontend display issue
**Solution**: Check React state management, component rendering

### Outcome D: API Returns Dummy Data
**Symptoms**: Shows "Test Request 1" in the list
**Cause**: No real requests found, dummy data displayed
**Solution**: Create real requests or check database

## Next Steps Based on Results

1. **If no API calls**: Focus on user roles and navigation
2. **If API called but no data**: Focus on database content and filtering
3. **If data returned but not displayed**: Focus on frontend rendering
4. **If dummy data shown**: Create real test data

## Cleanup After Testing
Once issue is identified, revert these temporary changes:
- Re-enable role restrictions in approvals page
- Re-enable role restrictions in approvals API
- Remove debug logs
- Remove dummy data fallback