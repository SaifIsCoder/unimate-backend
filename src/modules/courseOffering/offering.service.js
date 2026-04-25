import repository from "./offering.repository.js";

const offeringService = {
  listOfferings: async () => repository.findAll(),
};

export default offeringService;
