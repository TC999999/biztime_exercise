const express = require("express");
const slugify = require("slugify");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const middleware = require("../middleware");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT * FROM companies");
    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const companySelect = await db.query(
      "SELECT * FROM companies WHERE code=$1",
      [code]
    );
    if (companySelect.rows.length === 0) {
      throw new ExpressError(`No company with code of ${code}`, 404);
    }
    const company = companySelect.rows[0];

    const invoicesSelect = await db.query(
      "SELECT id, amt, paid, add_date, paid_date FROM invoices WHERE comp_code=$1",
      [code]
    );
    const invoices = invoicesSelect.rows;

    const industriesSelect = await db.query(
      "SELECT i.name FROM companies AS c JOIN companies_industries AS ci ON c.code=ci.comp_code JOIN industries AS i ON ci.industry_code=i.code WHERE c.code=$1",
      [code]
    );
    const industries = industriesSelect.rows.map((i) => {
      return i.name;
    });

    company.invoices = invoices;
    company.industries = industries;
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

router.post("/", middleware.checkCompaniesPosts, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const code = slugify(name, {
      replacement: "_",
      lower: true,
      strict: true,
      trim: true,
    });
    const results = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *",
      [code, name, description]
    );
    return res.status(201).json({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query(
      "UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *",
      [name, description, code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`No company with code of ${code}`, 404);
    }
    return res.json({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const find = await db.query("SELECT * FROM companies WHERE code=$1 ", [
      code,
    ]);
    if (find.rows.length === 0) {
      throw new ExpressError(`No company with code of ${code}`, 404);
    }
    const results = await db.query("DELETE FROM companies WHERE code=$1", [
      code,
    ]);
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
