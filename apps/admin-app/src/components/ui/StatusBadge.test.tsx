import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderStatusBadge } from './StatusBadge';
import React from 'react';

describe('OrderStatusBadge', () => {
  it('renders correctly for pending status', () => {
    render(<OrderStatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
