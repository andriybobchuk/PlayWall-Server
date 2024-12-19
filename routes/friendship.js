// const express = require('express')
// const router = express.Router()
// const db = require('../utils/db')
// const verifyToken = require('../middlewares/auth')


// const admin = require('../app');

const express = require('express');
const { sendNotification } = require('../firebaseService'); // Import the sendNotification function
const verifyToken = require('../middlewares/auth');
const router = express.Router();
const db = require('../utils/db')
//const { sendNotification } = require('./firebaseService'); 


// Test endpoint for sending a notification
router.post('/sendNotification', verifyToken, (req, res) => {
  // const { token, type, initiatorId, receiverId, friendshipId } = req.body;

  // Basic validation
  // if (!token || !type || !initiatorId || !receiverId) {
  //   return res.status(400).send('ERROR: Missing required fields (token, type, initiatorId, receiverId).');
  // }

  // Create the message payload
  const message = {
    data: {
      type: "Friend_invite", // e.g., "friend_invite", "friend_accept", etc.
      initiatorId: "-3",
      receiverId: "-4",
      friendshipId: "-12", // Optional field
    },
    token: "c1n_ZaOfSC640xcaK96qzX:APA91bF9fHJ0lVjEROU1HtARxAa1rUJTEWq7FdtRqGh4i7439MezUhMtD-_q9Y0pIn-GhkW2_fPEfSmK_2MqLT5gUCu_zSyVIFHiYZtGvYtVjs6NYNxXdyQK5tqpmhbG6pDeHYu7zGci",
  };

  // Send the notification
  sendNotification(message)
    .then(() => {
      res.status(200).send('SUCCESS: Notification sent.');
    })
    .catch(err => {
      console.error('Failed to send notification:', err);
      res.status(600).send('ERROR: Failed to send notification.');
    });
});



// MAIN ROUTE: /api/friendship
router.post('/', verifyToken, (req, res) => {
  const { email } = req.body;
  const requesterId = req.user.id;
  const requesterName = req.user.name;

  //res.status(500).send('Debug boy');

  const getUserIdQuery = 'SELECT id, pushToken FROM Users WHERE email = ? OR nick = ?';
  db.query(getUserIdQuery, [email, email], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Unable to find user due to a database error.');
    }

    if (results.length === 0) {
      return res.status(404).send('ERROR: User not found with the provided data');
    }

    const addresseeId = results[0].id;
    const pushToken = results[0].pushToken;

    if (!pushToken) {
      console.error('No push token found for user with email:', email);
      return res.status(404).send('No push token found for the user. Friendship request NOT sent.');
    }

    const checkFriendshipQuery = `
      SELECT status 
      FROM Friendships 
      WHERE (requester_id = ? AND addressee_id = ?) 
         OR (requester_id = ? AND addressee_id = ?)
    `;

    db.query(checkFriendshipQuery, [requesterId, addresseeId, addresseeId, requesterId], (err, results) => {
      if (err) {
        console.error('Database query error: ' + err.message);
        return res.status(500).send('ERROR: Unable to check friendship status due to a database error.');
      }

      if (results.length > 0) {
        const status = results[0].status;
        if (status === 'accepted') {
          return res.status(200).send('INFO: You are already friends.');
        } else if (status === 'pending') {
          return res.status(200).send('INFO: Friend request already sent.');
        } else {
          const updateFriendshipQuery = `
            UPDATE Friendships 
            SET status = 'pending' 
            WHERE (requester_id = ? AND addressee_id = ?) 
               OR (requester_id = ? AND addressee_id = ?)
          `;

          db.query(updateFriendshipQuery, [requesterId, addresseeId, addresseeId, requesterId], (err, results) => {
            if (err) {
              console.error('Database update error: ' + err.message);
              return res.status(500).send('ERROR: Unable to update friendship due to a database error.');
            }

            const message = {
              data: {
                type: "friend_invite",                     // String type for the event
                requesterId: requesterId.toString(),       // Ensure requesterId is a string
                recipientId: addresseeId.toString(),       // Ensure recipientId is a string
                friendshipId: friendshipId ? friendshipId.toString() : null, // Convert friendshipId to string or set to null
              },
              token: pushToken,                            // Token for the recipient
            };
            

            sendNotification(message)
              .then(() => {
                res.status(200).send('SUCCESS: Friendship request sent again.');
              })
              .catch(err => {
                console.error('Failed to send notification:', err);
                res.status(404).send('Failed to send notification because the user is logged out');
              });
          });
        }
      } else { //wrong but it creates the user and crashes on sending fcm
        const insertFriendshipQuery = `
          INSERT INTO Friendships (requester_id, addressee_id, status) 
          VALUES (?, ?, 'pending')
        `;

        db.query(insertFriendshipQuery, [requesterId, addresseeId], (err, results) => {
          if (err) {
            console.error('Database insert error: ' + err.message);
            return res.status(500).send('ERROR: Friendship not created due to a database error.');
          }

          const friendshipId = results.insertId;
          const message = {
            data: {
              type: "friend_invite",
              requesterId: requesterId.toString(),
              recipientId: addresseeId.toString(),
              friendshipId: friendshipId ? friendshipId.toString() : null,
            },
            token: pushToken,
          };

          sendNotification(message)
            .then(() => {
              res.status(200).send('Friendship request sent.');
            })
            .catch(err => {
              console.error('Failed to send notification:', err);
              res.status(200).send('Request sent silently');
            });
        });
      }
    });
  });
});




