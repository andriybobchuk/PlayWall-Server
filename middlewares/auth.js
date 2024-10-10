const admin = require('firebase-admin');
const db = require('../utils/db');

module.exports = verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).send('Unauthorized access: No token provided');
  }

  admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      const firebaseId = decodedToken.uid;

      const query = 'SELECT id FROM Users WHERE firebaseId = ?';
      db.query(query, [firebaseId], (err, results) => {
        if (err) {
          // Return a detailed error response
          return res.status(500).send({
            message: 'ERROR: User not added to database.',
            error: 'Database query failed: ' + err.message, // Provide the error message from the database
            stack: err.stack, // Optionally include stack trace for debugging
          });
        }

        if (results.length > 0) {
          req.user = {
            id: results[0].id,
            firebaseId: firebaseId,
            ...decodedToken,
          };
        } else {
          req.user = {
            firebaseId: firebaseId,
            ...decodedToken,
          };
        }

        next();
      });
    })
    .catch((error) => {
      res.status(403).send({
        message: 'Unauthorized access: Invalid token',
        error: error.message, // Provide the error message from token verification
        stack: error.stack, // Optionally include stack trace for debugging
      });
    });
};
