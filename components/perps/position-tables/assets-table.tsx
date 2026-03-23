import { useTheme } from "@/contexts/theme-context";
import { Column } from "../../ui/Table";
import { Table } from "../../ui/Table";

export type AssetsType = {
  id: string;
  coin: string;
  walletBalance: string;
  availableMargin: string;
  debt: string;
  loanLimit: string;
};

const assetsColumns: Column<AssetsType>[] = [
  {
    id: "coin",
    header: "Coin",
    accessorKey: "coin",
  },

  {
    id: "walletBalance",
    header: "Wallet Balance",
    accessorKey: "walletBalance",
  },

  {
    id: "availableMargin",
    header: "Available margin",
    accessorKey: "availableMargin",
  },

  {
    id: "debtLoanLimit",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Debt |</span>
        <span>Loan limit</span>
      </div>
    ),
    render: (row) => (
      <div className="flex flex-col">
        <span>{row.debt}</span>
        <span className="text-[11px] text-[#919191]">{row.loanLimit}</span>
      </div>
    ),
  },

  {
    id: "action",
    header: "Action",
    render: () => <div>-</div>,
  },
];

const assetsData: AssetsType[] = [
  {
    id: "asset-1",
    coin: "SUSDT",
    walletBalance: "1,250.50 SUSDT",
    availableMargin: "1,000.00 SUSDT",
    debt: "0.00 SUSDT",
    loanLimit: "5,000.00 SUSDT",
  },
  {
    id: "asset-2",
    coin: "USDT",
    walletBalance: "500.25 USDT",
    availableMargin: "450.00 USDT",
    debt: "0.00 USDT",
    loanLimit: "2,500.00 USDT",
  },
  {
    id: "asset-3",
    coin: "SBTC",
    walletBalance: "0.05 SBTC",
    availableMargin: "0.04 SBTC",
    debt: "0.00 SBTC",
    loanLimit: "0.50 SBTC",
  },
  {
    id: "asset-4",
    coin: "SETH",
    walletBalance: "1.25 SETH",
    availableMargin: "1.00 SETH",
    debt: "0.00 SETH",
    loanLimit: "10.00 SETH",
  },
];

export default function AssetsTable() {
  const { isDark } = useTheme();
  
  return (
    <div className={`p-2 rounded-lg border ${isDark ? "border-[#333333] bg-[#222222]" : "border-[#E2E2E2] bg-[#F7F7F7]"}`}>
      <Table
        columns={assetsColumns}
        data={assetsData}
        getRowKey={(row) => row.id}
        emptyText="No assets"
      />
    </div>
  );
}
