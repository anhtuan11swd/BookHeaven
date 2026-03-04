import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoggedIn: false,
  role: "user",
};

const authSlice = createSlice({
  initialState,
  name: "auth",
  reducers: {
    changeRole: (state, action) => {
      state.role = action.payload;
    },
    login: (state) => {
      state.isLoggedIn = true;
    },
    logout: () => initialState,
  },
});

export const authActions = authSlice.actions;
export const authReducer = authSlice.reducer;
