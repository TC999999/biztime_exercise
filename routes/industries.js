const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const middleware = require("../middleware");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT * FROM industries");
    const promises = results.rows.map(async (i) => {
      const c = await db.query(
        `SELECT c.code FROM industries AS i JOIN companies_industries AS ci ON i.code=ci.industry_code JOIN companies AS c ON ci.comp_code=c.code WHERE i.code=$1`,
        [i.code]
      );
      const compArr = c.rows.map((val) => {
        return val.code;
      });
      i.companies = compArr;
      return i;
    });
    const newIndArr = await Promise.all(promises);
    return res.json({ industries: newIndArr });
  } catch (err) {
    return next(err);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    const results = await db.query(
      "SELECT i.code AS code, i.name AS name, c.code AS company_code FROM industries as i JOIN companies_industries AS ci ON i.code=ci.industry_code JOIN companies AS c ON ci.comp_code=c.code WHERE i.code=$1",
      [req.params.code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(
        `Industry not found with code ${req.params.code}`,
        404
      );
    }
    const { name, code } = results.rows[0];
    let companies = results.rows.map((val) => {
      return val.company_code;
    });
    console.log(companies);
    return res.json({ industry: { code, name, companies } });
  } catch (err) {
    return next(err);
  }
});

router.post("/", middleware.checkIndustriesPosts, async (req, res, next) => {
  try {
    const { code, name } = req.body;
    const results = await db.query(
      "INSERT INTO industries (code, name) VALUES ($1, $2) RETURNING *",
      [code, name]
    );
    return res.status(201).json({ industry: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.post(
  "/company/:code",
  middleware.checkIndustriesCompaniesPosts,
  async (req, res, next) => {
    try {
      const findInd = await db.query(
        "SELECT code FROM industries WHERE code=$1",
        [req.params.code]
      );
      if (findInd.rows.length === 0) {
        throw new ExpressError(
          `Industry not found with code ${req.params.code}`,
          404
        );
      }

      const findComp = await db.query(
        "SELECT code FROM companies WHERE code=$1",
        [req.body.comp_code]
      );
      if (findComp.rows.length === 0) {
        throw new ExpressError(
          `Company not found with code ${req.body.comp_code}`,
          404
        );
      }

      const findRel = await db.query(
        "SELECT * FROM companies_industries WHERE comp_code=$1 AND industry_code=$2",
        [req.body.comp_code, req.params.code]
      );
      if (findRel.rows.length > 0) {
        throw new ExpressError(
          `Relationship exists between company with code ${req.body.comp_code} and industry with code ${req.params.code}`,
          400
        );
      }

      const results = await db.query(
        "INSERT INTO companies_industries (comp_code, industry_code) VALUES ($1, $2) RETURNING *",
        [req.body.comp_code, req.params.code]
      );
      return res
        .status(201)
        .json({ company_industry_relationship: results.rows[0] });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch("/:code", async (req, res, next) => {
  try {
    const results = await db.query(
      "UPDATE industries SET name=$1 WHERE code=$2 RETURNING *",
      [req.body.name, req.params.code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(
        `Industry not found with code ${req.params.code}`,
        404
      );
    }
    return res.json({ industry: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const findInd = await db.query(
      "SELECT code FROM industries WHERE code=$1",
      [req.params.code]
    );
    if (findInd.rows.length === 0) {
      throw new ExpressError(
        `Industry not found with code ${req.params.code}`,
        404
      );
    }
    await db.query("DELETE FROM industries WHERE code=$1", [req.params.code]);
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

router.delete(
  "/company/:code",
  middleware.checkIndustriesCompaniesPosts,
  async (req, res, next) => {
    try {
      const findInd = await db.query(
        "SELECT code FROM industries WHERE code=$1",
        [req.params.code]
      );
      if (findInd.rows.length === 0) {
        throw new ExpressError(
          `Industry not found with code ${req.params.code}`,
          404
        );
      }

      const findComp = await db.query(
        "SELECT code FROM companies WHERE code=$1",
        [req.body.comp_code]
      );
      if (findComp.rows.length === 0) {
        throw new ExpressError(
          `Company not found with code ${req.body.comp_code}`,
          404
        );
      }

      const findRel = await db.query(
        "SELECT * FROM companies_industries WHERE comp_code=$1 AND industry_code=$2",
        [req.body.comp_code, req.params.code]
      );
      if (findRel.rows.length === 0) {
        throw new ExpressError(
          `No relationship found between company with code ${req.body.comp_code} and industry ${req.params.code}`,
          400
        );
      }

      await db.query(
        "DELETE FROM companies_industries WHERE comp_code=$1 AND industry_code=$2",
        [req.body.comp_code, req.params.code]
      );
      return res.json({ status: "relationship deleted" });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
