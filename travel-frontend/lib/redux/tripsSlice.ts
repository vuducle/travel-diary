
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Trip {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  visibility: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
}

interface TripsState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
}

const initialState: TripsState = {
  trips: [],
  loading: false,
  error: null,
};

const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    setTrips: (state, action: PayloadAction<Trip[]>) => {
      state.trips = action.payload;
    },
  },
});

export const { setTrips } = tripsSlice.actions;
export default tripsSlice.reducer;
