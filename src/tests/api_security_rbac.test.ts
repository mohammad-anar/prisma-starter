process.env.NODE_ENV = "test";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { Secret } from "jsonwebtoken";
import app from "../app.js";
import env from "../config/env.js";
import { jwtHelper } from "../utils/jwt.js";
import { UserRole } from "@prisma/client";

describe("API Security, Validation, and RBAC Integration Tests", () => {
  // Test JWT tokens with specific roles
  const donorToken = jwtHelper.createToken(
    { id: "507f1f77bcf86cd799439011", phone: "01711111111", role: UserRole.DONOR, status: "APPROVED" },
    env.jwt.jwt_secret as Secret,
    "1h",
  );

  const adminToken = jwtHelper.createToken(
    { id: "507f1f77bcf86cd799439022", phone: "01722222222", role: UserRole.ADMIN, status: "APPROVED" },
    env.jwt.jwt_secret as Secret,
    "1h",
  );

  const superAdminToken = jwtHelper.createToken(
    { id: "507f1f77bcf86cd799439033", phone: "01733333333", role: UserRole.SUPERADMIN, status: "APPROVED" },
    env.jwt.jwt_secret as Secret,
    "1h",
  );

  it("GET / should return server health and project info", async () => {
    const res = await request(app).get("/");
    assert.equal(res.status, 200);
    assert.match(res.body.message, /ফুলপুর ব্লাড ডোনার নেটওয়ার্ক/);
    assert.equal(res.body.database, "MongoDB with Prisma ORM");
  });

  it("GET /api-docs/swagger.json should serve OpenAPI 3.0 documentation", async () => {
    const res = await request(app).get("/api-docs/swagger.json");
    assert.equal(res.status, 200);
    assert.equal(res.body.openapi, "3.0.0");
    assert.ok(res.body.paths["/api/v1/auth/register"]);
    assert.ok(res.body.paths["/api/v1/donors"]);
    assert.ok(res.body.paths["/api/v1/admin/donors"]);
    assert.ok(res.body.paths["/api/v1/superadmin/admins"]);
  });

  it("POST /api/v1/auth/register should reject requests with missing required fields", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Test User",
      // Missing phone, bloodGroup, password, addresses
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Validation Error");
    assert.ok(res.body.errorMessages.length > 0);
  });

  it("POST /api/v1/auth/login should reject empty credentials", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it("GET /api/v1/admin/donors should reject unauthenticated requests with 401 Unauthorized", async () => {
    const res = await request(app).get("/api/v1/admin/donors");
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it("GET /api/v1/admin/donors should reject DONOR role with 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/v1/admin/donors")
      .set("Authorization", `Bearer ${donorToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access denied/);
  });

  it("GET /api/v1/superadmin/admins should reject ADMIN role with 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/v1/superadmin/admins")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access denied/);
  });

  it("GET /api/v1/donors/:id should reject invalid MongoDB ObjectId with 400 Bad Request", async () => {
    const res = await request(app).get("/api/v1/donors/invalid-mongo-id-123");
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Invalid MongoDB ObjectId/);
  });

  it("POST /api/v1/emergency-requests should reject non-positive bag count", async () => {
    const res = await request(app).post("/api/v1/emergency-requests").send({
      title: "Need blood urgently",
      rugirNam: "Patient Name",
      thikana: "Phulpur Hospital",
      phone: "01712345678",
      bloodGroup: "O+",
      kotoBag: 0, // Invalid: must be positive
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Validation Error");
  });
});
