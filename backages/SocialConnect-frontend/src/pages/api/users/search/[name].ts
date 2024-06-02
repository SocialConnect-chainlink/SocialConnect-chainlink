import { mongo } from "@/lib/mongodb";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  message: string;
  data?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === "GET") {
    try {
      const { db } = await mongo();
      const name = req.query.name as string;

      const searchQuery = { name: { $regex: new RegExp(name, "i") } };
      const users = await db.collection("users").find(searchQuery).toArray();

      return res.status(200).json({ message: "Success", data: users });
    } catch (e) {
      return res.status(500).json({ message: "Database error" });
    }
  } else {
    // Handle any other HTTP method
    res.status(400).json({ message: "Unsupported method. Only support POST" });
  }
}
