const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../src/models/user.model');

describe('GET /api/auth/logout', () => {
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

  it('should logout an authenticated user', async () => {
    // Create a user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      fullName: { firstName: 'Test', lastName: 'User' },
      role: 'user',
      addresses: [],
    });

    // Generate token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Logout with token
    const logoutRes = await request(app)
      .get('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.body.message).toBe('Logout successful');
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app)
      .get('/api/auth/logout');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Unauthorized');
  });

  it('should return 401 if token is invalid', async () => {
    const res = await request(app)
      .get('/api/auth/logout')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Unauthorized');
  });
});

