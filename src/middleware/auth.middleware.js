export default (req, res, next) => {
  req.user = null;
  next();
};
