// Chains supported as Nexus bridge SOURCE chains (funds can come FROM these)
export const SUPPORTED_CHAIN_IDS = [8453, 42161, 10, 1, 137]; // Base, Arbitrum, Optimism, Ethereum, Polygon

// The chain where the app's contracts are deployed (trading/margin is Base only)
export const APP_CHAIN_ID = 8453;

export const SUPPORTED_CHAIN_NAMES: Record<number, string> = {
    1: "Ethereum",
    10: "Optimism",
    137: "Polygon",
    8453: "Base",
    42161: "Arbitrum",
}






