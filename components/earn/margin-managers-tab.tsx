import { Table } from "./table";

const tableHeadings = [
    { label: "Margin Manager", id: "margin-manager" },
    { label: "Current Debt", id: "current-debt" },
    { label: "Asset LT", id: "asset-lt" }
  ]

  const  tableBody = {
    rows: [
      {
        cell: [
          {
            title: "Tier #1",
            description: "0xf5ed...bdf7"
          },
          {
            title: "0.00 wstETH",
            description: "$0.00"
          },
          {
            title: "6 assets"
          }
        ]
      },
      {
        cell: [
          {
            title: "Tier #1",
            description: "0xf5ed...bdf7"
          },
          {
            title: "0.00 wstETH",
            description: "$0.00"
          },
          {
            title: "6 assets"
          }
        ]
      },
      {
        cell: [
          {
            title: "Tier #1",
            description: "0xf5ed...bdf7"
          },
          {
            title: "0.00 wstETH",
            description: "$0.00"
          },
          {
            title: "6 assets"
          }
        ]
      }
    ]
  }


export const MarginManagersTab = () => {
  return (
    <section className="w-full h-fit" aria-label="Margin Managers Overview">
      <article aria-label="Margin Managers List">
        <Table 
          heading={{}} 
          tableHeadings={tableHeadings} 
          tableBody={tableBody} 
        />
      </article>
    </section>
  );
};