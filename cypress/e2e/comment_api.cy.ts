import { faker } from '@faker-js/faker';

let userId: number;
let postId: number;

describe('GoRest API Test Case Comments', () => {
    beforeEach(() => {
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
            expect(userRes.body).to.have.property("name", userData.name)
            expect(userRes.body).to.have.property("email", userData.email)
            expect(userRes.body).to.have.property("gender", userData.gender)
            expect(userRes.body).to.have.property("status", userData.status)
            cy.log("User Created:", JSON.stringify(userRes.body))
            userId = userRes.body.id;

            const postData = {
                user_id: userId,
                title: "How to be a hacker in 1min",
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
                expect(postRes.body).to.have.property("user_id", postData.user_id)
                expect(postRes.body).to.have.property("title", postData.title)
                expect(postRes.body).to.have.property("body", postData.body)
                cy.log("Post Created:", JSON.stringify(postRes.body))
                postId = postRes.body.id;
            });
        });
    });

    it('TC_C_001: Fetch all comments', () => {
        cy.request({
            method: "GET",
            url: "/public/v2/comments",
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            }
        }).then((commentResponse) => {
            expect(commentResponse.status).to.eq(200);
            expect(commentResponse.body).to.be.an("array").and.not.to.be.empty;

            commentResponse.body.forEach((comments: any) => {
                expect(comments).to.have.all.keys("id", "post_id", "name", "email", "body")
            });
            cy.log("Total Comments:", commentResponse.body.length)
            cy.log("First Comment:", JSON.stringify(commentResponse.body[0]));
        })
    });

    it('TC_C_002: Get comment by valid ID', () => {
        const commentData = {
            post_id: postId,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            body: "A comment for testing fetch by ID"
        };

        cy.request({
            method: "POST",
            url: "/public/v2/comments",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: commentData
        }).then((createRes) => {
            expect(createRes.status).to.eq(201);
            const commentId = createRes.body.id;

            cy.request({
                method: "GET",
                url: `/public/v2/comments/${commentId}`,
                headers: { Authorization: `Bearer ${Cypress.env("token")}` }
            }).then((commentResponseId) => {
                expect(commentResponseId.status).to.eq(200);
                expect(commentResponseId.body).to.be.an("object");
                expect(commentResponseId.body).to.have.property("name", commentData.name)
                expect(commentResponseId.body).to.have.all.keys("id", "post_id", "name", "email", "body");
                expect(commentResponseId.body.id).to.eq(commentId);
                cy.log("Fetched Comment by ID:", JSON.stringify(commentResponseId.body));
            });
        });
    });


    it('TC_C_003: Get comment by invalid ID', () => {
        const invalidId = 99999;

        cy.request({
            method: "GET",
            url: `/public/v2/comments/${invalidId}`,
            headers: {
                Authorization: `Bearer ${Cypress.env("token")}`
            },
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(404);
            expect(response.body).to.have.property("message", "Resource not found")
            cy.log("Validate Error:", JSON.stringify(response.body));
        })
    });

    it('TC_C_004: Create comment with valid data', () => {
        const commentData = {
            post_id: postId,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            body: "This post is very informative"
        };

        cy.request({
            method: "POST",
            url: "/public/v2/comments",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: commentData
        }).then((commentRes) => {
            expect(commentRes.status).to.eq(201);
            expect(commentRes.body).to.have.property("id");
            expect(commentRes.body).to.have.property("post_id", commentData.post_id);
            expect(commentRes.body).to.have.property("name", commentData.name);
            expect(commentRes.body).to.have.property("email", commentData.email);
            expect(commentRes.body).to.have.property("body", commentData.body);
            cy.log("Comment Created:", JSON.stringify(commentRes.body));
        });
    });

    it('TC_C_005: Create comment with missing fields', () => {
        const commentData = {
            post_id: postId,
            name: faker.person.fullName(),
            // missing email
            body: "This post is very informative"
        };

        cy.request({
            method: "POST",
            url: "/public/v2/comments",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: commentData,
            failOnStatusCode: false
        }).then((commentRes) => {
            expect(commentRes.status).to.eq(422);
            expect(commentRes.body).to.be.an("array");

            const error = commentRes.body.find((e: any) => e.field === "email");
            expect(error).to.exist;
            expect(error.message).to.include("can't be blank");
            cy.log("Validation Error:", JSON.stringify(commentRes.body));
        });
    });

    it('TC_C_006: Create comment with invalid email', () => {
        const commentData = {
            post_id: postId,
            name: faker.person.fullName(),
            email: "invalid_email",
            body: "This post is very informative"
        };

        cy.request({
            method: "POST",
            url: "/public/v2/comments",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: commentData,
            failOnStatusCode: false
        }).then((commentRes) => {
            expect(commentRes.status).to.eq(422);
            expect(commentRes.body).to.be.an("array");

            const error = commentRes.body.find((e: any) => e.field === "email");
            expect(error).to.exist;
            expect(error.message).to.include("is invalid");
            cy.log("Validation Error:", JSON.stringify(commentRes.body));
        });
    });

    it('TC_C_007: Create comment with invalid post ID', () => {
        const commentData = {
            post_id: 999999,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            body: "This post is very informative and helped"
        };

        cy.request({
            method: "POST",
            url: "/public/v2/comments",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: commentData,
            failOnStatusCode: false
        }).then((commentRes) => {
            expect(commentRes.status).to.eq(422);
            expect(commentRes.body).to.be.an("array");

            const error = commentRes.body.find((e: any) => e.field === "post");
            expect(error).to.exist;
            expect(error.message).to.include("must exist");
            cy.log("Validation Error:", JSON.stringify(commentRes.body));
        });
    });

    it('TC_C_008: Update comment with valid data', () => {
        const commentData = {
            post_id: postId,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            body: "Initial comment body"
        };

        cy.request({
            method: "POST",
            url: "/public/v2/comments",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: commentData
        }).then((commentRes) => {
            expect(commentRes.status).to.eq(201);
            cy.log("Comment Created:", JSON.stringify(commentRes.body))
            const commentId = commentRes.body.id;

            const updatedData = {
                post_id: postId,
                name: commentData.name,
                email: commentData.email,
                body: "Updated comment"
            };

            cy.request({
                method: "PUT",
                url: `/public/v2/comments/${commentId}`,
                headers: { Authorization: `Bearer ${Cypress.env("token")}` },
                body: updatedData
            }).then((updateRes) => {
                expect(updateRes.status).to.eq(200);
                expect(updateRes.body).to.have.property("id", commentId);
                expect(updateRes.body.body).to.eq("Updated comment");
                cy.log("Updated Comment:", JSON.stringify(updateRes.body));
            });
        });
    });

    it('TC_C_009: Update comment with invalid ID', () => {
        const invalidCommentId = 999999;

        const updatedData = {
            post_id: postId,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            body: "Update attempt"
        };

        cy.request({
            method: "PUT",
            url: `/public/v2/comments/${invalidCommentId}`,
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: updatedData,
            failOnStatusCode: false
        }).then((res) => {
            expect(res.status).to.eq(404);
            expect(res.body).to.have.property("message", "Resource not found");
            cy.log("Error Response:", JSON.stringify(res.body));
        });
    })

    it("TC_C_010: Update comment with missing 'body' field", () => {
        const commentData = {
            post_id: postId,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            body: "Initial comment body",
        };

        cy.request({
            method: "POST",
            url: "/public/v2/comments",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: commentData,
        }).then((commentRes) => {
            expect(commentRes.status).to.eq(201);
            const commentId = commentRes.body.id;
            const originalBody = commentRes.body.body;

            cy.log("Comment Created:", JSON.stringify(commentRes.body));

            const updatePayload = {
                post_id: postId,
                name: faker.person.fullName(),
                email: faker.internet.email(),
                // 'body' is missing on purpose
            };

            cy.request({
                method: "PUT",
                url: `/public/v2/comments/${commentId}`,
                headers: { Authorization: `Bearer ${Cypress.env("token")}` },
                body: updatePayload,
                failOnStatusCode: false,
            }).then((updateRes) => {
                expect(updateRes.status).to.eq(200);
                expect(updateRes.body).to.have.property("id", commentId);
                expect(updateRes.body.body).to.eq(originalBody);
                cy.log("Updated (without body):", JSON.stringify(updateRes.body));
            });
        });
    });
    it('TC_C_011: Delete comment by valid ID', () => {
        const commentData = {
            post_id: postId,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            body: "Initial comment body",
        };

        cy.request({
            method: "POST",
            url: "/public/v2/comments",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: commentData,
        }).then((deleteRes) => {
            expect(deleteRes.status).to.eq(201);
            const commentId = deleteRes.body.id;

            expect(deleteRes.body).to.have.property("id", commentId)
            cy.log("Comment created:", JSON.stringify(deleteRes.body));

            cy.request({
                method: "DELETE",
                url: `/public/v2/comments/${commentId}`,
                headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            }).then((response) => {
                expect(response.status).to.eq(204);
                cy.log(`Comment with id ${commentId} deleted successfully.`)
            })

            cy.request({
                method: "GET",
                url: `/public/v2/comments/${commentId}`,
                headers: { Authorization: `Bearer ${Cypress.env("token")}` },
                failOnStatusCode: false,
            }).then((getRes) => {
                expect(getRes.status).to.eq(404);
                expect(getRes.body).to.have.property("message", "Resource not found");
                cy.log(`Confirmed deletion of comment ID ${commentId}`);
            });

        });
    });

    it('TC_C_012: Delete comment with invalid ID', () => {
        const commentData = {
            post_id: postId,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            body: "Initial comment body",
        };

        cy.request({
            method: "POST",
            url: "/public/v2/comments",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: commentData,
        }).then((deleteRes) => {
            expect(deleteRes.status).to.eq(201);
            cy.log("Valid comment created:", deleteRes.body.id);

            cy.request({
                method: "DELETE",
                url: `/public/v2/comments/999999`,
                headers: { Authorization: `Bearer ${Cypress.env("token")}` },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404);
                expect(response.body).to.have.property("message", "Resource not found");
                cy.log("Invalid delete response:", JSON.stringify(response.body));
            });
        });
    });

    it('TC_C_013: Create comment with special characters (XSS)', () => {
        const commentData = {
            post_id: postId,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            body: "<script>alert(1)</script>"
        };

        cy.request({
            method: "POST",
            url: "/public/v2/comments",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            body: commentData
        }).then((res) => {
            expect([201, 422]).to.include(res.status);
            cy.log("XSS Comment Response:", JSON.stringify(res.body));

            if (res.status === 201) {
                expect(res.body.body).to.include("<script>");
            } else {
                expect(res.body).to.have.property("message");
            }
        });
    });

    it('TC_C_014: Create comment with long body text (1000+ characters)', () => {
        const longText = 'A'.repeat(1200);

        const commentData = {
            post_id: postId,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            body: longText
        };

        cy.request({
            method: "POST",
            url: "/public/v2/comments",
            headers: { Authorization: `Bearer ${Cypress.env("token")}` },
            failOnStatusCode: false,
            body: commentData
        }).then((res) => {
            expect([201, 422]).to.include(res.status);
            cy.log("Long Body Comment Response:", JSON.stringify(res.body));

            if (res.status === 201) {
                expect(res.body.body.length).to.be.greaterThan(1000);
            } else {
                expect(res.body).to.be.an("array").and.not.to.be.empty;

                const bodyError = res.body.find((e: any) => e.field === "body");
                expect(bodyError).to.exist;
                expect(bodyError.message).to.match(/characters|too long|exceeds/i);
            }
        });
    });




});
