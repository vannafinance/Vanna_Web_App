import { Table } from "./table"

const tableHeadings = [
    {
      label: "User Id",
      id: "user-id",
    },
    {
      label: "Supplied Assets",
      id: "supplied-assets",
    },
    {
      label: "Supply (%)",
      id: "supply-percent",
    },
  ]

  const tableBody = {
    rows: [
      {
        cell: [
          {
            icon: "/icons/user.png",
            title: "0x9390...A1D1",
            clickable: "address",            
          },
          {
            icon: "/icons/eth-icon.png",
            title: "236,304,563.44 ETH",
            description: "$236.23M",
          },
          {
            percentage: 49.52,
          },
        ],
      },
      {
        cell: [
          {
            icon: "/icons/user.png",
            title: "0x9390...A1D1",
            clickable: "address",
          },
          {
            icon: "/icons/eth-icon.png",
            title: "236,304,563.44 ETH",
            description: "$236.23M",
          },
          {
            percentage: 49.52,
          },
        ],
      },
      {
        cell: [
          {
            icon: "/icons/user.png",
            title: "0x9390...A1D1",
            clickable: "address",
          },
          {
            icon: "/icons/eth-icon.png",
            title: "236,304,563.44 ETH",
            description: "$236.23M",
          },
          {
            percentage: 49.52,
          },
        ],
      },
    ],
  }

  const transactionTableHeadings = [
    {
      label: "Date",
      id: "date",
    },
    {
      label: "Type",
      id: "type",
    },
    {
      label: "Amount",
      id: "amount",
    },
    {
      label: "User Id",
      id: "userId",
    },
  ]

  const transactionTableBody =  {
    rows: [
      {
        cell: [
          {
            title: "2025-11-03",
            description: "16:19:47",
          },
          {
            title: "Vault Withdraw",
          },
          {
            icon: "/icons/eth-icon.png",
            title: "236,304 ETH",
            description: "$236.23M",
          },
          {
            icon: "/icons/user.png",
            title: "0x9390...A1D1",
          },
        ],
      },
      {
        cell: [
          {
            title: "2025-11-03",
            description: "16:19:47",
          },
          {
            title: "Vault Withdraw",
          },
          {
            icon: "/icons/eth-icon.png",
            title: "236,304 ETH",
            description: "$236.23M",
          },
          {
            icon: "/icons/user.png",
            title: "0x9390...A1D1",
          },
        ],
      },
      {
        cell: [
          {
            title: "2025-11-03",
            description: "16:19:47",
          },
          {
            title: "Vault Withdraw",
          },
          {
            icon: "/icons/eth-icon.png",
            title: "236,304 ETH",
            description: "$236.23M",
          },
          {
            icon: "/icons/user.png",
            title: "0x9390...A1D1",
          },
        ],
      },
    ],
  }


export const ActivityTab =()=>{
    return <div className="w-full h-fit rounded-[20px] border-[1px] border-[#E2E2E2] bg-[#F7F7F7] p-[24px] flex flex-col gap-[24px]">
        <Table showPieChart={true} tableBodyBackground="bg-white" heading={{heading:"User Distribution"}} tableHeadings={tableHeadings} tableBody={tableBody} />
        <Table  tableBodyBackground="bg-white" heading={{heading:"All Transactions",}} filters={{filters:["All"],customizeDropdown:true}} tableHeadings={transactionTableHeadings} tableBody={transactionTableBody}/>
    </div>
}