import repository from "./teacher.repository.js";

const teacherService = {
  listTeachers: async () => repository.findAll(),
};

export default teacherService;
