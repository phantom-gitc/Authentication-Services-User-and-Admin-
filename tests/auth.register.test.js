const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const request = require('supertest');
const User = require('../src/models/user.model');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany();
});

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    jest.setTimeout(20000);
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: { firstName: 'Test', lastName: 'User' }
      });
    if (res.statusCode !== 201) {
      console.error('Response:', res.body);
    }
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.username).toBe('testuser');
  });
});
