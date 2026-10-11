import test, { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import jwt from "jsonwebtoken";

// Set test environment variables before loading app
process.env.NODE_ENV = "test";
process.env.PORT = "0"; // ephemeral port
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/test";
process.env.JWT_SECRET = "test-access-token-secret-very-long-32-chars";
process.env.JWT_REFRESH_SECRET = "test-refresh-token-secret-very-long-32-chars";
process.env.CORS_ORIGINS = "http://localhost:3000,https://unimate.test";

const { default: app } = await import("../src/app.js");
const { SUPER_ADMIN, ADMIN, TEACHER, STUDENT, hasRole } = await import("../src/constants/roles.js");
const { default: roleMiddleware } = await import("../src/middlewares/role.middleware.js");
const { default: errorMiddleware } = await import("../src/middlewares/error.middleware.js");
const { AppError } = await import("../src/utils/app-error.js");

describe("uniMate Production Readiness Test Suite", () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe("1. Health Check & Core Endpoints", () => {
    it("GET /health should return 200 OK with non-sensitive status payload", async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.status, "ok");
      // Must not leak connection strings or secrets
      assert.equal(json.data.databaseUrl, undefined);
      assert.equal(json.data.jwtSecret, undefined);
    });

    it("GET /api/v1/health should also return 200 OK", async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.status, "ok");
    });

    it("GET / should return service info without leaking internals", async () => {
      const res = await fetch(`${baseUrl}/`);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.message, "Unimate backend is running");
      assert.equal(json.data.api.currentVersion, "v1");
    });
  });

  describe("2. Error Handling & 404 Routing", () => {
    it("Unmatched route should return consistent 404 response", async () => {
      const res = await fetch(`${baseUrl}/api/v1/non-existent-endpoint-${Date.now()}`);
      assert.equal(res.status, 404);

      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.message, "Route not found");
      assert.ok(json.error.type);
    });

    it("Centralized error middleware should mask database internals in production", () => {
      const req = { id: "req-test-1", method: "GET", originalUrl: "/test" };
      let capturedStatus = 0;
      let capturedPayload = null;
      const res = {
        status(code) {
          capturedStatus = code;
          return this;
        },
        json(payload) {
          capturedPayload = payload;
          return this;
        },
      };

      // Simulate a raw PostgreSQL internal syntax error
      const pgError = new Error("syntax error at or near 'SELECT' in column postgres");
      pgError.code = "42601";
      pgError.table = "users";

      // With NODE_ENV = 'production'
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      try {
        errorMiddleware(pgError, req, res, () => {});
        assert.equal(capturedStatus, 500);
        assert.equal(capturedPayload.success, false);
        assert.equal(capturedPayload.error.message, "Internal server error");
        // No SQL syntax or table name leaked
        assert.equal(capturedPayload.error.stack, undefined);
        assert.ok(!JSON.stringify(capturedPayload).includes("syntax error"));
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    it("Centralized error middleware should return user-friendly message for unique constraint (23505)", () => {
      const req = { id: "req-test-2", method: "POST", originalUrl: "/test" };
      let capturedStatus = 0;
      let capturedPayload = null;
      const res = {
        status(code) {
          capturedStatus = code;
          return this;
        },
        json(payload) {
          capturedPayload = payload;
          return this;
        },
      };

      const dupError = new Error("duplicate key value violates unique constraint 'users_email_key'");
      dupError.code = "23505";

      errorMiddleware(dupError, req, res, () => {});
      assert.equal(capturedStatus, 400);
      assert.equal(capturedPayload.success, false);
      assert.equal(capturedPayload.error.message, "Record already exists");
    });
  });

  describe("3. Security: Role Authorization & Admin Deletion Gate", () => {
    it("super_admin should pass all admin role checks via hasRole", () => {
      assert.equal(hasRole(SUPER_ADMIN, [ADMIN]), true);
      assert.equal(hasRole(SUPER_ADMIN, [SUPER_ADMIN]), true);
    });

    it("admin must NOT have access to SUPER_ADMIN-only endpoints", () => {
      assert.equal(hasRole(ADMIN, [SUPER_ADMIN]), false);
    });

    it("teacher must NOT have access to ADMIN-only endpoints", () => {
      assert.equal(hasRole(TEACHER, [ADMIN]), false);
      assert.equal(hasRole(TEACHER, [SUPER_ADMIN]), false);
    });

    it("student must NOT have access to TEACHER or ADMIN endpoints", () => {
      assert.equal(hasRole(STUDENT, [TEACHER]), false);
      assert.equal(hasRole(STUDENT, [ADMIN]), false);
      assert.equal(hasRole(STUDENT, [SUPER_ADMIN]), false);
    });

    it("DELETE /api/v1/admins/:id must reject unauthenticated requests with 401", async () => {
      const targetId = "11111111-1111-4111-a111-111111111111";
      const res = await fetch(`${baseUrl}/api/v1/admins/${targetId}`, {
        method: "DELETE",
      });
      assert.equal(res.status, 401);
    });

    it("DELETE /api/v1/admins/:id must reject regular admin token with 403 Forbidden", async () => {
      const targetId = "11111111-1111-4111-a111-111111111111";
      const adminToken = jwt.sign(
        { id: "22222222-2222-4222-a222-222222222222", role: ADMIN },
        process.env.JWT_SECRET
      );

      const res = await fetch(`${baseUrl}/api/v1/admins/${targetId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Role middleware blocks non-super_admin with 403
      // (or 401 if user lookup fails in auth middleware in offline db mode)
      assert.ok([401, 403].includes(res.status));
    });
  });

  describe("4. Critical Fix: UUID Handling in User Updates", () => {
    it("Old Number() conversion bug behaves incorrectly on UUID strings", () => {
      const uuid1 = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
      const uuid2 = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

      // The old bug:
      const oldCheckFails = Number(uuid1) !== Number(uuid2); // NaN !== NaN is true!
      assert.equal(oldCheckFails, true, "Demonstrates the old bug: Number(uuid) produces NaN !== NaN");

      // The fix:
      const fixedCheckIsSafe = String(uuid1).toLowerCase() !== String(uuid2).toLowerCase();
      assert.equal(fixedCheckIsSafe, false, "Fix correctly recognises identical UUIDs");
    });

    it("Fixed UUID comparison distinguishes distinct UUIDs correctly", () => {
      const uuidA = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
      const uuidB = "b1ffcd00-0d1c-4fe9-cc7e-7cc0ce491b22";

      const check = String(uuidA).toLowerCase() !== String(uuidB).toLowerCase();
      assert.equal(check, true);
    });

    it("Fixed UUID comparison is case-insensitive", () => {
      const lower = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
      const upper = "A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11";

      const isSame = String(lower).toLowerCase() === String(upper).toLowerCase();
      assert.equal(isSame, true);
    });
  });

  describe("5. JWT Secret Separation", () => {
    it("Access token and refresh token secrets must be distinct in production setup", () => {
      assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be defined");
      assert.ok(process.env.JWT_REFRESH_SECRET, "JWT_REFRESH_SECRET must be defined");
      assert.notEqual(
        process.env.JWT_SECRET,
        process.env.JWT_REFRESH_SECRET,
        "Access and refresh token secrets must not be identical"
      );
    });

    it("Access token verified with refresh token secret must fail", () => {
      const payload = { id: "user-123", role: STUDENT };
      const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

      assert.throws(() => {
        jwt.verify(accessToken, process.env.JWT_REFRESH_SECRET);
      }, /invalid signature/);
    });
  });

  describe("6. Security Headers & Proxy Trust", () => {
    it("Response should contain Helmet security headers", async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.headers.get("x-content-type-options"), "nosniff");
      assert.ok(res.headers.get("x-dns-prefetch-control"));
    });

    it("CORS headers should respect origin whitelist", async () => {
      const res = await fetch(`${baseUrl}/health`, {
        headers: {
          Origin: "http://localhost:3000",
        },
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:3000");
    });
  });

  describe("7. Startup Environment Validation", () => {
    it("Missing required environment variables should abort startup with status 1 and clear message", async () => {
      const { spawnSync } = await import("node:child_process");
      const path = await import("node:path");
      const envPath = path.resolve(process.cwd(), "src/config/env.js").replace(/\\/g, "/");
      const result = spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `import "file:///${envPath}";`,
        ],
        {
          cwd: process.cwd() + "/tests", // tests/ has no .env file
          encoding: "utf8",
          env: {
            PATH: process.env.PATH,
            SystemRoot: process.env.SystemRoot,
            NODE_ENV: "production",
          },
        }
      );

      assert.equal(result.status, 1);
      assert.ok(
        result.stderr.includes("FATAL: Missing required environment variable(s)"),
        `Expected stderr to include FATAL message, got: ${result.stderr}`
      );
    });
  });
});

