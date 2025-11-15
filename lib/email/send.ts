"use server"

import { getResend } from "./resend"
import { WelcomeEmail } from "@/emails/welcome"
import { SubscriptionConfirmation } from "@/emails/subscription-confirmation"
import PasswordResetEmail from "@/emails/password-reset"
import UsageWarningEmail from "@/emails/usage-warning"
import { devLog, errorLog } from "@/lib/logger"

// Use the verified Resend subdomain. If you verified `noreply.outbound.ing`,
// the From address must be something@noreply.outbound.ing to pass DMARC.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Outbounding <noreply@noreply.outbound.ing>"
const REPLY_TO = process.env.RESEND_REPLY_TO_EMAIL || "support@outbound.ing"

export async function sendWelcomeEmail(email: string, firstName: string) {
  try {
    const resend = getResend()
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to Outbounding! 🎉",
      react: WelcomeEmail({ firstName, email }),
  replyTo: REPLY_TO,
    })

    if (error) {
      errorLog("[Email] Failed to send welcome email:", error)
      return { success: false, error }
    }

    devLog("[Email] Welcome email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    errorLog("[Email] Error sending welcome email:", error)
    return { success: false, error }
  }
}

export async function sendSubscriptionConfirmationEmail(
  email: string,
  firstName: string,
  planName: string,
  planPrice: string,
  billingCycle: "monthly" | "annual",
  emailLimit: string
) {
  try {
    const resend = getResend()
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your ${planName} subscription is confirmed!`,
      react: SubscriptionConfirmation({
        firstName,
        planName,
        planPrice,
        billingCycle,
        emailLimit,
      }),
  replyTo: REPLY_TO,
    })

    if (error) {
      errorLog("[Email] Failed to send subscription confirmation:", error)
      return { success: false, error }
    }

    devLog("[Email] Subscription confirmation sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    errorLog("[Email] Error sending subscription confirmation:", error)
    return { success: false, error }
  }
}

export async function sendSubscriptionCancelledEmail(
  email: string,
  firstName: string,
  planName: string,
  endDate: string
) {
  try {
    const resend = getResend()
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Your subscription has been cancelled",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a1a1a; font-size: 28px;">Subscription Cancelled</h1>
          <p style="color: #484848; font-size: 16px; line-height: 26px;">Hi ${firstName},</p>
          <p style="color: #484848; font-size: 16px; line-height: 26px;">
            Your ${planName} subscription has been cancelled. You'll continue to have access to your plan until <strong>${endDate}</strong>.
          </p>
          <p style="color: #484848; font-size: 16px; line-height: 26px;">
            After that, your account will revert to the Free plan with 30 emails per month.
          </p>
          <p style="color: #484848; font-size: 16px; line-height: 26px;">
            We're sorry to see you go! If you change your mind, you can always resubscribe from your 
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://outbound.ing'}/upgrade" style="color: #000; text-decoration: underline;">upgrade page</a>.
          </p>
          <p style="color: #484848; font-size: 16px; line-height: 26px; margin-top: 40px;">
            Thanks for using Outbounding!<br/>
            The Outbounding Team
          </p>
        </div>
      `,
  replyTo: REPLY_TO,
    })

    if (error) {
      errorLog("[Email] Failed to send cancellation email:", error)
      return { success: false, error }
    }

    devLog("[Email] Cancellation email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    errorLog("[Email] Error sending cancellation email:", error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  try {
    const resend = getResend()
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your password - Outbounding",
      react: PasswordResetEmail({ userEmail: email, resetLink }),
  replyTo: REPLY_TO,
    })

    if (error) {
      errorLog("[Email] Failed to send password reset email:", error)
      return { success: false, error }
    }

    devLog("[Email] Password reset email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    errorLog("[Email] Error sending password reset email:", error)
    return { success: false, error }
  }
}

export async function sendUsageWarningEmail(
  email: string,
  userName: string | undefined,
  usageCount: number,
  limitCount: number,
  percentage: number,
  tier: string
) {
  try {
    const resend = getResend()
    
    const isAtLimit = percentage >= 100
    const subject = isAtLimit 
      ? "You've reached your monthly limit - Outbounding"
      : "You're running low on credits - Outbounding"
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      react: UsageWarningEmail({
        userName,
        usageCount,
        limitCount,
        percentage,
        tier,
      }),
  replyTo: REPLY_TO,
    })

    if (error) {
      errorLog("[Email] Failed to send usage warning email:", error)
      return { success: false, error }
    }

    devLog("[Email] Usage warning email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    errorLog("[Email] Error sending usage warning email:", error)
    return { success: false, error }
  }
}

export async function sendAdminReplyEmail(email: string, replyMessage: string) {
  try {
    const resend = getResend()

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Support Reply - Outbounding",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a1a1a; font-size: 28px;">Support Reply</h1>
          <p style="color: #484848; font-size: 16px; line-height: 26px;">Hi there,</p>
          <p style="color: #484848; font-size: 16px; line-height: 26px;">
            We've received your support message and here's our response:
          </p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1a1a1a; font-size: 16px; line-height: 26px; margin: 0; white-space: pre-wrap;">${replyMessage.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="color: #484848; font-size: 16px; line-height: 26px;">
            If you have any additional questions or need further assistance, please don't hesitate to reply to this email.
          </p>
          <p style="color: #484848; font-size: 16px; line-height: 26px; margin-top: 40px;">
            Best regards,<br/>
            The Outbounding Support Team
          </p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0;">
          <p style="color: #888; font-size: 12px; line-height: 20px;">
            This is an automated response to your support inquiry. You can also reply directly to this email for further assistance.
          </p>
        </div>
      `,
      replyTo: REPLY_TO,
    })

    if (error) {
      errorLog("[Email] Failed to send admin reply email:", error)
      return { success: false, error }
    }

    devLog("[Email] Admin reply email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    errorLog("[Email] Error sending admin reply email:", error)
    return { success: false, error }
  }
}

export async function sendAccountDeletionEmail(email: string, firstName?: string) {
  try {
    const resend = getResend()

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Your Outbounding account has been deleted",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a1a1a; font-size: 28px;">Account Deleted</h1>
          <p style="color: #484848; font-size: 16px; line-height: 26px;">Hi ${firstName || "there"},</p>
          <p style="color: #484848; font-size: 16px; line-height: 26px;">
            This is a confirmation that your Outbounding account and all associated data have been permanently deleted from our systems. If you did not request this deletion, please contact our support team immediately.
          </p>
          <p style="color: #484848; font-size: 16px; line-height: 26px; margin-top: 20px;">
            If you change your mind, you can create a new account at <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://outbound.ing'}" style="color: #000; text-decoration: underline;">${process.env.NEXT_PUBLIC_SITE_URL || 'https://outbound.ing'}</a>.
          </p>
          <p style="color: #484848; font-size: 16px; line-height: 26px; margin-top: 40px;">
            Thanks for having used Outbounding.<br/>
            The Outbounding Team
          </p>
        </div>
      `,
      replyTo: REPLY_TO,
    })

    if (error) {
      errorLog("[Email] Failed to send account deletion confirmation:", error)
      return { success: false, error }
    }

    devLog("[Email] Account deletion confirmation sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    errorLog("[Email] Error sending account deletion confirmation:", error)
    return { success: false, error }
  }
}
