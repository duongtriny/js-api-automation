const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');
const { test, expect } = require('@playwright/test');
const Ajv = require("ajv");
const ajv = new Ajv();

test("Verify user query data successful", async ({ request }) => {
    const filePath = resolve('data/film-query/get-all-fields.graphql');
    const query = await readFile(filePath, { encoding: 'utf8' });
    const requestBody = { query };
    const response = await request.post("https://swapi-graphql.netlify.app/.netlify/functions/index", {
        data: requestBody
    });
    const responseJson = await response.json();
    console.log("Response data: ", responseJson);
    expect(response.status()).toBe(200);
    //schema
    //check expectation
    //neu co dynamic data thi can tach ra de verify

});