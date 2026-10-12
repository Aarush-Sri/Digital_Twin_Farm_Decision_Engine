import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Full App UI Integration & Error Screen Detection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders the complete App without throwing runtime exceptions', async () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();

    // Verify Brand title is rendered
    expect(screen.getByText('GreenTwin')).toBeInTheDocument();

    // Verify main interactive buttons are present
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Preset Farm')).toBeInTheDocument();
    expect(screen.getByText(/⚡ Ask AI/)).toBeInTheDocument();

    // Verify Canvas is rendered
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('opens and closes Farm Profile Drawer without errors', async () => {
    render(<App />);

    const profileBtn = screen.getByText('Profile');
    fireEvent.click(profileBtn);

    // Profile drawer should open
    expect(await screen.findByText('Farm Profile')).toBeInTheDocument();
    expect(screen.getByText('Universal Config')).toBeInTheDocument();

    // Close drawer
    const closeBtn = screen.getByTitle('Close Drawer');
    fireEvent.click(closeBtn);
  });

  it('opens and closes Agent Chat Drawer without errors', async () => {
    render(<App />);

    const askAiBtn = screen.getByText(/⚡ Ask AI/);
    fireEvent.click(askAiBtn);

    // Agent chat drawer should open
    expect(await screen.findByText('AI Agronomist')).toBeInTheDocument();
    expect(screen.getByText('Simulation Panel')).toBeInTheDocument();

    // Close panel
    const closeBtn = screen.getByTitle('Close Panel');
    fireEvent.click(closeBtn);
  });
});
