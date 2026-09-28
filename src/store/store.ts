import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import themeReducer from './themeSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export interface User {
  userName: string;
  roles: string[];   
}

interface UserState {
  user: User | null;
}

const initialState: UserState = {
  user: null,
};
