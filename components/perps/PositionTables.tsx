import { useUserStore } from "@/store/user";
import { useState, useRef, useEffect } from "react";
import OpenOrdersTable from "./OpenOrdersTable";
import OrderHistoryTable from "./OrderHistoryTable";
import TransactionHistoryTable from "./TransactionHistory";
import OrderDetailsTable from "./OrderDetailsTable";
import ActivePositionsTable from "./ActivePositionsTable";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/Checkbox";
import ToggleButton from "../ui/toggle";
import PositionHistoryTable from "./PositionHistoryTable";
import AssetsTable from "./AssetsTable";
import ColumnPreferencesPopup, {
  type ColumnPreferenceItem,
} from "./ColumnPreferencesPopup";
import { Modal } from "../ui/modal";
import { CloseAllPositionsModal } from "./close-all-positions-modal";

type MainTabType =
  | "openOrders"
  | "orderHistory"
  | "positionHistory"
  | "position"
  | "orderDetails"
  | "transactionHistory"
  | "assets";

type OrderTabType =
  | "limitMarket"
  | "trailingStop"
  | "tpSl"
  | "trigger"
  | "iceberg"
  | "twap";

const filterOptions = [
  "All",
  "BTCUSDT",
  "BNBUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "AVAXUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOTUSDT",
  "DOGEUSDT",
  "MATICUSDT",
  "LINKUSDT",
  "LITUSDT"
];

// Column preferences for positions table
const positionColumnItems: ColumnPreferenceItem[] = [
  { id: "futures", label: "Futures", hasToggle: false },
  { id: "positionSize", label: "Position size", hasToggle: false },
  { id: "positionValue", label: "Position value", hasToggle: false },
  {
    id: "entryMarkPrice",
    label: "Avg. entry price | Mark price",
    hasToggle: true,
  },
  { id: "estLiquidation", label: "Est. liquidation price", hasToggle: true },
  { id: "margin", label: "Margin", hasToggle: true },
  {
    id: "tieredMaintenanceMarginRate",
    label: "Tiered maintenance margin rate",
    hasToggle: true,
  },
  { id: "unrealizedPnl", label: "Unrealized PnL", hasToggle: true },
  { id: "realizedPnl", label: "Realized PnL", hasToggle: true },
  { id: "funding", label: "Funding", hasToggle: true },
  { id: "mmr", label: "MMR", hasToggle: true },
  { id: "flashClose", label: "Flash close", hasToggle: true },
  { id: "reverse", label: "Reverse", hasToggle: true },
  { id: "entireTpSl", label: "All TP/SL", hasToggle: true },
  { id: "partialTpSl", label: "Partial TP/SL", hasToggle: true },
  { id: "trailingTpSl", label: "Trailing TP/SL", hasToggle: true },
  { id: "mmrSl", label: "MMR SL", hasToggle: true },
  { id: "close", label: "Close", hasToggle: false },
  { id: "breakevenPrice", label: "Breakeven price", hasToggle: true },
];

// Default visible columns (these will have toggle ON initially)
const defaultVisibleColumns = [
  "futures",
  "positionSize",
  "positionValue",
  "entryMarkPrice",
  "estLiquidation",
  "margin",
  "tieredMaintenanceMarginRate",
  "unrealizedPnl",
  "realizedPnl",
  "funding",
  "mmr",
  "flashClose",
  "reverse",
  "entireTpSl",
  "partialTpSl",
  "trailingTpSl",
  "mmrSl",
  "close",
];

const sortOptions = [
  { id: "default", label: "Default", icon: null },
  {
    id: "coin_asc",
    label: "Coin initial (from A to Z)",
    icon: "/perp/freepik__alphabets.svg",
  },
  {
    id: "position_value",
    label: "Position Value(from high to low)",
    icon: "/perp/freepik__position_value.svg",
  },
  {
    id: "margin",
    label: "Margin(from high to low)",
    icon: "/perp/freepik__margin.svg",
  },
  {
    id: "unrealized_pnl",
    label: "Unrealized PnL (from high to low)",
    icon: "/perp/freepik__unrealized_pnl.svg",
  },
  { id: "roi", label: "ROI(from high to low)", icon: "/perp/freepik__roi.svg" },
];

