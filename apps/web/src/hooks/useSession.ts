import type { Role } from '@app/shared';
import useSWR from 'swr';
import { apiClient, ApiError } from '../lib/apiClient';

const _ME_PATH = '/api/auth/me';
const _UNAUTHORIZED_STATUS = 401;

export interface MeSession {
  role: Role;
}

async function fetchSession(path: string): Promise<MeSession | null> {
  let result: MeSession | null;

  try {
    result = await apiClient.get<MeSession>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === _UNAUTHORIZED_STATUS) {
      result = null;
    } else {
      throw error;
    }
  }

  return result;
}

export function useSession() {
  const { data, error, isLoading, mutate } = useSWR<MeSession | null>(_ME_PATH, fetchSession, {
    revalidateOnFocus: false,
  });

  const result = {
    session: data ?? null,
    error,
    isLoading,
    mutate,
  };

  return result;
}
