// @ts-check
const { test, expect } = require('@playwright/test');

test('has title', async ({ request }) => {
  const url = 'http://localhost:3000/api/v1/countries';
  const response = await request.get(url);
  const actualResponseBody = await response.json();
  expect(response.status()).toBe(200);
});

