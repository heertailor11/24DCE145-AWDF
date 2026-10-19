
const request = require("supertest");
const app = require("../server");

describe("Task Management API", () => {
    test("POST /login returns 400 when credentials are missing", async () => {
        const response = await request(app)
            .post("/login")
            .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe(
            "Email and password are required"
        );
    });

    test("GET /unknown returns 404 for an unknown route", async () => {
        const response = await request(app)
            .get("/unknown");

        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe("Route not found");
    });
});
