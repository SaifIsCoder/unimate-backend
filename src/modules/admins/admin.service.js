import repository from "./admin.repository.js";

const adminService = {
  listAdmins: async () => repository.findAll(),
};

export default adminService;
