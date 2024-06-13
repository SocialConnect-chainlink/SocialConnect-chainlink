import type { NextApiRequest, NextApiResponse } from "next";
import { mongo } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { db } = await mongo();

  const { whitelist } = req.body;

  if (req.method === "POST") {
    if (whitelist) {
      const posts = await db
        .collection("posts")
        .find({
          $or: whitelist.map(
            ({ uuid, tier }: { uuid: string; tier: string }) => ({ uuid, tier })
          ),
        })
        .sort({ createdAt: -1 })
        .toArray();
      return res.status(200).json({ message: "Success", data: posts });
    }
    return res.status(400).json({ message: "Whitelist is not found" });
  }
}
