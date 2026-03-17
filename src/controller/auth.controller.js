const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require('../db/redis');

// Register user with username, email, password, and full name

async function registerUser(req, res) {
  try {
    const {
      username,
      email,
      password,
      fullName: { firstName, lastName },
    } = req.body;

    const isUserAlreadyExist = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isUserAlreadyExist) {
      return res.status(400).json({
        message: "Username or email already exists",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hash,
      fullName: {
        firstName,
        lastName,
      },
      role: "user",
    });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        address: user.addresses,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

// Login user with username or email and password

async function loginUser(req, res) {

  try {
    const { username, password, email } = req.body;

    const user = await userModel.findOne({ $or: [{ username }, { email }] }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        address: user.addresses,
      },
    });

  } catch (error) {

    console.error('Login error:', error);

    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

// Get current user data


async function getCurrentUser(req,res){
    try {
      
      return res.status(200).json({
        message: 'User data fetched successfully',
        user: req.user,
      })
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// Logout user

async function logoutUser(req, res) {
  try {
    // Extract token from cookies or Authorization header
    let token = req.cookies?.token;
    
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Add token to blacklist in Redis with 1 day expiration (same as token expiry)
    // Only if Redis is connected
    if (token && redis.connected) {
      try {
        await redis.set(`blacklist_${token}`, 'true', 'EX', 24 * 60 * 60);
      } catch (err) {
        console.warn('Failed to add token to blacklist:', err.message);
        // Don't fail logout if redis is unavailable
      }
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
    });

    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}


// Addresses: list, add, delete
async function listAddresses(req, res) {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ addresses: user.addresses });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
}


// Add address with street, city, state, zip code, country, phone, and pincode. Validate phone and pincode formats.
async function addAddress(req, res) {
  try {
    const { street, city, state, zipCode, country, phone, pincode   } = req.body;

    const userId = req.user.id;
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const addr = {
      street,
      city,
      state,
      zipCode,
      country,
      phone,
      pincode,
      default: user.addresses.length === 0,
    };

    user.addresses.push(addr);
    await user.save();

    const added = user.addresses[user.addresses.length - 1];
    return res.status(201).json({ address: added });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
}

async function deleteAddress(req, res) {
  try {
    const { addressId } = req.params;
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.addresses.pull(addressId);
    await user.save();

    return res.status(200).json({ message: 'Address removed' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
}



module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  listAddresses,
  addAddress,
  deleteAddress,
};

