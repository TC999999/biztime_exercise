process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const { json } = require("express");

let testCompany;
let testInvoice;
beforeEach(async () => {
  const companyResult = await db.query(
    "INSERT INTO companies (code, name, description) VALUES ('test','TestCompany','testing') RETURNING *"
  );
  testCompany = companyResult.rows[0];

  const invoiceResult = await db.query(
    "INSERT INTO invoices (comp_code, amt) VALUES ('test', 1000) RETURNING *"
  );
  let jsonStr = JSON.stringify(invoiceResult.rows[0]);
  testInvoice = JSON.parse(jsonStr);
  //   testInvoice.id = String(testInvoice.id);
  //   console.log(testCompany);
  //   console.log(testInvoice);
});

afterEach(async () => {
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("Get a list with one invoice", async () => {
    const res = await request(app).get("/invoices");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ invoices: [testInvoice] });
  });
});

describe("GET /invoices/:id", () => {
  test("Get a single invoice", async () => {
    const res = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    const { id, amt, paid, add_date, paid_date } = testInvoice;
    const invoice = { id, amt, paid, add_date, paid_date };
    expect(res.body).toEqual({
      invoice: { ...invoice, company: { ...testCompany } },
    });
  });

  test("Responds with 404 with invalid invoice id", async () => {
    const res = await request(app).get(`/invoices/0`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /invoices", () => {
  test("Creates a single invoice", async () => {
    const res = await request(app)
      .post("/invoices")
      .send({ amt: 400, comp_code: "test" });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "test",
        amt: 400,
        paid: false,
        add_date: testInvoice.add_date,
        paid_date: null,
      },
    });
  });
});

describe("PATCH /invoices/:id", () => {
  test("Updates a single invoice not paid yet", async () => {
    const res = await request(app)
      .patch(`/invoices/${testInvoice.id}`)
      .send({ amt: 300 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "test",
        amt: 300,
        paid: false,
        add_date: testInvoice.add_date,
        paid_date: null,
      },
    });
  });

  test("Updates a single invoice when paid", async () => {
    const res = await request(app)
      .patch(`/invoices/${testInvoice.id}`)
      .send({ amt: 300, paid: true });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "test",
        amt: 300,
        paid: true,
        add_date: testInvoice.add_date,
        paid_date: testInvoice.add_date,
      },
    });
  });

  test("Updates a single invoice when unpaid", async () => {
    const res = await request(app)
      .patch(`/invoices/${testInvoice.id}`)
      .send({ amt: 300, paid: false });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "test",
        amt: 300,
        paid: false,
        add_date: testInvoice.add_date,
        paid_date: null,
      },
    });
  });

  test("Responds with 404 with invalid invoice id", async () => {
    const res = await request(app).patch(`/invoices/0`).send({ amt: 300 });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE/invoices/:id", () => {
  test("Deletes a single invoice", async () => {
    const res = await request(app).delete(`/invoices/${testInvoice.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: "deleted",
    });
  });

  test("Responds with 404 with invalid invoice id", async () => {
    const res = await request(app).delete(`/invoices/0`);
    expect(res.statusCode).toBe(404);
  });
});
