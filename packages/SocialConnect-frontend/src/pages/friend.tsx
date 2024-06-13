import { useEffect, useMemo, useState } from "react";

import { useHydrationFix } from "@/hooks/useHydrationFix";
import { getXProfile } from "@/utils/url.util";
import { Facebook, Google, X } from "@/components/Icon/Social";
import ProfileScreen from "@/components/ui/Screens/ProfileScreen";
import { useRouter } from "next/router";
import { backend } from "@/services/backend";

export default function Friend() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isOpenMerge, setIsOpenMerge] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log(router.query.id);
    backend.getUser(router.query.id as string).then((res) => {
      console.log(res?.data.data[0]);
      setUserInfo(res?.data.data[0]);
    });
  }, [router.query.id]);

  const name = useMemo(() => {
    return userInfo?.name;
  }, [userInfo]);

  const socialMediaLink = useMemo(() => {
    const provider = userInfo?.thirdparty_user_info?.provider;
    switch (provider) {
      case "google":
        return <Google />;
      case "twitterv1":
        return (
          <a
            href={getXProfile(userInfo?.name)}
            target="_blank"
            className="text-blue-400"
          >
            <X />
          </a>
        );
      case "facebook":
        return <Facebook />;
      default:
        return;
    }
  }, [userInfo?.name, userInfo?.thirdparty_user_info?.provider]);

  const isLayoutLoading = useHydrationFix();
  if (isLayoutLoading) return <></>;

  if (!router.query.id)
    return (
      <div className="flex items-center mt-20 w-full justify-center">
        <div className="text-center text-2xl">Not Found 404</div>
      </div>
    );


  return (
    <ProfileScreen
      name={name || ''}
      socialMediaLink={socialMediaLink}
      mode="friend"
      userInfo={userInfo}
      isOpen={isOpenMerge}
      setIsOpen={setIsOpenMerge}
    />
  );
}