router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;

  const getFriendsQuery = `
    SELECT 
      f.friendship_id AS friendshipId, 
      f.requester_id AS requesterId, 
      f.status, 
      u.id, 
      u.email, 
      u.nick, 
      u.avatarId,
      u.screenRatio,  
      w.dateCreated AS lastMessageDate, 
      s.status AS lastMessageStatus, 
      s.requesterId AS lastMessageSender 
    FROM Users u
    JOIN Friendships f 
    ON (u.id = f.requester_id OR u.id = f.addressee_id)
    LEFT JOIN SentWallpapers s ON f.last_wallpaper_id = s.wallpaperId
    LEFT JOIN Wallpapers w ON s.wallpaperId = w.id
    WHERE (f.requester_id = ? OR f.addressee_id = ?)
    AND (f.status = 'accepted' OR (f.status = 'pending' AND f.addressee_id = u.id) OR (f.status = 'blocked' AND f.requester_id = u.id))
    AND u.id <> ?
    ORDER BY w.dateCreated DESC
  `;

  db.query(getFriendsQuery, [userId, userId, userId], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Unable to retrieve friends.');
    }

    const friends = results.map((row) => ({
      friendshipId: row.friendshipId,
      id: row.id,
      email: row.email,
      nick: row.nick,
      avatarId: row.avatarId || "", // Provide an empty string if avatarId is null
      screenRatio: row.screenRatio || null, // Add screenRatio from the database
      status: row.status,
      requesterId: row.requesterId,
      lastMessageDate: row.lastMessageDate || null,     // Last message date
      lastMessageStatus: row.lastMessageStatus || null, // Last message status (from SentWallpapers)
      lastMessageSender: row.lastMessageSender || null  // Last message sender
    }));

    res.status(200).json(friends);
  });
});


router.get('/requests', verifyToken, (req, res) => {
  const userId = req.user.id;

  const getFriendRequestsQuery = `
    SELECT u.id, u.email, u.nick, u.avatarId, f.status
    FROM Users u
    JOIN Friendships f
    ON u.id = f.requester_id
    WHERE f.addressee_id = ?
    AND f.status = 'pending'
  `;

  db.query(getFriendRequestsQuery, [userId], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Unable to retrieve friend requests.');
    }

    const friendRequests = results.map((row) => ({
      id: row.id,
      email: row.email,
      nick: row.nick,
      avatarId: row.avatarId || "", // Provide an empty string if avatarId is null,
      status: row.status
    }));

    res.status(200).json(friendRequests);
  });
});


