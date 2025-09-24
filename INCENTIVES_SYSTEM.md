# Updated Incentives System

## Overview
The incentives system has been completely redesigned according to your specifications. It now uses a separate `Incentive` model and provides three specific incentives based on rank and achievements.

## Incentive Types

### 1. Umrah Ticket
- **Eligibility**: Global Manager rank only
- **Frequency**: One-time only
- **Requirements**: Must be G.Manager rank
- **Application**: Available immediately upon reaching G.Manager

### 2. Car Plan
- **Eligibility**: Director rank with 2 direct Directors
- **Frequency**: One-time only
- **Requirements**: 
  - Must be Director rank
  - Must have exactly 2 direct Director referrals (not from entire downline)
- **Application**: Available when both conditions are met

### 3. Monthly Salary (₹40,000)
- **Eligibility**: Director rank with 2 direct S.Managers in current month
- **Frequency**: Monthly (can apply every month if eligible)
- **Requirements**:
  - Must be Director rank
  - Must have 2 direct referrals who became S.Manager in the current month
- **Application**: Available each month when conditions are met

## Key Features

### User Dashboard
- **Conditional Display**: Only shows incentives available for user's current rank
- **Real-time Status**: Shows application status (Apply Now, Pending, Approved)
- **Eligibility Check**: Displays progress toward requirements
- **Application History**: Shows recent applications with status

### Admin Dashboard
- **Centralized Management**: All incentive applications in one place
- **Detailed Information**: Shows user details, incentive type, eligibility data
- **Easy Approval**: Simple approve/reject buttons
- **Audit Trail**: Tracks who processed applications and when

### Database Structure
- **Separate Model**: `Incentive` model for better organization
- **Eligibility Tracking**: Stores eligibility data when application is made
- **Monthly Tracking**: Handles monthly salary applications with month field
- **Status Management**: Pending → Approved/Rejected workflow

## API Endpoints

### User Endpoints
- `POST /api/incentives/apply` - Submit incentive application
- `GET /api/incentives/user` - Get user's incentive applications and eligibility

### Admin Endpoints
- `GET /api/admin/incentives` - Get pending incentive applications
- `POST /api/admin/incentives` - Approve/reject incentive applications

## Business Logic

### Direct Referrals Only
- All incentive requirements are based on **direct referrals only**
- Car Plan: Counts only direct Directors (not from entire downline)
- Monthly Salary: Counts only direct S.Managers who achieved rank in current month

### One-time vs Monthly
- **Umrah Ticket & Car Plan**: One-time incentives (cannot reapply once approved)
- **Monthly Salary**: Monthly incentive (can apply each month if eligible)

### Eligibility Validation
- Real-time eligibility checking on both frontend and backend
- Prevents duplicate applications for one-time incentives
- Prevents multiple applications for same month (monthly salary)

## Updated Features

### Removed Old Logic
- Removed old incentives field from User model
- Removed hardcoded incentive display logic
- Removed automatic unlocking based on unclear criteria

### Added New Logic
- Dynamic incentive display based on rank
- Proper eligibility checking with direct referral counts
- Monthly tracking for salary incentive
- Comprehensive admin management interface

## Testing

To test the system:

1. **Create test users** with different ranks (G.Manager, Director)
2. **Set up referral chains** with direct referrals at required ranks
3. **Test applications** for each incentive type
4. **Verify admin approval** workflow
5. **Check monthly salary** reapplication functionality

## Migration Notes

- Existing users will need to reapply for incentives using the new system
- Old incentive data in User model is no longer used
- Admin dashboard now shows new incentive applications only
