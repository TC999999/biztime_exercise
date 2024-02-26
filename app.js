/** BizTime express application. */

const express = require("express");
// const middleware = require("./middleware");

const app = express();
const ExpressError = require("./expressError");

app.use(express.json());
// app.use(middleware.logger);

const cRoutes = require("./routes/companies");
app.use("/companies", cRoutes);

const invRoutes = require("./routes/invoices");
app.use("/invoices", invRoutes);

const indRoutes = require("./routes/industries");
app.use("/industries", indRoutes);

/** 404 handler */

app.use(function (req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    method: req.method,
  });
});

module.exports = app;
