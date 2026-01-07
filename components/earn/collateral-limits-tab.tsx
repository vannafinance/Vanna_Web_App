import { Table } from "./table";


const tableHeadings = [
    { label: "Assets", id: "assets" },
    { label: "Limits Usage", id: "limits-usage" }
  ]

 const  tableBody = {
    rows: [
      {
        cell: [
          {
            icon: "/icons/rst-Eth-icon.png",
            title: "rstETH",
            description: "wstETH v3"
          },
          {
            percentage: 25,
            value: "363.00 of 20.00K"
          }
        ]
      },
      {
        cell: [
          {
            icon: "/icons/rst-Eth-icon.png",
            title: "rstETH",
            description: "wstETH v3"
          },
          {
            percentage: 50,
            value: "363.00 of 20.00K"
          }
        ]
      },
      {
        cell: [
          {
            icon: "/icons/rst-Eth-icon.png",
            title: "rstETH",
            description: "wstETH v3"
          },
          {
            percentage: 25,
            value: "363.00 of 20.00K"
          }
        ]
      },
      {
        cell: [
          {
            icon: "/icons/rst-Eth-icon.png",
            title: "rstETH",
            description: "wstETH v3"
          },
          {
            percentage: 56,
            value: "363.00 of 20.00K"
          }
        ]
      },
      {
        cell: [
          {
            icon: "/icons/rst-Eth-icon.png",
            title: "rstETH",
            description: "wstETH v3"
          },
          {
            percentage: 56,
            value: "363.00 of 20.00K"
          }
        ]
      }
    ]
  }

export const CollateralLimitsTab = () => {
  return <div className="w-full h-fit ">
        <Table heading={{}} tableHeadings={tableHeadings} tableBody={tableBody} showProgressBar={true}/>
  </div>;
};