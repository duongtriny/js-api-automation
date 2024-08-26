const { test, expect } = require('@playwright/test');
const Ajv = require("ajv");
const ajv = new Ajv();
const getCountriesJsonSchema = require("../../data/get-countries-api/get-countries-api-json-schema.json");
const { expectedCountries } = require('../../data/get-countries-api/get-countries-expected-response');


test('Verify get countries api response schema', async ({ request }) => {
  const url = 'http://localhost:3000/api/v1/countries';
  const response = await request.get(url);
  const actualResponseBody = await response.json();
  const validator = ajv.compile(getCountriesJsonSchema);
  const validateResult = validator(actualResponseBody);
  const expectedResponse = {};
  console.log("Validator errors: ", validator.errors);
  console.log("API info: ", { url, actualResponseBody, expectedResponse });
  expect(validateResult).toBeTruthy();
  expect(response.status()).toBe(200);
});

test('Verify get countries api return data correctly', async ({ request }) => {
  const url = 'http://localhost:3000/api/v1/countries';
  const response = await request.get(url);
  const actualResponseBody = await response.json();
  console.log("API info: ", { url, actualResponseBody, expectedCountries });
  expect(response.status()).toBe(200);
  expect(actualResponseBody).toEqual(expect.arrayContaining(expectedCountries));
  expect(expectedCountries).toEqual(expect.arrayContaining(actualResponseBody));
});