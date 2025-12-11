"use client";

import Orderbook from "@/components/spot/OrderBook";
import OrderPlacementForm from "@/components/spot/OrderPlacementForm";
import PositionHistory from "@/components/spot/Position-History";
import Toolbar from "@/components/spot/Toolbar";

const spot = () => {
  return (
    <main className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-[1440px] p-4">
        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,1.1fr)] gap-4">
          <section className="flex flex-col gap-4">
            <div className="h-[592px] w-[1004px]  bg-white">
              <div className="flex gap-3 ">
                <div className="w-[669px] h-[592px] flex flex-col gap-3">
                  <div className="">
                    <button className="bg-[#F1EBFD] text-[#703AE6]  font-semibold py-3 px-4 rounded-lg">
                      Chart
                    </button>
                    <button className="bg-inherit text-[#111111] py-3 px-4 rounded-lg font-semibold">
                      Info
                    </button>
                  </div>
                  <div className="flex flex-col">
                    <div className="h-11 bg-[#F7F7F7] p-2 flex items-center gap-4">
                      <Toolbar />
                    </div>

                    <div>Chart</div>
                  </div>
                </div>

                <div className="w-[319px] h-[592px] flex flex-col ">
                  <Orderbook />
                </div>
              </div>
            </div>

            <div className="h-[449px]  bg-white flex flex-col">
              {/* <div className="bg-black h-[35px]"></div>
              <div className="bg-[#F7F7F7] h-[402px]"></div> */}

              <PositionHistory />
            </div>
          </section>

          <aside className="rounded-2xl bg-white  ">
            <OrderPlacementForm />
            {/* <OrderPlacementTable /> */}
          </aside>
        </div>
      </div>
    </main>
  );
};

export default spot;
