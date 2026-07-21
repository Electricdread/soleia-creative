import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks --------------------------------------------------------------

const rpcMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: any[]) => rpcMock(...args),
    from: (...args: any[]) => fromMock(...args),
  },
}));

// Force logo fetch to fail so getSoleiaLogoDataUri returns null (skip image add).
beforeEach(() => {
  rpcMock.mockReset();
  fromMock.mockReset();
  (global as any).fetch = vi.fn(() => Promise.reject(new Error('no network in test')));
});

// --- Helpers ------------------------------------------------------------

import { generateProposalPdf } from './proposalPdfGenerator';

const SAMPLE_TEMPLATES = [
  {
    id: '1',
    title: 'Custom Motion Graphics',
    price: 1500,
    category: 'Motion Design',
    long_description: 'Bespoke motion graphics tailored to your brand.',
    deliverables: ['1 hero loop', '3 accent loops'],
    ideal_for: 'Brand launches',
    sort_order: 1,
  },
  {
    id: '2',
    title: 'Video Mapping Content',
    price: 2500,
    category: 'Video Mapping',
    long_description: 'Content designed to wrap the venue LED surfaces.',
    deliverables: ['Master render', 'Backup loop'],
    ideal_for: 'Immersive activations',
    sort_order: 1,
  },
  {
    id: '3',
    title: 'On-Site Load Fee',
    price: 800,
    category: 'Video Mapping',
    sort_order: 2,
  },
];

const SAMPLE_CATEGORIES = [
  { name: 'Motion Design', intro: 'Bespoke motion built for the room.', sort_order: 1 },
  { name: 'Video Mapping', intro: 'Full-surface immersive content.', sort_order: 2 },
];

const PROPOSAL = {
  event_name: 'Test Event',
  client_name: 'Test Client',
  signed_at: '2026-07-21T12:00:00Z',
  client_signature: 'Test Client',
  status: 'accepted',
};

const ITEMS = [
  { title: 'Creative Package', price: 3000, quantity: 1, client_selected: true, is_flat_fee: true },
];

// Count PDF pages by parsing the raw PDF bytes.
function countPdfPages(base64: string): number {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const raw = new TextDecoder('latin1').decode(bytes);
  // Match "/Type /Page" but NOT "/Type /Pages"
  const matches = raw.match(/\/Type\s*\/Page(?![s\/A-Za-z])/g);
  return matches ? matches.length : 0;
}

async function generate(): Promise<{ base64: string; pages: number }> {
  const res = await generateProposalPdf(
    PROPOSAL as any,
    ITEMS as any,
    [],
    null,
    [],
    { returnBase64: true }
  );
  return { base64: res.base64, pages: countPdfPages(res.base64) };
}

// --- Tests --------------------------------------------------------------

describe('signed proposal PDF — About Our Services appendix', () => {
  it('baseline: no appendix when both RPC and table fallback return empty', async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    fromMock.mockReturnValue({
      select: () => Promise.resolve({ data: [], error: null }),
    });

    const { pages } = await generate();
    // Base signed proposal (no cover, no gallery) is a single content page.
    expect(pages).toBe(1);
  });

  it('client (anon) session: appendix renders from SECURITY DEFINER RPCs', async () => {
    rpcMock.mockImplementation((name: string) => {
      if (name === 'get_rate_card_addons') {
        return Promise.resolve({ data: SAMPLE_TEMPLATES, error: null });
      }
      if (name === 'get_rate_card_categories') {
        return Promise.resolve({ data: SAMPLE_CATEGORIES, error: null });
      }
      return Promise.resolve({ data: [], error: null });
    });
    // Client session should NOT hit the fallback tables.
    fromMock.mockReturnValue({
      select: () => Promise.resolve({ data: [], error: { message: 'RLS' } }),
    });

    const { pages } = await generate();
    // 1 base + 1 chapter opener page per unique category (2) = 3 minimum.
    expect(pages).toBeGreaterThanOrEqual(3);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('admin session: appendix renders via table fallback when RPC returns empty', async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    fromMock.mockImplementation((table: string) => ({
      select: () =>
        Promise.resolve({
          data: table === 'line_item_templates' ? SAMPLE_TEMPLATES : SAMPLE_CATEGORIES,
          error: null,
        }),
    }));

    const { pages } = await generate();
    expect(pages).toBeGreaterThanOrEqual(3);
    expect(fromMock).toHaveBeenCalledWith('line_item_templates');
    expect(fromMock).toHaveBeenCalledWith('line_item_categories');
  });

  it('admin and client PDFs have the same appendix page count for identical data', async () => {
    // Client run
    rpcMock.mockImplementation((name: string) =>
      Promise.resolve({
        data: name === 'get_rate_card_addons' ? SAMPLE_TEMPLATES : SAMPLE_CATEGORIES,
        error: null,
      })
    );
    fromMock.mockReturnValue({ select: () => Promise.resolve({ data: [], error: null }) });
    const client = await generate();

    // Admin run (RPC empty, tables populated)
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ data: [], error: null });
    fromMock.mockReset();
    fromMock.mockImplementation((table: string) => ({
      select: () =>
        Promise.resolve({
          data: table === 'line_item_templates' ? SAMPLE_TEMPLATES : SAMPLE_CATEGORIES,
          error: null,
        }),
    }));
    const admin = await generate();

    expect(admin.pages).toBe(client.pages);
  });
});
