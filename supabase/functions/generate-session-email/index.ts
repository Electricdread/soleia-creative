const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
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

  let title = '', clientName = '', coverUrl = '', eventDate = '', pageUrl = '', creativeCallUrl = '', driveFolderUrl = ''
  let scenario: 'pre_call_packet' | 'pre_packet_no_call' | 'direct_quote' = 'pre_call_packet'
  const siteUrl = 'https://soleiacreative.app'

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
    pageUrl = `${siteUrl}/creative/${token}`
  } else if (type === 'proposal') {
    const { data } = await supabase
      .from('proposals')
      .select('event_name, client_name, event_date, creative_call_url, drive_folder_url, is_pre_call_packet, proposal_scenario')
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
    creativeCallUrl = data.creative_call_url || ''
    driveFolderUrl = data.drive_folder_url || ''
    const rawScenario = (data as any).proposal_scenario
    if (rawScenario === 'pre_call_packet' || rawScenario === 'pre_packet_no_call' || rawScenario === 'direct_quote') {
      scenario = rawScenario
    } else {
      scenario = (data as any).is_pre_call_packet === false ? 'pre_packet_no_call' : 'pre_call_packet'
    }
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

  const logoUrl = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/email-assets/soleia-logo-color.png'

  let html: string

  if (type === 'proposal') {
    const isPreCallPacket = scenario === 'pre_call_packet'
    const isPrePacketNoCall = scenario === 'pre_packet_no_call'

    const headline = isPreCallPacket
      ? 'Your Proposal &amp; Pre-Call Packet'
      : isPrePacketNoCall
        ? 'Your Pre-Packet'
        : 'Your Proposal'

    const intro = isPreCallPacket
      ? `Ahead of our creative call, please take a few minutes to review the materials below. They&rsquo;ll get you acquainted with our process so we can hit the ground running on the call &mdash; choosing themes, line items, and content ideas for <strong style="color:#B8860B;">${esc(title)}</strong>.`
      : isPrePacketNoCall
        ? `Since you&rsquo;re providing your own mapped content for <strong style="color:#B8860B;">${esc(title)}</strong>, please review the menu of additional services below and follow the Content Delivery Guide when sending us your files. We&rsquo;ll handle loading, QC, and any add-ons you approve.`
        : `Please find your proposal for <strong style="color:#B8860B;">${esc(title)}</strong> below. Review the details and sign whenever you&rsquo;re ready.`

    const ctaLabel = isPreCallPacket ? 'Open Proposal &amp; Menu' : isPrePacketNoCall ? 'Open Pre-Packet &amp; Menu' : 'Open Proposal'

    const eventDetailsBlock = formattedDate ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 20px;">
              <tr><td style="background-color:#faf8f4;border-left:3px solid #B8860B;padding:16px 20px;">
                <p style="font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">Event Details</p>
                <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr><td style="padding:3px 0;font-size:14px;color:#666666;width:90px;">Event:</td><td style="padding:3px 0;font-size:14px;color:#333333;font-weight:600;">${esc(title)}</td></tr>
                  <tr><td style="padding:3px 0;font-size:14px;color:#666666;width:90px;">Date:</td><td style="padding:3px 0;font-size:14px;color:#333333;font-weight:600;">${esc(formattedDate)}</td></tr>
                </table>
              </td></tr>
            </table>` : ''

    const inclusionsBlock = `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 20px;">
              <tr><td style="background-color:#faf8f4;border-left:3px solid #B8860B;padding:16px 20px;">
                <p style="font-size:13px;font-weight:700;color:#B8860B;margin:0 0 8px;letter-spacing:1px;">INCLUDED IN YOUR VENUE CONTRACT</p>
                <p style="margin:0 0 4px;font-size:14px;color:#333333;line-height:1.6;">&bull; <strong>Up to 10 static logos</strong> &mdash; LED screens</p>
                <p style="margin:0;font-size:14px;color:#333333;line-height:1.6;">&bull; <strong>1 static logo</strong> &mdash; all TVs, Cabanas &amp; Bungalows</p>
                <p style="margin:8px 0 0;font-size:11px;color:#999999;font-style:italic;">Standard inclusions — no charge. Items below are additional services.</p>
              </td></tr>
            </table>`

    const packetContentsBlock = isPreCallPacket ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 24px;">
              <tr><td style="background-color:#f9f9f9;padding:20px 24px;">
                <p style="font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">What's inside the packet:</p>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
                  <tr><td width="32" style="padding:6px 12px 6px 0;vertical-align:top;font-size:18px;">&#128221;</td><td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;"><strong>Line Item Menu</strong> &mdash; browse our full menu of additional services and pricing</td></tr>
                  <tr><td width="32" style="padding:6px 12px 6px 0;vertical-align:top;font-size:18px;">&#127916;</td><td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;"><strong><a href="https://soleiacreative.app/creative-guide#display-specs" target="_blank" style="color:#B8860B;text-decoration:underline;">Creative Guide &amp; AE Template</a></strong> &mdash; venue specs, LED zones, and downloadable After Effects project file</td></tr>
                  <tr><td width="32" style="padding:6px 12px 6px 0;vertical-align:top;font-size:18px;">&#128193;</td><td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;"><strong>Collect Assets folder</strong> &mdash; where you&rsquo;ll drop logos, references, brand assets</td></tr>
                  <tr><td width="32" style="padding:6px 12px 6px 0;vertical-align:top;font-size:18px;">&#128197;</td><td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;"><strong>Timeline</strong> &mdash; after sign-off + assets: 14 days to deliver, 3 days to review, 1 revision, final notes due 4 days before the event</td></tr>
                </table>
              </td></tr>
            </table>` : ''

    const sendUsContentBlock = isPrePacketNoCall ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 24px;">
              <tr><td style="background-color:#f9f9f9;padding:20px 24px;">
                <p style="font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">Send us your content:</p>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
                  <tr><td width="32" style="padding:6px 12px 6px 0;vertical-align:top;font-size:18px;">&#127916;</td><td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;"><strong><a href="https://soleiacreative.app/delivery-guide" target="_blank" style="color:#B8860B;text-decoration:underline;">Content Delivery Guide</a></strong> &mdash; DXV3 encoding spec, resolutions per zone, and how to package your files</td></tr>
                  ${driveFolderUrl ? `<tr><td width="32" style="padding:6px 12px 6px 0;vertical-align:top;font-size:18px;">&#128193;</td><td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;"><strong><a href="${esc(driveFolderUrl)}" target="_blank" style="color:#B8860B;text-decoration:underline;">Your Drive Folder</a></strong> &mdash; drop your mapped, encoded content here when it&rsquo;s ready</td></tr>` : `<tr><td width="32" style="padding:6px 12px 6px 0;vertical-align:top;font-size:18px;">&#128193;</td><td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;"><strong>Drive Folder</strong> &mdash; we&rsquo;ll share a folder for your final mapped content</td></tr>`}
                  <tr><td width="32" style="padding:6px 12px 6px 0;vertical-align:top;font-size:18px;">&#128221;</td><td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;"><strong>Additional Services Menu</strong> &mdash; select any extras (loading & QC, dynamic elevator, on-site op) from the proposal below</td></tr>
                </table>
              </td></tr>
            </table>` : ''

    const scheduleCallBlock = isPreCallPacket ? (creativeCallUrl ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr><td align="center" style="padding:0 0 12px;">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr><td style="background-color:#ffffff;border:1.5px solid #B8860B;border-radius:8px;padding:12px 32px;text-align:center;">
                    <a href="${esc(creativeCallUrl)}" target="_blank" style="display:inline-block;color:#B8860B;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">Schedule Our Creative Call &#8594;</a>
                  </td></tr>
                </table>
              </td></tr>
            </table>` : `<p style="font-size:13px;line-height:1.6;color:#888888;font-style:italic;text-align:center;margin:0 0 12px;">We'll reach out separately to schedule the creative call.</p>`) : ''

    const closingNote = isPreCallPacket
      ? `<p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 16px;">Once you&rsquo;ve had a chance to look through everything, we&rsquo;ll meet on the creative call to finalize themes, content, and the line items you&rsquo;d like to include. The on-page signature stays available for whenever you&rsquo;re ready to lock things in.</p>`
      : isPrePacketNoCall
        ? `<p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 16px;">When your content is ready, send it through using the Delivery Guide above. Approve the additional services you need on the proposal page and sign whenever you&rsquo;re ready.</p>`
        : ''

    html = `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;min-width:100%;border-collapse:collapse;background-color:#f3f1eb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <tr>
    <td align="center" style="padding:0;background-color:#f3f1eb;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e5e5e5;">
        <tr>
          <td style="background-color:#111111;padding:48px 24px;text-align:center;">
            <img src="${logoUrl}" alt="Soleia" width="180" style="display:block;height:60px;width:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px;background-color:#ffffff;">
            <h2 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">${headline}</h2>
            ${formattedDate ? `<p style="font-size:13px;color:#B8860B;margin:0 0 20px;letter-spacing:0.5px;font-weight:600;">${esc(formattedDate)}</p>` : '<div style="height:14px;"></div>'}
            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 20px;">Dear ${esc(clientName) || 'Valued Client'},</p>
            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 16px;">${intro}</p>
            ${eventDetailsBlock}
            ${inclusionsBlock}
            ${packetContentsBlock}
            ${sendUsContentBlock}
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr><td align="center" style="padding:8px 0 12px;">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr><td style="background-color:#B8860B;border-radius:8px;padding:14px 36px;text-align:center;">
                    <a href="${esc(pageUrl)}" target="_blank" style="display:inline-block;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">${ctaLabel} &#8594;</a>
                  </td></tr>
                </table>
              </td></tr>
            </table>
            ${scheduleCallBlock}
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:0 0 24px;text-align:center;">
                <p style="font-size:11px;color:#999999;margin:0 0 4px;">If the button above doesn't work, copy and paste this link into your browser:</p>
                <p style="font-size:11px;color:#B8860B;margin:0;word-break:break-all;">
                  <a href="${esc(pageUrl)}" style="color:#B8860B;text-decoration:underline;">${esc(pageUrl)}</a>
                </p>
                ${isPreCallPacket && creativeCallUrl ? `<p style="font-size:11px;color:#B8860B;margin:6px 0 0;word-break:break-all;"><a href="${esc(creativeCallUrl)}" style="color:#B8860B;text-decoration:underline;">${esc(creativeCallUrl)}</a></p>` : ''}
              </td></tr>
            </table>
            ${closingNote}
            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0;">Looking forward to creating something memorable together.</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#111111;padding:24px;text-align:center;">
            <img src="${logoUrl}" alt="Soleia" width="84" style="display:block;height:28px;width:auto;margin:0 auto 8px;border:0;opacity:0.85;outline:none;text-decoration:none;" />
            <p style="margin:0 0 4px;font-size:12px;color:#DAA520;letter-spacing:1px;">Creative Team</p>
            <p style="margin:0;font-size:12px;color:#888888;">
              <a href="mailto:luisdreamslv@gmail.com" style="color:#888888;text-decoration:none;">luisdreamslv@gmail.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
  } else {
    html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#B8860B,#DAA520);height:6px;border-radius:4px 4px 0 0;"></td></tr>
<tr><td style="padding:30px 40px 20px;text-align:center;">
<span style="font-size:28px;font-weight:700;color:#B8860B;letter-spacing:2px;">SOLEIA</span>
<p style="margin:4px 0 0;font-size:11px;color:#8B6914;letter-spacing:3px;text-transform:uppercase;">Creative Team</p>
</td></tr>
${coverUrl ? `<tr><td style="padding:0 30px;">
<img src="${esc(coverUrl)}" alt="${esc(title)}" width="540" style="width:100%;max-width:540px;height:auto;border-radius:8px;display:block;" />
</td></tr>` : ''}
<tr><td style="padding:30px 40px;">
<p style="margin:0 0 6px;font-size:11px;color:#B8860B;text-transform:uppercase;letter-spacing:2px;font-weight:600;">${esc(typeLabel)}</p>
<h1 style="margin:0 0 8px;font-size:24px;color:#1a1a1a;font-weight:700;line-height:1.3;">${esc(title)}</h1>
<p style="margin:0 0 4px;font-size:15px;color:#555555;">${esc(clientName)}</p>
${formattedDate ? `<p style="margin:0;font-size:13px;color:#888888;">${esc(formattedDate)}</p>` : ''}
</td></tr>
<tr><td style="padding:10px 40px 12px;" align="center">
<a href="${esc(pageUrl)}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#B8860B,#DAA520);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:6px;font-size:15px;font-weight:600;letter-spacing:0.5px;">${esc(ctaLabel)} &#8594;</a>
</td></tr>
<tr><td style="padding:0 40px 24px;text-align:center;">
<p style="font-size:11px;color:#999999;margin:0 0 4px;">If the button doesn't work, copy this link:</p>
<p style="font-size:11px;color:#B8860B;margin:0;word-break:break-all;">
<a href="${esc(pageUrl)}" style="color:#B8860B;text-decoration:underline;">${esc(pageUrl)}</a>
</p>
</td></tr>
<tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e8e0d0;margin:0;" /></td></tr>
<tr><td style="padding:24px 40px 30px;text-align:center;">
<p style="margin:0 0 6px;font-size:12px;color:#999999;">Soleia Creative Team</p>
<p style="margin:0;font-size:11px;color:#bbbbbb;">luisdreamslv@gmail.com</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
  }

  const proposalSubjectPrefix = scenario === 'pre_call_packet' ? 'Pre-Call Packet' : scenario === 'pre_packet_no_call' ? 'Pre-Packet' : 'Proposal'
  const subject = type === 'proposal'
    ? `${proposalSubjectPrefix}: ${title} — ${clientName}`
    : `${typeLabel}: ${title} — ${clientName}`
  return new Response(JSON.stringify({ html, subject }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
