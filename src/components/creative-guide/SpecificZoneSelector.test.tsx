import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SpecificZoneSelector } from './SpecificZoneSelector';

describe('SpecificZoneSelector', () => {
  it('shows the selected zone image and included screens', () => {
    render(<SpecificZoneSelector />);

    fireEvent.click(screen.getByRole('tab', { name: /zone 4 outdoor/i }));

    expect(screen.getByRole('tab', { name: /zone 4 outdoor/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByAltText(/zone 4 beach club view/i)).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Outdoor SR');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Outdoor SL');
  });

  it('supports arrow-key navigation between zones', () => {
    render(<SpecificZoneSelector />);

    const firstTab = screen.getByRole('tab', { name: /zone 1 main stage/i });
    fireEvent.keyDown(firstTab, { key: 'ArrowRight' });

    expect(screen.getByRole('tab', { name: /zone 2 curves/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByAltText(/zone 2 interior view/i)).toBeInTheDocument();
  });
});
