import { CovalentClient } from "@covalenthq/client-sdk";

export const covalent = new CovalentClient(process.env.NEXT_PUBLIC_COVALENT_API_KEY || "");