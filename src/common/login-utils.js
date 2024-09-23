import { BASE_URL } from "./config-utils";
const { expect } = require('@playwright/test');

export const LOGIN_API = `${BASE_URL}/api/login`;
const username = 'staff';
const password = '1234567890';
export async function getLoginInfo(request) {
    const loginResponse = await request.post(LOGIN_API, {
        data: { username, password }
    });
    const jsonLoginResponse = await loginResponse.json();
    console.log("Login response: ", jsonLoginResponse);
    expect(loginResponse.status()).toBe(200);
    expect(jsonLoginResponse.token).toBeDefined();
    return {
        token: `Bearer ${jsonLoginResponse.token}`,
        timeout: jsonLoginResponse.timeout
    }
}

export async function checkTimeout(request, getTokenMoment, token, timeout) {
    getTokenMoment = new Date().getTime();
    let loginInfo = await getLoginInfo(request);
    token = loginInfo.token;
    timeout = loginInfo.timeout;
    return { getTokenMoment, token, timeout };
}