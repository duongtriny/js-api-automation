const { test, expect } = require('@playwright/test');

const _ = require('lodash');
const Ajv = require("ajv");
const ajv = new Ajv();

import { userRequestBodyTemplate } from '../../data/user/create-user-api/create-user-data';
import { CREATE_USER_API, CREATE_CARD_API, DELETE_USER_API } from "../../src/common/user-config-utils";
import { checkTimeout } from '../../src/common/login-utils';

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


test("Verify user create card successful", async ({ request }) => {
    let createUserRequestBody = _.cloneDeep(userRequestBodyTemplate);
    const createUserResponse = await request.post(CREATE_USER_API,
        {
            headers: {
                Authorization: token
            },
            data: createUserRequestBody
        }
    );
    const jsonCreateUserResponse = await createUserResponse.json();
    console.log("Create user response: ", jsonCreateUserResponse);
    expect(createUserResponse.status()).toBe(200);

    let createCardRequestBody = {
        userId: jsonCreateUserResponse.id,
        type: 'SLIVER'
    };

    const createCardResponse = await request.post(CREATE_CARD_API,
        {
            headers: {
                Authorization: token
            },
            data: createCardRequestBody
        }
    );

    const jsonCreateCardResponse = await createCardResponse.json();
    console.log("Create card response: ", jsonCreateCardResponse);
    expect(createCardResponse.status()).toBe(200);
    const expectedCreateCardResponse = {
        cardNumber: "7618-6321-9836-2109",
        name: "Doe John",
        expiredDate: "01-23-2030"
    };
    expect(jsonCreateCardResponse).toEqual(expect.objectContaining(expectedCreateCardResponse));

    //Clean up data
    await request.delete(`${DELETE_USER_API}/${jsonCreateUserResponse.id}`, {
        headers: {
            Authorization: token
        }
    });
});