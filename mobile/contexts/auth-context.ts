import axios from "@/api/axios";
import { setToken } from "@/services/auth-storage";
import { create } from "zustand";

interface User {
  name: string;
  email: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  getUser: () => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,

  getUser: async () => {
    try {
      const { data } = await axios.get("/user");
      set({ user: data });
    } catch (error) {
      console.log(error);
    }
  },

  login: async (data) => {
    try {
      const response = await axios.post("/login", data);
      await setToken(response.data.token);
      get().getUser();
    } catch (error) {
      console.log(error);
    }
  },

  logout: async () => {
    try {
      await axios.post("/logout");
      await setToken(null);
      set({ user: null });
    } catch (error) {
      console.log(error);
    }
  },
}));
