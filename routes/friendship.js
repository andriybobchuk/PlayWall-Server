const express = require('express')
const router = express.Router()
const db = require('../utils/db')
const verifyToken = require('../middlewares/auth')


const admin = require('../app');

// MAIN ROUTE: /api/friendship

// Assuming admin is already initialized with your Firebase credentials

router.post('/', verifyToken, (req, res) => {
  const { email } = req.body;
  const requesterId = req.user.id;
  const requesterName = req.user.name; // Assuming 'name' is available in req.user object

  const getUserIdQuery = 'SELECT id, pushToken FROM Users WHERE email = ?';
  db.query(getUserIdQuery, [email], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Unable to find user.');
    }

    if (results.length === 0) {
      return res.status(404).send('ERROR: User not found.');
    }

    const addresseeId = results[0].id;
    const pushToken = results[0].pushToken; // Get the push token for the recipient

    // Check if a friendship already exists
    const checkFriendshipQuery = `
      SELECT status 
      FROM Friendships 
      WHERE (requester_id = ? AND addressee_id = ?) 
         OR (requester_id = ? AND addressee_id = ?)
    `;

    db.query(checkFriendshipQuery, [requesterId, addresseeId, addresseeId, requesterId], (err, results) => {
      if (err) {
        console.error('Database query error: ' + err.message);
        return res.status(500).send('ERROR: Unable to check friendship status.');
      }

      // If a friendship already exists
      if (results.length > 0) {
        const status = results[0].status;
        if (status === 'accepted') {
          return res.status(200).send('You are already friends.');
        } else if (status === 'pending') {
          return res.status(200).send('Friend request already sent.');
        } else if (status === 'declined') {
          // Update the friendship back to 'pending' if previously declined
          const updateFriendshipQuery = `
            UPDATE Friendships 
            SET status = 'pending' 
            WHERE (requester_id = ? AND addressee_id = ?) 
               OR (requester_id = ? AND addressee_id = ?)
          `;

          db.query(updateFriendshipQuery, [requesterId, addresseeId, addresseeId, requesterId], (err, results) => {
            if (err) {
              console.error('Database update error: ' + err.message);
              return res.status(500).send('ERROR: Unable to update friendship.');
            }

            try {
              sendFriendRequestNotification(pushToken, requesterName);
            } catch (error) {
              console.error('Notification sending failed:', error);
            }

            return res.status(200).send('Friendship request sent again.');
          });
        }
      } else {
        // No existing friendship, insert a new record
        const insertFriendshipQuery = `
          INSERT INTO Friendships (requester_id, addressee_id, status) 
          VALUES (?, ?, 'pending')
        `;

        db.query(insertFriendshipQuery, [requesterId, addresseeId], (err, results) => {
          if (err) {
            console.error('Database insert error: ' + err.message);
            return res.status(500).send('ERROR: Friendship not created.');
          }

          sendFriendRequestNotification(pushToken, requesterName); // Send notification after creating friendship

          res.status(200).send('Friendship request sent.');
        });
      }
    });
  });
});

// Function to send the friend request notification
function sendFriendRequestNotification(pushToken, requesterName) {
  if (!pushToken) {
    console.error('No push token available, cannot send notification.');
    return;
  }

  const message = {
    // notification: {
    //   title: "New Friend Request",
    //   body: `${requesterName} has sent you a friend request.`,
    // },
    data: {
      type: "friend_request",
      requesterName: requesterName,
    },
    token: pushToken
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log(`Notification sent successfully: ${response}`);
    })
    .catch((error) => {
      console.error('Error sending notification: ' + error.message);
    });
}


// router.get('/', verifyToken, (req, res) => {
//   const userId = req.user.id;

//   const getFriendsQuery = `
//     SELECT 
//       f.friendship_id AS friendshipId, 
//       f.requester_id AS requesterId, 
//       f.status, 
//       u.id, 
//       u.email, 
//       u.nick, 
//       u.avatarId,
//       w.dateCreated AS lastMessageDate, 
//       s.status AS lastMessageStatus, 
//       s.requesterId AS lastMessageSender 
//     FROM Users u
//     JOIN Friendships f 
//     ON (u.id = f.requester_id OR u.id = f.addressee_id)
//     LEFT JOIN SentWallpapers s ON f.last_wallpaper_id = s.wallpaperId
//     LEFT JOIN Wallpapers w ON s.wallpaperId = w.id
//     WHERE (f.requester_id = ? OR f.addressee_id = ?)
//     AND (f.status = 'accepted' OR (f.status = 'blocked' AND f.requester_id = u.id))
//     AND u.id <> ?
//     ORDER BY w.dateCreated DESC
//   `;

