import type { NextApiRequest, NextApiResponse } from "next";
import { mongo } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { db } = await mongo();

  const { uuid } = req.query;
  if (req.method === "POST") {
    console.log(req.body);
    const posts = await db
      .collection("posts")
      .insertOne({ ...req.body, createdAt: new Date() });
    return res.status(200).json({ message: "Success", data: posts });
  }

  if (req.method === "GET") {
    if (uuid) {
      const posts = await db
        .collection("posts")
        .find({ uuid: uuid })
        .sort({ createdAt: -1 })
        .toArray();
      return res.status(200).json({ message: "Success", data: posts });
    }
    const posts = await db
      .collection("posts")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    return res.status(200).json({ message: "Success", data: posts });
  }
}
