const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const request = require('supertest');
const User = require('../src/models/user.model');

describe('POST /api/auth/login', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany();
  });

  it('should login a registered user', async () => {
    // Register a user first
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: { firstName: 'Test', lastName: 'User' }
      });

    // Now login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'password123'
      });
    if (res.statusCode !== 200) {
      console.error('Login response:', res.body);
    }
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.username).toBe('testuser');
    expect(res.body.message).toBe('Login successful');
  });

  it('should not login with wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
        fullName: { firstName: 'Test', lastName: 'User' }
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser2',
        password: 'wrongpassword'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid username or password');
  });
});
