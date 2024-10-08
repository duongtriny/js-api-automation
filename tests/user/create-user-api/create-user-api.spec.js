const { test, expect } = require('@playwright/test');
const _ = require('lodash');
const Ajv = require("ajv");
const ajv = new Ajv();

import { userRequestBodyTemplate } from '../../../data/user/create-user-api/create-user-data';
import { CREATE_USER_API, GET_USER_API, DELETE_USER_API } from "../../../src/common/user-config-utils";
import { knex } from '../../../src/common/database-utils';
import { getLoginInfo, checkTimeout } from '../../../src/common/login-utils';

let token;
let timeout;
let getTokenMoment;

test.beforeAll((async ({ request }) => {
    //Get login token
    ({ getTokenMoment, token, timeout } = await checkTimeout(request, getTokenMoment, token, timeout));
}));

test.beforeEach(async ({ request }) => {
    if ((new Date().getTime()) - getTokenMoment > timeout) {
        ({ getTokenMoment, token, timeout } = await checkTimeout(request, getTokenMoment, token, timeout));
    }
});

[
    {
        testCaseName: "Verify create user successful with single address",
        requestBody: _.cloneDeep(userRequestBodyTemplate)
    },
    {
        testCaseName: "Verify create user successful - firstName has 1 character",
        requestBody: {
            ..._.cloneDeep(userRequestBodyTemplate),
            firstName: "J"
        }
    },
    {
        testCaseName: "Verify create user successful with multiple address",
        requestBody: {
            ..._.cloneDeep(userRequestBodyTemplate),
            addresses: [
                ..._.cloneDeep(userRequestBodyTemplate.addresses),
                {
                    streetNumber: "456",
                    street: "Main St",
                    ward: "Ward 1",
                    district: "District 1",
                    city: "Thu Duc",
                    state: "Ho Chi Minh",
                    zip: "70000",
                    country: "VN"
                }
            ],
        }
    }
].forEach(({ testCaseName, requestBody }) => {
    test(testCaseName, async ({ request }) => {
        //Create user        
        const timeBeforeCreateCustomer = new Date();
        const createUserResponse = await request.post(CREATE_USER_API,
            {
                headers: {
                    Authorization: token
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
        const getUserResponse = await request.get(`${GET_USER_API}/${jsonCreateUserResponse.id}`, {
            headers: {
                Authorization: token
            }
        });
        const jsonGetUserResponse = await getUserResponse.json();
        console.log("Get user response: ", jsonGetUserResponse);

        expect(getUserResponse.status()).toBe(200);
        const jsonExpectedGetUser = _.cloneDeep(requestBody);
        jsonExpectedGetUser.id = jsonCreateUserResponse.id;
        jsonExpectedGetUser.createdAt = expect.any(String);
        jsonExpectedGetUser.updatedAt = expect.any(String);
        for (let i = 0; i < jsonExpectedGetUser.addresses.length; i++) {
            jsonExpectedGetUser.addresses[i].customerId = jsonCreateUserResponse.id;
            jsonExpectedGetUser.addresses[i].id = expect.any(String);
            jsonExpectedGetUser.addresses[i].createdAt = expect.any(String);
            jsonExpectedGetUser.addresses[i].updatedAt = expect.any(String);
        }
        expect(jsonGetUserResponse).toEqual(expect.objectContaining(jsonExpectedGetUser));
        //Verify date time
        verifyDateTime(timeBeforeCreateCustomer, jsonGetUserResponse.createdAt);
        verifyDateTime(timeBeforeCreateCustomer, jsonGetUserResponse.updatedAt);
        verifyDateTime(timeBeforeCreateCustomer, jsonGetUserResponse.addresses[0].createdAt);
        verifyDateTime(timeBeforeCreateCustomer, jsonGetUserResponse.addresses[0].updatedAt);

        //Clean up data
        await request.delete(`${DELETE_USER_API}/${jsonCreateUserResponse.id}`, {
            headers: {
                Authorization: token
            }
        });
    });
});

function verifyDateTime(timeBeforeCreateCustomer, actual) {
    const actualDateTime = new Date(actual);
    expect(actualDateTime.getTime()).toBeGreaterThan(timeBeforeCreateCustomer.getTime());
    expect(actualDateTime.getTime()).toBeLessThan((new Date()).getTime());
}

[
    {
        testCaseName: "Verify service return bad request when firstName null",
        requestBody: {
            ..._.cloneDeep(userRequestBodyTemplate),
            firstName: _
        },
        expectedResponse: {
            field: "",
            message: "must have required property 'firstName'"
        }
    },
    {
        testCaseName: "Verify service return bad request when firstName empty",
        requestBody: {
            ..._.cloneDeep(userRequestBodyTemplate),
            firstName: ""
        },
        expectedResponse: {
            field: "/firstName",
            message: "must NOT have fewer than 1 characters"
        }
    },
    {
        testCaseName: "Verify service return bad request when lastName null",
        requestBody: {
            ..._.cloneDeep(userRequestBodyTemplate),
            lastName: _
        },
        expectedResponse: {
            field: "",
            message: "must have required property 'lastName'"
        }
    },
    {
        testCaseName: "Verify service return bad request when lastName empty",
        requestBody: {
            ..._.cloneDeep(userRequestBodyTemplate),
            lastName: ""
        },
        expectedResponse: {
            field: "/lastName",
            message: "must NOT have fewer than 1 characters"
        }
    }
].forEach(({ testCaseName, requestBody, expectedResponse }) => {
    test(testCaseName, async ({ request }) => {
        //Create user        
        const createUserResponse = await request.post(CREATE_USER_API,
            {
                headers: {
                    Authorization: token
                },
                data: requestBody
            }
        );
        const jsonCreateUserResponse = await createUserResponse.json();
        console.log("Create user response: ", jsonCreateUserResponse);
        expect(createUserResponse.status()).toBe(400);
        //Verify schema
        expect(jsonCreateUserResponse).toEqual(expectedResponse);
    });
})

test("Verify create user successful by database query", async ({ request }) => {
    let requestBody = _.cloneDeep(userRequestBodyTemplate);
    //Create user        
    const timeBeforeCreateCustomer = new Date();
    const createUserResponse = await request.post(CREATE_USER_API,
        {
            headers: {
                Authorization: token
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
    let actualUserFromDb;
    await knex('customers').where('customers.id', jsonCreateUserResponse.id)
        .then(async (data) => {
            actualUserFromDb = data[0];
            let addresses = await knex('addresses').where('customerId', actualUserFromDb.id);
            actualUserFromDb.addresses = addresses;
        });

    const jsonExpectedGetUser = _.cloneDeep(requestBody);
    jsonExpectedGetUser.id = jsonCreateUserResponse.id;
    jsonExpectedGetUser.createdAt = expect.anything();
    jsonExpectedGetUser.updatedAt = expect.anything();
    for (let i = 0; i < jsonExpectedGetUser.addresses.length; i++) {
        jsonExpectedGetUser.addresses[i].customerId = jsonCreateUserResponse.id;
        jsonExpectedGetUser.addresses[i].id = expect.anything();
        jsonExpectedGetUser.addresses[i].createdAt = expect.anything();
        jsonExpectedGetUser.addresses[i].updatedAt = expect.anything();
    }
    expect(actualUserFromDb).toEqual(expect.objectContaining(jsonExpectedGetUser));
    //Verify date time
    verifyDateTime(timeBeforeCreateCustomer, actualUserFromDb.createdAt);
    verifyDateTime(timeBeforeCreateCustomer, actualUserFromDb.updatedAt);
    verifyDateTime(timeBeforeCreateCustomer, actualUserFromDb.addresses[0].createdAt);
    verifyDateTime(timeBeforeCreateCustomer, actualUserFromDb.addresses[0].updatedAt);

    //Clean up data
    await request.delete(`${DELETE_USER_API}/${jsonCreateUserResponse.id}`, {
        headers: {
            Authorization: token
        }
    });
});