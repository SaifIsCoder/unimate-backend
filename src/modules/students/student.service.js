import repository from "./student.repository.js";

const studentService = {
  listStudents: async () => repository.findAll(),
};

export default studentService;
