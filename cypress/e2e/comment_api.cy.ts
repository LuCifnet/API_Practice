import {
  generateUserData,
  generatePostData,
  generateCommentData,
} from '../fakeData/fakeData';

let userId: number;
let postId: number;


let userData: ReturnType<typeof generateUserData>;
let postData: ReturnType<typeof generatePostData>;
let commentData: ReturnType<typeof generateCommentData>;

describe('GoRest API Test Case Comments', () => {
  before(() => {
    userData = generateUserData();

    cy.request({
      method: 'POST',
      url: '/public/v2/users',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      body: userData,
    }).then((userRes) => {
      expect(userRes.status).to.eq(201);
      userId = userRes.body.id;
      cy.log('User Created:', JSON.stringify(userRes.body));

      postData = generatePostData(userId);

      cy.request({
        method: 'POST',
        url: '/public/v2/posts',
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        body: postData,
      }).then((postRes) => {
        expect(postRes.status).to.eq(201);
        postId = postRes.body.id;
        cy.log('Post Created:', JSON.stringify(postRes.body));
        commentData = generateCommentData(postId);
      });
    });
  });

  it('TC_C_001: Fetch all comments', () => {
    cy.request({
      method: 'GET',
      url: '/public/v2/comments',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
    }).then((commentResponse) => {
      expect(commentResponse.status).to.eq(200);
      expect(commentResponse.body).to.be.an('array').and.not.to.be.empty;
      commentResponse.body.forEach((comment: any) => {
        expect(comment).to.have.all.keys('id', 'post_id', 'name', 'email', 'body');
      });
      cy.log('Total Comments:', commentResponse.body.length);
    });
  });

  it('TC_C_002: Get comment by valid ID', () => {
    cy.request({
      method: 'POST',
      url: '/public/v2/comments',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      body: {
        ...commentData,
        body: 'A comment for testing fetch by ID',
      },
    }).then((createRes) => {
      expect(createRes.status).to.eq(201);
      expect(createRes.body.name).to.eq(commentData.name);
      const commentId = createRes.body.id;

      cy.request({
        method: 'GET',
        url: `/public/v2/comments/${commentId}`,
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      }).then((commentResponseId) => {
        expect(commentResponseId.status).to.eq(200);
        expect(commentResponseId.body.id).to.eq(commentId);
        expect(commentResponseId.body.name).to.eq(commentData.name);
        expect(commentResponseId.body.email).to.eq(commentData.email);
        expect(commentResponseId.body).to.have.all.keys('id', 'post_id', 'name', 'email', 'body');
      });
    });
  });

  it('TC_C_003: Get comment by invalid ID', () => {
    const invalidId = 99999;

    cy.request({
      method: 'GET',
      url: `/public/v2/comments/${invalidId}`,
      headers: {
        Authorization: `Bearer ${Cypress.env('token')}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body).to.have.property('message', 'Resource not found');
      cy.log('Validate Error:', JSON.stringify(response.body));
    });
  });

  it('TC_C_004: Create comment with valid data', () => {
    cy.request({
      method: 'POST',
      url: '/public/v2/comments',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      body: commentData,
    }).then((commentRes) => {
      expect(commentRes.status).to.eq(201);
      expect(commentRes.body).to.have.property('id');
      expect(commentRes.body).to.have.property('post_id', commentData.post_id);
      expect(commentRes.body).to.have.property('name', commentData.name);
      expect(commentRes.body).to.have.property('email', commentData.email);
      expect(commentRes.body).to.have.property('body', commentData.body);
      cy.log('Comment Created:', JSON.stringify(commentRes.body));
    });
  });

  it('TC_C_005: Create comment with missing fields', () => {
    const incompleteComment = {
      post_id: postId,
      name: commentData.name,
      // email intentionally missing
      body: commentData.body,
    };

    cy.request({
      method: 'POST',
      url: '/public/v2/comments',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      body: incompleteComment,
      failOnStatusCode: false,
    }).then((commentRes) => {
      expect(commentRes.status).to.eq(422);
      expect(commentRes.body).to.be.an('array');

      const error = commentRes.body.find((e: any) => e.field === 'email');
      expect(error).to.exist;
      expect(error.message).to.include("can't be blank");
      cy.log('Validation Error:', JSON.stringify(commentRes.body));
    });
  });

  it('TC_C_006: Create comment with invalid email', () => {
    const invalidEmailComment = { ...commentData, email: 'invalid_email' };

    cy.request({
      method: 'POST',
      url: '/public/v2/comments',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      body: invalidEmailComment,
      failOnStatusCode: false,
    }).then((commentRes) => {
      expect(commentRes.status).to.eq(422);
      expect(commentRes.body).to.be.an('array');

      const error = commentRes.body.find((e: any) => e.field === 'email');
      expect(error).to.exist;
      expect(error.message).to.include('is invalid');
      cy.log('Validation Error:', JSON.stringify(commentRes.body));
    });
  });

  it('TC_C_007: Create comment with invalid post ID', () => {
    const invalidPostComment = generateCommentData(999999);

    cy.request({
      method: 'POST',
      url: '/public/v2/comments',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      body: invalidPostComment,
      failOnStatusCode: false,
    }).then((commentRes) => {
      expect(commentRes.status).to.eq(422);
      expect(commentRes.body).to.be.an('array');

      const error = commentRes.body.find((e: any) => e.field === 'post');
      expect(error).to.exist;
      expect(error.message).to.include('must exist');
      cy.log('Validation Error:', JSON.stringify(commentRes.body));
    });
  });

  it('TC_C_008: Update comment with valid data', () => {
    const initialComment = { ...commentData, body: 'Initial comment body' };

    cy.request({
      method: 'POST',
      url: '/public/v2/comments',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      body: initialComment,
    }).then((commentRes) => {
      expect(commentRes.status).to.eq(201);
      cy.log('Comment Created:', JSON.stringify(commentRes.body));
      const commentId = commentRes.body.id;

      const updatedData = {
        post_id: postId,
        name: commentData.name,
        email: commentData.email,
        body: 'Updated comment',
      };

      cy.request({
        method: 'PUT',
        url: `/public/v2/comments/${commentId}`,
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        body: updatedData,
      }).then((updateRes) => {
        expect(updateRes.status).to.eq(200);
        expect(updateRes.body).to.have.property('id', commentId);
        expect(updateRes.body.body).to.eq('Updated comment');
        cy.log('Updated Comment:', JSON.stringify(updateRes.body));
      });
    });
  });

  it('TC_C_009: Update comment with invalid ID', () => {
    const invalidCommentId = 999999;

    const updatedData = { ...commentData, body: 'Update attempt' };

    cy.request({
      method: 'PUT',
      url: `/public/v2/comments/${invalidCommentId}`,
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      body: updatedData,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404);
      expect(res.body).to.have.property('message', 'Resource not found');
      cy.log('Error Response:', JSON.stringify(res.body));
    });
  });

  it("TC_C_010: Update comment with missing 'body' field", () => {
    const initialComment = { ...commentData, body: 'Initial comment body' };

    cy.request({
      method: 'POST',
      url: '/public/v2/comments',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      body: initialComment,
    }).then((commentRes) => {
      expect(commentRes.status).to.eq(201);
      const commentId = commentRes.body.id;
      const originalBody = commentRes.body.body;

      cy.log('Comment Created:', JSON.stringify(commentRes.body));

      const updatePayload = {
        post_id: postId,
        name: commentData.name,
        email: commentData.email,
        // body intentionally missing
      };

      cy.request({
        method: 'PUT',
        url: `/public/v2/comments/${commentId}`,
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        body: updatePayload,
        failOnStatusCode: false,
      }).then((updateRes) => {
        expect(updateRes.status).to.eq(200);
        expect(updateRes.body).to.have.property('id', commentId);
        expect(updateRes.body.body).to.eq(originalBody);
        cy.log('Updated (without body):', JSON.stringify(updateRes.body));
      });
    });
  });

  it('TC_C_011: Delete comment by valid ID', () => {
    const commentToDelete = { ...commentData, body: 'Initial comment body' };

    cy.request({
      method: 'POST',
      url: '/public/v2/comments',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      body: commentToDelete,
    }).then((deleteRes) => {
      expect(deleteRes.status).to.eq(201);
      const commentId = deleteRes.body.id;

      expect(deleteRes.body).to.have.property('id', commentId);
      cy.log('Comment created:', JSON.stringify(deleteRes.body));

      cy.request({
        method: 'DELETE',
        url: `/public/v2/comments/${commentId}`,
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      }).then((response) => {
        expect(response.status).to.eq(204);
        cy.log(`Comment with id ${commentId} deleted successfully.`);
      });

      cy.request({
        method: 'GET',
        url: `/public/v2/comments/${commentId}`,
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        failOnStatusCode: false,
      }).then((getRes) => {
        expect(getRes.status).to.eq(404);
        expect(getRes.body).to.have.property('message', 'Resource not found');
        cy.log(`Confirmed deletion of comment ID ${commentId}`);
      });
    });
  });

  it('TC_C_012: Delete comment with invalid ID', () => {
    const commentToDelete = { ...commentData, body: 'Initial comment body' };

    cy.request({
      method: 'POST',
      url: '/public/v2/comments',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      body: commentToDelete,
    }).then((deleteRes) => {
      expect(deleteRes.status).to.eq(201);
      cy.log('Valid comment created:', deleteRes.body.id);

      cy.request({
        method: 'DELETE',
        url: `/public/v2/comments/999999`,
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.have.property('message', 'Resource not found');
        cy.log('Invalid delete response:', JSON.stringify(response.body));
      });
    });
  });

  it('TC_C_013: Create comment with special characters (XSS)', () => {
    const xssComment = { ...commentData, body: '<script>alert(1)</script>' };

    cy.request({
      method: 'POST',
      url: '/public/v2/comments',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      body: xssComment,
    }).then((res) => {
      expect([201, 422]).to.include(res.status);
      cy.log('XSS Comment Response:', JSON.stringify(res.body));

      if (res.status === 201) {
        expect(res.body.body).to.include('<script>');
      } else {
        expect(res.body).to.have.property('message');
      }
    });
  });

  it('TC_C_014: Create comment with long body text (1000+ characters)', () => {
    const longText = 'A'.repeat(1200);
    const longComment = { ...commentData, body: longText };

    cy.request({
      method: 'POST',
      url: '/public/v2/comments',
      headers: { Authorization: `Bearer ${Cypress.env('token')}` },
      failOnStatusCode: false,
      body: longComment,
    }).then((res) => {
      expect([201, 422]).to.include(res.status);
      cy.log('Long Body Comment Response:', JSON.stringify(res.body));

      if (res.status === 201) {
        expect(res.body.body.length).to.be.greaterThan(1000);
      } else {
        expect(res.body).to.be.an('array').and.not.to.be.empty;

        const bodyError = res.body.find((e: any) => e.field === 'body');
        expect(bodyError).to.exist;
        expect(bodyError.message).to.match(/characters|too long|exceeds/i);
      }
    });
  });
});
