/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
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

interface ReauthenticationEmailProps {
  token: string
}

const LOGO_URL = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/email-assets/soleia-logo-black.png'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="160" alt="Soleia" style={logo} />
        </Section>
        <Hr style={goldBar} />
        <Heading style={h1}>Confirm reauthentication</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Section style={codeBox}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
        <Hr style={divider} />
        <Text style={signature}>— The Soleia Creative Team</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeBox = { textAlign: 'center' as const, margin: '24px 0', padding: '20px', backgroundColor: '#faf7f0', border: '1px solid #c49a3c', borderRadius: '4px' }
const codeStyle = {
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  margin: '0',
  letterSpacing: '6px',
}
const footer = { fontSize: '13px', color: '#888888', margin: '24px 0 0', lineHeight: '1.5' }
const divider = { borderTop: '1px solid #eeeeee', borderBottom: 'none', margin: '32px 0 16px' }
const signature = { fontSize: '12px', color: '#c49a3c', margin: '0', letterSpacing: '0.5px', fontStyle: 'italic' as const }
