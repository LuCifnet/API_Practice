import { faker } from '@faker-js/faker';
import { generateUserData } from '../fakeData/fakeData';

let sharedUserId: number;
let sharedUserEmail: string;
let sharedUserData: ReturnType<typeof generateUserData>;

describe("GoRest API Test Case Users", () => {

    before(() => {
        sharedUserData = generateUserData();

        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: sharedUserData
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body).to.have.property('id');
            expect(response.body).to.include(sharedUserData);

            sharedUserId = response.body.id;
            sharedUserEmail = response.body.email;

            cy.log(`Shared user created:
                ID: ${sharedUserId}
                Email: ${sharedUserEmail}
                Name: ${sharedUserData.name}
                Gender: ${sharedUserData.gender}
                Status: ${sharedUserData.status}`
            );
        });
    });

    it('TC_001: Get List of Users', () => {
        cy.request({
            method: "GET",
            url: "/public/v2/users",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an("array");
            expect(response.body.length).to.be.greaterThan(0);
            cy.log(`Total users fetched: ${response.body.length}`);
        });
    });

    it('TC_002: Get user by valid ID', () => {
        cy.request({
            method: "GET",
            url: `/public/v2/users/${sharedUserId}`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.id).to.eq(sharedUserId);
            expect(response.body.name).to.eq(sharedUserData.name);
            expect(response.body.email).to.eq(sharedUserData.email);
            expect(response.body.gender).to.eq(sharedUserData.gender);
            expect(response.body.status).to.eq(sharedUserData.status);
            cy.log(`Fetched user details: ID=${response.body.id}, Name=${response.body.name}, Email=${response.body.email}`);
        });
    });

    it('TC_003: Get user by invalid ID', () => {
        cy.request({
            method: "GET",
            url: `/public/v2/users/99999999`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(404);
            expect(response.body).to.have.property('message').and.to.be.a('string');
            cy.log(`Invalid ID fetch returned status: ${response.status}, message: ${response.body.message}`);
        });
    });

    it('TC_004: Create user with valid data', () => {
        const userData = generateUserData();
        cy.log(`Creating user with data: ${JSON.stringify(userData)}`);
        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: userData
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body).to.have.property('id').that.is.a('number');
            expect(response.body.name).to.eq(userData.name);
            expect(response.body.email).to.eq(userData.email);
            expect(response.body.gender).to.eq(userData.gender);
            expect(response.body.status).to.eq(userData.status);
            cy.log(`Created user with ID: ${response.body.id}`);
        });
    });

    it('TC_005: Create user missing required fields', () => {
        const userData = {
            name: '',
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: ''
        };
        cy.log(`Creating user with missing required fields: ${JSON.stringify(userData)}`);
        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: userData,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body).to.be.an('array').and.not.to.be.empty;
            const nameError = response.body.find((e: { field: string }) => e.field === 'name');
            const statusError = response.body.find((e: { field: string }) => e.field === 'status');
            expect(nameError).to.exist;
            expect(nameError.message).to.be.a('string').and.not.to.be.empty;
            expect(statusError).to.exist;
            expect(statusError.message).to.be.a('string').and.not.to.be.empty;
            cy.log(`Validation errors for missing fields: ${JSON.stringify(response.body)}`);
        });
    });

    it('TC_006: Update existing user', () => {
        const updateData = {
            name: faker.person.fullName(),
            gender: faker.person.sex()
        };
        cy.log(`Updating user ID ${sharedUserId} with data: ${JSON.stringify(updateData)}`);
        cy.request({
            method: "PUT",
            url: `/public/v2/users/${sharedUserId}`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: updateData
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.id).to.eq(sharedUserId);
            expect(response.body.name).to.eq(updateData.name);
            expect(response.body.gender).to.eq(updateData.gender);
            cy.log(`User updated successfully: ID=${response.body.id}, Name=${response.body.name}`);
        });
    });

    it('TC_007: Update user invalid ID', () => {
        const userData = generateUserData();
        cy.log(`Attempting update on invalid user ID 99999999 with data: ${JSON.stringify(userData)}`);
        cy.request({
            method: "PUT",
            url: `/public/v2/users/99999999`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: userData,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(404);
            expect(response.body).to.have.property('message').that.equals('Resource not found');
            cy.log(`Update invalid ID response: ${response.status} - ${response.body.message}`);
        });
    });

    it('TC_008: Delete existing user', () => {
        const tempUserData = generateUserData();
        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: tempUserData
        }).then((createRes) => {
            expect(createRes.status).to.eq(201);
            const tempUserId = createRes.body.id;
            cy.log(`Created temporary user for delete test: ID=${tempUserId}`);

            cy.request({
                method: "DELETE",
                url: `/public/v2/users/${tempUserId}`,
                headers: { Authorization: `Bearer ${Cypress.env("token")}` }
            }).then((deleteRes) => {
                expect(deleteRes.status).to.eq(204);
                cy.log(`Deleted temporary user ID: ${tempUserId}`);

                cy.request({
                    method: "GET",
                    url: `/public/v2/users/${tempUserId}`,
                    headers: { Authorization: `Bearer ${Cypress.env("token")}` },
                    failOnStatusCode: false
                }).then((getRes) => {
                    expect(getRes.status).to.eq(404);
                    cy.log(`Confirmed deletion of user ID: ${tempUserId} - Status: ${getRes.status}`);
                });
            });
        });
    });

    it('TC_009: Delete non-existent user', () => {
        cy.log("Attempting to delete non-existent user ID 9999999");
        cy.request({
            method: "DELETE",
            url: `/public/v2/users/9999999`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(404);
            cy.log(`Delete non-existent user response status: ${response.status}`);
        });
    });

    it('TC_010: Filter users by gender', () => {
        const expectedGender = sharedUserData.gender;
        cy.log(`Filtering users by gender: ${expectedGender}`);
        cy.request({
            method: "GET",
            url: `/public/v2/users?gender=${expectedGender}`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an("array");
            expect(response.body.length).to.be.greaterThan(0);
            response.body.forEach((user: { gender: string }) => {
                expect(user.gender).to.eq(expectedGender);
            });
            cy.log(`Filtered ${response.body.length} users with gender: ${expectedGender}`);
        });
    });

    it('TC_011: Filter users by active status', () => {
        cy.log("Filtering users by status: active");
        cy.request({
            method: "GET",
            url: `/public/v2/users?status=active`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an("array");
            expect(response.body.length).to.be.greaterThan(0);
            response.body.forEach((user: { status: string }) => {
                expect(user.status).to.eq("active");
            });
            cy.log(`Filtered ${response.body.length} active users`);
        });
    });

    it('TC_012: Filter users by inactive status', () => {
        cy.log("Filtering users by status: inactive");
        cy.request({
            method: "GET",
            url: `/public/v2/users?status=inactive`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an("array");
            expect(response.body.length).to.be.greaterThan(0);
            response.body.forEach((user: { status: string }) => {
                expect(user.status).to.eq("inactive");
            });
            cy.log(`Filtered ${response.body.length} inactive users`);
        });
    });

    it('TC_013: Create user with invalid email', () => {
        const userData = {
            name: faker.person.fullName(),
            email: "invalidEmail.com",
            gender: faker.person.sex(),
            status: "active"
        };
        cy.log(`Creating user with invalid email: ${userData.email}`);
        cy.request({
            method: "POST",
            url: `/public/v2/users`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: userData,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(422);
            const emailError = response.body.find((e: { field: string }) => e.field === 'email');
            expect(emailError).to.exist;
            expect(emailError.message.toLowerCase()).to.include("is invalid");
            cy.log(`Validation error message: ${emailError.message}`);
        });
    });

    it('TC_014: Create user with duplicate email', () => {
        cy.log(`Attempting to create user with duplicate email: ${sharedUserEmail}`);
        const userData = {
            name: faker.person.fullName(),
            email: sharedUserEmail,
            gender: faker.person.sex(),
            status: "active"
        };
        cy.request({
            method: "POST",
            url: `/public/v2/users`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: userData,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(422);
            const emailError = response.body.find((e: { field: string }) => e.field === 'email');
            expect(emailError).to.exist;
            expect(emailError.message.toLowerCase()).to.include("has already been taken");
            cy.log(`Duplicate email error message: ${emailError.message}`);
        });
    });

    it('TC_015: Update user with invalid gender', () => {
        cy.log(`Updating user ID ${sharedUserId} with invalid gender 'trans'`);
        cy.request({
            method: "PUT",
            url: `/public/v2/users/${sharedUserId}`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: { gender: "trans" },
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(422);
            cy.log(`Update with invalid gender response status: ${response.status}`);
        });
    });

    it('TC_016: Update user with empty payload', () => {
        cy.log(`Updating user ID ${sharedUserId} with empty payload`);
        cy.request({
            method: "PUT",
            url: `/public/v2/users/${sharedUserId}`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: {},
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(200);
            cy.log("Update with empty payload succeeded");
        });
    });

    it('TC_017: Create user with extra/invalid fields', () => {
        const userData = {
            name: faker.person.fullName(),
            email: `extra_${Date.now()}@mail.com`,
            gender: "female",
            status: "active",
            role: "admin"
        };
        cy.log(`Creating user with extra field 'role': ${userData.role}`);
        cy.request({
            method: "POST",
            url: `/public/v2/users`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: userData,
            failOnStatusCode: false
        }).then((response) => {
            if (response.status === 201) {
                expect(response.body).to.not.have.property("role");
                cy.log("User created successfully; extra field ignored.");
            } else if (response.status === 422) {
                const roleError = response.body.find((e: { field: string }) => e.field === 'role');
                expect(roleError).to.exist;
                cy.log(`Validation error for role field: ${roleError.message}`);
            } else {
                throw new Error(`Unexpected status code: ${response.status}`);
            }
        });
    });

});
