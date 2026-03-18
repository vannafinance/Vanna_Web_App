import createNewStore from "@/zustand/index";

// Types
export interface User {
  address: string | null;
  privyUserId: string | null;
  authMethod: "email" | "google" | "twitter" | "apple" | "wallet" | null;
  email: string | null;
}

// Initial State
const initialState: User = {
  address: null,
  privyUserId: null,
  authMethod: null,
  email: null,
};

// Export Store
export const useUserStore = createNewStore(initialState, {
  name: "user-store",
  devTools: true,
  persist: true,
});
