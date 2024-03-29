const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const middleware = require("../middleware");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT * FROM invoices");
    return res.json({ invoices: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const results = await db.query(
      "SELECT id, amt, paid, add_date, paid_date, code, name, description FROM invoices JOIN companies ON invoices.comp_code=companies.code WHERE id=$1",
      [req.params.id]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`No invoice with id of ${req.params.id}`, 404);
    }

    const { id, amt, paid, add_date, paid_date, code, name, description } =
      results.rows[0];
    const company = { code, name, description };
    const invoice = { id, amt, paid, add_date, paid_date, company };
    return res.json({ invoice });
  } catch (err) {
    return next(err);
  }
});

router.post("/", middleware.checkInvoicesPosts, async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      "INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *",
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt, paid } = req.body;
    let results;
    if (paid == true) {
      results = await db.query(
        "UPDATE invoices SET amt=$1, paid=$2, paid_date=CURRENT_DATE WHERE id=$3 RETURNING *",
        [amt, paid, id]
      );
    } else if (paid == false) {
      results = await db.query(
        "UPDATE invoices SET amt=$1, paid=$2, paid_date=null WHERE id=$3 RETURNING *",
        [amt, paid, id]
      );
    } else {
      results = await db.query(
        "UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *",
        [amt, id]
      );
    }

    if (results.rows.length === 0) {
      throw new ExpressError(`No invoice with id of ${id}`, 404);
    }

    return res.json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const find = await db.query("SELECT * FROM invoices WHERE id=$1", [id]);
    if (find.rows.length === 0) {
      throw new ExpressError(`No invoice with id of ${id}`, 404);
    }
    const results = await db.query("DELETE FROM invoices WHERE id=$1", [id]);
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
