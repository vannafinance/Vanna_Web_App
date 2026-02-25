export const FILTER_OPTIONS = ["3 Months", "6 Months", "1 Year", "All Time"]

// Overall Deposit Data - Monthly data for approximately one year (Jan 2025 - Dec 2025)
export const depositData = [
    { date: "2025-01-01", amount: 850 },
    { date: "2025-01-15", amount: 920 },
    { date: "2025-02-01", amount: 980 },
    { date: "2025-02-15", amount: 1050 },
    { date: "2025-03-01", amount: 1120 },
    { date: "2025-03-15", amount: 1180 },
    { date: "2025-04-01", amount: 1250 },
    { date: "2025-04-15", amount: 1320 },
    { date: "2025-05-01", amount: 1400 },
    { date: "2025-05-15", amount: 1480 },
    { date: "2025-06-01", amount: 1560 },
    { date: "2025-06-15", amount: 1650 },
    { date: "2025-07-01", amount: 1740 },
    { date: "2025-07-15", amount: 1830 },
    { date: "2025-08-01", amount: 1920 },
    { date: "2025-08-15", amount: 2020 },
    { date: "2025-09-01", amount: 2120 },
    { date: "2025-09-15", amount: 2230 },
    { date: "2025-10-01", amount: 2350 },
    { date: "2025-10-15", amount: 2470 },
    { date: "2025-11-01", amount: 2600 },
    { date: "2025-11-15", amount: 2740 },
    { date: "2025-12-01", amount: 2890 },
    { date: "2025-12-15", amount: 3050 },
    { date: "2025-12-31", amount: 3220 },
]

// Net APY Data - Monthly data showing APY earnings in USD (Jan 2025 - Dec 2025)
export const netApyData = [
    { date: "2025-01-01", amount: 12.50 },
    { date: "2025-01-15", amount: 18.20 },
    { date: "2025-02-01", amount: 24.80 },
    { date: "2025-02-15", amount: 31.50 },
    { date: "2025-03-01", amount: 38.90 },
    { date: "2025-03-15", amount: 46.20 },
    { date: "2025-04-01", amount: 54.10 },
    { date: "2025-04-15", amount: 62.30 },
    { date: "2025-05-01", amount: 71.20 },
    { date: "2025-05-15", amount: 80.50 },
    { date: "2025-06-01", amount: 90.10 },
    { date: "2025-06-15", amount: 100.20 },
    { date: "2025-07-01", amount: 110.80 },
    { date: "2025-07-15", amount: 122.10 },
    { date: "2025-08-01", amount: 133.90 },
    { date: "2025-08-15", amount: 146.20 },
    { date: "2025-09-01", amount: 159.10 },
    { date: "2025-09-15", amount: 172.80 },
    { date: "2025-10-01", amount: 187.20 },
    { date: "2025-10-15", amount: 202.30 },
    { date: "2025-11-01", amount: 218.10 },
    { date: "2025-11-15", amount: 234.60 },
    { date: "2025-12-01", amount: 251.90 },
    { date: "2025-12-15", amount: 270.10 },
    { date: "2025-12-31", amount: 289.20 },
]     

export const tableHeadings = [
    { label: "Pool", id: "pool" },
    { label: "Assets Supplied", id: "assets-supplied" ,icon:true},
    { label: "Supply APY", id: "supply-apy" ,icon:true},
    { label: "Assets Borrowed", id: "assets-borrowed" ,icon:true},
    { label: "Borrow APY", id: "borrow-apy" ,icon:true},
    { label: "Utilization Rate", id: "utilization-rate" ,icon:true},
    { label: "Collateral", id: "collateral" },
  ]

 export  const tableBody = {
    rows: [
      {
        cell: [
          {
            chain: "Base", // Will be dynamically replaced based on connected network
            title: "ETH",
            tag: "Active",
          },
          {
            title: "$892.4K",
            tag: "12.3M ETH",
          },
          {
            title: "18.45%",
            tag: "18.45%",
          },
          {
            title: "$6.21M USD",
            tag: "6.21M ETH",
          },
          {
            title: "15.32%",
            tag: "15.32%",
          },
          {
            title: "58.92%",
            tag: "58.92%",
          },
          {
            onlyIcons: ["ETH", "USDC", "USDT"],
            tag: "Collateral",
            clickable: "toggle",
          },
        ],
      },
      {
        cell: [
          {
            chain: "Base", // Will be dynamically replaced based on connected network
            title: "USDC",
            tag: "Active",
          },
          {
            title: "$1.2M",
            tag: "15.8M USDC",
          },
          {
            title: "12.85%",
            tag: "12.85%",
          },
          {
            title: "$8.45M USD",
            tag: "8.45M USDC",
          },
          {
            title: "9.67%",
            tag: "9.67%",
          },
          {
            title: "72.15%",
            tag: "72.15%",
          },
          {
            onlyIcons: ["USDC", "ETH", "USDT"],
            tag: "Collateral",
            clickable: "toggle",
          },
        ],
      },
      {
        cell: [
          {
            chain: "Base", // Will be dynamically replaced based on connected network
            title: "USDT",
            tag: "Active",
          },
          {
            title: "$567.3K",
            tag: "9.12M USDT",
          },
          {
            title: "16.78%",
            tag: "16.78%",
          },
          {
            title: "$3.89M USD",
            tag: "3.89M USDT",
          },
          {
            title: "11.24%",
            tag: "11.24%",
          },
          {
            title: "65.43%",
            tag: "65.43%",
          },
          {
            onlyIcons: ["USDT", "USDC", "ETH"],
            tag: "Collateral",
            clickable: "toggle",
          },
        ],
      },
    ],
  };
  