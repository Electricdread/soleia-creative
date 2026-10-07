import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CreativeSessionCover } from './CreativeSessionCover';

// West of UTC, where new Date('2026-10-19') is still Oct 18 local time.
process.env.TZ = 'America/Los_Angeles';

const session = {
  project_name: '10.19.26 MRI Software',
  client_name: 'MRI',
  // The row's created_at. The header must never show it.
  created_at: '2026-08-19T17:02:11.000Z',
};

describe('CreativeSessionCover', () => {
  it('runs west of UTC, where the old parse slipped a day', () => {
    expect(new Date('2026-10-19').getDate()).toBe(18);
  });

  it('shows the event date as its calendar day', () => {
    render(<CreativeSessionCover session={{ ...session, event_date: '2026-10-19' }} />);

    expect(screen.getByText('Oct 19, 2026')).toBeInTheDocument();
    expect(screen.queryByText('Aug 19, 2026')).not.toBeInTheDocument();
  });

  it('shows no date rather than the creation date when there is no event date', () => {
    render(<CreativeSessionCover session={{ ...session, event_date: null }} />);

    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });
});
