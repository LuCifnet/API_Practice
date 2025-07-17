import { faker } from '@faker-js/faker';

describe("GoRest API Test Case Users", () => {

    it('TC_001: Get List of Users', () => {
        cy.request({
            method: "GET",
            url: "/public/v2/users",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an("array");
            expect(response.body.length).to.be.greaterThan(0);
            cy.log("Total users fetched:", response.body.length)
        })
    })

    it('TC_002: Get user by valid ID', () => {
        cy.request({
            method: "GET",
            url: "/public/v2/users",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            const userId = response.body[1].id;
            cy.request({
                method: "GET",
                url: `/public/v2/users/${userId}`,
                headers: {
                    Authorization: `Bearer ${Cypress.env("token")}`
                }
            }).then((userResponse) => {
                expect(userResponse.status).to.eq(200);
                expect(userResponse.body).to.have.property('id', userId)
                expect(userResponse.body).to.have.property('name')
                expect(userResponse.body).to.have.property('email')
            })
        })
    })


    it('TC_003: Get user by invalid ID', () => {
        const invalidUserId = 99999999
        cy.request({
            method: "GET",
            url: `/public/v2/users/${invalidUserId}`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(404)
        })
    })


    it('TC_004: Create user with valid data', () => {
        const statuses = ["active", "inactive"];
        const userData = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: statuses[Math.floor(Math.random() * statuses.length)]
        }
        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            body: userData
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body).to.have.property('id')
            expect(response.body).to.include({
                name: userData.name,
                email: userData.email,
                gender: userData.gender,
                status: userData.status
            })
        })
    })

    it('TC_005: Create user missing required fields', () => {
        const missingData = {
            name: '',
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: ''
        }
        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            body: missingData,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body).to.be.an('array')
        })
    })

    it('TC_006: Update existing user', () => {

        const updateDetail = {
            name: faker.person.fullName(),
            gender: faker.person.sex()
        }
        cy.request({
            method: "GET",
            url: "/public/v2/users",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            }
        }).then((response) => {
            expect(response.status).to.eq(200)
            const userId = response.body[2].id;

            cy.request({
                method: "PUT",
                url: `/public/v2/users/${userId}`,
                headers: {
                    Authorization: `Bearer ${Cypress.env("token")}`
                },
                body: updateDetail
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property('name', updateDetail.name)
                expect(response.body).to.have.property('gender', updateDetail.gender)
            })
        })
    })

    it('TC_007: Update user invalid ID', () => {
        const invalidUserId = 99999999
        const genderStatus = ["active", "inactive"]
        const userData = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: genderStatus[Math.floor(Math.random() * genderStatus.length)]
        }
        cy.request({
            method: "PUT",
            url: `/public/v2/users/${invalidUserId}`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            failOnStatusCode: false,
            body: userData
        }).then((response) => {
            expect(response.status).to.eq(404);
            expect(response.body).to.have.property('message', 'Resource not found')
        })

    })

    it('TC_008: Delete existing user', () => {
        cy.request({
            method: "GET",
            url: "/public/v2/users",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            const userId = response.body[4].id;
            cy.log(`Deleting user with ID: ${userId}`)

            cy.request({
                method: "DELETE",
                url: `/public/v2/users/${userId}`,
                headers: {
                    Authorization: `Bearer ${Cypress.env("token")}`
                }
            }).then((userResponse) => {
                expect(userResponse.status).to.eq(204);
                cy.request({
                    method: "GET",
                    url: `/public/v2/users/${userId}`,
                    headers: { Authorization: `Bearer ${Cypress.env("token")}` },
                    failOnStatusCode: false
                }).then((getRes) => {
                    expect(getRes.status).to.eq(404)
                })
            })
        })
    })

    it('TC_009: Delete non-existent user', () => {
        const userId = 9999999
        cy.request({
            method: "DELETE",
            url: `/public/v2/users/${userId}`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(404);
            cy.log('User deletion failed as expected for non-existent ID.');
        })
    })

    it('TC_010: Filter users by gender', () => {
        cy.request({
            method: "GET",
            url: `/public/v2/users?gender=male`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an("array");
            response.body.forEach((user: { gender: string }) => {
                expect(user.gender).to.eq("male")
            })
        })
    })

    it("TC_011: Filter users by active status", () => {
        cy.request({
            method: "GET",
            url: `/public/v2/users?status=active`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
        }).then((response) => {
            expect(response.status).to.eq(200);
            cy.log(`Total users fetched: ${response.body.length}`);
            expect(response.body).to.be.an("array");
            response.body.forEach((user: { id: number, status: string }) => {
                cy.log(`Checking user ID ${user.id} with status: ${user.status}`);
                expect(user.status).to.eq("active")
            })
        })
    })


    it("TC_012: Filter users by inactive status", () => {
        cy.request({
            method: "GET",
            url: `/public/v2/users?status=inactive`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
        }).then((response) => {
            expect(response.status).to.eq(200);
            cy.log(`Total users fetched: ${response.body.length}`);
            expect(response.body).to.be.an("array");
            response.body.forEach((user: { id: number, status: string }) => {
                cy.log(`Checking user ID ${user.id} with status: ${user.status}`);
                expect(user.status).to.eq("inactive")
            })
        })
    })


    it('TC_013: Create user with invalid email', () => {
        const statuses = ["active", "inactive"]
        const userData = {
            name: faker.person.fullName(),
            email: "notanemail.com",
            gender: faker.person.sex(),
            status: statuses[Math.floor(Math.random() * statuses.length)]
        }
        cy.request({
            method: "POST",
            url: `/public/v2/users`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            failOnStatusCode: false,
            body: userData
        }).then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body).to.be.an("array");

            const emailError = response.body.find((err: { field: string }) => err.field == "email");
            expect(emailError).to.exist;
            expect(emailError.message).to.include("is invalid");
            cy.log("Validation message for email:", emailError.message);
        })
    })

    it('TC_014: Create user with duplicate email', () => {
        const dupStatus = ["active", "inactive"];
        const duplicateUser = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: dupStatus[Math.floor(Math.random() * dupStatus.length)]
        };

        cy.request({
            method: "POST",
            url: `/public/v2/users`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            failOnStatusCode: false,
            body: duplicateUser
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body).to.have.property("email", duplicateUser.email);
            cy.log(`User created with email: ${duplicateUser.email}`);


            cy.request({
                method: "POST",
                url: `/public/v2/users`,
                headers: {
                    Authorization: `Bearer ${Cypress.env("token")}`
                },
                failOnStatusCode: false,
                body: duplicateUser
            }).then((response) => {
                expect(response.status).to.eq(422);
                expect(response.body).to.be.an("array");

                const emailError = response.body.find((err: { field: string; message: string }) => err.field == "email");
                expect(emailError).to.exist;
                expect(emailError.message.toLowerCase()).to.include("has already been taken");
                cy.log("Duplicate email validation:", emailError.message);
            });
        });
    });

    it("TC_015: Update user with invalid gender", () => {
        const dupStatus = ["active", "inactive"];
        const duplicateUser = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: dupStatus[Math.floor(Math.random() * dupStatus.length)]
        };

        cy.request({
            method: "POST",
            url: `/public/v2/users`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            failOnStatusCode: false,
            body: duplicateUser
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body).to.have.property("email", duplicateUser.email);
            cy.log(`User created with email: ${duplicateUser.email}`);

            cy.request({
                method: "PUT",
                url: `/public/v2/users/${response.body.id}`,
                headers: {
                    Authorization: `Bearer ${Cypress.env("token")}`
                },
                failOnStatusCode: false,
                body: {
                    ...duplicateUser,
                    gender: "trans"
                }
            }).then((updateResponse) => {
                expect(updateResponse.status).to.eq(422);
            })
        })
    })

    it('TC_016: Update user with empty payload', () => {
        const statuses = ["active", "inactive"];
        const newUser = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: statuses[Math.floor(Math.random() * statuses.length)]
        };

        cy.request({
            method: "POST",
            url: `/public/v2/users`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            body: newUser
        }).then((response) => {
            expect(response.status).to.eq(201);
            const userId = response.body.id;
            cy.log(`User created with ID: ${userId}`);


            cy.request({
                method: "PUT",
                url: `/public/v2/users/${userId}`,
                headers: {
                    Authorization: `Bearer ${Cypress.env("token")}`
                },
                body: {},
                failOnStatusCode: false
            }).then((updateRes) => {
                expect(updateRes.status).to.eq(200);
                expect(updateRes.body).to.be.an("object");
                cy.log("Empty payload validation response:", JSON.stringify(updateRes.body));
            });
        });
    });


    it('TC_017: Create user with extra/invalid fields', () => {
        const statuses = ["active", "inactive"];
        const userData = {
            name: "Extra",
            email: "extra_" + Date.now() + "@email.com", 
            gender: "female",
            status: statuses[Math.floor(Math.random() * statuses.length)],
            role: "admin" 
        };

        cy.request({
            method: "POST",
            url: `/public/v2/users`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            failOnStatusCode: false,
            body: userData
        }).then((response) => {
            
            if (response.status === 201) {
                cy.log("User created successfully, API ignored extra field");
                expect(response.body).to.have.property("id");
                expect(response.body).to.not.have.property("role");
            } else if (response.status === 422) {
                cy.log("API rejected request due to extra/invalid field");
                expect(response.body).to.be.an("array");
                const roleError = response.body.find((err: { field: string }) => err.field === "role");
                expect(roleError).to.exist;
                cy.log("Validation error message:", roleError.message);
            } else {
                throw new Error(`Unexpected status code: ${response.status}`);
            }
        });
    });


})