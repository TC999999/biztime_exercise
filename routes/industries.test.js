process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testIndustry;

beforeEach(async () => {
  const createCompany = await db.query(
    "INSERT INTO companies (code, name, description) VALUES ('test', 'TestCompany', 'testing testing') RETURNING *"
  );
  testCompany = createCompany.rows[0];

  const createIndustry = await db.query(
    "INSERT INTO industries (code, name) VALUES ('acct', 'Accounting') RETURNING *"
  );
  testIndustry = createIndustry.rows[0];

  await db.query(
    "INSERT INTO companies_industries (comp_code, industry_code) VALUES ('test', 'acct') RETURNING *"
  );
});

afterEach(async () => {
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM industries");
  await db.query("DELETE FROM companies_industries");
});

afterAll(async () => {
  await db.end();
});

describe("GET /industries", () => {
  test("Get a list with one industry", async () => {
    const res = await request(app).get("/industries");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      industries: [{ ...testIndustry, companies: [testCompany.code] }],
    });
  });
});

describe("GET /industries/:industry_code", () => {
  test("Get a single industry", async () => {
    const res = await request(app).get(`/industries/${testIndustry.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      industry: { ...testIndustry, companies: [testCompany.code] },
    });
  });

  test("Responds with 404 when invalid industry code", async () => {
    const res = await request(app).get(`/industries/idontexist`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /industries", () => {
  test("Creates a single industry", async () => {
    const res = await request(app)
      .post("/industries")
      .send({ code: "tech", name: "Technology" });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      industry: { code: "tech", name: "Technology" },
    });
  });
});

describe("POST /industries/:industry_code", () => {
  test("Creates a relationship between an industry and a company", async () => {
    const res = await request(app)
      .post("/industries")
      .send({ code: "tech", name: "Technology" });

    const res2 = await request(app)
      .post(`/industries/${res.body.industry.code}`)
      .send({ company_code: testCompany.code });
    expect(res2.statusCode).toBe(201);
    expect(res2.body).toEqual({
      company_industry_relationship: {
        comp_code: "test",
        industry_code: "tech",
      },
    });
  });
});

describe("PATCH /industries/:industry_code", () => {
  test("Updates a single industry", async () => {
    const res = await request(app)
      .patch(`/industries/${testIndustry.code}`)
      .send({ name: "Not Accounting" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      industry: {
        code: testIndustry.code,
        name: "Not Accounting",
      },
    });
  });

  test("Responds with 404 when invalid industry code", async () => {
    const res = await request(app)
      .patch(`/industries/idontexist`)
      .send({ name: "Non-Existent Industry" });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /industries/:industry_code", () => {
  test("Deletes a single industry", async () => {
    const res = await request(app).delete(`/industries/${testIndustry.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: "deleted",
    });
  });

  test("Responds with 404 when invalid industry code", async () => {
    const res = await request(app).delete(`/industries/idontexist`);
    expect(res.statusCode).toBe(404);
  });
});
