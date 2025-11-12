import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

interface SubscriptionConfirmationProps {
  firstName: string
  planName: string
  planPrice: string
  billingCycle: "monthly" | "annual"
  emailLimit: string
}

export const SubscriptionConfirmation = ({
  firstName,
  planName,
  planPrice,
  billingCycle,
  emailLimit,
}: SubscriptionConfirmationProps) => (
  <Html>
    <Head />
    <Preview>Your {planName} subscription is confirmed!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Subscription Confirmed! 🎉</Heading>
        
        <Text style={text}>Hi {firstName},</Text>
        
        <Text style={text}>
          Thank you for upgrading to <strong>{planName}</strong>! Your subscription is now active.
        </Text>
        
        <Section style={planContainer}>
          <Text style={planHeading}>Your Plan Details:</Text>
          <Text style={planDetail}><strong>Plan:</strong> {planName}</Text>
          <Text style={planDetail}><strong>Price:</strong> {planPrice} (billed {billingCycle})</Text>
          <Text style={planDetail}><strong>Email Limit:</strong> {emailLimit}</Text>
          <Text style={planDetail}><strong>Next Billing Date:</strong> {billingCycle === "monthly" ? "One month from today" : "One year from today"}</Text>
        </Section>
        
        <Section style={buttonContainer}>
          <Button style={button} href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://outbound.ing'}/generator`}>
            Start Generating Emails
          </Button>
        </Section>
        
        <Text style={text}>
          You can manage your subscription anytime from your{" "}
          <Link href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://outbound.ing'}/settings`} style={link}>
            account settings
          </Link>.
        </Text>
        
        <Text style={footer}>
          Thanks for choosing Outbounding!<br />
          The Outbounding Team
        </Text>
        
        <Text style={footerSmall}>
          Questions? Just reply to this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

SubscriptionConfirmation.PreviewProps = {
  firstName: "John",
  planName: "Pro",
  planPrice: "$39/month",
  billingCycle: "monthly",
  emailLimit: "Unlimited",
} as SubscriptionConfirmationProps

export default SubscriptionConfirmation

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  marginBottom: "64px",
  maxWidth: "600px",
  borderRadius: "8px",
}

const h1 = {
  color: "#1a1a1a",
  fontSize: "32px",
  fontWeight: "700",
  margin: "0 0 30px",
  padding: "0",
  lineHeight: "1.2",
}

const text = {
  color: "#484848",
  fontSize: "16px",
  lineHeight: "26px",
  marginBottom: "16px",
}

const planContainer = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
}

const planHeading = {
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
}

const planDetail = {
  color: "#484848",
  fontSize: "15px",
  lineHeight: "28px",
  margin: "0",
}

const buttonContainer = {
  margin: "32px 0",
  textAlign: "center" as const,
}

const button = {
  backgroundColor: "#000000",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
}

const link = {
  color: "#000000",
  textDecoration: "underline",
}

const footer = {
  color: "#484848",
  fontSize: "16px",
  lineHeight: "24px",
  marginTop: "40px",
  marginBottom: "8px",
}

const footerSmall = {
  color: "#898989",
  fontSize: "14px",
  lineHeight: "22px",
}
