import MarketActionSheet, {
  STATE,
} from "@/components/Markets/MarketActionSheet";
import { Order, OrderTable } from "@/components/Markets/OrderTable";
import { FFButton } from "@/components/ui/FFButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHydrationFix } from "@/hooks/useHydrationFix";
import { useState } from "react";

export default function Marketplace() {
  const [currentTab, setCurrentTab] = useState<"orders" | "myOrders">("orders");
  const [state, setState] = useState<STATE>(STATE.buy);
  const [isOpen, setIsOpen] = useState(false);
  const isLayoutLoading = useHydrationFix();

  // mock
  const data: Order[] = [
    {
      id: "1",
      name: "Vitalik Buterin",
      subName: "vitalik.eth",
      level: 1,
      qty: 2,
      price: "0.05",
      status: "inOrders",
    },
  ];

  if (isLayoutLoading) return;

  return (
    <div className="pt-7 font-sans flex flex-col justify-between items-end space-y-3">
      <FFButton className="w-12 h-8" onClick={() => {
        setState(STATE.sell);
        setIsOpen(isOpen => !isOpen);
      }}>
        +
      </FFButton>
      <Tabs
        defaultValue="listFriends"
        value={currentTab}
        onValueChange={(value) => setCurrentTab(value as "orders" | "myOrders")}
        className="w-full h-full"
      >
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="myOrders">My Orders</TabsTrigger>
        </TabsList>
        <hr />
        <TabsContent value="orders">
          <OrderTable data={data} tab={currentTab} />
        </TabsContent>
        <TabsContent value="myOrders">
          <OrderTable data={data} tab={currentTab} />
        </TabsContent>
      </Tabs>
      <MarketActionSheet isOpenForce={isOpen} setIsOpenForce={setIsOpen} data={{ state, friendName: data[0].name, qty: data[0].qty, price: data[0].price }} />
    </div>
  );
}
