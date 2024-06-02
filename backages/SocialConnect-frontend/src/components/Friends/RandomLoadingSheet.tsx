import { ClipLoader } from "react-spinners";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { useEffect, useState } from "react";

export default function RandomLoadingSheet({
  children,
  disabled = false,
  textPrice,
  isOpenForce = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  textPrice: string;
  isOpenForce?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(isOpenForce);

  useEffect(() => {
    setIsOpen(isOpenForce);
  }, [isOpenForce]);

  return (
    <Sheet open={isOpen}>
      <SheetTrigger
        className="font-serif w-full"
        disabled={disabled}
      // onClick={() => setIsOpen(true)}
      >
        {children}
      </SheetTrigger>
      <SheetContent className=" rounded-t-2xl h-1/2" side="bottom">
        <SheetHeader className="h-full  max-w-[500px] mx-auto">
          <SheetDescription className="min-h-52  flex flex-col justify-between items-center text-center text-black h-full">
            <div />
            <div className="space-y-3 flex flex-col items-center">
              <ClipLoader color="#FFDD3C" size={55} />
              <div className="font-medium text-xl">Discovering new friends</div>
              <div className="text-secondary text-sm">{textPrice}</div>
            </div>
            <div className="text-secondary text-sm">
              This process will take a moment. Please wait...
            </div>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
