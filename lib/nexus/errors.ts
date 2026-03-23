import { NexusError, ERROR_CODES } from "@avail-project/nexus-core";

export function getReadableNexusError(err: unknown): string {
  if (err instanceof NexusError) {
    switch (err.code) {
      case ERROR_CODES.USER_DENIED_INTENT:
      case ERROR_CODES.USER_DENIED_ALLOWANCE:
      case ERROR_CODES.USER_DENIED_INTENT_SIGNATURE:
        return "Transaction cancelled by user";
      case ERROR_CODES.INSUFFICIENT_BALANCE:
        return "Insufficient balance across chains";
      case ERROR_CODES.SLIPPAGE_EXCEEDED_ALLOWANCE:
      case ERROR_CODES.RATES_CHANGED_BEYOND_TOLERANCE:
        return "Price changed too much. Please try again.";
      case ERROR_CODES.TRANSACTION_TIMEOUT:
      case ERROR_CODES.LIQUIDITY_TIMEOUT:
        return "Transaction timed out. Please retry.";
      case ERROR_CODES.TOKEN_NOT_SUPPORTED:
        return "Token not supported on this chain";
      case ERROR_CODES.CHAIN_NOT_FOUND:
        return "Chain not supported";
      case ERROR_CODES.TRANSACTION_REVERTED:
        return "Transaction reverted on-chain";
      default:
        return err.message;
    }
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export function isUserCancellation(err: unknown): boolean {
  if (err instanceof NexusError) {
    return [
      ERROR_CODES.USER_DENIED_INTENT,
      ERROR_CODES.USER_DENIED_ALLOWANCE,
      ERROR_CODES.USER_DENIED_INTENT_SIGNATURE,
    ].includes(err.code as any);
  }
  if (err instanceof Error) {
    return (
      err.message.includes("User rejected") ||
      err.message.includes("user rejected") ||
      err.message.includes("User denied")
    );
  }
  return false;
}
