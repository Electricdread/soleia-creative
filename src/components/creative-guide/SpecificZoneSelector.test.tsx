import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SpecificZoneSelector } from './SpecificZoneSelector';

describe('SpecificZoneSelector', () => {
  it('shows the selected zone view and included screens', () => {
    render(<SpecificZoneSelector />);

    fireEvent.click(screen.getByRole('tab', { name: /zone 2 outdoor/i }));

    expect(screen.getByRole('tab', { name: /zone 2 outdoor/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText(/zone 2 — outdoor sr and outdoor sl/i)).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Outdoor SR');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Outdoor SL');
  });

  it('supports arrow-key navigation between zones', () => {
    render(<SpecificZoneSelector />);

    const firstTab = screen.getByRole('tab', { name: /zone 1 main stage/i });
    fireEvent.keyDown(firstTab, { key: 'ArrowRight' });

    expect(screen.getByRole('tab', { name: /zone 2 outdoor/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText(/zone 2 — outdoor sr and outdoor sl/i)).toBeInTheDocument();
  });
});