router.post('/accept', verifyToken, (req, res) => {
  const userId = req.user.id; // ID of the user who accepted the request
  const { requesterId } = req.body; // ID of the user who sent the friend request

  const acceptFriendQuery = `
      UPDATE Friendships
      SET status = 'accepted' 
      WHERE requester_id = ? AND addressee_id = ? AND status = 'pending'
  `;

  db.query(acceptFriendQuery, [requesterId, userId], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Unable to accept friend request.');
    }

    // Now, retrieve the friendshipId
    const getFriendshipIdQuery = `
      SELECT friendship_id FROM Friendships 
      WHERE (requester_id = ? AND addressee_id = ?) 
         OR (requester_id = ? AND addressee_id = ?)
    `;

    db.query(getFriendshipIdQuery, [requesterId, userId, userId, requesterId], (err, friendshipResults) => {
      if (err) {
        console.error('Database query error: ' + err.message);
        return res.status(500).send('ERROR: Could not fetch friendship ID.');
      }

      if (friendshipResults.length > 0) {
        const friendshipId = friendshipResults[0].friendship_id;

        // Retrieve the push token of the requester (user who sent the friend request)
        const getPushTokenQuery = 'SELECT pushToken FROM Users WHERE id = ?';
        db.query(getPushTokenQuery, [requesterId], (err, tokenResults) => {
          if (err) {
            console.error('Database query error: ' + err.message);
            return res.status(500).send('ERROR: Could not fetch requester push token.');
          }

          if (tokenResults.length > 0) {
            const pushToken = tokenResults[0].pushToken;

            // Send notification to the requester about the friend request acceptance
            const message = {
              data: {
                type: "friend_accept",
                initiatorId: requesterId.toString(),
                receiverId: userId.toString(),
                friendshipId: friendshipId.toString(), // Use the fetched friendshipId here
              },
              token: pushToken,
            };

            sendNotification(message)
              .then(() => {
                res.status(200).send('Friend request accepted and notification sent.');
              })
              .catch(err => {
                console.error('Failed to send notification:', err);
                res.status(200).send('Request accepted silently');
              });
          } else {
            res.status(404).send('Requester not found.');
          }
        });
      } else {
        res.status(404).send('Friendship not found.');
      }
    });
  });
});
router.post('/getLinkRequestData', verifyToken, (req, res) => {
  // Extract requesterId and code from the body instead of the query
  const { requesterId, code } = req.body;

  // First, validate the one-time code
  const validateCodeQuery = 'SELECT nick, avatarId, email FROM Users WHERE id = ? AND oneTimeCode = ?';
  db.query(validateCodeQuery, [requesterId, code], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Unable to validate code.');
    }

    if (results.length > 0) {
      // Code is valid, return the user data
      const userData = results[0];
      res.status(200).json({
        nick: userData.nick,
        avatarId: userData.avatarId,
        email: userData.email
      });
    } else {
      // Invalid or expired code
      res.status(401).send('Invalid or expired code.');
    }
  });
});

router.post('/sendOneTimeCode', verifyToken, (req, res) => {
  const userId = req.user.id; // Extract the user ID from the token
  const { oneTimeCode } = req.body; // Extract the one-time code from the request body

  if (!oneTimeCode || isNaN(oneTimeCode)) {
    return res.status(400).send('Invalid or missing one-time code.');
  }

  // Update the oneTimeCode column in the Users table
  const updateCodeQuery = 'UPDATE Users SET oneTimeCode = ? WHERE id = ?';
  db.query(updateCodeQuery, [oneTimeCode, userId], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('Unable to update one-time code.');
    }

    if (results.affectedRows > 0) {
      res.status(200).json({
        message: 'One-time code updated successfully.',
        oneTimeCode: oneTimeCode
      });
    } else {
      res.status(404).send('User not found.');
    }
  });
});


router.post('/create-friendship-with-link', verifyToken, (req, res) => {
  const recipientId = req.user.id; // ID of the user who clicked the link
  const { requesterId, code } = req.body; // Extract requesterId and code from the body

  // First, validate the one-time code
  const validateCodeQuery = 'SELECT id FROM Users WHERE id = ? AND oneTimeCode = ?';
  db.query(validateCodeQuery, [requesterId, code], (err, codeValidationResults) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('Unable to validate code.');
    }

    if (codeValidationResults.length > 0) {
      // Code is valid, proceed to create friendship
      const createFriendshipQuery = `
        INSERT INTO Friendships (requester_id, addressee_id, status)
        VALUES (?, ?, 'accepted')
      `;

      db.query(createFriendshipQuery, [requesterId, recipientId], (err, results) => {
        if (err) {
          console.error('Database query error: ' + err.message);
          return res.status(500).send('Unable to create friendship.');
        }

        // Remove the one-time code to prevent reuse
        const removeCodeQuery = 'UPDATE Users SET oneTimeCode = NULL WHERE id = ?';
        db.query(removeCodeQuery, [requesterId], (err, removalResults) => {
          if (err) {
            console.error('Database query error: ' + err.message);
          }

          // Regardless of the outcome of removing the code, notify the requester
          const getPushTokenQuery = 'SELECT pushToken FROM Users WHERE id = ?';
          db.query(getPushTokenQuery, [requesterId], (err, tokenResults) => {
            if (err || tokenResults.length === 0) {
              console.error('Failed to retrieve push token:', err ? err.message : 'Token not found.');
              return res.status(404).send('ERROR: Requester not found.');
            }

            const pushToken = tokenResults[0].pushToken;
            const message = {
              data: {
                type: "friend_accept",
                initiatorId: requesterId.toString(),
                receiverId: recipientId.toString()
              },
              token: pushToken,
            };

            sendNotification(message)
              .then(() => res.status(200).send('Friendship created and notification sent.'))
              .catch(err => {
                console.error('Failed to send notification:', err);
                res.status(200).send('Friendship created silently');
              });
          });
        });
      });
    } else {
      // Invalid or expired code
      res.status(401).send('Invalid or expired code.');
    }
  });
});


