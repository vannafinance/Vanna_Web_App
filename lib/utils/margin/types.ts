export interface PoolTable {
  id: number;
  name: string;
  icon: string;
  supply: string;
  supplyAPY: string;
  borrowAPY: string;
  yourBalance: string;
  isActive?: boolean;
  version?: number;
  vToken: string;
}
