import { IconName } from "@/components/ui/iconName";
import { backend } from "@/services/backend";
import { useRouter } from "next/router";
import React, { useState } from "react";
import Image from "next/image";

export default function Search() {
  const router = useRouter();
  const { query } = router;
  const [data, setData] = useState([]);

  const searchUser = async (name: string) => {
    try {
      const res = await backend.searchUser(name);
      setData(res?.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    if (query.term) {
      searchUser(query.term as string);
    }
  }, [query]);

  return (
    <div className="border-t mt-3 pt-5">
      {data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((user: any) => {
            return (
              <div key={user} className="flex justify-between items-center">
                <button
                  className="space-x-2 flex items-center"
                  onClick={() => router.push(`/friend?id=${user.uuid}`)}
                >
                  <IconName name={user.name} />
                  <div className="text-start">
                    <p className="text-sm font-semibold">{user.name}</p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-[250px] w-full flex flex-col space-y-10 items-center justify-center">
          <Image
            className="cursor-pointer opacity-50"
            onClick={() => router.push("/")}
            src="/logo.svg"
            width={128}
            height={128}
            alt="friendfi logo"
          />
          <p className="text-lg">
            User with the name{" "}
            <span className="text-yellow-500 font-bold">{query.term}</span> is
            not found !
          </p>
        </div>
      )}
    </div>
  );
}
