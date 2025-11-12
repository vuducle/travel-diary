import { fr } from 'zod/locales';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Location {
  id: string;
  name: string;
  street: string | null;
  country: string;
  lat: number;
  lng: number;
  coverImage?: string;
  tripId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface LocationsState {
  locations: Location[];
  loading: boolean;
  error: string | null;
}

const initialState: LocationsState = {
  locations: [],
  loading: false,
  error: null,
};

const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    setLocations: (state, action: PayloadAction<Location[]>) => {
      state.locations = action.payload;
    },
  },
});

export const { setLocations } = locationsSlice.actions;
export default locationsSlice.reducer;
