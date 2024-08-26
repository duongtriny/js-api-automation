const { test, expect } = require('@playwright/test');
const Ajv = require("ajv");
const ajv = new Ajv();
const getCountriesJsonSchema = require("../../data/get-countries-api/get-countries-api-json-schema.json");


test('Verify get countries api response schema', async ({ request }) => {
  const url = 'http://localhost:3000/api/v1/countries';
  const response = await request.get(url);
  const actualResponseBody = await response.json();
  const validator = ajv.compile(getCountriesJsonSchema);
  const validateResult = validator(actualResponseBody);
  const expectedResponse = {};
  console.log("Validator errors: ", validator.errors);
  console.log("API info: ", {url, actualResponseBody, expectedResponse});
  expect(validateResult).toBeTruthy();
  expect(response.status()).toBe(200);
});

