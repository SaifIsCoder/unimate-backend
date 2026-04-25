import repository from "./user.repository.js";

const userService = {
  listUsers: async () => repository.findAll(),
};

export default userService;
