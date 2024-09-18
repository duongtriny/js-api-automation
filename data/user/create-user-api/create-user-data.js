export const userRequestBodyTemplate = {
    firstName: "John",
    lastName: "Doe",
    middleName: "Smith",
    birthday: "01-23-2000",
    email: `auto_api_${new Date().getTime()}@abc.com`,
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