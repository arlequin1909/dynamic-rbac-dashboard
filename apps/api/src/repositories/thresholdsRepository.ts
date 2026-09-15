const _DEFAULT_VOLATILITY_ALERT_PCT = 5;

export interface ThresholdsState {
  volatilityAlertPct: number;
}

let _state: ThresholdsState = { volatilityAlertPct: _DEFAULT_VOLATILITY_ALERT_PCT };

export const thresholdsRepository = {
  get(): ThresholdsState {
    const result = { ..._state };

    return result;
  },

  set(next: ThresholdsState): void {
    _state = { ...next };
  },
};
