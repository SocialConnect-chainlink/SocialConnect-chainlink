import { useEffect, useMemo, useState } from "react";
import { useAuthCore } from "@particle-network/auth-core-modal";

import { useHydrationFix } from "@/hooks/useHydrationFix";
import { getXProfile } from "@/utils/url.util";
import { Facebook, Google, X } from "@/components/Icon/Social";
import ProfileScreen from "@/components/ui/Screens/ProfileScreen";
import { backend } from "@/services/backend";

export default function Profile() {
  const { userInfo } = useAuthCore();
  const [isOpenMore, setIsOpenMore] = useState(false);

  const name = useMemo(() => {
    return userInfo?.thirdparty_user_info?.user_info
      ? userInfo.thirdparty_user_info?.user_info?.name
      : "";
  }, [userInfo?.thirdparty_user_info?.user_info]);

  const socialMediaLink = useMemo(() => {
    const provider = userInfo?.thirdparty_user_info?.provider;
    switch (provider) {
      case "google":
        return <Google />;
      case "twitterv1":
        return (
          <a href={getXProfile(name)} target="_blank" className="text-blue-400">
            <X />
          </a>
        );
      case "facebook":
        return <Facebook />;
      default:
        return;
    }
  }, [name, userInfo?.thirdparty_user_info?.provider]);

  const isLayoutLoading = useHydrationFix();
  if (isLayoutLoading) return <></>;

  return (
    <ProfileScreen
      name={name}
      socialMediaLink={socialMediaLink}
      mode="me"
      userInfo={userInfo}
      isOpen={isOpenMore}
      setIsOpen={setIsOpenMore}
    />
  );
}
