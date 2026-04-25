import repository from "./course.repository.js";

const courseService = {
  listCourses: async () => repository.findAll(),
};

export default courseService;
