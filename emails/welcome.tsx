import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

interface WelcomeEmailProps {
  firstName: string
  email: string
}

export const WelcomeEmail = ({ firstName, email }: WelcomeEmailProps) => (
    <Html>
      <Head />
      <Preview>Welcome to Outbounding - Start generating AI-powered cold emails!</Preview>
      <Body style={main}>
        <Container style={container}>
        <Heading style={h1}>Welcome to Outbounding! 🎉</Heading>        <Text style={text}>Hi {firstName},</Text>
        
        <Text style={text}>
          Thank you for signing up! You're now ready to create professional cold emails that get responses.
        </Text>
        
        <Section style={featuresContainer}>
          <Text style={featuresHeading}>What you can do now:</Text>
          <Text style={feature}>✓ Generate 30 emails per month (Free Plan)</Text>
          <Text style={feature}>✓ Access to free strategies across 9 industries</Text>
          <Text style={feature}>✓ Location-based business search (20 searches/month)</Text>
          <Text style={feature}>✓ Customize tone, length, and goals</Text>
          <Text style={feature}>✓ Save up to 50 contacts</Text>
          <Text style={feature}>✓ Save your emails in your archive</Text>
        </Section>
        
        <Section style={buttonContainer}>
          <Button style={button} href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.outbound.ing'}/dashboard`}>
            Go to Dashboard
          </Button>
        </Section>
        
        <Text style={text}>
          Want more? <Link href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.outbound.ing'}/upgrade`} style={link}>Upgrade to Light or Pro</Link> for unlimited strategies, more emails, and premium features.
        </Text>
        
        <Text style={footer}>
          Happy emailing!<br />
          The Outbounding Team
        </Text>
        
        <Text style={footerSmall}>
          If you have any questions, just reply to this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

WelcomeEmail.PreviewProps = {
  firstName: "John",
  email: "john@example.com",
} as WelcomeEmailProps

export default WelcomeEmail

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

const featuresContainer = {
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
}

const featuresHeading = {
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
}

const feature = {
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
