"use client";

import Orderbook from "@/components/spot/OrderBook";
import OrderPlacementForm from "@/components/spot/OrderPlacementForm";
import PositionTables from "@/components/spot/PositionTables";
import Toolbar from "@/components/spot/Toolbar";

const spot = () => {
  return (
    <main className="min-h-screen w-full py-10 flex flex-col gap-4 bg-white">
      <div className="px-5 grid grid-cols-[minmax(0,3fr)_minmax(0,1.1fr)] gap-4 ">
        <section className="flex flex-col gap-4">
          <div className=" w-full flex gap-4 bg-white">
            <div className="w-[669px] flex flex-col gap-3">
              <div className="flex gap-1 rounded-md">
                <button className="bg-[#F1EBFD] text-[#703AE6]  font-semibold py-3 px-4 rounded-lg">
                  Chart
                </button>
                <button className="bg-inherit text-[#111111] py-3 px-4 rounded-lg font-semibold">
                  Info
                </button>
              </div>

              {/* Chart */}
              <div className="flex flex-col gap-0.75 rounded-lg">
                <div className="h-11 bg-[#F7F7F7] p-2 flex items-center gap-4">
                  <Toolbar />
                </div>

                <div>Chart</div>
              </div>
            </div>

            {/* OrderBook */}
            <div className="w-[319px] h-[592px] rounded-xl flex flex-col gap-2 ">
              <Orderbook />
            </div>
          </div>

          <div className="max-h-[449px]  bg-white flex flex-col">
            <PositionTables />
          </div>
        </section>

        <aside className="rounded-2xl bg-white  ">
          <OrderPlacementForm />
        </aside>
      </div>
    </main>
  );
};

export default spot;
