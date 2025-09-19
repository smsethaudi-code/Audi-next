import nodemailer from 'nodemailer'
import * as QRCode from 'qrcode'

interface BookingEmailData {
  bookingId: string
  eventName: string
  eventType: string
  userName: string
  userEmail: string
  startTime: string
  endTime: string
  participantCount: number
  eventDescription?: string
  externalServices?: string[]
  rejectionReason?: string
  cancellationReason?: string
  isExternal: boolean
  totalAmount?: number
}

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // Configure email transporter using environment variables
    const config: EmailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    }

    this.transporter = nodemailer.createTransport(config)
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  }

  private formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime)
    const end = new Date(endTime)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60))
  }

  private async generateQRCode(data: BookingEmailData): Promise<Buffer> {
    // Generate verification code (same logic as in QRCodeDisplay component)
    const verificationCode = `${data.bookingId}-${data.eventName}-${new Date(data.startTime).getTime()}`
    const verificationHash = Buffer.from(verificationCode).toString('base64')

    const qrData = JSON.stringify({
      bookingId: data.bookingId,
      eventName: data.eventName,
      startTime: data.startTime,
      endTime: data.endTime,
      eventType: data.eventType,
      participantCount: data.participantCount,
      verificationCode: verificationHash,
      generatedAt: new Date().toISOString()
    })

    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return qrCodeBuffer
  }

  private getEmailTemplate(content: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dr. S.M Seth Auditorium Booking</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            
            .logo {
                margin-bottom: 15px;
                max-width: 100%;
                height: auto;
            }
            
            .header h1 {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 5px;
            }
            
            .header p {
                font-size: 14px;
                opacity: 0.9;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .greeting {
                font-size: 16px;
                margin-bottom: 20px;
                color: #2c3e50;
            }
            
            .booking-details {
                background-color: #f8f9fa;
                border-left: 4px solid #667eea;
                padding: 20px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
            }
            
            .booking-details h3 {
                color: #2c3e50;
                margin-bottom: 15px;
                font-size: 18px;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }
            
            .detail-row:last-child {
                border-bottom: none;
            }
            
            .detail-label {
                font-weight: 600;
                color: #495057;
                min-width: 140px;
            }
            
            .detail-value {
                color: #2c3e50;
                font-weight: 500;
            }
            
            .amount-highlight {
                background-color: #28a745;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: bold;
            }
            
            .services-list {
                background-color: #e8f4fd;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
            }
            
            .services-list h4 {
                color: #0056b3;
                margin-bottom: 10px;
            }
            
            .services-list ul {
                list-style: none;
                padding-left: 0;
            }
            
            .services-list li {
                padding: 4px 0;
                color: #495057;
            }
            
            .services-list li:before {
                content: "✓ ";
                color: #28a745;
                font-weight: bold;
                margin-right: 8px;
            }
            
            .contact-info {
                background-color: #667eea;
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
            }
            
            .contact-info h4 {
                margin-bottom: 15px;
                font-size: 18px;
            }
            
            .contact-item {
                margin: 8px 0;
                font-size: 14px;
            }
            
            .footer {
                background-color: #2c3e50;
                color: #bdc3c7;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                line-height: 1.5;
            }
            
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .status-approved {
                background-color: #d4edda;
                color: #155724;
            }
            
            .status-partial {
                background-color: #fff3cd;
                color: #856404;
            }
            
            .status-cancelled {
                background-color: #f8d7da;
                color: #721c24;
            }
            
            .status-received {
                background-color: #cce5ff;
                color: #0056b3;
            }
            
            .warning-box {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
            }
            
            .warning-box h4 {
                color: #856404;
                margin-bottom: 10px;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 0;
                    box-shadow: none;
                }
                
                .detail-row {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .detail-label {
                    margin-bottom: 4px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://media.kshitijsinghbhati.in/logo.jpg" alt="Poornima Group Logo" class="logo">
                <h1>Dr. S.M Seth Auditorium</h1>
                <p>Poornima Group of Colleges</p>
            </div>
            
            <div class="content">
                ${content}
            </div>
            
            <div class="footer">
                <p><strong>Dr. S.M Seth Auditorium Booking System</strong></p>
                <p>Poornima Group, PIET Campus, ISI-2, RIICO Institutional Area, Sitapura, Jaipur - 302022</p>
                <p style="margin-top: 10px; font-size: 11px;">
                    This is an automated email. Please do not reply directly to this message.
                </p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  // Internal booking received email
  async sendInternalBookingReceived(data: BookingEmailData): Promise<boolean> {
    try {
      const duration = this.calculateDuration(data.startTime, data.endTime)
      
      const content = `
        <div class="greeting">Dear Admin,</div>
        
        <p>A new internal booking request has been received and requires your review.</p>
        
        <div class="booking-details">
            <h3>📋 Booking Request Details <span class="status-badge status-received">New Request</span></h3>
            <div class="detail-row">
                <span class="detail-label">📅 Event Name:</span>
                <span class="detail-value">${data.eventName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📝 Event Type:</span>
                <span class="detail-value">${data.eventType}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">👤 Requested By:</span>
                <span class="detail-value">${data.userName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📧 Email:</span>
                <span class="detail-value">${data.userEmail}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📆 Date:</span>
                <span class="detail-value">${this.formatDate(data.startTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🕒 Time (From):</span>
                <span class="detail-value">${this.formatTime(data.startTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🕒 Time (To):</span>
                <span class="detail-value">${this.formatTime(data.endTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">⏱️ Duration:</span>
                <span class="detail-value">${duration} hours</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">👥 Attendees:</span>
                <span class="detail-value">${data.participantCount}</span>
            </div>
        </div>
        
        ${data.eventDescription ? `
        <div class="services-list">
            <h4>📝 Event Description</h4>
            <p>${data.eventDescription}</p>
        </div>
        ` : ''}
        
        
      `

      await this.transporter.sendMail({
        from: `"S.M Seth Auditorium" <${process.env.EMAIL_FROM || 'noreply@poornima.org'}>`,
        to: 'smsethaudi@poornima.org',
        subject: `New Internal Booking Request - Dr. SM Seth Auditorium`,
        html: this.getEmailTemplate(content)
      })

      return true
    } catch (error) {
      console.error('Error sending internal booking received email:', error)
      return false
    }
  }

  // External booking received email
  async sendExternalBookingReceived(data: BookingEmailData): Promise<boolean> {
    try {
      const duration = this.calculateDuration(data.startTime, data.endTime)
      
      const content = `
        <div class="greeting">Dear Sir/Madam,</div>
        
        <p>Your booking request for <strong>${data.eventName}</strong> has been received by the management of Poornima Group of Colleges.</p>
        
        <div class="booking-details">
            <h3>📋 Booking Details <span class="status-badge status-received">Request Received</span></h3>
            <p><strong>Dr. SM Seth Auditorium, Poornima Group, PIET Campus, ISI-2, RIICO Institutional Area, Sitapura, Jaipur - 302022</strong></p>
            <div class="detail-row">
                <span class="detail-label">📆 Date:</span>
                <span class="detail-value">${this.formatDate(data.startTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🕒 Time (From):</span>
                <span class="detail-value">${this.formatTime(data.startTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🕒 Time (To):</span>
                <span class="detail-value">${this.formatTime(data.endTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">⏱️ Total Duration:</span>
                <span class="detail-value">${duration} hours</span>
            </div>
        </div>
        
        <p>Our team will review your request and get back to you shortly.</p>
        
        <div class="contact-info">
            <h4>📞 Contact Information</h4>
            <div class="contact-item"><strong>Puran Yogi</strong></div>
            <div class="contact-item">Auditorium Incharge</div>
            <div class="contact-item">📱 Contact: 9929002075</div>
            <div class="contact-item">📧 Email: smsethaudi@poornima.org</div>
        </div>
      `

      await this.transporter.sendMail({
        from: `"S.M Seth Auditorium" <${process.env.EMAIL_FROM || 'noreply@poornima.org'}>`,
        to: data.userEmail,
        cc: 'smsethaudi@poornima.org',
        subject: `Booking Request Received - Dr. SM Seth Auditorium`,
        html: this.getEmailTemplate(content)
      })

      return true
    } catch (error) {
      console.error('Error sending external booking received email:', error)
      return false
    }
  }

  // External booking partially approved
  async sendExternalPartiallyApproved(data: BookingEmailData): Promise<boolean> {
    try {
      const duration = this.calculateDuration(data.startTime, data.endTime)
      
      const content = `
        <div class="greeting">Dear Sir/Madam,</div>
        
        <p>Your booking for <strong>${data.eventName}</strong> has been partially approved by the management of Poornima Group of Colleges.</p>
        
        <div class="booking-details">
            <h3>📋 Booking Details <span class="status-badge status-partial">Partially Approved</span></h3>
            <p><strong>Dr. SM Seth Auditorium, Poornima Group, PIET Campus, ISI-2, RIICO Institutional Area, Sitapura, Jaipur - 302022</strong></p>
            <div class="detail-row">
                <span class="detail-label">📆 Date:</span>
                <span class="detail-value">${this.formatDate(data.startTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🕒 Time (From):</span>
                <span class="detail-value">${this.formatTime(data.startTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🕒 Time (To):</span>
                <span class="detail-value">${this.formatTime(data.endTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">⏱️ Total Duration:</span>
                <span class="detail-value">${duration} hours</span>
            </div>
            ${data.totalAmount ? `
            <div class="detail-row">
                <span class="detail-label">💰 Amount Payable:</span>
                <span class="detail-value amount-highlight">₹${data.totalAmount.toLocaleString()}</span>
            </div>
            ` : ''}
        </div>
        
        ${data.externalServices && data.externalServices.length > 0 ? `
        <div class="services-list">
            <h4>✅ Services you selected:</h4>
            <ul>
                ${data.externalServices.map(service => `<li>${service}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        <div class="warning-box">
            <h4>💰 Payment Required</h4>
            <p>For payment contact <strong>Mr. Puran Yogi ASAP</strong></p>
        </div>
        
        <div class="contact-info">
            <h4>📞 Contact Information</h4>
            <div class="contact-item"><strong>Puran Yogi</strong></div>
            <div class="contact-item">Auditorium Incharge</div>
            <div class="contact-item">📱 Contact: 9929002075</div>
            <div class="contact-item">📧 Email: smsethaudi@poornima.org</div>
        </div>
      `

      await this.transporter.sendMail({
        from: `"S.M Seth Auditorium" <${process.env.EMAIL_FROM || 'noreply@poornima.org'}>`,
        to: data.userEmail,
        cc: 'smsethaudi@poornima.org',
        subject: `Booking Partially Approved - Dr. SM Seth Auditorium`,
        html: this.getEmailTemplate(content)
      })

      return true
    } catch (error) {
      console.error('Error sending external partially approved email:', error)
      return false
    }
  }

  // External booking fully approved
  async sendExternalApproved(data: BookingEmailData): Promise<boolean> {
    try {
      const duration = this.calculateDuration(data.startTime, data.endTime)
      
      const content = `
        <div class="greeting">Dear Sir/Madam,</div>
        
        <p>Your booking for <strong>${data.eventName}</strong> has been approved by the management of Poornima Group of Colleges.</p>
        
        <div class="booking-details">
            <h3>📋 Booking Details <span class="status-badge status-approved">Approved</span></h3>
            <p><strong>Dr. SM Seth Auditorium, Poornima Group, PIET Campus, ISI-2, RIICO Institutional Area, Sitapura, Jaipur - 302022</strong></p>
            <div class="detail-row">
                <span class="detail-label">📆 Date:</span>
                <span class="detail-value">${this.formatDate(data.startTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🕒 Time (From):</span>
                <span class="detail-value">${this.formatTime(data.startTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🕒 Time (To):</span>
                <span class="detail-value">${this.formatTime(data.endTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">⏱️ Total Duration:</span>
                <span class="detail-value">${duration} hours</span>
            </div>
        </div>
        
        <div class="services-list">
            <h4>✅ Following facilities will be provided by Poornima during your program:</h4>
            <ul>
                <li>Neat & clean AC Auditorium venue with installed facilities including light, sound & AV system</li>
                <li>Uninterrupted power supply during the program</li>
                <li>Two professionals to manage Light, Sound & AV</li>
                ${data.externalServices && data.externalServices.length > 0 ? 
                  `<li>And the approved services: ${data.externalServices.join(', ')}</li>` : ''}
            </ul>
        </div>
        
        <div class="warning-box">
            <h4>❌ Following facilities will not be provided by Poornima during your program:</h4>
            <ul style="list-style: none; padding-left: 0;">
                <li style="color: #721c24;">✗ Security</li>
                <li style="color: #721c24;">✗ Decoration</li>
                <li style="color: #721c24;">✗ Arranging Audience</li>
                <li style="color: #721c24;">✗ Anchors</li>
            </ul>
        </div>
        
        <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>⏰ Important:</strong> Kindly arrive at the venue at least 2 hours prior to the event and take over the venue.</p>
            <p><strong>📱 QR Code:</strong> Your booking verification QR code is attached to this email. Please save it and present it at the venue for verification.</p>
        </div>
        
        <div class="contact-info">
            <h4>📞 Contact Information</h4>
            <div class="contact-item"><strong>Puran Yogi</strong></div>
            <div class="contact-item">Auditorium Incharge</div>
            <div class="contact-item">📱 Contact: 9929002075</div>
            <div class="contact-item">📧 Email: smsethaudi@poornima.org</div>
        </div>
      `

      // Generate QR code for the approved booking
      const qrCodeBuffer = await this.generateQRCode(data)

      await this.transporter.sendMail({
        from: `"S.M Seth Auditorium" <${process.env.EMAIL_FROM || 'noreply@poornima.org'}>`,
        to: data.userEmail,
        cc: 'smsethaudi@poornima.org',
        subject: `Booking Approved - Dr. SM Seth Auditorium`,
        html: this.getEmailTemplate(content),
        attachments: [
          {
            filename: `Auditorium-Booking-QR-${data.bookingId}.png`,
            content: qrCodeBuffer,
            contentType: 'image/png'
          }
        ]
      })

      return true
    } catch (error) {
      console.error('Error sending external approved email:', error)
      return false
    }
  }

  // Admin cancelled booking
  async sendAdminCancelled(data: BookingEmailData): Promise<boolean> {
    try {
      const duration = this.calculateDuration(data.startTime, data.endTime)
      
      const content = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #721c24; font-size: 24px;">🚫 Booking Cancelled by Admin</h2>
        </div>
        
        <p>We regret to inform you that your booking has been cancelled by the administration.</p>
        
        <div class="booking-details">
            <h3>📋 Cancelled Booking Details <span class="status-badge status-cancelled">Cancelled</span></h3>
            <div class="detail-row">
                <span class="detail-label">📅 Event Name:</span>
                <span class="detail-value">${data.eventName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📝 Event Type:</span>
                <span class="detail-value">${data.eventType}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📆 Date:</span>
                <span class="detail-value">${this.formatDate(data.startTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🕒 Time:</span>
                <span class="detail-value">${this.formatTime(data.startTime)} - ${this.formatTime(data.endTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">⏱️ Duration:</span>
                <span class="detail-value">${duration} hours</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">👥 Attendees:</span>
                <span class="detail-value">${data.participantCount}</span>
            </div>
        </div>
        
        ${data.cancellationReason ? `
        <div class="warning-box">
            <h4>📝 Cancellation Reason</h4>
            <p>${data.cancellationReason}</p>
        </div>
        ` : ''}
        
        <div class="services-list">
            <h4>❗ Important Information</h4>
            <ul>
                <li>This cancellation was initiated by the administration</li>
                <li>If you have any questions regarding this cancellation, please contact the administration office</li>
                <li>You may submit a new booking request for alternative dates and times</li>
            </ul>
        </div>
        
        <div class="contact-info">
            <h4>📞 Need Help?</h4>
            <div class="contact-item">If you have any questions or need assistance with rebooking:</div>
            <div class="contact-item">📧 Email: smsethaudi@poornima.org</div>
            <div class="contact-item">📞 Contact: +91 9929002075</div>
        </div>
        
        <p style="margin-top: 20px;">Thank you for your understanding.</p>
      `

      await this.transporter.sendMail({
        from: `"S.M Seth Auditorium" <${process.env.EMAIL_FROM || 'noreply@poornima.org'}>`,
        to: data.userEmail,
        cc: 'smsethaudi@poornima.org',
        subject: `Booking Cancelled - Dr. SM Seth Auditorium`,
        html: this.getEmailTemplate(content)
      })

      return true
    } catch (error) {
      console.error('Error sending admin cancelled email:', error)
      return false
    }
  }

  // User cancelled booking
  async sendUserCancelled(data: BookingEmailData): Promise<boolean> {
    try {
      const duration = this.calculateDuration(data.startTime, data.endTime)
      
      const content = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #856404; font-size: 24px;">📋 Booking Cancellation Confirmation</h2>
        </div>
        
        <div class="greeting">Dear ${data.userName},</div>
        
        <p>We have received your request to cancel the following booking. Your cancellation has been processed successfully.</p>
        
        <div class="booking-details">
            <h3>📋 Cancelled Booking Details <span class="status-badge status-cancelled">User Cancelled</span></h3>
            <div class="detail-row">
                <span class="detail-label">📅 Event Name:</span>
                <span class="detail-value">${data.eventName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📝 Event Type:</span>
                <span class="detail-value">${data.eventType}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📆 Date:</span>
                <span class="detail-value">${this.formatDate(data.startTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🕒 Time:</span>
                <span class="detail-value">${this.formatTime(data.startTime)} - ${this.formatTime(data.endTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">⏱️ Duration:</span>
                <span class="detail-value">${duration} hours</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">👥 Attendees:</span>
                <span class="detail-value">${data.participantCount}</span>
            </div>
        </div>
        
        ${data.cancellationReason ? `
        <div class="services-list">
            <h4>📝 Cancellation Reason</h4>
            <p>${data.cancellationReason}</p>
        </div>
        ` : ''}
        
        <div class="services-list">
            <h4>📌 What's Next?</h4>
            <ul>
                <li>Your booking slot has been made available for other users</li>
                <li>You can submit a new booking request anytime for different dates</li>
                <li>No further action is required from your side</li>
            </ul>
        </div>
        
        <div class="contact-info">
            <h4>📞 Contact Information</h4>
            <div class="contact-item">If you need assistance with future bookings:</div>
            <div class="contact-item"><strong>Puran Yogi</strong></div>
            <div class="contact-item">Auditorium Incharge</div>
            <div class="contact-item">📱 Contact: 9929002075</div>
            <div class="contact-item">📧 Email: smsethaudi@poornima.org</div>
        </div>
        
        <p style="margin-top: 20px;">Thank you for using our booking system.</p>
      `

      await this.transporter.sendMail({
        from: `"S.M Seth Auditorium" <${process.env.EMAIL_FROM || 'noreply@poornima.org'}>`,
        to: data.userEmail,
        cc: 'smsethaudi@poornima.org',
        subject: `Booking Cancellation Confirmed - Dr. SM Seth Auditorium`,
        html: this.getEmailTemplate(content)
      })

      return true
    } catch (error) {
      console.error('Error sending user cancelled email:', error)
      return false
    }
  }

  // Internal booking approved
  async sendInternalApproved(data: BookingEmailData): Promise<boolean> {
    try {
      const duration = this.calculateDuration(data.startTime, data.endTime)
      
      const content = `
        <div class="greeting">Dear ${data.userName},</div>
        
        <p>Great news! Your booking for <strong>${data.eventName}</strong> has been approved.</p>
        
        <div class="booking-details">
            <h3>📋 Approved Booking Details <span class="status-badge status-approved">Approved</span></h3>
            <div class="detail-row">
                <span class="detail-label">📅 Event Name:</span>
                <span class="detail-value">${data.eventName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📝 Event Type:</span>
                <span class="detail-value">${data.eventType}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">📆 Date:</span>
                <span class="detail-value">${this.formatDate(data.startTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">🕒 Time:</span>
                <span class="detail-value">${this.formatTime(data.startTime)} - ${this.formatTime(data.endTime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">⏱️ Duration:</span>
                <span class="detail-value">${duration} hours</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">👥 Attendees:</span>
                <span class="detail-value">${data.participantCount}</span>
            </div>
        </div>
        
        <div class="services-list">
            <h4>📋 Next Steps</h4>
            <ul>
                <li>Your QR code is attached to this email for verification</li>
                <li>Save the QR code and present it on the event day</li>
                <li>The QR code is also available in your dashboard</li>
                <li>Arrive at least 30 minutes before your scheduled time</li>
            </ul>
        </div>
        
        <div class="contact-info">
            <h4>📞 Contact Information</h4>
            <div class="contact-item">For any queries:</div>
            <div class="contact-item"><strong>Puran Yogi</strong></div>
            <div class="contact-item">Auditorium Incharge</div>
            <div class="contact-item">📱 Contact: 9929002075</div>
            <div class="contact-item">📧 Email: smsethaudi@poornima.org</div>
        </div>
      `

      // Generate QR code for the approved booking
      const qrCodeBuffer = await this.generateQRCode(data)

      await this.transporter.sendMail({
        from: `"S.M Seth Auditorium" <${process.env.EMAIL_FROM || 'noreply@poornima.org'}>`,
        to: data.userEmail,
        cc: 'smsethaudi@poornima.org',
        subject: `Booking Approved - Dr. SM Seth Auditorium`,
        html: this.getEmailTemplate(content),
        attachments: [
          {
            filename: `Auditorium-Booking-QR-${data.bookingId}.png`,
            content: qrCodeBuffer,
            contentType: 'image/png'
          }
        ]
      })

      return true
    } catch (error) {
      console.error('Error sending internal approved email:', error)
      return false
    }
  }
}

export default EmailService