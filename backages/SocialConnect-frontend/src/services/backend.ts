import axios from "axios";

const register = async (
  uuid: string,
  token: string,
  userInfo: import("@particle-network/auth-core").UserInfo
) => {
  try {
    const res = await axios.post("/api/register", { uuid, token, userInfo });
    return res;
  } catch (e) {
    console.error(e);
  }
};

const getUser = async (uuid: string) => {
  try {
    const res = await axios.get(`/api/users/${uuid}`);
    return res;
  } catch (e) {
    console.error(e);
  }
};

const createPost = async (data: {
  content: string;
  tier: string;
  uuid: string;
}) => {
  try {
    const res = await axios.post(`/api/posts`, data);
    return res;
  } catch (e) {
    console.error(e);
  }
};

const getPosts = async () => {
  try {
    const res = await axios.get(`/api/posts`);
    return res;
  } catch (e) {
    console.error(e);
  }
};

const getPost = async (uuid: string) => {
  try {
    const res = await axios.get(`/api/posts/?uuid=${uuid}`);
    return res;
  } catch (e) {
    console.error(e);
  }
};

const getPostWhiteList = async (
  whitelist: { uuid: string; tier: string }[]
) => {
  try {
    const res = await axios.post(`/api/posts/whitelists`, { whitelist });
    return res;
  } catch (e) {
    console.error(e);
  }
};

const searchUser = async (name: string) => {
  try {
    const res = await axios.get(`/api/users/search/${name}`);
    return res;
  } catch (e) {
    console.error(e);
  }
};

export const backend = {
  searchUser,
  register,
  getUser,
  createPost,
  getPosts,
  getPost,
  getPostWhiteList,
};