router.post('/decline', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { requesterId } = req.body;

  const removeFriendshipQuery = `
      DELETE FROM Friendships
      WHERE requester_id = ? AND addressee_id = ?
         OR requester_id = ? AND addressee_id = ?
  `;

  db.query(removeFriendshipQuery, [requesterId, userId, userId, requesterId], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Unable to decline friend request.');
    }

    res.status(200).send('Friendship removed successfully.');
  });
});



router.post('/removeFriend', verifyToken, (req, res) => {
  const { friendshipId } = req.body;

  // First, retrieve the requesterId and recipientId based on the friendshipId
  const getFriendshipDetailsQuery = `
    SELECT requester_id, addressee_id 
    FROM Friendships 
    WHERE friendship_id = ?
  `;

  db.query(getFriendshipDetailsQuery, [friendshipId], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Could not fetch friendship details.');
    }

    if (results.length === 0) {
      return res.status(404).send('ERROR: Friendship not found.');
    }

    const { requester_id, addressee_id } = results[0];

    // Check if the logged-in user is either the requester or the addressee
    const userId = req.user.id; // ID of the user making the request
    if (userId !== requester_id && userId !== addressee_id) {
      return res.status(403).send('ERROR: You do not have permission to delete this friendship.');
    }

    const removeFriendQuery = `
      DELETE FROM Friendships
      WHERE friendship_id = ?
    `;

    db.query(removeFriendQuery, [friendshipId], (err, result) => {
      if (err) {
        console.error('Database query error: ' + err.message);
        return res.status(500).send('ERROR: Could not remove friend.');
      }

      // Determine who should receive the notification
      const recipientId = (userId === requester_id) ? addressee_id : requester_id;

      // Retrieve the push token of the recipient to send the notification
      const getPushTokenQuery = 'SELECT pushToken FROM Users WHERE id = ?';
      db.query(getPushTokenQuery, [recipientId], (err, tokenResults) => {
        if (err) {
          console.error('Database query error: ' + err.message);
          return res.status(500).send('ERROR: Could not fetch recipient push token.');
        }

        if (tokenResults.length > 0) {
          const pushToken = tokenResults[0].pushToken;

          // Prepare the notification message
          const message = {
            data: {
              type: "friend_remove",
              requesterId: userId.toString(),
              recipientId: recipientId.toString(),
              friendshipId: friendshipId.toString(),
            },
            token: pushToken,
          };

          // Send the notification
          sendNotification(message)
            .then(() => {
              res.json({ success: true, message: 'Friendship removed successfully and notification sent.' });
            })
            .catch(err => {
              console.error('Failed to send notification:', err);
              res.status(200).send('Friendship removed silently');
            });
        } else {
          res.status(404).send('ERROR: Recipient not found for notification.');
        }
      });
    });
  });
});



