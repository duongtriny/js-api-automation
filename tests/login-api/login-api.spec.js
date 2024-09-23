const { test, expect } = require('@playwright/test');
const Ajv = require("ajv");
const { BASE_URL } = require('../../src/common/config-utils');
const ajv = new Ajv();

test("Verify user login successful", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/login`, {
        data: {
            username: "staff",
            password: "1234567890"
        }
    });
    const jsonResponse = await response.json();
    console.log("Login response: ", jsonResponse);
    expect(response.status()).toBe(200);
    //Verify schema
    expect(jsonResponse.token).toBeDefined();
    expect(jsonResponse.timeout).toBe(120000)
});

[
    {
        password: "1234567890"
    },
    {
        username: "",
        password: "1234567890"
    },
    {
        username: "staff"
    },
    {
        username: "staff",
        password: ""
    },
    {
        username: "abc",
        password: "1234567890"
    },
    {
        username: "staff",
        password: "123"
    },
    {
        username: "abc",
        password: "xyz"
    }
].forEach(requestBody => {
    test(`Verify user login unsuccessful with username: ${requestBody.username} and password: ${requestBody.password}`, async ({request}) =>{
        const response = await request.post(`${baseUrl}/api/login`, {
            data: requestBody
        });
        const jsonResponse = await response.json();
        console.log("Login response: ", jsonResponse);
        expect(response.status()).toBe(401);
        expect(jsonResponse).toEqual({
            "message": "Invalid credentials"
        });
    });
})