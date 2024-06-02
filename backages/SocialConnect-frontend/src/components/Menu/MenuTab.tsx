import { useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostItem from "../Post/PostItem";
import { backend } from "@/services/backend";
import { useFriendFi } from "@/hooks/useFriendFi";
import { useAuthCore } from "@particle-network/auth-core-modal";

export default function MenuTab({
  uuid,
  name,
  highestTier = 2,
}: {
  name: string;
  uuid: string;
  highestTier?: number;
}) {
  const [currentTab, setCurrentTab] = useState<"post" | "statistics">("post");
  const [posts, setPosts] = useState([]);
  const { userInfo } = useAuthCore();
  useEffect(() => {
    try {
      (async () => {
        try {
          const whitelist = Array.from({ length: userInfo?.uuid === uuid ? 3 : highestTier + 1 }).map((_, i) => {
            return { uuid, tier: i.toString() };
          });
          const postsResponse = await backend.getPostWhiteList(whitelist);
          console.log(postsResponse);
          const _posts = postsResponse?.data.data.map((post: any) => {
            return {
              name: name,
              content: post.content,
              createdAt: post.createdAt,
              level: post.tier,
              image: undefined,
              uuid: uuid,
            };
          });
          setPosts(_posts);
        } catch (error) {
          console.error("Error fetching posts:", error);
        }
      })();
    } catch (e) {
      console.error(e);
    }
  }, [highestTier, name, uuid]);
  return (
    <div className="pt-7 font-sans">
      <Tabs
        defaultValue="post"
        value={currentTab}
        onValueChange={(value) => setCurrentTab(value as "post" | "statistics")}
        className="w-full h-full"
      >
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="post">Post</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>
        <hr />
        <TabsContent value="post" className="flex flex-col px-1">
          {posts &&
            posts.length > 0 &&
            posts.map((post: any, key) => {
              return (
                <>
                  <PostItem key={key} {...post} />
                  <hr className="my-5" />
                </>
              );
            })}
        </TabsContent>
        <TabsContent
          value="statistics"
          className="text-center text-sm font-sans flex flex-col justify-center items-center h-full w-full space-y-3"
        >
          Statistics covalent...
        </TabsContent>
      </Tabs>
    </div>
  );
}
