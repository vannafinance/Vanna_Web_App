export interface DropdownOptionsType {
    id:string,
    name:string,
    icon:string
}

export interface AssetAmount {
    asset: string;
    amount: string;
  }
  
  export interface BorrowInfo {
    assetData: AssetAmount;
    percentage: number;
    usdValue: number;
  }
  
export interface Position {
    positionId: number;
  
    collateral: AssetAmount;
    collateralUsdValue: number;
  
    borrowed: BorrowInfo[];
  
    leverage: number;
    interestAccrued: number;
  
    isOpen: boolean;
    user: string;
  }
  
  export type PositionsArray = Position[];

  export interface Collaterals{ 
    id?: string; // Optional for backward compatibility, will be generated if not provided
    asset:string,
    amount:number,
    amountInUsd:number,
    balanceType:string,
    unifiedBalance:number
  }
  