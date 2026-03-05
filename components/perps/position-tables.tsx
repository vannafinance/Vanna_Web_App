import { useTheme } from "@/contexts/theme-context";
import { useUserStore } from "@/store/user";
import { useState, useMemo } from "react";
import OpenOrdersTable from "./position-tables/open-orders-table";
import OrderHistoryTable from "./position-tables/order-history-table";
import TransactionHistoryTable from "./position-tables/transaction-history";
import OrderDetailsTable from "./position-tables/order-details-table";
import ActivePositionsTable from "./position-tables/active-positions-table";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/Checkbox";
import PositionHistoryTable from "./position-tables/position-history-table";
import AssetsTable from "./position-tables/assets-table";
import { AnimatedTabs } from "../ui/animated-tabs";

import { Modal } from "../ui/modal";
import { CloseAllPositionsModal } from "./modals/close-all-positions-modal";
import { MainTabType, OrderTabType } from "@/lib/types";
import {
  FILTER_OPTIONS,
  POSITION_COLUMN_ITEMS,
  DEFAULT_VISIBLE_COLUMNS,
  SORT_OPTIONS,
  MAIN_TABS,
  ORDER_TABS,
  PREFERENCE_ITEMS,
} from "@/lib/constants/perps";
import { FilterDropdown } from "./position-tables/filter-dropdown";
import { SortDropdown } from "./position-tables/sort-dropdown";
import { PreferencesDropdown } from "./position-tables/preferences-dropdown";
import ColumnPreferencesPopup from "./position-tables/column-preference-popup";

const PositionTables = () => {
  const { isDark } = useTheme();
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
    DEFAULT_VISIBLE_COLUMNS,
  );

  // Column order state - maintains the order of columns
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    // Initialize with all column items in their default order
    return POSITION_COLUMN_ITEMS.map((col) => col.id);
  });

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
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    setColumnOrder(POSITION_COLUMN_ITEMS.map((col) => col.id));
  };

  // Handle column reordering
  const handleReorderColumns = (newOrder: string[]) => {
    setColumnOrder(newOrder);
  };

  const filteredFilterOptions = FILTER_OPTIONS.filter((opt) =>
    opt.toLowerCase().includes(filterSearch.toLowerCase()),
  );

  const filteredSortOptions = SORT_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(sortSearch.toLowerCase()),
  );

  // Get the selected sort option
  const selectedSortOption = SORT_OPTIONS.find(
    (opt) => opt.id === selectedSort,
  );

  // Filter and transform main tabs for AnimatedTabs
  const filteredMainTabs = useMemo(() => {
    return MAIN_TABS.filter((tab) => {
      const prefKey = tab.id === "position" ? "positions" : tab.id;
      return tabPreferences[prefKey as keyof typeof tabPreferences];
    }).map((tab) => ({
      id: tab.id,
      label: tab.count !== null ? `${tab.label}(${tab.count})` : tab.label,
    }));
  }, [tabPreferences]);

  return (
    <div
      className={`w-full rounded-lg ${
        !userAddress
          ? isDark
            ? "bg-[#222222]"
            : "bg-white"
          : isDark
            ? "bg-[#222222]"
            : "bg-[#F7F7F7]"
      } flex flex-col gap-1 p-2`}
    >
      {/* Tabs */}
      <div className="flex p-0.5 gap-6 justify-between">
        <AnimatedTabs
          type="ghost-compact"
          tabs={filteredMainTabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as MainTabType)}
          containerClassName="!bg-transparent !p-0 !rounded-none"
          tabClassName="py-2"
        />
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
          <PreferencesDropdown
            preferences={tabPreferences}
            onTogglePreference={handleTabPreferenceToggle}
            isOpen={isPreferencesOpen}
            onToggleOpen={setIsPreferencesOpen}
            items={PREFERENCE_ITEMS}
          />
        </div>
      </div>

      {/* Order Tabs - show for openOrders & orderHistory */}
      {(activeTab === "openOrders" || activeTab === "orderHistory") && (
        <div className="flex gap-2 items-center">
          <div className={`flex h-[47px] p-1 rounded-lg border ${isDark ? "bg-[#111111] border-[#333333]" : "bg-[#FFFFFF] border-[#E2E2E2]"}`}>
            {ORDER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilterTab(tab.id)}
                className={`cursor-pointer px-4 py-3 text-[12px] leading-[100%] font-semibold rounded-lg transition-colors ${
                  activeFilterTab === tab.id
                    ? "bg-[#703AE6] text-white"
                    : isDark
                      ? "text-[#FFFFFF] hover:bg-[#333333]"
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
            <FilterDropdown
              selected={selectedFilter}
              onSelect={setSelectedFilter}
              options={filteredFilterOptions}
              isOpen={isFilterOpen}
              onToggle={(open) => {
                setIsFilterOpen(open);
                if (open) setIsSortOpen(false);
              }}
              search={filterSearch}
              onSearchChange={setFilterSearch}
            />
          )}
        </div>
      )}

      {/* Filter & Sort - show for position tab */}
      {activeTab === "position" && (
        <div className="flex justify-between">
          <div className="flex gap-2">
            {/* Filter Dropdown */}
            <FilterDropdown
              selected={selectedFilter}
              onSelect={setSelectedFilter}
              options={filteredFilterOptions}
              isOpen={isFilterOpen}
              onToggle={(open) => {
                setIsFilterOpen(open);
                if (open) setIsSortOpen(false);
              }}
              search={filterSearch}
              onSearchChange={setFilterSearch}
            />

            {/* Sort Dropdown */}
            <SortDropdown
              selected={selectedSort}
              onSelect={setSelectedSort}
              options={filteredSortOptions}
              isOpen={isSortOpen}
              onToggle={(open) => {
                setIsSortOpen(open);
                if (open) setIsFilterOpen(false);
              }}
              search={sortSearch}
              onSearchChange={setSortSearch}
            />
          </div>
          <div className="flex items-center gap-1 ">
            {/* column preferences in case of active position table */}
            <ColumnPreferencesPopup
              columnItems={POSITION_COLUMN_ITEMS}
              visibleColumns={visibleColumns}
              columnOrder={columnOrder}
              onToggleColumn={toggleColumnVisibility}
              onReorderColumns={handleReorderColumns}
              onReset={resetColumnPreferences}
              isOpen={isColumnPreferencesOpen}
              onToggle={() =>
                setIsColumnPreferencesOpen(!isColumnPreferencesOpen)
              }
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
        <div className={`flex-1 flex items-center justify-center rounded-lg border ${isDark ? "bg-[#222222] border-[#333333]" : "bg-gray-50 border-[#E2E2E2]"}`}>
          <button className={`px-4 py-2 font-semibold rounded-lg ${isDark ? "bg-[#3D2A6E] text-[#703AE6]" : "bg-[#F1EBFD] text-[#703AE6]"}`}>
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
              columnItems={POSITION_COLUMN_ITEMS}
              columnOrder={columnOrder}
            />
          )}
          {activeTab === "openOrders" && (
            <OpenOrdersTable activeTab={activeFilterTab} />
          )}
          {activeTab === "orderHistory" && (
            <OrderHistoryTable activeTab={activeFilterTab} />
          )}
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
