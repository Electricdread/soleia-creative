/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

const LOGO_URL = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/email-assets/soleia-logo-black.png'

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="160" alt="Soleia" style={logo} />
        </Section>
        <Hr style={goldBar} />
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password for {siteName}. Click the button below to choose a new password.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Reset Password
          </Button>
        </Section>
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
        </Text>
        <Hr style={divider} />
        <Text style={signature}>— The Soleia Creative Team</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const logoSection = { textAlign: 'center' as const, padding: '8px 0 20px' }
const logo = { margin: '0 auto' }
const goldBar = { borderTop: '2px solid #c49a3c', borderBottom: 'none', margin: '0 0 28px' }
const h1 = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '26px',
  fontWeight: 'normal' as const,
  color: '#1a1a1a',
  margin: '0 0 20px',
  letterSpacing: '-0.3px',
}
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 18px' }
const buttonSection = { textAlign: 'center' as const, margin: '32px 0' }
const button = {
  backgroundColor: '#1a1a1a',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '4px',
  padding: '14px 32px',
  textDecoration: 'none',
  letterSpacing: '0.5px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
}
const footer = { fontSize: '13px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }
const divider = { borderTop: '1px solid #eeeeee', borderBottom: 'none', margin: '32px 0 16px' }
const signature = { fontSize: '12px', color: '#c49a3c', margin: '0', letterSpacing: '0.5px', fontStyle: 'italic' as const }
