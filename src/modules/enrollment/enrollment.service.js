import repository from "./enrollment.repository.js";

const enrollmentService = {
  listEnrollments: async () => repository.findAll(),
};

export default enrollmentService;
