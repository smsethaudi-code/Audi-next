import EmailService from '@/lib/emailService'

const testEmailService = async () => {
  try {
    const emailService = new EmailService()
    
    // Test data for email
    const testBookingData = {
      bookingId: "test-123",
      eventName: "Test Event",
      eventType: "Conference", 
      userName: "Test User",
      userEmail: "test@example.com",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
      participantCount: 50,
      eventDescription: "This is a test event description",
      isExternal: false,
      externalServices: ["refreshments"]
    }

    console.log('Testing internal booking received email...')
    await emailService.sendInternalBookingReceived(testBookingData)
    console.log('✅ Internal booking received email sent successfully!')

    console.log('Testing external booking approved email...')
    await emailService.sendExternalApproved(testBookingData)
    console.log('✅ External booking approved email sent successfully!')

    console.log('All email tests passed! 🎉')
  } catch (error) {
    console.error('❌ Email test failed:', error)
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEmailService()
}

export default testEmailService