//   db.query(getFriendsQuery, [userId, userId, userId], (err, results) => {
//     if (err) {
//       console.error('Database query error: ' + err.message);
//       return res.status(500).send('ERROR: Unable to retrieve friends.');
//     }

//     const friends = results.map((row) => ({
//       friendshipId: row.friendshipId,
//       id: row.id,
//       email: row.email,
//       nick: row.nick,
//       avatarId: row.avatarId || "", // Provide an empty string if avatarId is null
//       status: row.status,
//       requesterId: row.requesterId,
//       lastMessageDate: row.lastMessageDate || null,     // Last message date
//       lastMessageStatus: row.lastMessageStatus || null, // Last message status (from SentWallpapers)
//       lastMessageSender: row.lastMessageSender || null  // Last message sender
//     }));

//     res.status(200).json(friends);
//   });
// });
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
      u.screenRatio,  -- Select the screenRatio field
      w.dateCreated AS lastMessageDate, 
      s.status AS lastMessageStatus, 
      s.requesterId AS lastMessageSender 
    FROM Users u
    JOIN Friendships f 
    ON (u.id = f.requester_id OR u.id = f.addressee_id)
    LEFT JOIN SentWallpapers s ON f.last_wallpaper_id = s.wallpaperId
    LEFT JOIN Wallpapers w ON s.wallpaperId = w.id
    WHERE (f.requester_id = ? OR f.addressee_id = ?)
    AND (f.status = 'accepted' OR (f.status = 'blocked' AND f.requester_id = u.id))
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



// router.get('/', verifyToken, (req, res) => {
//   const userId = req.user.id;

//   const getFriendsQuery = `
//     SELECT f.friendship_id AS friendshipId, f.requester_id AS requesterId, f.status, u.id, u.email, u.nick, u.avatarId
//     FROM Users u
//     JOIN Friendships f
//     ON (u.id = f.requester_id OR u.id = f.addressee_id)
//     WHERE (f.requester_id = ? OR f.addressee_id = ?)
//     AND (f.status = 'accepted' OR (f.status = 'blocked' AND f.requester_id = u.id))
//     AND u.id <> ?
//   `;

//   db.query(getFriendsQuery, [userId, userId, userId], (err, results) => {
//     if (err) {
//       console.error('Database query error: ' + err.message);
//       return res.status(500).send('ERROR: Unable to retrieve friends.');
//     }

//     const friends = results.map((row) => ({
//       friendshipId: row.friendshipId,
//       id: row.id,
//       email: row.email,
//       nick: row.nick,
//       avatarId: row.avatarId || "", // Provide an empty string if avatarId is null
//       status: row.status,
//       requesterId: row.requesterId
//     }));

//     res.status(200).json(friends);
//   });
// });



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



// router.post('/accept', verifyToken, (req, res) => {
//   const userId = req.user.id
//   const { requesterId } = req.body

//   console.log(`User id: ${userId}`)
//   console.log(`Requester id: ${requesterId}`)

//   const acceptFriendQuery = `
//       UPDATE Friendships
//       SET status = 'accepted'
//       WHERE requester_id = ? AND addressee_id = ? AND status = 'pending'
//   `

//   db.query(acceptFriendQuery, [requesterId, userId], (err, results) => {
//     if (err) {
//       console.error('Database query error: ' + err.message)
//       return res.status(500).send('ERROR: Unable to accept friend request.')
//     }

//     res.status(200).send('Friend request accepted.')
//   })
// })



router.post('/accept', verifyToken, (req, res) => {
  const userId = req.user.id; // ID of the user who accepted the request
  const { requesterId } = req.body; // ID of the user who sent the friend request

  console.log(`User id: ${userId}`);
  console.log(`Requester id: ${requesterId}`);

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

    // Retrieve the push token of the requester (user who sent the friend request)
    const getPushTokenQuery = 'SELECT pushToken FROM Users WHERE id = ?';
    db.query(getPushTokenQuery, [requesterId], (err, tokenResults) => {
      if (err) {
        console.error('Database query error: ' + err.message);
        return res.status(500).send('ERROR: Could not fetch requester push token.');
      }

      if (tokenResults.length > 0) {
        const pushToken = tokenResults[0].pushToken;

        // Send notification to the requester
        sendAcceptanceNotification(pushToken);

        // Respond back to the client that the friend request was accepted
        res.status(200).send('Friend request accepted.');
      } else {
        res.status(404).send('Requester not found.');
      }
    });
  });
});

