const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const verifyToken = require('../middlewares/auth')

// MAIN ROUTE: /api/user
router.post('/createUser', verifyToken, (req, res) => {
  const { pushToken, firebaseId, email } = req.body;
  const { uid } = req.user; // firebaseID extrated from auth token

  if (!email || !uid || !pushToken || !firebaseId) {
    console.error('Missing required fields: email, uid, or pushToken.');
    return res.status(400).send('ERROR: Missing required fields.');
  }

  // Database query to insert user
  const query = 'INSERT INTO Users (email, firebaseId, pushToken) VALUES (?, ?, ?)';

  db.query(query, [email, uid, pushToken], (err, results) => {
    if (err) {
      // Log detailed error message
      console.error(`Database insert error for user (${email}): ${err.message}`);

      // Check if the error is due to a duplicate entry
      if (err.code === 'ER_DUP_ENTRY') {
        console.error(`User with email ${email} already exists.`);
        return res.status(409).send('ERROR: User already exists.');
      }

      // Send generic 500 error for other issues
      return res.status(500).send('ERROR: User not added to database.');
    }

    // Log success message
    console.log(`User with email ${email} added to the database successfully.`);

    // Respond with success
    res.status(200).send('User added to database.');
  });
});

// Fetch user data by firebaseId
router.get('/getUserData', verifyToken, (req, res) => {
  const { uid } = req.user;

  const query = 'SELECT id, nick, email, avatarId FROM Users WHERE firebaseId = ?';
  db.query(query, [uid], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Unable to fetch user data.');
    }

    if (results.length === 0) {
      return res.status(404).send('ERROR: User not found.');
    }

    const userDataResponse = {
      id: results[0].id,
      name: results[0].nick || "",  // Provide default value if null
      email: results[0].email,
      avatarId: results[0].avatarId || ""  // Provide default value if null
    };

    res.status(200).json(userDataResponse);
  });
});

// Update user avatar and nick
router.post('/updateProfile', verifyToken, (req, res) => {
  const { avatarId, nick } = req.body;
  const { uid } = req.user;

  // Build the query dynamically based on provided fields
  let query = 'UPDATE Users SET ';
  const params = [];

  if (avatarId) {
    query += 'avatarId = ? ';
    params.push(avatarId);
  }

  if (nick) {
    if (params.length > 0) query += ', '; // Add a comma if avatarUrl is also being updated
    query += 'nick = ? ';
    params.push(nick);
  }

  query += 'WHERE firebaseId = ?';
  params.push(uid);

  // If neither field is provided, return an error
  if (params.length === 1) {
    return res.status(400).send('ERROR: No fields to update.');
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database update error: ' + err.message);
      return res.status(500).send('ERROR: Unable to update profile.');
    }

    if (results.affectedRows === 0) {
      return res.status(404).send('ERROR: User not found.');
    }

    res.status(200).send('Profile updated successfully.');
  });
});


router.post('/updatePushToken', verifyToken, (req, res) => {
  const { pushToken } = req.body
  const { uid } = req.user
  const query = 'UPDATE Users SET pushToken = ? WHERE firebaseId = ?'

  // console.log(req)

  db.query(query, [pushToken, uid], (err, results) => {
    if (err) {
      console.error('Token update error: ' + err.message)
      return res.status(500).send('Token not updated.')
    }
    if (results.affectedRows === 0) {
      return res.status(404).send('User not found.')
    }
    res.status(200).send('Push token updated.')
  })
})

module.exports = router
