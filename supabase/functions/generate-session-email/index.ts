import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const type = url.searchParams.get('type') || 'creative'

  if (!token) {
    return new Response(JSON.stringify({ error: 'token is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let title = '', clientName = '', coverUrl = '', eventDate = '', pageUrl = ''
  const siteUrl = 'https://soleia-creativeteam.com'

  if (type === 'creative') {
    const { data } = await supabase
      .from('creative_sessions')
      .select('project_name, client_name, cover_images, event_date')
      .eq('token', token)
      .single()

    if (!data) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    title = data.project_name
    clientName = data.client_name
    eventDate = data.event_date || ''
    const covers = data.cover_images as any[]
    coverUrl = covers?.[0]?.url || ''
    pageUrl = `${siteUrl}/session/${token}`
  } else if (type === 'proposal') {
    const { data } = await supabase
      .from('proposals')
      .select('event_name, client_name, event_date')
      .eq('token', token)
      .single()

    if (!data) {
      return new Response(JSON.stringify({ error: 'Proposal not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    title = data.event_name
    clientName = data.client_name
    eventDate = data.event_date || ''
    pageUrl = `${siteUrl}/proposal/${token}`
  } else {
    const { data } = await supabase
      .from('client_links')
      .select('event_name, client_name, event_date')
      .eq('token', token)
      .single()

    if (!data) {
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    title = data.event_name
    clientName = data.client_name
    eventDate = data.event_date || ''
    pageUrl = `${siteUrl}/preview/${token}`
  }

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const formattedDate = eventDate
    ? new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  const typeLabel = type === 'creative' ? 'Creative Session' : type === 'proposal' ? 'Proposal' : 'Idea Session'
  const ctaLabel = type === 'creative' ? 'View Session' : type === 'proposal' ? 'View Proposal' : 'View Session'

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Gold Header Bar -->
<tr><td style="background:linear-gradient(135deg,#B8860B,#DAA520);height:6px;border-radius:4px 4px 0 0;"></td></tr>

<!-- Logo Area -->
<tr><td style="padding:30px 40px 20px;text-align:center;">
<span style="font-size:28px;font-weight:700;color:#B8860B;letter-spacing:2px;">SOLEIA</span>
<p style="margin:4px 0 0;font-size:11px;color:#8B6914;letter-spacing:3px;text-transform:uppercase;">Creative Team</p>
</td></tr>

${coverUrl ? `<!-- Cover Image -->
<tr><td style="padding:0 30px;">
<img src="${esc(coverUrl)}" alt="${esc(title)}" width="540" style="width:100%;max-width:540px;height:auto;border-radius:8px;display:block;" />
</td></tr>` : ''}

<!-- Content -->
<tr><td style="padding:30px 40px;">
<p style="margin:0 0 6px;font-size:11px;color:#B8860B;text-transform:uppercase;letter-spacing:2px;font-weight:600;">${esc(typeLabel)}</p>
<h1 style="margin:0 0 8px;font-size:24px;color:#1a1a1a;font-weight:700;line-height:1.3;">${esc(title)}</h1>
<p style="margin:0 0 4px;font-size:15px;color:#555555;">${esc(clientName)}</p>
${formattedDate ? `<p style="margin:0;font-size:13px;color:#888888;">${esc(formattedDate)}</p>` : ''}
</td></tr>

<!-- CTA Button -->
<tr><td style="padding:10px 40px 30px;" align="center">
<a href="${esc(pageUrl)}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#B8860B,#DAA520);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.5px;">${esc(ctaLabel)} →</a>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e8e0d0;margin:0;" /></td></tr>

<!-- Footer -->
<tr><td style="padding:24px 40px 30px;text-align:center;">
<p style="margin:0 0 6px;font-size:12px;color:#999999;">Soleia Creative Team</p>
<p style="margin:0;font-size:11px;color:#bbbbbb;">luisdreamslv@gmail.com</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  return new Response(JSON.stringify({ html, subject: `${typeLabel}: ${title} — ${clientName}` }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
