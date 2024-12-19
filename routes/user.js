const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const verifyToken = require('../middlewares/auth')

router.post('/createUser', verifyToken, (req, res) => {
  const { email, screenRatio, nick } = req.body;
  const { uid } = req.user;

  if (!email || !uid || !screenRatio || !nick) {
    return res.status(400).send({ error: 'Missing required fields: email, uid, screenRatio, or username.' });
  }

  const query = 'INSERT INTO Users (email, firebaseId, screenRatio, nick) VALUES (?, ?, ?, ?)';

  db.query(query, [email, uid, screenRatio, nick], (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        // Check error message to determine if the duplicate entry is for username or another field
        if (err.sqlMessage.includes('username')) {
          return res.status(409).send({ error: 'Username already exists.' });
        } else {
          return res.status(409).send({ error: 'User already exists.' });
        }
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

router.post('/updatePushToken', verifyToken, (req, res) => {
  const { pushToken } = req.body;
  const { uid } = req.user;

  // If pushToken is undefined, treat it as null
  const tokenToUpdate = pushToken === undefined ? null : pushToken;

  const query = 'UPDATE Users SET pushToken = ? WHERE firebaseId = ?';

  db.query(query, [tokenToUpdate, uid], (err, results) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to update push token.', details: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).send({ error: 'User not found.' });
    }
    res.status(200).send({ success: true });
  });
});





router.post('/updateProfile', verifyToken, (req, res) => {
  const { avatarId, nick } = req.body;
  const { uid } = req.user;

  // Skip nickname uniqueness check and update if nick is an empty string
  if (nick !== undefined && nick.trim() !== '') {
    const nickCheckQuery = 'SELECT 1 FROM Users WHERE nick = ? AND firebaseId != ?';
    db.query(nickCheckQuery, [nick, uid], (err, results) => {
      if (err) {
        console.error('Database query error: ' + err.message);
        return res.status(500).send('ERROR: Unable to verify nickname uniqueness.');
      }
      if (results.length > 0) {
        return res.status(409).send('ERROR: Nickname already in use.');
      }

      // Proceed to update profile if nickname is unique
      updateProfile(req, res, uid, avatarId, nick);
    });
  } else {
    // Skip nick update if it's empty or undefined
    updateProfile(req, res, uid, avatarId, undefined);
  }
});

function updateProfile(req, res, uid, avatarId, nick) {
  let query = 'UPDATE Users SET ';
  const params = [];

  // Handle avatarId, including setting it to NULL if empty string is received
  if (avatarId === '') {
    query += 'avatarId = NULL, ';
  } else if (avatarId !== null && avatarId !== undefined) {
    query += 'avatarId = ?, ';
    params.push(avatarId);
  }

  // Handle nick only if it is defined
  if (nick !== undefined) {
    query += 'nick = ?, ';
    params.push(nick);
  }

  // Remove trailing comma and add WHERE clause
  query = query.replace(/, $/, ' ') + 'WHERE firebaseId = ?';
  params.push(uid);

  // If no fields to update, return an error
  if (params.length === 1) { // Only `uid` is in params
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
}









// router.post('/updateProfile', verifyToken, (req, res) => {
//   const { avatarId, nick } = req.body;
//   const { uid } = req.user;

//   // First check if the nick is unique, if provided
//   if (nick !== undefined) {
//     const nickCheckQuery = 'SELECT 1 FROM Users WHERE nick = ? AND firebaseId != ?';
//     db.query(nickCheckQuery, [nick, uid], (err, results) => {
//       if (err) {
//         console.error('Database query error: ' + err.message);
//         return res.status(500).send('ERROR: Unable to verify nickname uniqueness.');
//       }
//       if (results.length > 0) {
//         return res.status(409).send('ERROR: Nickname already in use.');
//       }

//       // Proceed to update profile if nickname is unique or not provided
//       updateProfile(req, res, uid, avatarId, nick);
//     });
//   } else {
//     // If nick not provided, proceed to update immediately
//     updateProfile(req, res, uid, avatarId, nick);
//   }
// });

// function updateProfile(req, res, uid, avatarId, nick) {
//   let query = 'UPDATE Users SET ';
//   const params = [];

//   // Handle avatarId, including setting it to NULL if empty string is received
//   if (avatarId === '') {
//     query += 'avatarId = NULL, ';
//   } else if (avatarId !== null && avatarId !== undefined) {
//     query += 'avatarId = ?, ';
//     params.push(avatarId);
//   }

//   // Handle nick, explicitly allowing empty string as a valid value
//   if (nick !== undefined) {
//     query += 'nick = ? ';
//     params.push(nick);
//   }

//   query += 'WHERE firebaseId = ?';
//   params.push(uid);

//   // If no fields to update and not just setting avatarId to NULL, return an error
//   if (params.length === (avatarId === '' ? 1 : 0)) {
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
// }

router.get('/getAppData', verifyToken, (req, res) => {
  const userId = req.user.id;

  const selectQuery = 'SELECT devilCount, isPremium, consecutiveDays, lastCheckInDate FROM userAppData WHERE userId = ?';

  db.query(selectQuery, [userId], (err, results) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to fetch user app data.', details: err.message });
    }

    if (results.length === 0) {
      // Insert default values when no record exists
      const insertQuery = `
        INSERT INTO userAppData (userId, devilCount, isPremium, consecutiveDays, lastCheckInDate)
        VALUES (?, 10, FALSE, 0, '2024-10-10')
      `;

      db.query(insertQuery, [userId], (err, result) => {
        if (err) {
          return res.status(500).send({ error: 'Failed to create default user app data.', details: err.message });
        }

        // Return default values
        res.json({ devilCount: 10, isPremium: false, consecutiveDays: 0, lastCheckInDate: null });
      });
    } else {
      res.json(results[0]);
    }
  });
});

router.post('/updateAppData', verifyToken, (req, res) => {
  const { devilCount, isPremium, consecutiveDays, lastCheckInDate } = req.body;
  const userId = req.user.id;

  let updateFields = [];
  let insertValues = [userId];
  let updateValues = [];

  // Prepare values for INSERT (default values) and UPDATE (actual values)
  insertValues.push(devilCount != null ? parseInt(devilCount, 10) : 10); // Default insert value
  updateFields.push('devilCount = COALESCE(?, devilCount)');
  updateValues.push(devilCount != null ? parseInt(devilCount, 10) : null);

  insertValues.push(isPremium != null ? isPremium === 'true' : false); // Default insert value
  updateFields.push('isPremium = COALESCE(?, isPremium)');
  updateValues.push(isPremium != null ? isPremium === 'true' : null);

  insertValues.push(consecutiveDays != null ? parseInt(consecutiveDays, 10) : 0); // Default insert value
  updateFields.push('consecutiveDays = COALESCE(?, consecutiveDays)');
  updateValues.push(consecutiveDays != null ? parseInt(consecutiveDays, 10) : null);

  insertValues.push(lastCheckInDate != null ? lastCheckInDate : '2024-10-10'); // Default insert value
  updateFields.push('lastCheckInDate = COALESCE(?, lastCheckInDate)');
  updateValues.push(lastCheckInDate != null ? lastCheckInDate : null);

  const query = `
    INSERT INTO userAppData (userId, devilCount, isPremium, consecutiveDays, lastCheckInDate)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    ${updateFields.join(', ')}
  `;

  const finalValues = insertValues.concat(updateValues);

  db.query(query, finalValues, (err, result) => {
    if (err) {
      console.error('Database update error:', err);
      return res.status(500).send({ error: 'Failed to update or insert user app data.', details: err.message });
    }

    res.send({ success: true, message: 'User app data updated successfully.' });
  });
});


module.exports = router
