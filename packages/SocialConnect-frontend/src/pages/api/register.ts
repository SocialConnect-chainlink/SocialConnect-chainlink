import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { mongo } from "@/lib/mongodb";
const sdk = require("api")("@particlenetwork/v1.0#2ygu0a82elptcg1dc");

type ResponseData = {
  message: string;
  data?: any;
};

async function validateParticleAuth(uuid: string, token: string) {
  const url = "https://api.particle.network/server/rpc/#getUserInfo";
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getUserInfo",
    params: [uuid, token],
  });

  const authToken = process.env.PARTICLE_AUTH;
  try {
    const res = await axios
      .post(url, body, {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Basic ${authToken}`,
        },
      })
      .then((res) => res.data);
    return res;
  } catch (e) {
    console.log("fetch:validateParticleAuth", e);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { uuid, token, userInfo } = req.body;

  if (req.method === "POST") {
    // Process a POST request
    try {
      console.log('test1');
      const { db } = await mongo();
      console.log('test2');

      const userCollection = db.collection("users");
      console.log('test3');
      const particleUser = await validateParticleAuth(uuid, token);
      // const particleUser = userInfo;
      console.log('test4');

      if (particleUser) {
        const userData = { uuid: uuid, ...particleUser.result };
        const existed = await userCollection.findOne({ _id: uuid });
        if (existed) {
          await userCollection.updateOne({ _id: uuid }, { $set: userData });
        } else {
          await userCollection.insertOne({ _id: uuid, ...userData });
        }
        // await userCollection.findOneAndUpdate({ _id: uuid }, { $setOnInsert: userData });
        return res.status(200).json({ message: "Success", data: userData });
      } else {
        return res.status(400).send({ message: "Invalid credentials" });
      }
    } catch (e) {
      return res.status(500).send({ message: "Database error" });
    }
  } else {
    // Handle any other HTTP method
    res.status(400).json({ message: "Unsupported method. Only support POST" });
  }
}
