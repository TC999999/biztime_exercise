const ExpressError = require("./expressError");

function logger(req, res, next) {
  console.log(`Received a ${req.method} request to ${req.path}.`);
  return next();
}

function checkCompaniesPosts(req, res, next) {
  try {
    if (!req.body.code || !req.body.name) {
      throw new ExpressError(
        "Requires both company code and company name",
        400
      );
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
}

function checkInvoicesPosts(req, res, next) {
  try {
    if (!req.body.comp_code || !req.body.amt) {
      throw new ExpressError(
        "Requires both company code and invoice amount",
        400
      );
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
}

module.exports = { logger, checkCompaniesPosts, checkInvoicesPosts };
