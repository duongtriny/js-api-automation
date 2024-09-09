const { test, expect } = require('@playwright/test');
const Ajv = require("ajv");
const ajv = new Ajv();
const getCountriesJsonSchema = require("../../data/get-countries-api/get-countries-api-json-schema.json");
const getCountriesByFilterSchema = require("../../data/get-countries-by-filter-api/get-countries-by-filter-api-schema.json");
const getCountriesWithPagination = require("../../data/get-countries-with-pagination-api/get-countries-with-pagination-api-json-schema.json");
const { expectedCountries } = require('../../data/get-countries-api/get-countries-expected-response');
const { notEqual } = require('assert');

test.beforeEach(async () => {
  console.log("before each");
});

test.afterEach(async () => {
  console.log("after each");
});

const host = 'http://localhost';
const port = 3000;
const baseUrl = `${host}:${port}`;

test('Verify get countries api response schema', async ({ request }) => {
  const url = `${baseUrl}/api/v1/countries`;
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
  const url = `${baseUrl}/api/v1/countries`;
  const response = await request.get(url);
  const actualResponseBody = await response.json();
  console.log("API info: ", { url, actualResponseBody, expectedCountries });
  expect(response.status()).toBe(200);
  expect(actualResponseBody).toEqual(expect.arrayContaining(expectedCountries));
  expect(expectedCountries).toEqual(expect.arrayContaining(actualResponseBody));
});

expectedCountries.forEach((country) => {
  test.describe("Verify get country by code", () => {
    test.beforeEach(async () => {
      console.log("before each specific");
    });
    test(`Verify get countries api return ${country.code} correctly`, async ({ request }) => {
      const url = `${baseUrl}/api/v1/countries/${country.code}`;
      const response = await request.get(url);
      const actualResponseBody = await response.json();
      console.log("API info: ", { url, actualResponseBody, country });
      expect(response.status()).toBe(200);
      expect(actualResponseBody).toEqual(country);
    });
    test.afterEach(async () => {
      console.log("after each specific");
    });
  });
});

test('Verify get countries by filter api response schema', async ({ request }) => {
  const url = `${baseUrl}/api/v3/countries`;
  const response = await request.get(url, {
    params: {
      gdp: 5000,
      operator: '>'
    }
  });
  const actualResponseBody = await response.json();
  const validator = ajv.compile(getCountriesByFilterSchema);
  const validateResult = validator(actualResponseBody);
  console.log("Validator errors: ", validator.errors);
  console.log("API info: ", { url, actualResponseBody });
  expect(validateResult).toBeTruthy();
  expect(response.status()).toBe(200);
});

test('Verify get country by gdp filter greater than 5000', async ({ request }) => {
  const url = `${baseUrl}/api/v3/countries`;
  const response = await request.get(url, {
    params: {
      gdp: 5000,
      operator: '>'
    }
  });
  request.u
  const actualResponseBody = await response.json();
  actualResponseBody.forEach(item => {
    expect(item.gdp).toBeGreaterThan(5000);
  });
});

[
  {
    operator: '>',
    gdp: 1000,
    assertion: function (actualGdp) { expect(actualGdp).toBeGreaterThan(this.gdp); }
  },
  {
    operator: '<',
    gdp: 2000,
    assertion: function (actualGdp) { expect(actualGdp).toBeLessThan(this.gdp); }
  },
  {
    operator: '>=',
    gdp: 3000,
    assertion: function (actualGdp) { expect(actualGdp).toBeGreaterThanOrEqual(this.gdp); }
  },
  {
    operator: '<=',
    gdp: 4000,
    assertion: function (actualGdp) { expect(actualGdp).toBeLessThanOrEqual(this.gdp); }
  },
  {
    operator: '==',
    gdp: 5000,
    assertion: function (actualGdp) { expect(actualGdp).toBe(this.gdp); }
  },
  {
    operator: '!=',
    gdp: 5000,
    assertion: function (actualGdp) { expect(actualGdp).not.toBe(this.gdp); }
  }
].forEach(data => {
  test(`Verify get country by gdp filter ${data.operator} ${data.gdp}`, async ({ request }) => {
    const url = `${baseUrl}/api/v3/countries`;
    const response = await request.get(url, {
      params: {
        gdp: data.gdp,
        operator: data.operator
      }
    });
    const actualResponseBody = await response.json();
    actualResponseBody.forEach(item => {
      data.assertion(item.gdp);
    });
  });
})

async function getCountriesWithPaginationMethod(request, page, size) {
  const url = `${baseUrl}/api/v4/countries`;
  console.log("Url: ", url);
  return await request.get(url, {
    params: {
      page: page,
      size: size
    }
  });
}

test('Verify get countries with pagination', async ({ request }) => {
  let size = 4;
  //Verify first page
  const firstPageResponse = await getCountriesWithPaginationMethod(request, 1, size);
  const actualFirstPageResponseBody = await firstPageResponse.json();
  const validator = ajv.compile(getCountriesWithPagination);
  const validateResult = validator(actualFirstPageResponseBody);
  console.log("Validator errors: ", validator.errors);
  console.log("First Page API info: ", { actualFirstPageResponseBody: JSON.stringify(actualFirstPageResponseBody) });
  expect(firstPageResponse.status()).toBe(200);
  expect(validateResult).toBeTruthy();
  expect(actualFirstPageResponseBody.data.length).toBe(size);

  //Verify second page
  const secondPageResponse = await getCountriesWithPaginationMethod(request, 2, size);
  const actualSecondPageResponseBody = await secondPageResponse.json();
  console.log("Second Page API info: ", { actualSecondPageResponseBody: JSON.stringify(actualSecondPageResponseBody) });
  expect(secondPageResponse.status()).toBe(200);
  expect(actualSecondPageResponseBody.data.length).toBe(size);
  expect(actualSecondPageResponseBody.data).not.toEqual(expect.arrayContaining(actualFirstPageResponseBody.data));

  //Verify last page
  const lastPage = Math.ceil(actualFirstPageResponseBody.total / size);
  const lastPageLength = actualFirstPageResponseBody.total % size;
  const lastPageResponse = await getCountriesWithPaginationMethod(request, lastPage, size);
  const actualLastPageResponseBody = await lastPageResponse.json();
  console.log("Second Page API info: ", { actualLastPageResponseBody: JSON.stringify(actualLastPageResponseBody) });
  expect(lastPageResponse.status()).toBe(200);
  expect(actualLastPageResponseBody.data.length).toBe(lastPageLength);

  //Verify last page plus one
  const lastPagePlusResponse = await getCountriesWithPaginationMethod(request, lastPage + 1, size);
  const actualLastPagePlusResponseBody = await lastPagePlusResponse.json();
  console.log("Second Page API info: ", { actualLastPagePlusResponseBody: JSON.stringify(actualLastPagePlusResponseBody) });
  expect(lastPagePlusResponse.status()).toBe(200);
  expect(actualLastPagePlusResponseBody.data.length).toBe(0);
});

test("Verify get countries with header", async ({ request }) => {
  const url = `${baseUrl}/api/v5/countries`;
  console.log("Url: ", url);
  const response = await request.get(url, {
    headers: {
      'api-key': 'private'
    }
  });
  const actualResponse = await response.json();
  console.log(actualResponse);
});