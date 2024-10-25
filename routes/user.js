const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const verifyToken = require('../middlewares/auth')

// MAIN ROUTE: /api/user
router.post('/createUser', verifyToken, (req, res) => {
  const { email, screenRatio } = req.body;
  const { uid } = req.user;

  if (!email || !uid || !screenRatio) {
    return res.status(400).send({ error: 'Missing required fields: email, uid, or screenRatio.' });
  }

  const query = 'INSERT INTO Users (email, firebaseId, screenRatio) VALUES (?, ?, ?)';

  db.query(query, [email, uid, screenRatio], (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).send({ error: 'User already exists.' });
      }
      return res.status(500).send({ error: 'Failed to add user to database.', details: err.message });
    }
    res.status(200).send({ success: true });
  });
});



// Fetch user data by firebaseId
router.get('/getUserData', verifyToken, (req, res) => {
  const { uid } = req.user;

  // Updated query to also select screenRatio
  const query = 'SELECT id, nick, email, avatarId, screenRatio FROM Users WHERE firebaseId = ?';
  db.query(query, [uid], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Unable to fetch user data.');
    }

    if (results.length === 0) {
      return res.status(404).send('ERROR: User not found.');
    }

    // Include screenRatio in the response
    const userDataResponse = {
      id: results[0].id,
      name: results[0].nick || "",  // Provide default value if null
      email: results[0].email,
      avatarId: results[0].avatarId || "",  // Provide default value if null
      screenRatio: results[0].screenRatio || null  // Provide null if screenRatio is missing
    };

    res.status(200).json(userDataResponse);
  });
});


// // Update user avatar and nick
// router.post('/updateProfile', verifyToken, (req, res) => {
//   const { avatarId, nick } = req.body;
//   const { uid } = req.user;

//   // Build the query dynamically based on provided fields
//   let query = 'UPDATE Users SET ';
//   const params = [];

//   if (avatarId) {
//     query += 'avatarId = ? ';
//     params.push(avatarId);
//   }

//   if (nick) {
//     if (params.length > 0) query += ', '; // Add a comma if avatarUrl is also being updated
//     query += 'nick = ? ';
//     params.push(nick);
//   }

//   query += 'WHERE firebaseId = ?';
//   params.push(uid);

//   // If neither field is provided, return an error
//   if (params.length === 1) {
//     return res.status(400).send('ERROR: No fields to update.');
//   }

//   db.query(query, params, (err, results) => {
//     if (err) {
//       console.error('Database update error: ' + err.message);
//       return res.status(500).send('ERROR: Unable to update profile.');
//     }

//     if (results.affectedRows === 0) {
//       return res.status(404).send('ERROR: User not found.');
//     }

//     res.status(200).send('Profile updated successfully.');
//   });
// });

router.post('/updatePushToken', verifyToken, (req, res) => {
  const { pushToken } = req.body;
  const { uid } = req.user;

  if (!pushToken) {
    return res.status(400).send({ error: 'Missing push token.' });
  }

  const query = 'UPDATE Users SET pushToken = ? WHERE firebaseId = ?';

  db.query(query, [pushToken, uid], (err, results) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to update push token.', details: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).send({ error: 'User not found.' });
    }
    res.status(200).send({ success: true });
  });
});
// Update user avatar and nick
router.post('/updateProfile', verifyToken, (req, res) => {
  const { avatarId, nick } = req.body;
  const { uid } = req.user;

  // Build the query dynamically based on provided fields
  let query = 'UPDATE Users SET ';
  const params = [];

  if (avatarId === '') {
    query += 'avatarId = NULL ';
  } else if (avatarId !== null && avatarId !== undefined) {
    query += 'avatarId = ? ';
    params.push(avatarId);
  }

  if (nick) {
    if (params.length > 0 || avatarId === '') query += ', '; // Add a comma if needed
    query += 'nick = ? ';
    params.push(nick);
  }

  query += 'WHERE firebaseId = ?';
  params.push(uid);

  // If no fields to update, return an error
  if (params.length === 1 && avatarId !== '') {
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


module.exports = router
