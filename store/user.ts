import createNewStore from "@/zustand/index"

// Types
export interface User {
  address:string | null
}

// Initial State
const initialState: User = {
  address:null,
};

// Export Store
export const useUserStore = createNewStore(initialState, {
  name: "user-store",
  devTools: true,
  persist: true,
});

