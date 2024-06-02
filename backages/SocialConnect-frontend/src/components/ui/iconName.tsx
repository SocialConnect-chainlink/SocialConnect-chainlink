import { cn } from "@/lib/utils";
import { capitalizeFirstLetter } from "@/utils/string.util";

export const IconName = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "text-xl font-sans bg-brand w-10 h-10 rounded-full flex items-center justify-center",
        className
      )}
    >
      {capitalizeFirstLetter(name)}
    </div>
  );
};
