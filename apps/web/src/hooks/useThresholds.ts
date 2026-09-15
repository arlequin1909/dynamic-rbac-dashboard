import useSWR from 'swr';
import { apiClient } from '../lib/apiClient';

const _THRESHOLDS_PATH = '/api/thresholds';

export interface Thresholds {
  volatilityAlertPct: number;
}

async function fetchThresholds(path: string): Promise<Thresholds> {
  const response = await apiClient.get<{ data: Thresholds }>(path);
  const result = response.data;

  return result;
}

export function useThresholds() {
  const result = useSWR(_THRESHOLDS_PATH, fetchThresholds);

  return result;
}
