import {
  UsersIcon,
  HomeIcon,
  ShoppingBag,
  UserIcon,
  MessageSquareIcon,
} from "lucide-react";

export const BOTTOM_MENU_ITEMS = [
  {
    name: "Home",
    icon: HomeIcon,
    path: "/",
  },
  {
    name: "Chat",
    icon: MessageSquareIcon,
    path: "/chat",
  },
  {
    name: "Friends",
    icon: UsersIcon,
    path: "/friends",
  },
  {
    name: "Market",
    icon: ShoppingBag,
    path: "/market",
  },
  {
    name: "Profile",
    icon: UserIcon,
    path: "/profile",
  },
];
