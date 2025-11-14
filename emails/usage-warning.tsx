import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface UsageWarningEmailProps {
  userName?: string
  usageCount: number
  limitCount: number
  percentage: number
  tier: string
}

export default function UsageWarningEmail({ 
  userName, 
  usageCount, 
  limitCount, 
  percentage,
  tier 
}: UsageWarningEmailProps) {
  const isAtLimit = percentage >= 100
  
  return (
    <Html>
      <Head />
      <Preview>{isAtLimit ? "You've reached your monthly limit" : "You're running low on credits"} - Outbounding</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isAtLimit ? '🚨 Monthly Limit Reached' : '⚠️ Usage Warning'}
          </Heading>
          
          <Text style={text}>
            Hi {userName || 'there'},
          </Text>
          
          <Text style={text}>
            {isAtLimit 
              ? `You've used all ${limitCount} of your monthly email generations on your ${tier} plan.`
              : `You've used ${usageCount} out of ${limitCount} email generations (${percentage}% of your monthly limit).`
            }
          </Text>
          
          {!isAtLimit && (
            <Text style={text}>
              You have <strong>{limitCount - usageCount} generations remaining</strong> this month.
            </Text>
          )}
          
          {tier === 'free' && (
            <>
              <Text style={text}>
                <strong>Want unlimited email generations and business discovery?</strong>
              </Text>
              
              <Section style={benefitsList}>
                <Text style={benefitItem}>✅ Unlimited email generation</Text>
                <Text style={benefitItem}>✅ Unlimited location-based business search</Text>
                <Text style={benefitItem}>✅ A/B test variants (3 per email)</Text>
                <Text style={benefitItem}>✅ Multiple languages</Text>
                <Text style={benefitItem}>✅ Priority support</Text>
              </Section>
              
              <Section style={buttonContainer}>
                <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://outbound.ing'}/upgrade`}>
                  Upgrade to Pro - $29/month
                </Button>
              </Section>
            </>
          )}
          
          {tier === 'light' && (
            <>
              <Text style={text}>
                <strong>Need more generations and advanced features?</strong>
              </Text>
              
              <Text style={text}>
                Upgrade to Pro for unlimited email generation, unlimited location-based business search, A/B testing, and multi-language support.
              </Text>
              
              <Section style={buttonContainer}>
                <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://outbound.ing'}/upgrade`}>
                  Upgrade to Pro - $29/month
                </Button>
              </Section>
            </>
          )}
          
          <Text style={footer}>
            Best regards,<br />
            The Outbounding Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 24px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 24px',
}

const benefitsList = {
  margin: '0 24px',
}

const benefitItem = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '32px',
  margin: '0',
}

const buttonContainer = {
  padding: '27px 24px',
}

const button = {
  backgroundColor: '#000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
}

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '24px',
  marginTop: '32px',
}
