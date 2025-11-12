"use server"

import { getResend } from "./resend"
import { WelcomeEmail } from "@/emails/welcome"
import { SubscriptionConfirmation } from "@/emails/subscription-confirmation"
import PasswordResetEmail from "@/emails/password-reset"
import UsageWarningEmail from "@/emails/usage-warning"
import { devLog, errorLog } from "@/lib/logger"

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Outbounding <noreply@outbound.ing>"

export async function sendWelcomeEmail(email: string, firstName: string) {
  try {
    const resend = getResend()
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to Outbounding! 🎉",
      react: WelcomeEmail({ firstName, email }),
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
