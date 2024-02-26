process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
beforeEach(async () => {
  const result = await db.query(
    "INSERT INTO companies (code, name, description) VALUES ('test','TestCompany','testing') RETURNING *"
  );
  testCompany = result.rows[0];
});

afterEach(async () => {
  await db.query("DELETE FROM companies");
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Get a list with one company", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [testCompany] });
  });
});

describe("GET /companies/:code", () => {
  test("Get a single company", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: { ...testCompany, invoices: [], industries: [] },
    });
  });

  test("Responds with 404 when invalid code", async () => {
    const res = await request(app).get(`/companies/nonexistentcompany`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /companies", () => {
  test("Creates a single company", async () => {
    const res = await request(app).post("/companies").send({
      name: "Test Company 2",
      description: "more testing",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
        code: "test_company_2",
        name: "Test Company 2",
        description: "more testing",
      },
    });
  });
});

describe("PATCH /companies/:code", () => {
  test("Updates a single company", async () => {
    const res = await request(app)
      .patch(`/companies/${testCompany.code}`)
      .send({ name: "NewTestCompany", description: "still testing" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: "test",
        name: "NewTestCompany",
        description: "still testing",
      },
    });
  });

  test("Responds with 404 when invalid code", async () => {
    const res = await request(app)
      .patch(`/companies/nonexistentcompany`)
      .send({ name: "NewTestCompany", description: "still testing" });

    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /companies/:code", () => {
  test("Deletes a single company", async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: "deleted",
    });
  });

  test("Responds with 404 when invalid code", async () => {
    const res = await request(app).delete(`/companies/nonexistentcompany`);
    expect(res.statusCode).toBe(404);
  });
});