// Block friend by friendship_id and ensure the blocker becomes the addressee
router.post('/block', verifyToken, (req, res) => {
  const { friendshipId, userIdToBlock } = req.body; // person being blocked
  const userId = req.user.id; // person initiating the block

  // First, retrieve the current requester and addressee for the friendship
  const getFriendshipQuery = `
    SELECT requester_id, addressee_id FROM Friendships WHERE friendship_id = ?
  `;

  db.query(getFriendshipQuery, [friendshipId], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Could not fetch friendship.');
    }

    if (results.length === 0) {
      return res.status(404).send('ERROR: Friendship not found.');
    }

    const { requester_id, addressee_id } = results[0];

    // Check if the user initiating the block is either the requester or addressee
    if (userId !== requester_id && userId !== addressee_id) {
      return res.status(403).send('ERROR: You cannot block this friendship because it is not yours.');
    }

    // Regardless of previous roles, the user initiating the block always becomes the addressee
    let newRequesterId = userIdToBlock;
    let newAddresseeId = userId;

    // Update the friendship to 'blocked' and ensure the blocker is the addressee
    const blockQuery = `
      UPDATE Friendships
      SET requester_id = ?, addressee_id = ?, status = 'blocked'
      WHERE friendship_id = ?
    `;

    db.query(blockQuery, [newRequesterId, newAddresseeId, friendshipId], (err, results) => {
      if (err) {
        console.error('Database update error: ' + err.message);
        return res.status(500).send('ERROR: Could not block user.');
      }

      // Retrieve the push token of the user being blocked
      const getPushTokenQuery = 'SELECT pushToken FROM Users WHERE id = ?';
      db.query(getPushTokenQuery, [userIdToBlock], (err, tokenResults) => {
        if (err) {
          console.error('Database query error: ' + err.message);
          return res.status(500).send('ERROR: Could not fetch push token.');
        }

        if (tokenResults.length > 0) {
          const pushToken = tokenResults[0].pushToken;

          // Prepare the notification message
          const message = {
            data: {
              type: "friend_block",
              requesterId: userId.toString(),
              recipientId: userIdToBlock.toString(),
              friendshipId: friendshipId.toString(),
            },
            token: pushToken,
          };

          // Send the notification
          sendNotification(message)
            .then(() => {
              res.json({ success: true, message: 'User blocked successfully and notification sent.' });
            })
            .catch(err => {
              console.error('Failed to send notification:', err);
              res.status(200).send('User blocked silently');
            });
        } else {
          res.status(404).send('ERROR: User to be blocked not found for notification.');
        }
      });
    });
  });
});



// Unblock user by friendship_id
router.post('/unblock', verifyToken, (req, res) => {
  const { friendshipId } = req.body; // ID of the friendship to unblock

  // Fetch the friendship details
  const getFriendshipQuery = `
    SELECT requester_id, addressee_id FROM Friendships WHERE friendship_id = ?
  `;

  db.query(getFriendshipQuery, [friendshipId], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Could not fetch friendship.');
    }

    if (results.length === 0) {
      return res.status(404).send('ERROR: Friendship not found.');
    }

    const { requester_id, addressee_id } = results[0];

    // Check if the user initiating the unblock is either the requester or addressee
    const userId = req.user.id; // The user initiating the unblock
    if (userId !== requester_id && userId !== addressee_id) {
      return res.status(403).send('ERROR: You cannot unblock this friendship because it is not yours.');
    }

    // Proceed to unblock the friendship
    const unblockQuery = `
      UPDATE Friendships
      SET status = 'accepted'
      WHERE friendship_id = ? AND status = 'blocked'
    `;

    db.query(unblockQuery, [friendshipId], (err, results) => {
      if (err) {
        console.error('Database update error: ' + err.message);
        return res.status(500).send('ERROR: Could not unblock user.');
      }

      // Determine who should receive the notification
      const recipientId = (userId === requester_id) ? addressee_id : requester_id;

      // Retrieve the push token of the user being unblocked
      const getPushTokenQuery = 'SELECT pushToken FROM Users WHERE id = ?';
      db.query(getPushTokenQuery, [recipientId], (err, tokenResults) => {
        if (err) {
          console.error('Database query error: ' + err.message);
          return res.status(500).send('ERROR: Could not fetch recipient push token.');
        }

        if (tokenResults.length > 0) {
          const pushToken = tokenResults[0].pushToken;

          // Prepare the notification message
          const message = {
            data: {
              type: "friend_unblock",
              requesterId: userId.toString(),
              recipientId: recipientId.toString(),
              friendshipId: friendshipId.toString(),
            },
            token: pushToken,
          };

          // Send the notification
          sendNotification(message)
            .then(() => {
              res.json({ success: true, message: 'User unblocked successfully and notification sent.' });
            })
            .catch(err => {
              console.error('Failed to send notification:', err);
              res.status(200).send('User unblocked silently');
            });
        } else {
          res.status(404).send('ERROR: User to be unblocked not found for notification.');
        }
      });
    });
  });
});








module.exports = router
