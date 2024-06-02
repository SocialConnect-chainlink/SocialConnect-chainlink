import MyPostBar from "@/components/Post/MyPostBar";
import PostItem from "@/components/Post/PostItem";
import { FFButton } from "@/components/ui/FFButton";
import { useFriendFi } from "@/hooks/useFriendFi";
import { useHydrationFix } from "@/hooks/useHydrationFix";
import { backend } from "@/services/backend";
import { useAuthCore } from "@particle-network/auth-core-modal";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const isLayoutLoading = useHydrationFix();
  const router = useRouter();
  const [postList, setPostList] = useState<
    {
      name: string;
      content: string;
      createdAt: Date;
      image: undefined;
      level: number;
      uuid: string;
    }[]
  >([]);
  const { userInfo } = useAuthCore();
  const { fetchFriendKeys, friendKeyWhiteList } = useFriendFi();
  useEffect(() => {
    fetchFriendKeys();
  }, [fetchFriendKeys]);

  useEffect(() => {
    if (friendKeyWhiteList.length === 0) return;
    const friendKeyWhiteListFilter = friendKeyWhiteList.filter(
      (item) => item.uuid !== userInfo?.uuid
    );
    const highsetTierKey = Object.values(
      friendKeyWhiteListFilter.reduce(
        (acc: { [key: string]: { tier: number; uuid: string } }, item) => {
          if (!acc[item.uuid] || acc[item.uuid].tier < parseInt(item.tier)) {
            acc[item.uuid] = { tier: parseInt(item.tier), uuid: item.uuid };
          }
          return acc;
        },
        {}
      )
    );
    const highsetTierKeys = highsetTierKey
      .map((item) => {
        return Array.from({ length: +item.tier + 1 }).map((_, i) => {
          return { uuid: item.uuid, tier: i.toString() };
        });
      })
      .flat();
    try {
      (async () => {
        try {
          const postsResponse = await backend.getPostWhiteList(highsetTierKeys);
          const updatedPosts = await Promise.all(
            postsResponse?.data.data.map(async (post: any) => {
              const userResponse = await backend.getUser(post.uuid);
              return {
                name: userResponse?.data?.data[0]?.name || "",
                content: post.content,
                createdAt: post.createdAt,
                level: post.tier,
                image: undefined,
                uuid: post.uuid,
              };
            })
          );
          setPostList(updatedPosts);
        } catch (error) {
          console.error("Error fetching posts:", error);
        }
      })();
    } catch (e) {
      console.error(e);
    }
  }, [friendKeyWhiteList, userInfo?.uuid]);
  if (isLayoutLoading) return <></>;
  return (
    <div className="text-center text-sm font-sans flex flex-col mt-7 w-full pb-[120px]">
      <MyPostBar />
      {postList.length > 0 ? (
        postList.map((post, key) => {
          return (
            <>
              <hr className="my-5" />
              <PostItem key={key} {...post} />
            </>
          );
        })
      ) : (
        <div className="text-center text-sm font-sans flex flex-col justify-center items-center h-screen w-full">
          <div>
            <h2 className="text-xl font-semibold">Find some friend</h2>
            <p className="text-secondary">
              You have never conneted to anyone yet.
            </p>
            <p className="text-secondary">Let&apos;s discover new friend!</p>
          </div>
          <div className="w-36">
            <FFButton
              className="w-full text-base"
              onClick={() => router.push("friends")}
            >
              Discover
            </FFButton>
          </div>
        </div>
      )}
    </div>
  );
}