const PositionTables = () => {
  const userAddress = useUserStore((state) => state.address);
  const [activeTab, setActiveTab] = useState<MainTabType>("position");
  const [activeFilterTab, setActiveFilterTab] =
    useState<OrderTabType>("limitMarket");

  // Filter & Sort states
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedSort, setSelectedSort] = useState("default");
  const [filterSearch, setFilterSearch] = useState("");
  const [sortSearch, setSortSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isColumnPreferencesOpen, setIsColumnPreferencesOpen] = useState(false);
  const [isCloseAllModalOpen, setIsCloseAllModalOpen] = useState(false);
  const [tabPreferences, setTabPreferences] = useState({
    positions: true,
    openOrders: true,
    orderHistory: true,
    positionHistory: true,
    orderDetails: true,
    transactionHistory: true,
    assets: true,
  });

  // Column visibility state - toggle ON = visible (displayed), toggle OFF = hidden
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    defaultVisibleColumns,
  );

  // Column order state - maintains the order of columns
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    // Initialize with all column items in their default order
    return positionColumnItems.map((col) => col.id);
  });

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const preferencesRef = useRef<HTMLDivElement>(null);
  const columnPreferencesRef = useRef<HTMLDivElement>(null);
  const columnPrefsBtnRef = useRef<HTMLButtonElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (
        preferencesRef.current &&
        !preferencesRef.current.contains(event.target as Node)
      ) {
        setIsPreferencesOpen(false);
      }
      if (
        columnPreferencesRef.current &&
        !columnPreferencesRef.current.contains(event.target as Node)
      ) {
        setIsColumnPreferencesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle tab preference toggle - switch tab if current active tab is being hidden
  const handleTabPreferenceToggle = (itemId: string, state: boolean) => {
    setTabPreferences((prev) => ({
      ...prev,
      [itemId]: state,
    }));

    // If disabling the current active tab, switch to first visible tab
    if (!state) {
      const tabId = itemId === "positions" ? "position" : itemId;
      if (activeTab === tabId) {
        const tabOrder: MainTabType[] = [
          "position",
          "openOrders",
          "orderHistory",
          "positionHistory",
          "orderDetails",
          "transactionHistory",
          "assets",
        ];
        const newPrefs = { ...tabPreferences, [itemId]: false };
        const visibleTab = tabOrder.find((t) => {
          const key = t === "position" ? "positions" : t;
          return newPrefs[key as keyof typeof newPrefs];
        });
        if (visibleTab) {
          setActiveTab(visibleTab);
        }
      }
    }
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId],
    );
  };

  // Reset column preferences to default
  const resetColumnPreferences = () => {
    setVisibleColumns(defaultVisibleColumns);
    setColumnOrder(positionColumnItems.map((col) => col.id));
  };

  // Handle column reordering
  const handleReorderColumns = (newOrder: string[]) => {
    setColumnOrder(newOrder);
  };

  const filteredFilterOptions = filterOptions.filter((opt) =>
    opt.toLowerCase().includes(filterSearch.toLowerCase()),
  );

  const filteredSortOptions = sortOptions.filter((opt) =>
    opt.label.toLowerCase().includes(sortSearch.toLowerCase()),
  );

  // Get the selected sort option
  const selectedSortOption = sortOptions.find((opt) => opt.id === selectedSort);

  const mainTabs = [
    {
      id: "position" as MainTabType,
      label: "Positions",
      count: null,
    },
    {
      id: "openOrders" as MainTabType,
      label: "Open Orders",
      count: null,
    },
    { id: "orderHistory" as MainTabType, label: "Order History", count: null },
    {
      id: "positionHistory" as MainTabType,
      label: "Position History",
      count: null,
    },
    {
      id: "orderDetails" as MainTabType,
      label: "Order Details",
      count: null,
    },
    {
      id: "transactionHistory" as MainTabType,
      label: "Transaction History",
      count: null,
    },
    { id: "assets" as MainTabType, label: "Assets", count: null },
  ];

  const orderTabs = [
    {
      id: "limitMarket" as OrderTabType,
      label: "Limit | Market",
      count: 4,
    },
    {
      id: "trailingStop" as OrderTabType,
      label: "Trailing stop",
      count: 2,
    },
    {
      id: "tpSl" as OrderTabType,
      label: "TP/SL",
      count: 0,
    },
    {
      id: "trigger" as OrderTabType,
      label: "Trigger",
      count: 0,
    },
    {
      id: "iceberg" as OrderTabType,
      label: "Iceberg",
      count: 0,
    },
    {
      id: "twap" as OrderTabType,
      label: "TWAP",
      count: 0,
    },
  ];

  const preferenceItems = [
    { id: "positions", label: "Positions", hasToggle: false },
    { id: "openOrders", label: "Open Orders", hasToggle: false },
    { id: "orderHistory", label: "Order History", hasToggle: true },
    { id: "positionHistory", label: "Position History", hasToggle: true },
    { id: "orderDetails", label: "Order Details", hasToggle: true },
    { id: "transactionHistory", label: "Transaction History", hasToggle: true },
    { id: "assets", label: "Assets", hasToggle: true },
  ] as const;

  return (
    <div
      className={`w-full rounded-lg ${
        !userAddress ? "bg-white" : "bg-[#F7F7F7]"
      }    flex flex-col gap-2 p-2`}
    >
      {/* Tabs */}
      <div className="flex p-0.5 gap-6 justify-between">
        <div className="flex gap-1">
          {mainTabs
            .filter((tab) => {
              // Map tab.id to preference key (position -> positions)
              const prefKey = tab.id === "position" ? "positions" : tab.id;
              return tabPreferences[prefKey as keyof typeof tabPreferences];
            })
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer text-[12px] font-semibold  transition-colors py-2 px-4 ${
                  activeTab === tab.id
                    ? "text-[#703AE6] bg-[#F1EBFD] rounded-lg"
                    : "text-[#111111] hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                {tab.count !== null && `(${tab.count})`}
              </button>
            ))}
        </div>
        <div className="flex items-center gap-3">
          {/* show current checkbox */}
          {activeTab !== "transactionHistory" && activeTab !== "assets" && (
            <div className="text-[12px] font-semibold">
              <Checkbox
                label="Show Current"
                checked={showCurrent}
                onChange={(e) => setShowCurrent(e.target.checked)}
              />
            </div>
          )}

          {/* filter icon button with preferences popup */}
          <div ref={preferencesRef} className="relative">
            <button
              type="button"
              className="cursor-pointer"
              onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
            >
              <Image
                src="/icons/filter-icon.svg"
                alt="filter"
                width={20}
                height={14}
              />
            </button>

            <AnimatePresence>
              {isPreferencesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-1 w-[267px] bg-[#F7F7F7] rounded-xl z-50 py-3 px-2 shadow-[0px_7px_15px_rgba(0,0,0,0.08),0px_28px_28px_rgba(0,0,0,0.07)] flex flex-col gap-[23px]"
                >
                  {/* Header */}
                  <h3 className="text-[12px] leading-[18px] font-semibold text-[#111111]">
                    Preferences
                  </h3>

                  {/* Preference Items */}
                  <div className="flex flex-col gap-3">
                    {preferenceItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between "
                      >
                        <span className="text-[12px]  leading-[18px]font-medium text-[#111111]">
                          {item.label}
                        </span>
                        {item.hasToggle ? (
                          <ToggleButton
                            size="small"
                            defaultChecked={
                              tabPreferences[
                                item.id as keyof typeof tabPreferences
                              ]
                            }
                            onToggle={(state) =>
                              handleTabPreferenceToggle(item.id, state)
                            }
                          />
                        ) : (
                          <div className="w-10" />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Order Tabs - show for openOrders & orderHistory */}
      {(activeTab === "openOrders" || activeTab === "orderHistory") && (
        <div className="flex gap-2 items-center">
          <div className="flex h-[47px] bg-[#FFFFFF] p-1  rounded-lg border border-[#E2E2E2] ">
            {orderTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilterTab(tab.id)}
                className={`cursor-pointer px-4 py-3 text-[12px] leading-[100%] font-semibold rounded-lg transition-colors ${
                  activeFilterTab === tab.id
                    ? "bg-[#703AE6] text-white"
                    : "text-[#111111] hover:bg-gray-100"
                }`}
              >
                {tab.label}
                {`(${tab.count})`}
              </button>
            ))}
          </div>

          {/* Filter Dropdown for Open Orders only */}
          {activeTab === "openOrders" && (
            <div ref={filterRef} className="relative">
              <button
                onClick={() => {
                  setIsFilterOpen(!isFilterOpen);
                  setIsSortOpen(false);
                }}
                className="cursor-pointer flex items-center h-[47px] gap-1 px-4 py-2 bg-white border border-[#E2E2E2] rounded-lg text-[12px] leading-[18px] font-semibold text-[#111111]"
              >
                Filter: {selectedFilter}
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                  animate={{ rotate: isFilterOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </motion.svg>
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 w-60 bg-[#F4F4F4] rounded-xl z-50 p-4 shadow-[0px_7px_15px_rgba(0,0,0,0.08),0px_28px_28px_rgba(0,0,0,0.07)] flex flex-col gap-[15px]"
                  >
                    {/* Search */}
                    <div className="flex items-center h-12 gap-2.5 px-2 py-3 rounded-lg bg-[#FFFFFF] border-b border-[#E2E2E2]">
                      <Image
                        src="/icons/search.svg"
                        alt="search"
                        width={24}
                        height={24}
                      />
                      <input
                        type="text"
                        placeholder="Search"
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="flex-1 text-[14px] leading-[21px] font-medium outline-none placeholder:text-[#A7A7A7]"
                      />
                    </div>
                    {/* Options */}
                    <div className="flex flex-col gap-[15px] max-h-[180px] overflow-y-auto scrollbar-thin">
                      {filteredFilterOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSelectedFilter(option);
                            setIsFilterOpen(false);
                            setFilterSearch("");
                          }}
                          className="cursor-pointer w-full text-left px-3 text-[14px] leading-[21px] font-medium text-[#111111] hover:bg-[#F1EBFD] rounded-md"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Filter & Sort - show for position tab */}
      {activeTab === "position" && (
        <div className="flex justify-between">
          <div className="flex gap-2">
            {/* Filter Dropdown */}
            <div ref={filterRef} className="relative">
              <button
                onClick={() => {
                  setIsFilterOpen(!isFilterOpen);
                  setIsSortOpen(false);
                }}
                className=" cursor-pointer flex items-center h-[47px] gap-1 px-4 py-2 bg-white border border-[#E2E2E2] rounded-lg text-[12px] leading-[18px] font-semibold text-[#111111]"
              >
                Filter: {selectedFilter}
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                  animate={{ rotate: isFilterOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </motion.svg>
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 w-60 bg-[#F4F4F4]  rounded-xl  z-50 p-4 shadow-[0px_7px_15px_rgba(0,0,0,0.08),0px_28px_28px_rgba(0,0,0,0.07)] flex flex-col gap-[15px]"
                  >
                    {/* Search */}
                    <div className="flex items-center h-12  gap-2.5 px-2 py-3 rounded-lg bg-[#FFFFFF] border-b border-[#E2E2E2]">
                      <Image
                        src="/icons/search.svg"
                        alt="search"
                        width={24}
                        height={24}
                      />
                      <input
                        type="text"
                        placeholder="Search"
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="flex-1 text-[14px] leading-[21px] font-medium outline-none placeholder:text-[#A7A7A7]"
                      />
                    </div>
                    {/* Options */}
                    <div className="flex flex-col gap-[15px] max-h-[180px] overflow-y-auto scrollbar-thin">
                      {filteredFilterOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSelectedFilter(option);
                            setIsFilterOpen(false);
                            setFilterSearch("");
                          }}
                          className="cursor-pointer w-full text-left px-3 text-[14px] leading-[21px] font-medium text-[#111111] hover:bg-[#F1EBFD] rounded-md"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Dropdown */}
            <div ref={sortRef} className="relative">
              <button
                onClick={() => {
                  setIsSortOpen(!isSortOpen);
                  setIsFilterOpen(false);
                }}
                className="cursor-pointer flex items-center gap-1 h-[47px] px-4 py-2 bg-white border border-[#E2E2E2] rounded-lg text-[12px] leading-[18px] text-[#111111] font-semibold"
              >
                {selectedSortOption && selectedSortOption.icon ? (
                  <Image
                    src={selectedSortOption.icon}
                    alt={selectedSortOption.label}
                    width={20}
                    height={20}
                  />
                ) : (
                  <span>Sort</span>
                )}
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                  animate={{ rotate: isSortOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </motion.svg>
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 w-[299px] bg-[#F4F4F4] border border-[#E2E2E2] shadow-[0px_7px_15px_rgba(0,0,0,0.08),0px_28px_28px_rgba(0,0,0,0.07)]  z-50 p-4 rounded-xl flex flex-col gap-[15px]"
                  >
                    {/* Search */}
                    <div className="flex items-center h-12  gap-2.5 px-2 py-3 rounded-lg bg-[#FFFFFF] border-b border-[#E2E2E2]">
                      <Image
                        src="/icons/search.svg"
                        alt="search"
                        width={24}
                        height={24}
                      />
                      <input
                        type="text"
                        placeholder="Search"
                        value={sortSearch}
                        onChange={(e) => setSortSearch(e.target.value)}
                        className="flex-1 text-[14px] leading-[21px] font-medium outline-none placeholder:text-[#A7A7A7]"
                      />
                    </div>
                    {/* Options */}
                    <div className="flex flex-col gap-[15px]">
                      {filteredSortOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSelectedSort(option.id);
                            setIsSortOpen(false);
                            setSortSearch("");
                          }}
                          className={`cursor-pointer w-full flex items-center justify-between  text-[14px] leading-[21px] font-medium rounded-md hover:bg-[#F1EBFD] ${
                            selectedSort === option.id
                              ? "text-[#703AE6]"
                              : "text-[#111111]"
                          }`}
                        >
                          <span>{option.label}</span>
                          {option.icon && (
                            <Image
                              src={option.icon}
                              alt=""
                              width={20}
                              height={20}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-1 ">
            {/* column preferences in case of active position table */}
            <ColumnPreferencesPopup
              columnItems={positionColumnItems}
              visibleColumns={visibleColumns}
              columnOrder={columnOrder}
              onToggleColumn={toggleColumnVisibility}
              onReorderColumns={handleReorderColumns}
              onReset={resetColumnPreferences}
              isOpen={isColumnPreferencesOpen}
              onToggle={() => setIsColumnPreferencesOpen(!isColumnPreferencesOpen)}
              buttonRef={columnPrefsBtnRef}
              popupRef={columnPreferencesRef}
            />
            <Button
              text="Close All"
              size="small"
              type="ghost"
              disabled={false}
              onClick={() => setIsCloseAllModalOpen(true)}
            />
          </div>
        </div>
      )}

      {!userAddress ? (
        <div className="flex-1 flex  items-center justify-center bg-gray-50 border border-[#E2E2E2] rounded-lg">
          <button className="px-4 py-2 bg-[#F1EBFD] text-[#703AE6] font-semibold rounded-lg ">
            Connect your Wallet
          </button>
        </div>
      ) : (
        <>
          {activeTab === "position" && (
            <ActivePositionsTable
              filter={selectedFilter}
              sort={selectedSort}
              visibleColumns={visibleColumns}
              columnItems={positionColumnItems}
              columnOrder={columnOrder}
            />
          )}
          {activeTab === "openOrders" && <OpenOrdersTable activeTab={activeFilterTab} />}
          {activeTab === "orderHistory" && <OrderHistoryTable />}
          {activeTab === "positionHistory" && <PositionHistoryTable />}
          {activeTab === "orderDetails" && <OrderDetailsTable />}
          {activeTab === "transactionHistory" && <TransactionHistoryTable />}
          {activeTab === "assets" && <AssetsTable />}
        </>
      )}

      {/* Close All Positions Modal */}
      <Modal
        open={isCloseAllModalOpen}
        onClose={() => setIsCloseAllModalOpen(false)}
      >
        <CloseAllPositionsModal
          onClose={() => setIsCloseAllModalOpen(false)}
          onConfirm={() => {
            console.log("Close all positions confirmed");
            // Handle close all positions logic here
            setIsCloseAllModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default PositionTables;
