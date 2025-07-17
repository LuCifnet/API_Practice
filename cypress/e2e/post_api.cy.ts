import { faker } from '@faker-js/faker';

describe('GoRest API Test Case - Posts', () => {

    it('TC_P_001: Retrieve all posts', () => {
        cy.request({
            method: "GET",
            url: "/public/v2/posts",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an("array").and.not.be.empty;

            response.body.forEach((post: any) => {
                expect(post).to.have.all.keys("id", "user_id", "title", "body");
            });

            cy.log("First Post:", JSON.stringify(response.body[0]));
        });
    });

    it('TC_P_002: Get posts with large page number', () => {
        cy.request({
            method: "GET",
            url: "/public/v2/posts?page=99999",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an("array").that.is.empty;

            cy.log("Response Body:", JSON.stringify(response.body));
        });
    });

    it('TC_P_003: Get post by valid ID', () => {
        cy.request({
            method: "GET",
            url: "/public/v2/posts",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            }
        }).then((response) => {
            const postId = response.body[1].id;

            cy.request({
                method: "GET",
                url: `/public/v2/posts/${postId}`,
                headers: {
                    Authorization: `Bearer ${Cypress.env("token")}`
                }
            }).then((res) => {
                expect(res.status).to.eq(200);
                expect(res.body).to.be.an("object");

                expect(res.body).to.include.keys("id", "user_id", "title", "body");
                expect(res.body.id).to.eq(postId);
            });
        });
    });

    it('TC_P_004: Get post by invalid ID', () => {
        const invalidId = 99999999;

        cy.request({
            method: "GET",
            url: `/public/v2/posts/${invalidId}`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(404);
            expect(response.body).to.have.property("message", "Resource not found");

            cy.log("Response Body:", JSON.stringify(response.body));
        });
    });

    it('TC_P_005: Create post with valid data', () => {
        const statuses = ["active", "inactive"];
        const userData = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: faker.helpers.arrayElement(statuses)
        };

        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            body: userData
        }).then((userRes) => {
            expect(userRes.status).to.eq(201);
            const userId = userRes.body.id;

            const postData = {
                user_id: userId,
                title: "How to be a hacker in 60min",
                body: "First Learn how to hack your heart."
            };

            cy.request({
                method: "POST",
                url: "/public/v2/posts",
                headers: {
                    Authorization: `Bearer ${Cypress.env("token")}`
                },
                body: postData
            }).then((postRes) => {
                expect(postRes.status).to.eq(201);
                expect(postRes.body).to.include(postData);
                expect(postRes.body).to.have.property("id");

                cy.log("Post Created:", JSON.stringify(postRes.body));
            });
        });
    });

    it('TC_P_006: Create post with missing title', () => {
        const statuses = ["active", "inactive"];
        const userData = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: faker.helpers.arrayElement(statuses)
        };

        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            body: userData
        }).then((userRes) => {
            expect(userRes.status).to.eq(201);
            const userId = userRes.body.id;

            const postData = {
                user_id: userId,
                body: "First Learn how to hack your heart and in your head"
            };

            cy.request({
                method: "POST",
                url: "/public/v2/posts",
                headers: {
                    Authorization: `Bearer ${Cypress.env("token")}`
                },
                failOnStatusCode: false,
                body: postData
            }).then((postRes) => {
                expect(postRes.status).to.eq(422);
                expect(postRes.body).to.be.an("array");

                const error = postRes.body.find((e: any) => e.field === "title");
                expect(error).to.exist;
                expect(error.message).to.include("can't be blank");

                cy.log("Validation Error:", JSON.stringify(postRes.body));
            });
        });
    });

    it('TC_P_007: Create post with non-existent user_id', () => {
        const postData = {
            user_id: 9999999,
            title: "Test",
            body: "Body"
        };

        cy.request({
            method: "POST",
            url: "/public/v2/posts",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            body: postData,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body).to.be.an("array");

            const error = response.body.find((e: any) => e.field === "user");
            expect(error).to.exist;
            expect(error.message).to.include("must exist");

            cy.log("Validation Error:", JSON.stringify(response.body));
        });
    });

    it('TC_P_008: Create post with overly long title', () => {
        const statuses = ["active", "inactive"];
        const userData = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: faker.helpers.arrayElement(statuses)
        };

        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            body: userData
        }).then(userRes => {
            expect(userRes.status).to.eq(201);
            const userId = userRes.body.id;
            const longTitle = 'A'.repeat(1000);
            const postData = {
                user_id: userId,
                title: longTitle,
                body: "Body content here"
            };

            cy.request({
                method: "POST",
                url: "/public/v2/posts",
                headers: {
                    Authorization: `Bearer ${Cypress.env("token")}`
                },
                failOnStatusCode: false,
                body: postData
            }).then((response) => {
                expect([201, 422]).to.include(response.status);
                if (response.status === 201) {
                    expect(response.body).to.have.property("id");
                    expect(response.body.user_id).to.eq(userId);
                    expect(response.body.body).to.eq(postData.body);
                    expect(response.body.title.length).to.be.lte(1000);
                    cy.log("Post created with possibly trimmed title:", JSON.stringify(response.body));
                } else {
                    expect(response.body).to.be.an("array");
                    const error = response.body.find((e: any) => e.field === "title");
                    expect(error).to.exist;
                    cy.log("Validation Error:", JSON.stringify(response.body));
                }
            })
        });
    });

    it('TC_P_009: Create post without auth token', () => {
        const statuses = ["active", "inactive"];
        const userData = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: faker.helpers.arrayElement(statuses)
        };
        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            body: userData
        }).then((userRes) => {
            expect(userRes.status).to.eq(201);
            const userId = userRes.body.id;

            const postData = {
                user_id: userId,
                title: "Title",
                body: "Body"
            };
            cy.request({
                method: "POST",
                url: "/public/v2/posts",
                failOnStatusCode: false,
                body: postData
            }).then((response) => {
                expect(response.status).to.eq(401);
                expect(response.body).to.have.property("message").and.to.include("Authentication failed");
                cy.log("Response Body:", JSON.stringify(response.body));
            });
        });
    });


    it('TC_P_010: Update post with valid data', () => {
        const statuses = ["active", "inactive"];
        const userData = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: faker.helpers.arrayElement(statuses)
        };

        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            body: userData
        }).then(userRes => {
            expect(userRes.status).to.eq(201);
            const userId = userRes.body.id;

            const postData = {
                user_id: userId,
                title: "Original Title",
                body: "Original Body"
            };

            cy.request({
                method: "POST",
                url: "/public/v2/posts",
                headers: {
                    Authorization: `Bearer ${Cypress.env("token")}`
                },
                body: postData
            }).then(postRes => {
                expect(postRes.status).to.eq(201);
                const postId = postRes.body.id;

                const updateData = {
                    title: "Updated",
                    body: "Updated body"
                };

                cy.request({
                    method: "PUT",
                    url: `/public/v2/posts/${postId}`,
                    headers: {
                        Authorization: `Bearer ${Cypress.env("token")}`
                    },
                    body: updateData
                }).then(updateRes => {
                    expect(updateRes.status).to.eq(200);
                    expect(updateRes.body).to.have.property("id", postId);
                    expect(updateRes.body).to.have.property("title", updateData.title);
                    expect(updateRes.body).to.have.property("body", updateData.body);
                    expect(updateRes.body).to.have.property("user_id", userId);
                    cy.log("Updated Post:", JSON.stringify(updateRes.body));
                });
            });
        });
    });


    it('TC_P_011: Update post with invalid ID', () => {
        const invalidPostId = 9999999;
        const updateData = {
            title: "Update",
            body: "Body"
        };

        cy.request({
            method: "PUT",
            url: `/public/v2/posts/${invalidPostId}`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            body: updateData,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(404);
            expect(response.body).to.have.property("message", "Resource not found");
            cy.log("Response Body:", JSON.stringify(response.body));
        });
    });


    it('TC_P_012: Delete post with valid ID', () => {
        const statuses = ["active", "inactive"];
        const userData = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: faker.helpers.arrayElement(statuses)
        };

        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            body: userData
        }).then(userRes => {
            expect(userRes.status).to.eq(201);
            const userId = userRes.body.id;

            const postData = {
                user_id: userId,
                title: "Post to be deleted",
                body: "This post will be deleted in the test."
            };

            cy.request({
                method: "POST",
                url: "/public/v2/posts",
                headers: {
                    Authorization: `Bearer ${Cypress.env("token")}`
                },
                body: postData
            }).then(postRes => {
                expect(postRes.status).to.eq(201);
                const postId = postRes.body.id;

                cy.request({
                    method: "DELETE",
                    url: `/public/v2/posts/${postId}`,
                    headers: {
                        Authorization: `Bearer ${Cypress.env("token")}`
                    }
                }).then(deleteRes => {
                    expect(deleteRes.status).to.eq(204);
                    cy.log(`Post with ID ${postId} deleted successfully`);
                });
            });
        });
    });

    it('TC_P_013: Delete post with invalid ID', () => {
        const invalidId = 9999999;

        cy.request({
            method: "DELETE",
            url: `/public/v2/posts/${invalidId}`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            failOnStatusCode: false
        }).then(response => {
            expect(response.status).to.eq(404);
            expect(response.body).to.have.property("message", "Resource not found");
            cy.log("Response Body:", JSON.stringify(response.body));
        });
    });


    // TC_P_014: Delete post without auth token
    it('TC_P_014: Delete post without auth token', () => {
        const statuses = ["active", "inactive"];
        const userData = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: faker.helpers.arrayElement(statuses),
        };

        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: userData,
        }).then(userRes => {
            expect(userRes.status).to.eq(201);
            const userId = userRes.body.id;

            const postData = {
                user_id: userId,
                title: "Title for delete test",
                body: "Body for delete test"
            };

            cy.request({
                method: "POST",
                url: "/public/v2/posts",
                headers: { Authorization: `Bearer ${Cypress.env("token")}` },
                body: postData,
            }).then(postRes => {
                expect(postRes.status).to.eq(201);
                const postId = postRes.body.id;

                cy.request({
                    method: "DELETE",
                    url: `/public/v2/posts/${postId}`,
                    failOnStatusCode: false
                }).then(deleteRes => {
                    expect(deleteRes.status).to.eq(404);
                    expect(deleteRes.body).to.have.property("message").and.to.include("Resource not found");
                    cy.log("Response Body:", JSON.stringify(deleteRes.body));
                });
            });
        });
    });


    // TC_P_015: Create post with numeric title
    it('TC_P_015: Create post with numeric title', () => {
        const statuses = ["active", "inactive"];
        const userData = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: faker.helpers.arrayElement(statuses),
        };

        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: userData,
        }).then(userRes => {
            expect(userRes.status).to.eq(201);
            const userId = userRes.body.id;

            const postData = {
                user_id: userId,
                title: 123456,  // numeric title
                body: "Body with numeric title"
            };

            cy.request({
                method: "POST",
                url: "/public/v2/posts",
                headers: { Authorization: `Bearer ${Cypress.env("token")}` },
                body: postData,
            }).then(postRes => {
                expect(postRes.status).to.eq(201);
                expect(postRes.body).to.have.property("title", postData.title.toString()); // title stored as string
                cy.log("Post Created:", JSON.stringify(postRes.body));
            });
        });
    });

    // TC_P_016: Create post with special characters in title
    it('TC_P_016: Create post with special chars in title', () => {
        const statuses = ["active", "inactive"];
        const userData = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: faker.helpers.arrayElement(statuses),
        };

        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: userData,
        }).then(userRes => {
            expect(userRes.status).to.eq(201);
            const userId = userRes.body.id;

            const postData = {
                user_id: userId,
                title: "!@#$%^&*()",
                body: "Body with special chars in title"
            };

            cy.request({
                method: "POST",
                url: "/public/v2/posts",
                headers: { Authorization: `Bearer ${Cypress.env("token")}` },
                body: postData,
            }).then(postRes => {
                expect(postRes.status).to.eq(201);
                expect(postRes.body).to.have.property("title", postData.title);
                cy.log("Post Created:", JSON.stringify(postRes.body));
            });
        });
    });

    // TC_P_017: Create post with null title and body
    it('TC_P_017: Create post with null title and body', () => {
        const statuses = ["active", "inactive"];
        const userData = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: faker.helpers.arrayElement(statuses),
        };

        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: userData,
        }).then(userRes => {
            expect(userRes.status).to.eq(201);
            const userId = userRes.body.id;

            const postData = {
                user_id: userId,
                title: null,
                body: null
            };

            cy.request({
                method: "POST",
                url: "/public/v2/posts",
                headers: { Authorization: `Bearer ${Cypress.env("token")}` },
                failOnStatusCode: false,
                body: postData,
            }).then(postRes => {
                expect(postRes.status).to.eq(422);
                expect(postRes.body).to.be.an("array");
                const errorTitle = postRes.body.find((e: any) => e.field === "title");
                const errorBody = postRes.body.find((e: any) => e.field === "body");
                expect(errorTitle).to.exist;
                expect(errorBody).to.exist;
                cy.log("Validation Errors:", JSON.stringify(postRes.body));
            });
        });
    });

    // TC_P_018: Update post with empty JSON
    it.only('TC_P_018: Update post with empty JSON', () => {
        const statuses = ["active", "inactive"];
        const userData = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            gender: faker.person.sex(),
            status: faker.helpers.arrayElement(statuses),
        };

        cy.request({
            method: "POST",
            url: "/public/v2/users",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: userData,
        }).then(userRes => {
            expect(userRes.status).to.eq(201);
            const userId = userRes.body.id;

            const postData = {
                user_id: userId,
                title: "Valid Title",
                body: "Valid Body"
            };

            cy.request({
                method: "POST",
                url: "/public/v2/posts",
                headers: { Authorization: `Bearer ${Cypress.env("token")}` },
                body: postData,
            }).then(postRes => {
                expect(postRes.status).to.eq(201);
                const postId = postRes.body.id;

                cy.request({
                    method: "PUT",
                    url: `/public/v2/posts/${postId}`,
                    headers: { Authorization: `Bearer ${Cypress.env("token")}` },
                    failOnStatusCode: false,
                    body: {}
                }).then(updateRes => {
                    expect(updateRes.status).to.eq(200);
                    expect(updateRes.body).to.be.an("object");
                    cy.log("Validation Errors:", JSON.stringify(updateRes.body));
                });
            });
        });
    });

    // TC_P_019: Verify response schema on GET /posts
    it('TC_P_019: Verify response schema', () => {
        cy.request({
            method: "GET",
            url: "/public/v2/posts",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` }
        }).then(response => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an("array");

            response.body.forEach((post: any) => {
                expect(post).to.have.all.keys("id", "user_id", "title", "body");
            });

            cy.log("Response Schema Validated");
        });
    });
});
