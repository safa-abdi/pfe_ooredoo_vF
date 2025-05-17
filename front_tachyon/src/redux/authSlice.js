import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: null,
    role: null,
    user: null,
  },
  reducers: {
    loginSuccess(state, action) {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.user = action.payload.user;
    },
    logout(state) {
      state.token = null;
      state.role = null;
      state.user = null;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;