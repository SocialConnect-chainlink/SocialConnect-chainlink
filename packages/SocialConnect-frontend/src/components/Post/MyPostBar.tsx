import { useAuthCore } from "@particle-network/auth-core-modal";
import { IconName } from "../ui/iconName";
import { Picture } from "../Icon";
import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { backend } from "@/services/backend";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
} from "../ui/select";
import { SelectTrigger } from "@radix-ui/react-select";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

export default function MyPostBar() {
  const { userInfo } = useAuthCore();
  const [content, setContent] = useState("");
  const [tier, setTier] = useState("0");

  const router = useRouter();

  const name = useMemo(() => {
    return userInfo?.thirdparty_user_info?.user_info
      ? userInfo.thirdparty_user_info?.user_info?.name
      : "";
  }, [userInfo?.thirdparty_user_info?.user_info]);

  const handleCreatePost = async () => {
    try {
      await backend.createPost({
        content,
        tier,
        uuid: userInfo?.uuid || "",
      });
      setContent("");
      setTier("0");
      toast.success("Post Create Successfully!");
      router.reload();
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <div className="flex items-center">
      <div className="space-x-3 flex items-center w-full pr-3">
        <IconName name={name} className="w-12 h-10" />
        <Input
          className="text-tertiary text-sm border-0 w-full"
          placeholder="What's on your mind?"
          onChange={(e) => setContent(e.target.value)}
          value={content}
        />
        {/* <p className="text-tertiary text-sm">What&apos;s on your mind?</p> */}
      </div>
      {/* <Picture /> */}
      <Select value={tier} onValueChange={(value) => setTier(value)}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="0">Common</SelectItem>
            <SelectItem value="1">Close</SelectItem>
            <SelectItem value="2">Best</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button className="rounded-full" onClick={handleCreatePost}>
        Post
      </Button>
    </div>
  );
}
