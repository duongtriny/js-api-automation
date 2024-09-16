const { test, expect } = require('@playwright/test');
const _ = require('lodash');
const Ajv = require("ajv");
const ajv = new Ajv();
const host = 'http://localhost';
const port = 3000;
const baseUrl = `${host}:${port}`;

test("Verify create user successful", async ({ request }) => {
    //Get login token
    const loginResponse = await request.post(`${baseUrl}/api/login`, {
        data: {
            username: "staff",
            password: "1234567890"
        }
    });
    const jsonLoginResponse = await loginResponse.json();
    console.log("Login response: ", jsonLoginResponse);
    expect(loginResponse.status()).toBe(200);
    expect(jsonLoginResponse.token).toBeDefined();

    //Create user
    let randomEmail = `auto_api_${new Date().getTime()}@abc.com`;
    const requestBody = {
        firstName: "John",
        lastName: "Doe",
        middleName: "Smith",
        birthday: "01-23-2000",
        email: randomEmail,
        phone: "0123456789",
        addresses: [
            {
                streetNumber: "123",
                street: "Main St",
                ward: "Ward 1",
                district: "District 1",
                city: "Thu Duc",
                state: "Ho Chi Minh",
                zip: "70000",
                country: "VN"
            }
        ]
    };
    const timeBeforeCreateCustomer = new Date();
    const createUserResponse = await request.post(`${baseUrl}/api/user`,
        {
            headers: {
                Authorization: `Bearer ${jsonLoginResponse.token}`
            },
            data: requestBody
        }
    );
    const jsonCreateUserResponse = await createUserResponse.json();
    console.log("Create user response: ", jsonCreateUserResponse);
    expect(createUserResponse.status()).toBe(200);
    //Verify schema
    expect(jsonCreateUserResponse.id).toBeDefined();
    expect(jsonCreateUserResponse.message).toEqual("Customer created");

    //Double check created user
    const getUserResponse = await request.get(`${baseUrl}/api/user/${jsonCreateUserResponse.id}`, {
        headers: {
            Authorization: `Bearer ${jsonLoginResponse.token}`
        }
    });
    const jsonGetUserResponse = await getUserResponse.json();
    console.log("Get user response: ", jsonGetUserResponse);

    expect(getUserResponse.status()).toBe(200);
    const jsonExpectedGetUser = _.cloneDeep(requestBody);
    jsonExpectedGetUser.id = jsonCreateUserResponse.id;
    jsonExpectedGetUser.createdAt = expect.any(String);
    jsonExpectedGetUser.updatedAt = expect.any(String);
    jsonExpectedGetUser.addresses[0].customerId = jsonCreateUserResponse.id;
    jsonExpectedGetUser.addresses[0].id = expect.any(String);
    jsonExpectedGetUser.addresses[0].createdAt = expect.any(String);
    jsonExpectedGetUser.addresses[0].updatedAt = expect.any(String);
    expect(jsonGetUserResponse).toEqual(expect.objectContaining(jsonExpectedGetUser));
    //Verify date time
    verifyDateTime(timeBeforeCreateCustomer, jsonGetUserResponse.createdAt);
    verifyDateTime(timeBeforeCreateCustomer, jsonGetUserResponse.updatedAt);
    verifyDateTime(timeBeforeCreateCustomer, jsonGetUserResponse.addresses[0].createdAt);
    verifyDateTime(timeBeforeCreateCustomer, jsonGetUserResponse.addresses[0].updatedAt);

    //Clean up data
    await request.delete(`${baseUrl}/api/user/${jsonCreateUserResponse.id}`, {
        headers: {
            Authorization: `Bearer ${jsonLoginResponse.token}`
        }
    });
});

function verifyDateTime(timeBeforeCreateCustomer, actual) {
    const actualDateTime = new Date(actual);
    expect(actualDateTime.getTime()).toBeGreaterThan(timeBeforeCreateCustomer.getTime());
    expect(actualDateTime.getTime()).toBeLessThan((new Date()).getTime());
}