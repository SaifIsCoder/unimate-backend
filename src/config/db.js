import env from "./env.js";

export const getDbConfig = () => env.db;

export const connectDb = async () => {
  return {
    connected: false,
    message: "Database connection is not implemented yet.",
    config: getDbConfig(),
  };
};
