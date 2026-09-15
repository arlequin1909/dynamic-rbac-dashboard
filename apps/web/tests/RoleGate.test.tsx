import type { Permission, Role } from '@app/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RoleGate } from '../src/components/auth/RoleGate';
import { useSession } from '../src/hooks/useSession';

vi.mock('../src/hooks/useSession');

const mockedUseSession = vi.mocked(useSession);

const _REQUIRES: Permission[] = ['audit:read'];

function mockSession(role: Role | null, isLoading = false): void {
  mockedUseSession.mockReturnValue({
    session: role ? { role } : null,
    error: undefined,
    isLoading,
    mutate: vi.fn() as unknown as ReturnType<typeof useSession>['mutate'],
  });
}

describe('RoleGate', () => {
  it('does not render children when the role lacks the permission', () => {
    mockSession('viewer');

    render(
      <RoleGate requires={_REQUIRES}>
        <p>Secret content</p>
      </RoleGate>
    );

    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });

  it('renders children when the role has the permission', () => {
    mockSession('admin');

    render(
      <RoleGate requires={_REQUIRES}>
        <p>Secret content</p>
      </RoleGate>
    );

    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });

  it('renders the fallback when the role lacks the permission', () => {
    mockSession('trader');

    render(
      <RoleGate requires={_REQUIRES} fallback={<p>Not allowed</p>}>
        <p>Secret content</p>
      </RoleGate>
    );

    expect(screen.getByText('Not allowed')).toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });

  it('renders nothing (no fallback either) while the session is loading', () => {
    mockSession(null, true);

    const { container } = render(
      <RoleGate requires={_REQUIRES} fallback={<p>Not allowed</p>}>
        <p>Secret content</p>
      </RoleGate>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the fallback when there is no session', () => {
    mockSession(null, false);

    render(
      <RoleGate requires={_REQUIRES} fallback={<p>Not allowed</p>}>
        <p>Secret content</p>
      </RoleGate>
    );

    expect(screen.getByText('Not allowed')).toBeInTheDocument();
  });

  it('renders a retry-able error state (not the fallback) when the session check fails', () => {
    mockedUseSession.mockReturnValue({
      session: null,
      error: new Error('network error'),
      isLoading: false,
      mutate: vi.fn() as unknown as ReturnType<typeof useSession>['mutate'],
    });

    render(
      <RoleGate requires={_REQUIRES} fallback={<p>Not allowed</p>}>
        <p>Secret content</p>
      </RoleGate>
    );

    expect(screen.queryByText('Not allowed')).not.toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
