import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SessionState {
  showExpiryModal: boolean;
  expiryReason: 'expired' | 'logout' | null;
  expiredAt: number | null;
}

const initialState: SessionState = {
  showExpiryModal: false,
  expiryReason: null,
  expiredAt: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    triggerExpiry: (
      state,
      action: PayloadAction<{ reason: 'expired' | 'logout' }>
    ) => {
      state.showExpiryModal = true;
      state.expiryReason = action.payload.reason;
      state.expiredAt = Date.now();
    },
    hideExpiry: (state) => {
      state.showExpiryModal = false;
      state.expiryReason = null;
      state.expiredAt = null;
    },
  },
});

export const { triggerExpiry, hideExpiry } = sessionSlice.actions;
export default sessionSlice.reducer;
