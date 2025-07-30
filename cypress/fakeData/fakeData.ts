// fakedata.ts
import { faker } from '@faker-js/faker';

export type UserData = {
  name: string;
  email: string;
  gender: string;
  status: string;
};

export type PostData = {
  user_id: number;
  title: string;
  body: string;
};

export type CommentData = {
  post_id: number;
  name: string;
  email: string;
  body: string;
};

// Generate user data for POST /users
export function generateUserData(): UserData {
  const statuses = ['active', 'inactive'];
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    gender: faker.person.sex(),
    status: faker.helpers.arrayElement(statuses),
  };
}

// Generate post data for POST /posts
export function generatePostData(userId: number): PostData {
  return {
    user_id: userId,
    title: 'How to be a hacker in 1 min',
    body: 'First learn how to hack your heart.',
  };
}

// Generate comment data for POST /comments
export function generateCommentData(postId: number, customBody?: string): CommentData {
  return {
    post_id: postId,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    body: customBody ?? 'This post is very informative',
  };
}
