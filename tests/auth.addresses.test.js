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
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany();
});

describe('Addresses endpoints', () => {
  const base = '/api/auth/users/me/addresses';

  it('GET should return 401 if no token provided', async () => {
    const res = await request(app).get(base);
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('POST should validate phone and pincode', async () => {
    // create user
    const user = await User.create({
      username: 'addruser',
      email: 'addr@example.com',
      password: 'hashed',
      fullName: { firstName: 'Addr', lastName: 'User' },
      role: 'user',
      addresses: [],
    });

    const token = jwt.sign({ id: user._id.toString(), username: user.username, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // missing phone
    const res1 = await request(app)
      .post(base)
      .set('Authorization', `Bearer ${token}`)
      .send({ street: '1 Test St', city: 'City', state: 'State', zipCode: '12345', country: 'Country', pincode: '560001' });
    expect(res1.statusCode).toBe(400);

    // invalid pincode
    const res2 = await request(app)
      .post(base)
      .set('Authorization', `Bearer ${token}`)
      .send({ street: '1 Test St', city: 'City', state: 'State', zipCode: '12345', country: 'Country', phone: '1234567890', pincode: 'abc' });
    expect(res2.statusCode).toBe(400);
  });

  it('POST should add address and mark default when first', async () => {
    const user = await User.create({
      username: 'addruser2',
      email: 'addr2@example.com',
      password: 'hashed',
      fullName: { firstName: 'Addr', lastName: 'User' },
      role: 'user',
      addresses: [],
    });

    const token = jwt.sign({ id: user._id.toString(), username: user.username, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const payload = {
      street: '100 Main St',
      city: 'Metropolis',
      state: 'State',
      zipCode: '99999',
      country: 'Country',
      phone: '9876543210',
      pincode: '560001'
    };

    const res = await request(app)
      .post(base)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect([201, 200]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('address');
    const address = res.body.address;
    expect(address).toHaveProperty('_id');
    expect(address.street).toBe(payload.street);
    // first address should be marked default by API contract
    expect(address).toHaveProperty('default');
    expect(address.default).toBeTruthy();

    // GET should list the address and mark default
    const getRes = await request(app)
      .get(base)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body).toHaveProperty('addresses');
    expect(Array.isArray(getRes.body.addresses)).toBe(true);
    expect(getRes.body.addresses.length).toBeGreaterThanOrEqual(1);
    const listed = getRes.body.addresses.find(a => a._id === address._id || a._id === address.id);
    expect(listed).toBeTruthy();
    expect(listed.default).toBeTruthy();

    // DELETE the address
    const addressId = address._id || address.id;
    const delRes = await request(app)
      .delete(`${base}/${addressId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200,204]).toContain(delRes.statusCode);

    // GET should return no addresses after delete
    const getAfter = await request(app)
      .get(base)
      .set('Authorization', `Bearer ${token}`);
    expect(getAfter.statusCode).toBe(200);
    expect(getAfter.body).toHaveProperty('addresses');
    // either empty array or not containing the deleted id
    const still = getAfter.body.addresses || [];
    const found = still.find(a => a._id === addressId || a.id === addressId);
    expect(found).toBeFalsy();
  });

});
