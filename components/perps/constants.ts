import {
  TriggerPriceType,
  ExecutionPriceType,
  TakeProfitType,
  StopLossType,
  TimeInForce,
  TwapFrequencyType,
} from "@/lib/types";
import { SuffixOption } from "../ui/InputWithUnit";

export const TRIGGER_PRICE_SUFFIX_OPTIONS: SuffixOption<TriggerPriceType>[] = [
  { label: "Last Price", value: "last" },
  { label: "Mark Price", value: "mark" },
  { label: "Index Price", value: "index" },
];

export const EXECUTION_PRICE_SUFFIX_OPTIONS: SuffixOption<ExecutionPriceType>[] = [
  { label: "Limit", value: "limit" },
  { label: "Market", value: "market" },
];

export const TP_SUFFIX_OPTIONS: SuffixOption<TakeProfitType>[] = [
  { label: "Price (USDT)", value: "price" },
  { label: "ROI (%)", value: "roi" },
  { label: "PnL (USDT)", value: "pnl" },
  { label: "Change (%)", value: "change" },
];

export const SL_SUFFIX_OPTIONS: SuffixOption<StopLossType>[] = [
  { label: "Price (USDT)", value: "price" },
  { label: "ROI (%)", value: "roi" },
  { label: "PnL (USDT)", value: "pnl" },
  { label: "Change (%)", value: "change" },
];

export const TIME_IN_FORCE_OPTIONS: TimeInForce[] = ["GTC", "Post-Only", "FOK", "IOC"];

export const TWAP_FREQUENCY_OPTIONS: TwapFrequencyType[] = [
  "5s",
  "10s",
  "20s",
  "30s",
  "60s",
];
