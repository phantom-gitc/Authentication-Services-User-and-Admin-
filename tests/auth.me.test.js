const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/user.model');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  process.env.JWT_SECRET = 'testsecret';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany(); // Clean DB before every test
});

describe('GET /api/auth/me', () => {

  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 401 if token is invalid', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should return user data if token is valid', async () => {
    // Create user
    const user = await User.create({
      username: 'meuser',
      email: 'meuser@example.com',
      password: 'hashedpassword',
      fullName: { firstName: 'Me', lastName: 'User' },
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

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');


    // The /me endpoint returns only the decoded JWT payload, which does not include fullName
    expect(res.body.user).toMatchObject({
      username: 'meuser',
      email: 'meuser@example.com',
      role: 'user',
      id: user._id.toString(),
    });

    // Ensure password is not returned
    expect(res.body.user).not.toHaveProperty('password');
  });

});
