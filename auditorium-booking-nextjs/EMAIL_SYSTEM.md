# Email Notification System

## Overview

The auditorium booking system now includes a comprehensive email notification system that automatically sends professional, branded emails to users and administrators for all booking status changes.

## Features

### Automated Email Notifications

The system automatically sends emails for the following events:

1. **Booking Received** 
   - Internal bookings: Sent when a Poornima student/staff creates a booking
   - External bookings: Sent when an external organization creates a booking

2. **Booking Approved**
   - Internal bookings: Sent when admin approves an internal booking
   - External bookings: Sent when admin approves an external booking (includes QR code)

3. **Booking Partially Approved**
   - External bookings: Sent when admin partially approves with limited services

4. **Booking Cancelled by Admin**
   - Sent when admin rejects or cancels a booking (with reason)

5. **Booking Cancelled by User**
   - Sent when user cancels their own booking

### Professional Email Templates

All emails feature:
- **Poornima Group Branding**: Professional logo and color scheme
- **Clean Design**: Minimalistic layout with embedded CSS
- **Comprehensive Information**: All booking details clearly presented
- **Mobile Responsive**: Optimized for all devices
- **QR Code Integration**: Approved external bookings include verification QR codes

## Configuration

### Environment Variables

The following environment variables control email functionality:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=smsethaudi@poornima.org
EMAIL_PASS=nimtbdaiqyohjnvj
EMAIL_FROM=smsethaudi@poornima.org

# Admin Configuration  
ADMIN_EMAIL=smsethaudi@poornima.org
```

### SMTP Setup

The system uses Gmail SMTP with the following settings:
- **Host**: smtp.gmail.com
- **Port**: 587 (STARTTLS)
- **Authentication**: Username/password
- **Security**: STARTTLS enabled

## Technical Implementation

### EmailService Class

Located in `src/lib/emailService.ts`, the EmailService class provides:

```typescript
class EmailService {
  // Booking received notifications
  async sendInternalBookingReceived(data: BookingEmailData): Promise<boolean>
  async sendExternalBookingReceived(data: BookingEmailData): Promise<boolean>
  
  // Approval notifications
  async sendInternalApproved(data: BookingEmailData): Promise<boolean>
  async sendExternalApproved(data: BookingEmailData): Promise<boolean>
  async sendExternalPartiallyApproved(data: BookingEmailData): Promise<boolean>
  
  // Cancellation notifications
  async sendAdminCancelled(data: BookingEmailData): Promise<boolean>
  async sendUserCancelled(data: BookingEmailData): Promise<boolean>
}
```

### Integration Points

Email notifications are automatically triggered from:

1. **Booking Creation** (`/api/bookings` POST)
   - Sends "booking received" email based on internal/external status

2. **Admin Actions** (`/api/admin/bookings/[id]` PATCH)
   - Sends appropriate email based on action (approve, reject, cancel)

3. **User Cancellation** (`/api/bookings/[id]` PATCH)
   - Sends cancellation email when user cancels their booking

### Error Handling

- Email failures don't prevent booking operations from completing
- All email errors are logged for debugging
- Graceful fallback ensures system functionality

## Email Content Structure

### Internal Booking Received
- Confirmation of booking submission
- All booking details
- Next steps and timeline
- Contact information

### External Booking Received  
- Confirmation with professional branding
- Detailed booking information
- External services requested
- Review process explanation

### Booking Approved
- Confirmation of approval
- QR code for verification (external bookings)
- Event details and instructions
- Contact information for queries

### Booking Cancelled
- Clear cancellation notice
- Reason for cancellation (if provided)
- Contact information for queries
- Professional apology (admin cancellations)

## QR Code Integration

Approved external bookings automatically include:
- **Verification QR Code**: Contains booking ID and verification data
- **Instructions**: How to use QR code for event entry
- **Backup Information**: Manual verification details if QR fails

## Styling and Branding

All emails include:
- **Poornima Logo**: Fetched from CDN
- **Brand Colors**: Professional blue/white color scheme
- **Typography**: Clean, readable fonts
- **Layout**: Consistent spacing and alignment
- **Mobile Optimization**: Responsive design for all devices

## Usage Examples

### Testing Email Functionality

A test script is available at `test-email.js`:

```bash
node test-email.js
```

### Manual Email Sending

```typescript
import EmailService from '@/lib/emailService'

const emailService = new EmailService()
const bookingData = {
  bookingId: "123",
  eventName: "Conference",
  // ... other booking details
}

await emailService.sendInternalApproved(bookingData)
```

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check SMTP credentials and network connectivity
2. **HTML not rendering**: Verify email client supports HTML emails
3. **Images not loading**: Ensure CDN URLs are accessible
4. **Delivery delays**: Check SMTP rate limits and queue status

### Debugging

Enable detailed logging by checking:
- Console logs in API routes
- SMTP connection status
- Email service response codes

### Support

For email-related issues:
- Check environment variable configuration
- Verify SMTP server connectivity
- Review email service logs
- Contact system administrator

## Security Considerations

- SMTP credentials stored securely in environment variables
- No sensitive booking data exposed in email headers
- Professional email templates prevent phishing concerns
- Verification codes use secure encoding methods

## Future Enhancements

Potential improvements:
- Email template customization interface
- Delivery status tracking
- Bulk email notifications
- Email analytics and reporting
- Multi-language support