// Function to send the acceptance notification
function sendAcceptanceNotification(pushToken) {
  if (!pushToken) {
    console.error('No push token available, cannot send notification.');
    return;
  }

  const message = {
    data: {
      type: "friend_acceptance",
    },
    token: pushToken,
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log(`Acceptance notification sent: ${response}`);
    })
    .catch((error) => {
      console.error('Error sending acceptance notification: ' + error.message);
    });
}



router.post('/decline', verifyToken, (req, res) => {
  const userId = req.user.id
  const { requesterId } = req.body

  const declineFriendQuery = `
      UPDATE Friendships
      SET status = 'declined'
      WHERE requester_id = ? AND addressee_id = ? AND status = 'pending'
  `

  db.query(declineFriendQuery, [requesterId, userId], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message)
      return res.status(500).send('ERROR: Unable to decline friend request.')
    }

    res.status(200).send('Friend request declined.')
  })
})

router.post('/update', (req, res) => {
  res.send('Friendship updated')
})

// Remove friend by friendship_id
router.post('/removeFriend', verifyToken, (req, res) => {
  const { friendshipId } = req.body;

  const removeFriendQuery = `
    DELETE FROM Friendships
    WHERE friendship_id = ?
  `;

  db.query(removeFriendQuery, [friendshipId], (err, result) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Could not remove friend.');
    }

    res.json({ success: true, message: 'Friendship removed successfully.' });
  });
});

// // Block friend by friendship_id and switch requester/addressee if needed
// router.post('/block', verifyToken, (req, res) => {
//   const { friendshipId, userIdToBlock } = req.body; // person being blocked
//   const userId = req.user.id; // person initiating the block

//   // First, retrieve the current requester and addressee for the friendship
//   const getFriendshipQuery = `
//     SELECT requester_id, addressee_id FROM Friendships WHERE friendship_id = ?
//   `;

//   db.query(getFriendshipQuery, [friendshipId], (err, results) => {
//     if (err) {
//       console.error('Database query error: ' + err.message);
//       return res.status(500).send('ERROR: Could not fetch friendship.');
//     }

//     if (results.length === 0) {
//       return res.status(404).send('ERROR: Friendship not found.');
//     }

//     const { requester_id, addressee_id } = results[0];

//     // Check who is blocking whom and swap if needed
//     let newRequesterId = requester_id;
//     let newAddresseeId = addressee_id;

//     if (userIdToBlock === addressee_id && userId === requester_id) {
//       // User 1 is blocking User 2 (already requester)
//       // No need to switch.
//     } else if (userIdToBlock === requester_id && userId === addressee_id) {
//       // User 2 (addressee) is blocking User 1 (requester), swap them.
//       newRequesterId = addressee_id;
//       newAddresseeId = requester_id;
//     } else {
//       return res.status(400).send('ERROR: Invalid block request.');
//     }

//     // Update the friendship to 'blocked' with the proper requester/addressee
//     const blockQuery = `
//       UPDATE Friendships
//       SET requester_id = ?, addressee_id = ?, status = 'blocked'
//       WHERE friendship_id = ?
//     `;

//     db.query(blockQuery, [newRequesterId, newAddresseeId, friendshipId], (err, results) => {
//       if (err) {
//         console.error('Database update error: ' + err.message);
//         return res.status(500).send('ERROR: Could not block user.');
//       }

//       res.json({ success: true, message: 'User blocked successfully.' });
//     });
//   });
// });

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

      res.json({ success: true, message: 'User blocked successfully.' });
    });
  });
});

// Unblock user by friendship_id
router.post('/unblock', verifyToken, (req, res) => {
  const { friendshipId } = req.body; // person to be unblocked

  // Fetch the friendship details
  const getFriendshipQuery = `
    SELECT status FROM Friendships WHERE friendship_id = ?
  `;

  db.query(getFriendshipQuery, [friendshipId], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Could not fetch friendship.');
    }

    if (results.length === 0) {
      return res.status(404).send('ERROR: Friendship not found.');
    }

    const { status } = results[0];

    // Proceed to unblock the friendship regardless of requester/addressee roles
    if (status === 'blocked') {
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

        res.json({ success: true, message: 'User unblocked successfully.' });
      });
    } else {
      return res.status(400).send('ERROR: Friendship is not blocked.');
    }
  });
});









module.exports = router
