import repository from "./auth.repository.js";

const authService = {
  login: async (payload) => {
    const user = await repository.findByEmail(payload.email);

    return {
      user,
      token: "mock-token",
    };
  },
};

export default authService;
