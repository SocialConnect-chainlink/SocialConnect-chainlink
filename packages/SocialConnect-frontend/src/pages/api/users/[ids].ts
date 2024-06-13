import { mongo } from "@/lib/mongodb";
import type { NextApiRequest, NextApiResponse } from "next";
// import clientPromise from '@/lib/mongodb';

type ResponseData = {
  message: string;
  data?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // const client = await clientPromise;

  if (req.method === "GET") {
    try {
      const { db } = await mongo();

      const ids = req.query.ids ? (req.query.ids as string).split(",") : [];
      console.log(ids);
      const users = await db
        .collection("users")
        .find({ _id: { $in: ids as any } })
        .toArray();
      return res.status(200).json({ message: "Success", data: await users });
    } catch (e) {
      return res.status(500).json({ message: "Database error" });
    }
  } else {
    // Handle any other HTTP method
    res.status(400).json({ message: "Unsupported method. Only support POST" });
  }
}
