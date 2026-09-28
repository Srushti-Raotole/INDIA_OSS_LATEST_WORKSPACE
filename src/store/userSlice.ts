import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  userId: number;
  userName: string;
  role: "ADMIN_USER" | "NOC_USER" | "VIDEO_USER";
  status: string;
}

interface UserState {
  user: User | null;
}

const initialState: UserState = {
  user: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
