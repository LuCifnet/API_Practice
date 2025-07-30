import { faker } from '@faker-js/faker';

let userId: number;
let todoId: number;
let todoData: any;

describe('GoRest API Test Case Todo', () => {
  // Create one user once before all tests
  before(() => {
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
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      body: userData
    }).then((userRes) => {
      expect(userRes.status).to.eq(201);
      userId = userRes.body.id;
      cy.log("Setup: User Created:", JSON.stringify(userRes.body));
    });
  });

  // Create a new todo before each test for the existing user
  beforeEach(() => {
    const todo_status = ['pending', 'completed'];
    todoData = {
      user_id: userId,
      title: "Buy groceries",
      due_on: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // future date
      status: faker.helpers.arrayElement(todo_status)
    };

    cy.request({
      method: "POST",
      url: "/public/v2/todos",
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      body: todoData
    }).then((todoRes) => {
      expect(todoRes.status).to.eq(201);
      expect(todoRes.body).to.have.property("title", todoData.title);
      todoId = todoRes.body.id;
      cy.log("Setup: Todo Created:", JSON.stringify(todoRes.body));
    });
  });

  it('TC_T_001: Retrieve all todos', () => {
    cy.request({
      method: "GET",
      url: "/public/v2/todos",
      headers: { Authorization: `Bearer ${Cypress.env("token")}` }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array").and.not.to.be.empty;

      res.body.forEach((todo: any) => {
        expect(todo).to.have.all.keys("id", "user_id", "title", "due_on", "status");
      });

      cy.log("Total Todos:", res.body.length.toString());
      cy.log("First Todo Details:", JSON.stringify(res.body[0]));
    });
  });

  it('TC_T_002: Get todo by valid ID', () => {
    cy.request({
      method: "GET",
      url: `/public/v2/todos/${todoId}`,
      headers: { Authorization: `Bearer ${Cypress.env("token")}` }
    }).then((todoRes) => {
      expect(todoRes.status).to.eq(200);
      expect(todoRes.body).to.include({
        id: todoId,
        user_id: todoData.user_id,
        title: todoData.title,
        status: todoData.status
      });
      expect(new Date(todoRes.body.due_on).toISOString()).to.eq(todoData.due_on);
      expect(todoRes.body).to.have.all.keys("id", "user_id", "title", "due_on", "status");

      cy.log("Fetched Todo Details:", JSON.stringify(todoRes.body));
    });
  });

  it('TC_T_003: Get todo by invalid ID', () => {
    const invalidTodoId = 9999999;

    cy.request({
      method: "GET",
      url: `/public/v2/todos/${invalidTodoId}`,
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      failOnStatusCode: false
    }).then((todoRes) => {
      expect(todoRes.status).to.eq(404);
      expect(todoRes.body).to.have.property("message", "Resource not found");

      cy.log("Invalid Todo Fetch Attempt:", JSON.stringify(todoRes.body));
    });
  });

  it('TC_T_004: Create todo with valid data', () => {
    const newTodoData = {
      user_id: userId,
      title: "Finish Cypress tests",
      due_on: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      status: "pending"
    };

    cy.request({
      method: "POST",
      url: "/public/v2/todos",
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      body: newTodoData
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body).to.include({
        title: newTodoData.title,
        user_id: newTodoData.user_id,
        status: newTodoData.status
      });
      expect(new Date(res.body.due_on).toISOString()).to.eq(newTodoData.due_on);

      cy.log("New Todo Created Successfully:", JSON.stringify(res.body));
    });
  });

  it('TC_T_005: Create todo with missing required fields', () => {
    const invalidTodoData = {
      user_id: userId,
      status: "pending"
    };

    cy.request({
      method: "POST",
      url: "/public/v2/todos",
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      body: invalidTodoData,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(422);
      expect(res.body).to.be.an("array");
      expect(res.body[0]).to.have.property("field");
      expect(res.body[0]).to.have.property("message");
      cy.log("Validation Error Response:", JSON.stringify(res.body));
    });
  });

  it('TC_T_006: Create todo with invalid status value', () => {
    const invalidStatusTodo = {
      user_id: userId,
      title: "Check invalid status",
      due_on: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "inprogress"
    };

    cy.request({
      method: "POST",
      url: "/public/v2/todos",
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      body: invalidStatusTodo,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(422);
      expect(res.body).to.be.an("array");
      expect(res.body[0]).to.have.property("field", "status");
      expect(res.body[0]).to.have.property("message");
      cy.log("Invalid Status Response:", JSON.stringify(res.body));
    });
  });

  it('TC_T_007: Create todo with invalid user ID', () => {
    const invalidUserTodo = {
      user_id: 9999999,
      title: "Fake user",
      due_on: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "pending"
    };

    cy.request({
      method: "POST",
      url: "/public/v2/todos",
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      body: invalidUserTodo,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(422);
      expect(res.body).to.be.an("array");
      expect(res.body[0]).to.have.property("field", "user");
      expect(res.body[0]).to.have.property("message");
      cy.log("Invalid User Response:", JSON.stringify(res.body));
    });
  });

  it('TC_T_008: Create todo without token', () => {
    cy.request({
      method: "POST",
      url: "/public/v2/todos",
      body: todoData,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body).to.have.property("message", "Authentication failed");
      cy.log("Unauthorized Response:", JSON.stringify(res.body));
    });
  });

  it('TC_T_009: Update todo with valid data', () => {
    const updatedData = {
      title: "Updated task",
      status: "completed"
    };

    cy.request({
      method: "PUT",
      url: `/public/v2/todos/${todoId}`,
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      body: updatedData
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.include({
        id: todoId,
        title: updatedData.title,
        status: updatedData.status
      });
      cy.log("Updated Todo:", JSON.stringify(res.body));
    });
  });

  it('TC_T_010: Update todo with invalid status', () => {
    const invalidStatusData = {
      status: "done"
    };

    cy.request({
      method: "PUT",
      url: `/public/v2/todos/${todoId}`,
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      body: invalidStatusData,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(422);
      expect(res.body).to.be.an("array");
      expect(res.body[0]).to.have.property("field", "status");
      cy.log("Invalid Status Update Response:", JSON.stringify(res.body));
    });
  });

  it('TC_T_011: Update todo with invalid ID', () => {
    const invalidIdData = {
      title: "Ghost update"
    };

    cy.request({
      method: "PUT",
      url: `/public/v2/todos/999999`,
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      body: invalidIdData,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(404);
      expect(res.body).to.have.property("message", "Resource not found");
      cy.log("Invalid ID Update Response:", JSON.stringify(res.body));
    });
  });

  it('TC_T_012: Update todo with empty payload', () => {
    cy.request({
      method: "PUT",
      url: `/public/v2/todos/${todoId}`,
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      body: {},
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("object");
      cy.log("Empty Payload Update Response:", JSON.stringify(res.body));
    });
  });

  it('TC_T_013: Delete valid todo', () => {
    cy.request({
      method: "DELETE",
      url: `/public/v2/todos/${todoId}`,
      headers: { Authorization: `Bearer ${Cypress.env("token")}` }
    }).then((res) => {
      expect(res.status).to.eq(204);
      cy.log("Deleted Todo ID:", todoId.toString());
    });
  });

  it('TC_T_014: Delete todo with invalid ID', () => {
    cy.request({
      method: "DELETE",
      url: `/public/v2/todos/999999`,
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(404);
      expect(res.body).to.have.property("message", "Resource not found");
      cy.log("Delete Invalid ID Response:", JSON.stringify(res.body));
    });
  });

  it('TC_T_015: Delete todo without token', () => {
    cy.request({
      method: "DELETE",
      url: `/public/v2/todos/${todoId}`,
      failOnStatusCode: false
    }).then((res) => {
      // Note: The API returns 404 when deleting without token, treat as unauthorized in this case
      expect(res.status).to.eq(404);
      expect(res.body).to.have.property("message", "Resource not found");
      cy.log("Delete Without Token Response:", JSON.stringify(res.body));
    });
  });

  it('TC_T_016: Create todo with long title', () => {
    const longTitleTodo = {
      user_id: userId,
      title: "x".repeat(500),
      due_on: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "pending"
    };

    cy.request({
      method: "POST",
      url: "/public/v2/todos",
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      body: longTitleTodo,
      failOnStatusCode: false
    }).then((res) => {
      expect([201, 422]).to.include(res.status);
      cy.log("Long Title Response:", JSON.stringify(res.body));
    });
  });

  it('TC_T_017: Create todo with special characters title', () => {
    const specialCharTodo = {
      user_id: userId,
      title: "⚡🔥💥@#&^%$",
      due_on: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "pending"
    };

    cy.request({
      method: "POST",
      url: "/public/v2/todos",
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      body: specialCharTodo
    }).then((res) => {
      expect([201, 200]).to.include(res.status);
      cy.log("Special Characters Title Response:", JSON.stringify(res.body));
    });
  });

  it('TC_T_018: Mark todo as completed', () => {
    const updateStatus = {
      status: "completed"
    };

    cy.request({
      method: "PUT",
      url: `/public/v2/todos/${todoId}`,
      headers: { Authorization: `Bearer ${Cypress.env("token")}` },
      body: updateStatus
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.include({
        id: todoId,
        status: "completed"
      });
      cy.log("Todo Marked Completed:", JSON.stringify(res.body));
    });
  });
});
