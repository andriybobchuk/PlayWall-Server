const express = require('express')
const admin = require('firebase-admin')
const verifyToken = require('./middlewares/auth')
const friendshipRouter = require('./routes/friendship')
const userRouter = require('./routes/user')
const db = require('./utils/db')

admin.initializeApp({
  credential: admin.credential.cert('playwall-a1a0f-firebase-adminsdk-gy6bf-499122748c.json'),
})

const app = express()
app.use(express.json())


// app.post('/api/changeWallpaper', verifyToken, (req, res) => {
//   const { fileName, recipientId, comment, reaction, type } = req.body;
//   const requesterId = req.user.id;

//   // Insert wallpaper into the Wallpapers table with type provided by the client
//   const insertWallpaperQuery = `
//     INSERT INTO Wallpapers (fileName, type)
//     VALUES (?, ?)
//   `;

//   db.query(insertWallpaperQuery, [fileName, type], (err, wallpaperResults) => {
//     if (err) {
//       console.error('Database insert error: ' + err.message);
//       return res.status(500).send('ERROR: Could not insert wallpaper record.');
//     }

//     const wallpaperId = wallpaperResults.insertId; // Get the wallpaper ID

//     // Insert record into the SentWallpapers table with comment and reaction
//     const insertSentWallpaperQuery = `
//       INSERT INTO SentWallpapers (wallpaperId, requesterId, recipientId, comment, reaction)
//       VALUES (?, ?, ?, ?, ?)
//     `;
//     db.query(
//       insertSentWallpaperQuery,
//       [wallpaperId, requesterId, recipientId, comment, reaction],
//       (err, sentWallpaperResults) => {
//         if (err) {
//           console.error('Database insert error: ' + err.message);
//           return res.status(500).send('ERROR: Could not insert sent wallpaper record.');
//         }

//         // Update the last wallpaper in the Friendships table
//         const updateFriendshipQuery = `
//           UPDATE Friendships 
//           SET last_wallpaper_id = ?
//           WHERE (requester_id = ? AND addressee_id = ?)
//              OR (requester_id = ? AND addressee_id = ?)
//         `;
//         db.query(updateFriendshipQuery, [wallpaperId, requesterId, recipientId, recipientId, requesterId], (err, result) => {
//           if (err) {
//             console.error('Error updating last_wallpaper_id in Friendships: ' + err.message);
//             return res.status(500).send('ERROR: Could not update friendship with last wallpaper.');
//           }

//           // Fetch the recipient's push token for sending the notification
//           const query = 'SELECT pushToken FROM Users WHERE id = ?';
//           db.query(query, [recipientId], (err, results) => {
//             if (err) {
//               console.error('Database query error: ' + err.message);
//               return res.status(500).send('ERROR: Could not fetch user push token.');
//             }

//             if (results.length > 0) {
//               const pushToken = results[0].pushToken;

//               const message = {
//                 data: {
//                   type: 'wallpaper',
//                   fileName: fileName,
//                   wallpaperType: type,  // Changed "type" to "wallpaperType" to avoid name conflict
//                   wallpaperId: wallpaperId.toString(),  // Send the wallpaper ID
//                   requesterId: requesterId.toString(),
//                   recipientId: recipientId.toString(),
//                   timeSent: new Date().toISOString(),  // Timestamp of when the wallpaper was sent
//                 },
//                 token: pushToken,
//               };

//               admin.messaging().send(message)
//                 .then((result) => {
//                   console.log(`Notification sent: ${result}`);
//                   res.json({ success: true, result: sentWallpaperResults });
//                 })
//                 .catch((error) => {
//                   console.error('Notification sending error: ', error);
//                   res.status(500).send(error);
//                 });
//             } else {
//               res.status(404).send(`User with id ${recipientId} not found.`);
//             }
//           });
//         });
//       }
//     );
//   });
// });

// app.post('/api/changeWallpaper', verifyToken, (req, res) => {
//   const { fileName, recipientId, comment, reaction, type } = req.body;
//   const requesterId = req.user.id;

//   // Insert wallpaper into the Wallpapers table with type provided by the client
//   const insertWallpaperQuery = `
//     INSERT INTO Wallpapers (fileName, type)
//     VALUES (?, ?)
//   `;

//   db.query(insertWallpaperQuery, [fileName, type], (err, wallpaperResults) => {
//     if (err) {
//       return res.status(500).json({ errorCode: 'ERR_DB_INSERT_WALLPAPER', message: 'Could not insert wallpaper record.' });
//     }

//     const wallpaperId = wallpaperResults.insertId; // Get the wallpaper ID

//     // Insert record into the SentWallpapers table with comment and reaction
//     const insertSentWallpaperQuery = `
//       INSERT INTO SentWallpapers (wallpaperId, requesterId, recipientId, comment, reaction)
//       VALUES (?, ?, ?, ?, ?)
//     `;
//     db.query(
//       insertSentWallpaperQuery,
//       [wallpaperId, requesterId, recipientId, comment, reaction],
//       (err, sentWallpaperResults) => {
//         if (err) {
//           return res.status(500).json({ errorCode: 'ERR_DB_INSERT_SENT_WALLPAPER', message: 'Could not insert sent wallpaper record.' });
//         }

//         // Update the last wallpaper in the Friendships table
//         const updateFriendshipQuery = `
//           UPDATE Friendships 
//           SET last_wallpaper_id = ?
//           WHERE (requester_id = ? AND addressee_id = ?)
//              OR (requester_id = ? AND addressee_id = ?)
//         `;
//         db.query(updateFriendshipQuery, [wallpaperId, requesterId, recipientId, recipientId, requesterId], (err) => {
//           if (err) {
//             return res.status(500).json({ errorCode: 'ERR_DB_UPDATE_FRIENDSHIP', message: 'Could not update friendship with last wallpaper.' });
//           }

//           // Fetch the recipient's push token for sending the notification
//           const query = 'SELECT pushToken FROM Users WHERE id = ?';
//           db.query(query, [recipientId], (err, results) => {
//             if (err) {
//               return res.status(500).json({ errorCode: 'ERR_DB_FETCH_PUSH_TOKEN', message: 'Could not fetch user push token.' });
//             }

//             if (results.length > 0) {
//               const pushToken = results[0].pushToken;

//               const message = {
//                 data: {
//                   type: 'wallpaper',
//                   fileName: fileName,
//                   wallpaperType: type,
//                   wallpaperId: wallpaperId.toString(),
//                   requesterId: requesterId.toString(),
//                   recipientId: recipientId.toString(),
//                   timeSent: new Date().toISOString(),
//                 },
//                 token: pushToken,
//               };

//               admin.messaging().send(message)
//                 .then((result) => {
//                   res.json({ success: true, result: sentWallpaperResults });
//                 })
//                 .catch((error) => {
//                   return res.status(500).json({ errorCode: 'ERR_NOTIFICATION_SEND', message: 'Error sending notification.', detail: error });
//                 });
//             } else {
//               res.status(404).json({ errorCode: 'ERR_USER_NOT_FOUND', message: `User with id ${recipientId} not found.` });
//             }
//           });
//         });
//       }
//     );
//   });
// });

// app.post('/api/changeWallpaper', verifyToken, (req, res) => {
//   const { fileName, recipientId, comment, reaction, type } = req.body;
//   const requesterId = req.user.id;

//   // Insert wallpaper into the Wallpapers table with type provided by the client
//   const insertWallpaperQuery = `
//     INSERT INTO Wallpapers (fileName, type)
//     VALUES (?, ?)
//   `;

//   db.query(insertWallpaperQuery, [fileName, type], (err, wallpaperResults) => {
//     if (err) {
//       return res.status(500).json({ errorCode: 'ERR_DB_INSERT_WALLPAPER', message: 'Could not insert wallpaper record.' });
//     }

//     const wallpaperId = wallpaperResults.insertId; // Get the wallpaper ID

//     // Insert record into the SentWallpapers table with comment and reaction
//     const insertSentWallpaperQuery = `
//       INSERT INTO SentWallpapers (wallpaperId, requesterId, recipientId, comment, reaction)
//       VALUES (?, ?, ?, ?, ?)
//     `;
//     db.query(
//       insertSentWallpaperQuery,
//       [wallpaperId, requesterId, recipientId, comment, reaction],
//       (err, sentWallpaperResults) => {
//         if (err) {
//           return res.status(500).json({ errorCode: 'ERR_DB_INSERT_SENT_WALLPAPER', message: 'Could not insert sent wallpaper record.' });
//         }

//         // Update the last wallpaper in the Friendships table
//         const updateFriendshipQuery = `
//           UPDATE Friendships 
//           SET last_wallpaper_id = ?
//           WHERE (requester_id = ? AND addressee_id = ?)
//              OR (requester_id = ? AND addressee_id = ?)
//         `;
//         db.query(updateFriendshipQuery, [wallpaperId, requesterId, recipientId, recipientId, requesterId], (err) => {
//           if (err) {
//             return res.status(500).json({ errorCode: 'ERR_DB_UPDATE_FRIENDSHIP', message: 'Could not update friendship with last wallpaper.' });
//           }

//           // Fetch the recipient's push token for sending the notification
//           const query = 'SELECT pushToken FROM Users WHERE id = ?';
//           db.query(query, [recipientId], (err, results) => {
//             if (err) {
//               return res.status(500).json({ errorCode: 'ERR_DB_FETCH_PUSH_TOKEN', message: 'Could not fetch user push token.' });
//             }

//             if (results.length > 0) {
//               const pushToken = results[0].pushToken;

//               const message = {
//                 data: {
//                   type: 'wallpaper',
//                   fileName: fileName,
//                   wallpaperType: type,
//                   wallpaperId: wallpaperId.toString(),
//                   requesterId: requesterId.toString(),
//                   recipientId: recipientId.toString(),
//                   timeSent: new Date().toISOString(),
//                 },
//                 token: pushToken,
//               };

//               admin.messaging().send(message)
//                 .then((result) => {
//                   // Send a response with the required data structure
//                   res.json({
//                     success: true,
//                     data: {
//                       fileName: fileName,
//                       recipientId: recipientId,
//                       comment: comment,
//                       reaction: reaction,
//                       type: type
//                     },
//                     message: 'Wallpaper sent successfully.'
//                   });
//                 })
//                 .catch((error) => {
//                   return res.status(500).json({ errorCode: 'ERR_NOTIFICATION_SEND', message: 'Error sending notification.', detail: error });
//                 });
//             } else {
//               res.status(404).json({ errorCode: 'ERR_USER_NOT_FOUND', message: `User with id ${recipientId} not found.` });
//             }
//           });
//         });
//       }
//     );
//   });
// });

// app.post('/api/changeWallpaper', verifyToken, (req, res) => {
//   const { fileName, recipientId, comment, reaction, type } = req.body;
//   const requesterId = req.user.id;

//   // Insert wallpaper into the Wallpapers table with type provided by the client
//   const insertWallpaperQuery = `
//     INSERT INTO Wallpapers (fileName, type)
//     VALUES (?, ?)
//   `;

//   db.query(insertWallpaperQuery, [fileName, type], (err, wallpaperResults) => {
//     if (err) {
//       return res.status(500).json({ errorCode: 'ERR_DB_INSERT_WALLPAPER', message: 'Could not insert wallpaper record.' });
//     }

//     const wallpaperId = wallpaperResults.insertId; // Get the wallpaper ID

//     // Insert record into the SentWallpapers table with comment and reaction
//     const insertSentWallpaperQuery = `
//       INSERT INTO SentWallpapers (wallpaperId, requesterId, recipientId, comment, reaction)
//       VALUES (?, ?, ?, ?, ?)
//     `;
//     db.query(
//       insertSentWallpaperQuery,
//       [wallpaperId, requesterId, recipientId, comment, reaction],
//       (err, sentWallpaperResults) => {
//         if (err) {
//           return res.status(500).json({ errorCode: 'ERR_DB_INSERT_SENT_WALLPAPER', message: 'Could not insert sent wallpaper record.' });
//         }

//         // Update the last wallpaper in the Friendships table
//         const updateFriendshipQuery = `
//           UPDATE Friendships 
//           SET last_wallpaper_id = ?
//           WHERE (requester_id = ? AND addressee_id = ?)
//              OR (requester_id = ? AND addressee_id = ?)
//         `;
//         db.query(updateFriendshipQuery, [wallpaperId, requesterId, recipientId, recipientId, requesterId], (err) => {
//           if (err) {
//             return res.status(500).json({ errorCode: 'ERR_DB_UPDATE_FRIENDSHIP', message: 'Could not update friendship with last wallpaper.' });
//           }

//           // Fetch the recipient's push token for sending the notification
//           const query = 'SELECT pushToken FROM Users WHERE id = ?';
//           db.query(query, [recipientId], (err, results) => {
//             if (err) {
//               return res.status(500).json({ errorCode: 'ERR_DB_FETCH_PUSH_TOKEN', message: 'Could not fetch user push token.' });
//             }

//             if (results.length > 0) {
//               const pushToken = results[0].pushToken;

//               const message = {
//                 data: {
//                   type: 'wallpaper',
//                   fileName: fileName,
//                   wallpaperType: type,
//                   wallpaperId: wallpaperId.toString(),
//                   requesterId: requesterId.toString(),
//                   recipientId: recipientId.toString(),
//                   timeSent: new Date().toISOString(),
//                 },
//                 token: pushToken,
//               };

//               admin.messaging().send(message)
//                 .then((result) => {
//                   // Send a response with the required data structure
//                   res.json({
//                     success: true,
//                     data: {
//                       fileName: fileName,
//                       recipientId: recipientId,
//                       comment: comment,
//                       reaction: reaction,
//                       type: type
//                     },
//                     message: 'Wallpaper sent successfully.'
//                   });
//                 })
//                 .catch((error) => {
//                   return res.status(500).json({ errorCode: 'ERR_NOTIFICATION_SEND', message: 'Error sending notification.', detail: error });
//                 });
//             } else {
//               res.status(404).json({ errorCode: 'ERR_USER_NOT_FOUND', message: `User with id ${recipientId} not found.` });
//             }
//           });
//         });
//       }
//     );
//   });
// });

app.post('/api/changeWallpaper', verifyToken, (req, res) => {
  const { fileName, recipientId, comment, reaction, type } = req.body;
  const requesterId = req.user.id;

  // Insert wallpaper into the Wallpapers table with type provided by the client
  const insertWallpaperQuery = `
    INSERT INTO Wallpapers (fileName, type)
    VALUES (?, ?)
  `;

  db.query(insertWallpaperQuery, [fileName, type], (err, wallpaperResults) => {
    if (err) {
      return res.status(500).json({ errorCode: 'ERR_DB_INSERT_WALLPAPER', message: 'Could not insert wallpaper record.' });
    }

    const wallpaperId = wallpaperResults.insertId; // Get the wallpaper ID

    // Insert record into the SentWallpapers table with comment and reaction
    const insertSentWallpaperQuery = `
      INSERT INTO SentWallpapers (wallpaperId, requesterId, recipientId, comment, reaction)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(
      insertSentWallpaperQuery,
      [wallpaperId, requesterId, recipientId, comment, reaction],
      (err, sentWallpaperResults) => {
        if (err) {
          return res.status(500).json({ errorCode: 'ERR_DB_INSERT_SENT_WALLPAPER', message: 'Could not insert sent wallpaper record.' });
        }

        // Update the last wallpaper in the Friendships table
        const updateFriendshipQuery = `
          UPDATE Friendships 
          SET last_wallpaper_id = ?
          WHERE (requester_id = ? AND addressee_id = ?)
             OR (requester_id = ? AND addressee_id = ?)
        `;
        db.query(updateFriendshipQuery, [wallpaperId, requesterId, recipientId, recipientId, requesterId], (err) => {
          if (err) {
            return res.status(500).json({ errorCode: 'ERR_DB_UPDATE_FRIENDSHIP', message: 'Could not update friendship with last wallpaper.' });
          }

          // Fetch the recipient's push token for sending the notification
          const query = 'SELECT pushToken FROM Users WHERE id = ?';
          db.query(query, [recipientId], (err, results) => {
            if (err) {
              return res.status(500).json({ errorCode: 'ERR_DB_FETCH_PUSH_TOKEN', message: 'Could not fetch user push token.' });
            }

            if (results.length > 0) {
              const pushToken = results[0].pushToken;

              const message = {
                data: {
                  type: 'wallpaper',
                  fileName: fileName,
                  wallpaperType: type,
                  wallpaperId: wallpaperId.toString(),
                  requesterId: requesterId.toString(),
                  recipientId: recipientId.toString(),
                  timeSent: new Date().toISOString(),
                },
                token: pushToken,
              };

              admin.messaging().send(message)
                .then((result) => {
                  // Create the response object with the new structure
                  const responseData = {
                    fileName: fileName,
                    recipientId: recipientId,
                    comment: comment,
                    reaction: reaction,
                    type: type,
                    id: wallpaperId, // Add the wallpaper ID
                    timestamp: new Date().toISOString(), // Add the current timestamp
                    status: 'unread', // Default status, can be modified as needed
                    senderId: requesterId // Add the sender ID
                  };

                  // Send the response with the required data structure
                  res.json({
                    success: true,
                    data: responseData,
                    message: 'Wallpaper sent successfully.'
                  });
                })
                .catch((error) => {
                  return res.status(500).json({ errorCode: 'ERR_NOTIFICATION_SEND', message: 'Error sending notification.', detail: error });
                });
            } else {
              res.status(404).json({ errorCode: 'ERR_USER_NOT_FOUND', message: `User with id ${recipientId} not found.` });
            }
          });
        });
      }
    );
  });
});




app.get('/api/getRecipientData/:recipientId', verifyToken, (req, res) => {
  const recipientId = req.params.recipientId;
  const currentUserId = req.user.id; // Get the current user's ID from the token

  // Query to join Users and Friendships to fetch both user and friendship details, including screenRatio
  const query = `
    SELECT u.id, u.nick, u.email, u.avatarId, u.screenRatio, f.created_at AS since, f.status, f.requester_id AS requesterId, f.friendship_id
    FROM Users u
    JOIN Friendships f 
      ON (f.requester_id = ? AND f.addressee_id = u.id) 
      OR (f.addressee_id = ? AND f.requester_id = u.id)
    WHERE u.id = ?
  `;

  db.query(query, [currentUserId, currentUserId, recipientId], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Unable to fetch recipient data.');
    }

    if (results.length === 0) {
      return res.status(404).send('ERROR: Recipient or friendship not found.');
    }

    // Construct response with both user data and friendship details, including screenRatio
    const userDataResponse = {
      id: results[0].id,
      name: results[0].nick || "",  // Provide default value if null
      email: results[0].email,
      avatarId: results[0].avatarId || "",  // Provide default value if null
      screenRatio: results[0].screenRatio || 2.28,  // Provide default value if null (default to 1)
      since: results[0].since,  // Date when the friendship was created
      status: results[0].status,  // Status of the friendship
      requesterId: results[0].requesterId,  // ID of the person who initiated the friendship
      friendshipId: results[0].friendship_id
    };

    res.status(200).json(userDataResponse);
  });
});



app.get('/api/wallpaperHistory/:recipientId', verifyToken, (req, res) => {
  const recipientId = req.params.recipientId; 
  const firebaseId = req.user.uid; 

  const page = parseInt(req.query.page) || 0;
  const pageSize = parseInt(req.query.pageSize) || 15; 
  const offset = page * pageSize;

  const getUserIdQuery = `SELECT id FROM Users WHERE firebaseId = ?`;

  db.query(getUserIdQuery, [firebaseId], (err, results) => {
    if (err) {
      console.error('Database query error (get user ID): ' + err.message);
      return res.status(500).send('ERROR: Could not fetch user ID.');
    }

    if (results.length === 0) {
      return res.status(404).send('ERROR: User not found.');
    }

    const loggedInUserId = results[0].id;

    const wallpaperHistoryQuery = `
      SELECT 
        w.id, 
        w.fileName, 
        w.type, 
        s.comment, 
        s.reaction, 
        s.timeSent, 
        s.requesterId, 
        s.recipientId, 
        s.status 
      FROM SentWallpapers s
      JOIN Wallpapers w ON s.wallpaperId = w.id
      WHERE (s.requesterId = ? AND s.recipientId = ?)
         OR (s.requesterId = ? AND s.recipientId = ?)
      ORDER BY s.timeSent DESC
      LIMIT ? OFFSET ?
    `;

    db.query(wallpaperHistoryQuery, 
      [loggedInUserId, recipientId, recipientId, loggedInUserId, pageSize, offset], 
      (err, results) => {
        if (err) {
          console.error('Database query error (wallpaper history): ' + err.message);
          return res.status(500).send('ERROR: Could not fetch wallpaper history.');
        }

        // You can include totalCount if needed for better client-side handling.
        res.json({
          data: results,
          page: page,
          pageSize: pageSize,
          endReached: results.length < pageSize // Indicate end of pagination
        });
      });
  });
});


// app.post('/api/wallpaper/addReaction', verifyToken, (req, res) => {
//   const { wallpaperId, reaction } = req.body;
//   const userId = req.user.id; // The user who is adding the reaction

//   const query = `
//     UPDATE SentWallpapers 
//     SET reaction = ? 
//     WHERE wallpaperId = ? 
//     AND (requesterId = ? OR recipientId = ?)
//   `;

//   db.query(query, [reaction, wallpaperId, userId, userId], (err, results) => {
//     if (err) {
//       console.error('Database update error: ' + err.message);
//       return res.status(500).send('ERROR: Could not add reaction.');
//     }

//     // Fetch the wallpaper's requesterId and recipientId to determine who should receive the notification
//     const getRecipientQuery = `
//       SELECT requesterId, recipientId 
//       FROM SentWallpapers 
//       WHERE wallpaperId = ?
//     `;

//     db.query(getRecipientQuery, [wallpaperId], (err, results) => {
//       if (err) {
//         console.error('Error fetching recipient for notification: ' + err.message);
//         return res.status(500).send('ERROR: Could not notify recipient.');
//       }

//       if (results.length > 0) {
//         const { requesterId, recipientId } = results[0];

//         // Determine who should receive the notification: if userId is the requester, notify the recipient and vice versa
//         const notifyUserId = (userId === requesterId) ? recipientId : requesterId;

//         // Fetch the push token of the user who should be notified
//         const getPushTokenQuery = `SELECT pushToken FROM Users WHERE id = ?`;
        

//         db.query(getPushTokenQuery, [notifyUserId], (err, tokenResults) => {
//           if (err) {
//             console.error('Error fetching push token: ' + err.message);
//             return res.status(500).send('ERROR: Could not notify recipient.');
//           }

//           const pushToken = tokenResults[0]?.pushToken;
//           if (pushToken) {
//             // Send FCM notification for the reaction to the recipient
//             const message = {
//               data: {
//                 type: "reaction",
//                 reaction: reaction,
//               },
//               token: pushToken
//             };

//             admin.messaging().send(message)
//               .then(response => {
//                 console.log('Reaction notification sent successfully:', response);
//               })
//               .catch(error => {
//                 console.error('Error sending reaction notification:', error);
//               });
//           }
//         });
//       } else {
//         return res.status(404).send('ERROR: Wallpaper not found.');
//       }
//     });

//     res.json({ success: true });
//   });
// });


app.post('/api/wallpaper/addReaction', verifyToken, (req, res) => {
  const { wallpaperId, reaction } = req.body;
  const userId = req.user.id; // The user who is adding the reaction

  const query = `
    UPDATE SentWallpapers 
    SET reaction = ? 
    WHERE wallpaperId = ? 
    AND (requesterId = ? OR recipientId = ?)
  `;

  db.query(query, [reaction, wallpaperId, userId, userId], (err, results) => {
    if (err) {
      console.error('Database update error: ' + err.message);
      return res.status(500).send('ERROR: Could not add reaction.');
    }

    // Fetch the wallpaper's requesterId and recipientId to determine who should receive the notification
    const getRecipientQuery = `
      SELECT requesterId, recipientId 
      FROM SentWallpapers 
      WHERE wallpaperId = ?
    `;

    db.query(getRecipientQuery, [wallpaperId], (err, results) => {
      if (err) {
        console.error('Error fetching recipient for notification: ' + err.message);
        return res.status(500).send('ERROR: Could not notify recipient.');
      }

      if (results.length > 0) {
        const { requesterId, recipientId } = results[0];

        // Determine who should receive the notification: if userId is the requester, notify the recipient and vice versa
        const notifyUserId = (userId === requesterId) ? recipientId : requesterId;

        // Fetch the push token of the user who should be notified
        const getPushTokenQuery = `SELECT pushToken FROM Users WHERE id = ?`;
        
        db.query(getPushTokenQuery, [notifyUserId], (err, tokenResults) => {
          if (err) {
            console.error('Error fetching push token: ' + err.message);
            return res.status(500).send('ERROR: Could not notify recipient.');
          }

          const pushToken = tokenResults[0]?.pushToken;
          if (pushToken) {
            // Send FCM notification for the reaction to the recipient
            const message = {
              data: {
                type: "reaction",
                wallpaperId: wallpaperId.toString(),  // Include wallpaperId
                requesterId: requesterId.toString(),    // Include requesterId
                recipientId: recipientId.toString(),    // Include recipientId
                reaction: reaction,
              },
              token: pushToken
            };

            admin.messaging().send(message)
              .then(response => {
                console.log('Reaction notification sent successfully:', response);
              })
              .catch(error => {
                console.error('Error sending reaction notification:', error);
              });
          }
        });
      } else {
        return res.status(404).send('ERROR: Wallpaper not found.');
      }
    });

    res.json({ success: true });
  });
});






// app.post('/api/wallpaper/removeReaction', verifyToken, (req, res) => {
//   const { wallpaperId } = req.body;
//   const userId = req.user.id; // This is the person performing the action (removing the reaction)

//   const updateReactionQuery = `
//     UPDATE SentWallpapers 
//     SET reaction = NULL 
//     WHERE wallpaperId = ? 
//     AND (requesterId = ? OR recipientId = ?)
//   `;

//   db.query(updateReactionQuery, [wallpaperId, userId, userId], (err, results) => {
//     if (err) {
//       console.error('Database update error: ' + err.message);
//       return res.status(500).send('ERROR: Could not remove reaction.');
//     }

//     // Fetch the complete wallpaper data for the notification
//     const getWallpaperQuery = `
//       SELECT w.id, w.fileName, w.type AS wallpaperType, s.comment, s.reaction, s.timeSent, s.requesterId, s.recipientId
//       FROM SentWallpapers s
//       JOIN Wallpapers w ON s.wallpaperId = w.id
//       WHERE w.id = ?
//     `;

//     db.query(getWallpaperQuery, [wallpaperId], (err, results) => {
//       if (err) {
//         console.error('Error fetching wallpaper data for notification: ' + err.message);
//         return res.status(500).send('ERROR: Could not notify recipient.');
//       }

//       if (results.length > 0) {
//         const wallpaper = results[0];

//         // Determine who should receive the notification
//         const notifyUserId = (userId === wallpaper.requesterId) ? wallpaper.recipientId : wallpaper.requesterId;

//         // Fetch the push token of the user who should be notified
//         const getPushTokenQuery = `SELECT pushToken FROM Users WHERE id = ?`;

//         db.query(getPushTokenQuery, [notifyUserId], (err, tokenResults) => {
//           if (err) {
//             console.error('Error fetching push token: ' + err.message);
//             return res.status(500).send('ERROR: Could not notify recipient.');
//           }

//           const pushToken = tokenResults[0]?.pushToken;
//           if (pushToken) {
//             // Create WallpaperHistoryResponse object for the notification
//             const wallpaperHistoryResponse = {
//               id: wallpaper.id,
//               fileName: wallpaper.fileName,
//               wallpaperType: wallpaper.wallpaperType,
//               requesterId: wallpaper.requesterId,
//               recipientId: wallpaper.recipientId,
//               comment: wallpaper.comment,
//               reaction: null,  // Reaction is now removed
//               timeSent: wallpaper.timeSent
//             };

//             // Send FCM notification with the WallpaperHistoryResponse
//             const message = {
//               data: {
//                 type: "reaction_removed",  // Notification type
//                 ...wallpaperHistoryResponse
//               },
//               token: pushToken
//             };

//             admin.messaging().send(message)
//               .then(response => {
//                 console.log('Reaction removal notification sent successfully:', response);
//               })
//               .catch(error => {
//                 console.error('Error sending reaction removal notification:', error);
//               });
//           }
//         });
//       } else {
//         return res.status(404).send('ERROR: Wallpaper not found.');
//       }
//     });

//     res.json({ success: true });
//   });
// // });
// app.post('/api/wallpaper/removeReaction', verifyToken, (req, res) => {
//   const { wallpaperId } = req.body;
//   const userId = req.user.id; // This is the person performing the action (removing the reaction)

//   const updateReactionQuery = `
//     UPDATE SentWallpapers 
//     SET reaction = NULL 
//     WHERE wallpaperId = ? 
//     AND (requesterId = ? OR recipientId = ?)
//   `;

//   db.query(updateReactionQuery, [wallpaperId, userId, userId], (err, results) => {
//     if (err) {
//       console.error('Database update error: ' + err.message);
//       return res.status(500).send('ERROR: Could not remove reaction.');
//     }

//     // Fetch the complete wallpaper data for the notification
//     const getWallpaperQuery = `
//       SELECT w.id, w.fileName, w.type AS wallpaperType, s.comment, s.reaction, s.timeSent, s.requesterId, s.recipientId
//       FROM SentWallpapers s
//       JOIN Wallpapers w ON s.wallpaperId = w.id
//       WHERE w.id = ?
//     `;

//     db.query(getWallpaperQuery, [wallpaperId], (err, results) => {
//       if (err) {
//         console.error('Error fetching wallpaper data for notification: ' + err.message);
//         return res.status(500).send('ERROR: Could not notify recipient.');
//       }

//       if (results.length > 0) {
//         const wallpaper = results[0];

//         // Determine who should receive the notification: if userId is the requester, notify the recipient and vice versa
//         const notifyUserId = (userId === wallpaper.requesterId) ? wallpaper.recipientId : wallpaper.requesterId;

//         // Fetch the push token of the user who should be notified
//         const getPushTokenQuery = `SELECT pushToken FROM Users WHERE id = ?`;

//         db.query(getPushTokenQuery, [notifyUserId], (err, tokenResults) => {
//           if (err) {
//             console.error('Error fetching push token: ' + err.message);
//             return res.status(500).send('ERROR: Could not notify recipient.');
//           }

//           const pushToken = tokenResults[0]?.pushToken;
//           if (pushToken) {
//             // Create WallpaperHistoryResponse object for the notification
//             const wallpaperHistoryResponse = {
//               id: wallpaper.id,
//               fileName: wallpaper.fileName,
//               wallpaperType: wallpaper.wallpaperType,
//               requesterId: wallpaper.requesterId,
//               recipientId: wallpaper.recipientId,
//               comment: wallpaper.comment,
//               reaction: null,  // Reaction is now removed
//               timeSent: wallpaper.timeSent
//             };

//             // Send FCM notification with the WallpaperHistoryResponse
//             const message = {
//               data: {
//                 type: "reaction_removed",  // Notification type
//                 id: wallpaperHistoryResponse.id.toString(), // Include id
//                 fileName: wallpaperHistoryResponse.fileName, // Include fileName
//                 wallpaperType: wallpaperHistoryResponse.wallpaperType, // Include wallpaperType
//                 requesterId: wallpaperHistoryResponse.requesterId.toString(), // Include requesterId
//                 recipientId: wallpaperHistoryResponse.recipientId.toString(), // Include recipientId
//                 comment: wallpaperHistoryResponse.comment || "", // Include comment
//                 reaction: wallpaperHistoryResponse.reaction, // Include reaction
//                 timeSent: wallpaperHistoryResponse.timeSent, // Include timeSent
//               },
//               token: pushToken
//             };

//             admin.messaging().send(message)
//               .then(response => {
//                 console.log('Reaction removal notification sent successfully:', response);
//               })
//               .catch(error => {
//                 console.error('Error sending reaction removal notification:', error);
//               });
//           }
//         });
//       } else {
//         return res.status(404).send('ERROR: Wallpaper not found.');
//       }
//     });

//     res.json({ success: true });
//   });
// });



// app.post('/api/wallpaper/addComment', verifyToken, (req, res) => {
//   const { wallpaperId, comment } = req.body;
//   const userId = req.user.id; // The user who is adding the comment

//   const updateCommentQuery = `
//     UPDATE SentWallpapers 
//     SET comment = ? 
//     WHERE wallpaperId = ? 
//     AND (requesterId = ? OR recipientId = ?)
//   `;

//   db.query(updateCommentQuery, [comment, wallpaperId, userId, userId], (err, results) => {
//     if (err) {
//       console.error('Database update error: ' + err.message);
//       return res.status(500).send('ERROR: Could not add comment.');
//     }

//     // Fetch the complete wallpaper data for the notification
//     const getWallpaperQuery = `
//       SELECT w.id, w.fileName, w.type AS wallpaperType, s.comment, s.reaction, s.timeSent, s.requesterId, s.recipientId
//       FROM SentWallpapers s
//       JOIN Wallpapers w ON s.wallpaperId = w.id
//       WHERE w.id = ?
//     `;

//     db.query(getWallpaperQuery, [wallpaperId], (err, results) => {
//       if (err) {
//         console.error('Error fetching wallpaper data for notification: ' + err.message);
//         return res.status(500).send('ERROR: Could not notify recipient.');
//       }

//       if (results.length > 0) {
//         const wallpaper = results[0];

//         // Determine who should receive the notification
//         const notifyUserId = (userId === wallpaper.requesterId) ? wallpaper.recipientId : wallpaper.requesterId;

//         // Fetch the push token of the user who should be notified
//         const getPushTokenQuery = `SELECT pushToken FROM Users WHERE id = ?`;

//         db.query(getPushTokenQuery, [notifyUserId], (err, tokenResults) => {
//           if (err) {
//             console.error('Error fetching push token: ' + err.message);
//             return res.status(500).send('ERROR: Could not notify recipient.');
//           }

//           const pushToken = tokenResults[0]?.pushToken;
//           if (pushToken) {
//             // Create WallpaperHistoryResponse object for the notification
//             const wallpaperHistoryResponse = {
//               id: wallpaper.id,
//               fileName: wallpaper.fileName,
//               wallpaperType: wallpaper.wallpaperType,
//               requesterId: wallpaper.requesterId,
//               recipientId: wallpaper.recipientId,
//               comment: comment, // Updated with new comment
//               reaction: wallpaper.reaction, // Keep the reaction unchanged
//               timeSent: wallpaper.timeSent
//             };

//             // Send FCM notification with the WallpaperHistoryResponse
//             const message = {
//               data: {
//                 type: "comment",
//                 ...wallpaperHistoryResponse
//               },
//               token: pushToken
//             };

//             admin.messaging().send(message)
//               .then(response => {
//                 console.log('Comment notification sent successfully:', response);
//               })
//               .catch(error => {
//                 console.error('Error sending comment notification:', error);
//               });
//           }
//         });
//       } else {
//         return res.status(404).send('ERROR: Wallpaper not found.');
//       }
//     });

//     res.json({ success: true });
//   });
// });
app.post('/api/wallpaper/removeReaction', verifyToken, (req, res) => {
  const { wallpaperId } = req.body;
  const userId = req.user.id; // This is the person performing the action (removing the reaction)

  const updateReactionQuery = `
    UPDATE SentWallpapers 
    SET reaction = NULL 
    WHERE wallpaperId = ? 
    AND (requesterId = ? OR recipientId = ?)
  `;

  db.query(updateReactionQuery, [wallpaperId, userId, userId], (err, results) => {
    if (err) {
      console.error('Database update error: ' + err.message);
      return res.status(500).send('ERROR: Could not remove reaction.');
    }

    // Fetch the wallpaper's requesterId and recipientId to determine who should receive the notification
    const getRecipientQuery = `
      SELECT requesterId, recipientId 
      FROM SentWallpapers 
      WHERE wallpaperId = ?
    `;

    db.query(getRecipientQuery, [wallpaperId], (err, results) => {
      if (err) {
        console.error('Error fetching recipient for notification: ' + err.message);
        return res.status(500).send('ERROR: Could not notify recipient.');
      }

      if (results.length > 0) {
        const { requesterId, recipientId } = results[0];

        // Determine who should receive the notification: if userId is the requester, notify the recipient and vice versa
        const notifyUserId = (userId === requesterId) ? recipientId : requesterId;

        // Fetch the push token of the user who should be notified
        const getPushTokenQuery = `SELECT pushToken FROM Users WHERE id = ?`;

        db.query(getPushTokenQuery, [notifyUserId], (err, tokenResults) => {
          if (err) {
            console.error('Error fetching push token: ' + err.message);
            return res.status(500).send('ERROR: Could not notify recipient.');
          }

          const pushToken = tokenResults[0]?.pushToken;
          if (pushToken) {
            // Send FCM notification for the reaction removal to the recipient
            const message = {
              data: {
                type: "reaction_removed",  // Notification type
                wallpaperId: wallpaperId.toString(), // Include wallpaperId
                requesterId: requesterId.toString(),    // Include requesterId
                recipientId: recipientId.toString(),    // Include recipientId
                //comment: "", // Reaction is removed, no comment
                reaction: "none", // Reaction is now null
              },
              token: pushToken
            };

            admin.messaging().send(message)
              .then(response => {
                console.log('Reaction removal notification sent successfully:', response);
              })
              .catch(error => {
                console.error('Error sending reaction removal notification:', error);
              });
          }
        });
      } else {
        return res.status(404).send('ERROR: Wallpaper not found.');
      }
    });

    res.json({ success: true });
  });
});




app.post('/api/wallpaper/addComment', verifyToken, (req, res) => {
  const { wallpaperId, comment } = req.body;
  const userId = req.user.id; // The user who is adding the comment

  const updateCommentQuery = `
    UPDATE SentWallpapers 
    SET comment = ? 
    WHERE wallpaperId = ? 
    AND (requesterId = ? OR recipientId = ?)
  `;

  db.query(updateCommentQuery, [comment, wallpaperId, userId, userId], (err, results) => {
    if (err) {
      console.error('Database update error: ' + err.message);
      return res.status(500).send('ERROR: Could not add comment.');
    }

    // Fetch the wallpaper's requesterId and recipientId to determine who should receive the notification
    const getRecipientQuery = `
      SELECT requesterId, recipientId 
      FROM SentWallpapers 
      WHERE wallpaperId = ?
    `;

    db.query(getRecipientQuery, [wallpaperId], (err, results) => {
      if (err) {
        console.error('Error fetching recipient for notification: ' + err.message);
        return res.status(500).send('ERROR: Could not notify recipient.');
      }

      if (results.length > 0) {
        const { requesterId, recipientId } = results[0];

        // Determine who should receive the notification: if userId is the requester, notify the recipient and vice versa
        const notifyUserId = (userId === requesterId) ? recipientId : requesterId;

        // Fetch the push token of the user who should be notified
        const getPushTokenQuery = `SELECT pushToken FROM Users WHERE id = ?`;

        db.query(getPushTokenQuery, [notifyUserId], (err, tokenResults) => {
          if (err) {
            console.error('Error fetching push token: ' + err.message);
            return res.status(500).send('ERROR: Could not notify recipient.');
          }

          const pushToken = tokenResults[0]?.pushToken;
          if (pushToken) {
            // Send FCM notification for the comment to the recipient
            const message = {
              data: {
                type: "comment",  // Notification type
                wallpaperId: wallpaperId.toString(), // Include wallpaperId
                requesterId: requesterId.toString(),    // Include requesterId
                recipientId: recipientId.toString(),    // Include recipientId
                comment: comment, // Updated with new comment
                //reaction: "wow", // Keep the reaction unchanged
              },
              token: pushToken
            };

            admin.messaging().send(message)
              .then(response => {
                console.log('Comment notification sent successfully:', response);
              })
              .catch(error => {
                console.error('Error sending comment notification:', error);
              });
          }
        });
      } else {
        return res.status(404).send('ERROR: Wallpaper not found.');
      }
    });

    res.json({ success: true });
  });
});



// app.post('/api/wallpaper/removeReaction', verifyToken, (req, res) => {
//   const { wallpaperId } = req.body;
//   const userId = req.user.id; // This is the person performing the action (removing the reaction)

//   const updateReactionQuery = `
//     UPDATE SentWallpapers 
//     SET reaction = NULL 
//     WHERE wallpaperId = ? 
//     AND (requesterId = ? OR recipientId = ?)
//   `;

//   db.query(updateReactionQuery, [wallpaperId, userId, userId], (err, results) => {
//     if (err) {
//       console.error('Database update error: ' + err.message);
//       return res.status(500).send('ERROR: Could not remove reaction.');
//     }

//     // Fetch the complete wallpaper data for the notification
//     const getWallpaperQuery = `
//       SELECT w.id, w.fileName, w.type AS wallpaperType, s.comment, s.reaction, s.timeSent, s.requesterId, s.recipientId
//       FROM SentWallpapers s
//       JOIN Wallpapers w ON s.wallpaperId = w.id
//       WHERE w.id = ?
//     `;

//     db.query(getWallpaperQuery, [wallpaperId], (err, results) => {
//       if (err) {
//         console.error('Error fetching wallpaper data for notification: ' + err.message);
//         return res.status(500).send('ERROR: Could not notify recipient.');
//       }

//       if (results.length > 0) {
//         const wallpaper = results[0];

//         // Determine who should receive the notification: if userId is the requester, notify the recipient and vice versa
//         const notifyUserId = (userId === wallpaper.requesterId) ? wallpaper.recipientId : wallpaper.requesterId;

//         // Fetch the push token of the user who should be notified
//         const getPushTokenQuery = `SELECT pushToken FROM Users WHERE id = ?`;

//         db.query(getPushTokenQuery, [notifyUserId], (err, tokenResults) => {
//           if (err) {
//             console.error('Error fetching push token: ' + err.message);
//             return res.status(500).send('ERROR: Could not notify recipient.');
//           }

//           const pushToken = tokenResults[0]?.pushToken;
//           if (pushToken) {
//             // Create WallpaperHistoryResponse object for the notification
//             const wallpaperHistoryResponse = {
//               id: wallpaper.id,
//               fileName: wallpaper.fileName,
//               wallpaperType: wallpaper.wallpaperType,  // Renamed to wallpaperType
//               requesterId: wallpaper.requesterId,
//               recipientId: wallpaper.recipientId,
//               comment: wallpaper.comment,
//               reaction: null,  // Reaction is now removed
//               timeSent: wallpaper.timeSent
//             };

//             // Send FCM notification with the WallpaperHistoryResponse
//             const message = {
//               data: {
//                 type: "reaction_removed",  // Notification type
//                 ...wallpaperHistoryResponse
//               },
//               token: pushToken
//             };

//             admin.messaging().send(message)
//               .then(response => {
//                 console.log('Reaction removal notification sent successfully:', response);
//               })
//               .catch(error => {
//                 console.error('Error sending reaction removal notification:', error);
//               });
//           }
//         });
//       } else {
//         return res.status(404).send('ERROR: Wallpaper not found.');
//       }
//     });

//     res.json({ success: true });
//   });
// });




// app.post('/api/wallpaper/addComment', verifyToken, (req, res) => {
//   const { wallpaperId, comment } = req.body;
//   const userId = req.user.id; // The user who is adding the comment

//   const updateCommentQuery = `
//     UPDATE SentWallpapers 
//     SET comment = ? 
//     WHERE wallpaperId = ? 
//     AND (requesterId = ? OR recipientId = ?)
//   `;

//   db.query(updateCommentQuery, [comment, wallpaperId, userId, userId], (err, results) => {
//     if (err) {
//       console.error('Database update error: ' + err.message);
//       return res.status(500).send('ERROR: Could not add comment.');
//     }

//     // Fetch the complete wallpaper data for the notification
//     const getWallpaperQuery = `
//       SELECT w.id, w.fileName, w.type AS wallpaperType, s.comment, s.reaction, s.timeSent, s.requesterId, s.recipientId
//       FROM SentWallpapers s
//       JOIN Wallpapers w ON s.wallpaperId = w.id
//       WHERE w.id = ?
//     `;

//     db.query(getWallpaperQuery, [wallpaperId], (err, results) => {
//       if (err) {
//         console.error('Error fetching wallpaper data for notification: ' + err.message);
//         return res.status(500).send('ERROR: Could not notify recipient.');
//       }

//       if (results.length > 0) {
//         const wallpaper = results[0];

//         // Determine who should receive the notification: if userId is the requester, notify the recipient and vice versa
//         const notifyUserId = (userId === wallpaper.requesterId) ? wallpaper.recipientId : wallpaper.requesterId;

//         // Fetch the push token of the user who should be notified
//         const getPushTokenQuery = `SELECT pushToken FROM Users WHERE id = ?`;

//         db.query(getPushTokenQuery, [notifyUserId], (err, tokenResults) => {
//           if (err) {
//             console.error('Error fetching push token: ' + err.message);
//             return res.status(500).send('ERROR: Could not notify recipient.');
//           }

//           const pushToken = tokenResults[0]?.pushToken;
//           if (pushToken) {
//             // Create WallpaperHistoryResponse object for the notification
//             const wallpaperHistoryResponse = {
//               id: wallpaper.id,
//               fileName: wallpaper.fileName,
//               wallpaperType: wallpaper.wallpaperType, // Renamed to avoid conflict
//               requesterId: wallpaper.requesterId,
//               recipientId: wallpaper.recipientId,
//               comment: wallpaper.comment, // Updated with new comment
//               reaction: wallpaper.reaction, // Keep the reaction unchanged
//               timeSent: wallpaper.timeSent
//             };

//             // Send FCM notification with the WallpaperHistoryResponse
//             const message = {
//               data: {
//                 type: "comment",
//                 ...wallpaperHistoryResponse
//               },
//               token: pushToken
//             };

//             admin.messaging().send(message)
//               .then(response => {
//                 console.log('Comment notification sent successfully:', response);
//               })
//               .catch(error => {
//                 console.error('Error sending comment notification:', error);
//               });
//           }
//         });
//       } else {
//         return res.status(404).send('ERROR: Wallpaper not found.');
//       }
//     });

//     res.json({ success: true });
//   });
// });

app.post('/api/wallpaper/markMessagesAsRead', verifyToken, (req, res) => {
  const { friendshipId, lastMessageId } = req.body;
  const userId = req.user.id;

  // Ensure the user is part of the friendship
  const checkFriendshipQuery = `
    SELECT friendship_id 
    FROM Friendships 
    WHERE friendship_id = ? 
    AND (requester_id = ? OR addressee_id = ?)
  `;

  db.query(checkFriendshipQuery, [friendshipId, userId, userId], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Unable to verify friendship.');
    }

    if (results.length === 0) {
      return res.status(404).send('ERROR: Friendship not found.');
    }

    // Update the message status to 'read' in SentWallpapers table
    const updateMessageStatusQuery = `
      UPDATE SentWallpapers 
      SET status = 'read' 
      WHERE wallpaperId = ? AND status = 'unread'
    `;

    db.query(updateMessageStatusQuery, [lastMessageId], (err, results) => {
      if (err) {
        console.error('Database update error: ' + err.message);
        return res.status(500).send('ERROR: Unable to mark messages as read.');
      }

      res.json({ success: true });
    });
  });
});






app.post('/api/wallpaper/report', verifyToken, (req, res) => {
  const { wallpaperId } = req.body
  const userId = req.user.id

  const query = 'INSERT INTO Reports (wallpaperId, userId) VALUES (?, ?)'
  db.query(query, [wallpaperId, userId], (err, results) => {
    if (err) {
      console.error('Database insert error: ' + err.message)
      return res.status(500).send('ERROR: Could not report wallpaper.')
    }

    res.json({ success: true })
  })
})

app.use('/api/user', userRouter)
app.use('/api/friendship', friendshipRouter)

app.listen(3000, () => {
  console.log('Server runs at port 3000')
})

app.get('/api/exploreWallpapers', verifyToken, (req, res) => {
  const page = parseInt(req.query.page) || 0; // Default to page 0
  const pageSize = parseInt(req.query.pageSize) || 6; // Default to page size 6
  const offset = page * pageSize; // Offset for pagination

  // Adjusted query to fetch both 'New' and 'Popular' wallpapers, sorted by 'order'
  const wallpapersQuery = `
    SELECT * FROM Wallpapers
    WHERE type IN ('New', 'Popular')
    ORDER BY \`order\` ASC,
             CASE 
               WHEN type = 'New' THEN dateCreated 
               WHEN type = 'Popular' THEN savedCount 
             END DESC
    LIMIT ? OFFSET ?
  `;

  db.query(wallpapersQuery, [pageSize, offset], (err, wallpapers) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Could not fetch wallpapers.');
    }

    // Split the results into 'New' and 'Popular' groups
    const newWallpapers = wallpapers.filter(wallpaper => wallpaper.type === 'New');
    const popularWallpapers = wallpapers.filter(wallpaper => wallpaper.type === 'Popular');

    const combinedResults = [];
    const newGroupSize = 3;  // Number of new wallpapers in each group
    const popularGroupSize = 3;  // Number of popular wallpapers in each group

    const maxIterations = Math.max(newWallpapers.length, popularWallpapers.length);
    
    for (let i = 0; i < maxIterations; i += newGroupSize) {
      // Push 3 new wallpapers first
      for (let j = 0; j < newGroupSize; j++) {
        if (newWallpapers[i + j]) combinedResults.push(newWallpapers[i + j]);
      }
      // Then push 3 popular wallpapers
      for (let j = 0; j < popularGroupSize; j++) {
        if (popularWallpapers[i + j]) combinedResults.push(popularWallpapers[i + j]);
      }
    }

    res.json(combinedResults);
  });
});


// // EXPLORE ----------
// app.get('/api/exploreWallpapers', verifyToken, (req, res) => {
//   const page = parseInt(req.query.page) || 0; // Default to page 0
//   const pageSize = parseInt(req.query.pageSize) || 6; // Default to page size 6
  
//   const offsetNew = page * Math.ceil(pageSize / 2); // Offset for "New" wallpapers
//   const offsetPopular = page * Math.floor(pageSize / 2); // Offset for "Popular" wallpapers

//   // Adjusted query to consider 'order' for 'New' wallpapers, then by dateCreated
//   const newWallpapersQuery = `
//     SELECT * FROM Wallpapers
//     WHERE type = 'New'
//     ORDER BY \`order\` ASC, dateCreated DESC
//     LIMIT ? OFFSET ?
//   `;

//   // Adjusted query to consider 'order' for 'Popular' wallpapers, then by savedCount
//   const popularWallpapersQuery = `
//     SELECT * FROM Wallpapers
//     WHERE type = 'Popular'
//     ORDER BY \`order\` ASC, savedCount DESC
//     LIMIT ? OFFSET ?
//   `;

//   const results = [];

//   // Fetch the new wallpapers
//   db.query(newWallpapersQuery, [Math.ceil(pageSize / 2), offsetNew], (err, newWallpapers) => {
//     if (err) {
//       console.error('Database query error (new): ' + err.message);
//       return res.status(500).send('ERROR: Could not fetch new wallpapers.');
//     }
    
//     results.push(...newWallpapers);

//     // Fetch the popular wallpapers
//     db.query(popularWallpapersQuery, [Math.floor(pageSize / 2), offsetPopular], (err, popularWallpapers) => {
//       if (err) {
//         console.error('Database query error (popular): ' + err.message);
//         return res.status(500).send('ERROR: Could not fetch popular wallpapers.');
//       }
      
//       results.push(...popularWallpapers);

//       // Sorting the results in groups of 3 New, 3 Popular, 3 New, etc.
//       const combinedResults = [];
//       const newGroupSize = 3;  // Number of new wallpapers in each group
//       const popularGroupSize = 3;  // Number of popular wallpapers in each group

//       const maxIterations = Math.max(newWallpapers.length, popularWallpapers.length);
      
//       for (let i = 0; i < maxIterations; i += newGroupSize) {
//         // Push 3 new wallpapers first
//         for (let j = 0; j < newGroupSize; j++) {
//           if (newWallpapers[i + j]) combinedResults.push(newWallpapers[i + j]);
//         }
//         // Then push 3 popular wallpapers
//         for (let j = 0; j < popularGroupSize; j++) {
//           if (popularWallpapers[i + j]) combinedResults.push(popularWallpapers[i + j]);
//         }
//       }

//       res.json(combinedResults);
//     });
//   });
// });


// // EXPLORE ----------
// app.get('/api/exploreWallpapers', verifyToken, (req, res) => {
//   const page = parseInt(req.query.page) || 0; // Default to page 0
//   const pageSize = parseInt(req.query.pageSize) || 6; // Default to page size 6
  
//   const offsetNew = page * Math.ceil(pageSize / 2); // Offset for "New" wallpapers
//   const offsetPopular = page * Math.floor(pageSize / 2); // Offset for "Popular" wallpapers

//   const newWallpapersQuery = `
//     SELECT * FROM Wallpapers
//     WHERE type = 'new'
//     ORDER BY dateCreated DESC
//     LIMIT ? OFFSET ?
//   `;

//   const popularWallpapersQuery = `
//     SELECT * FROM Wallpapers
//     WHERE type = 'popular'
//     ORDER BY savedCount DESC
//     LIMIT ? OFFSET ?
//   `;

//   const results = [];

//   // Fetch the new wallpapers
//   db.query(newWallpapersQuery, [Math.ceil(pageSize / 2), offsetNew], (err, newWallpapers) => {
//     if (err) {
//       console.error('Database query error (new): ' + err.message);
//       return res.status(500).send('ERROR: Could not fetch new wallpapers.');
//     }
    
//     results.push(...newWallpapers);

//     // Fetch the popular wallpapers
//     db.query(popularWallpapersQuery, [Math.floor(pageSize / 2), offsetPopular], (err, popularWallpapers) => {
//       if (err) {
//         console.error('Database query error (popular): ' + err.message);
//         return res.status(500).send('ERROR: Could not fetch popular wallpapers.');
//       }
      
//       results.push(...popularWallpapers);

//       // Sorting the results in groups of 3 New, 3 Popular, 3 New, etc.
//       const combinedResults = [];
//       const newGroupSize = 3;  // Number of new wallpapers in each group
//       const popularGroupSize = 3;  // Number of popular wallpapers in each group

//       const maxIterations = Math.max(newWallpapers.length, popularWallpapers.length);
      
//       for (let i = 0; i < maxIterations; i += newGroupSize) {
//         // Push 3 new wallpapers first
//         for (let j = 0; j < newGroupSize; j++) {
//           if (newWallpapers[i + j]) combinedResults.push(newWallpapers[i + j]);
//         }
//         // Then push 3 popular wallpapers
//         for (let j = 0; j < popularGroupSize; j++) {
//           if (popularWallpapers[i + j]) combinedResults.push(popularWallpapers[i + j]);
//         }
//       }

//       res.json(combinedResults);
//     });
//   });
// });


app.post('/api/saveWallpaper', verifyToken, (req, res) => {
  const { wallpaperId } = req.body;
  const userId = req.user.id;

  // Check if the wallpaper is already saved by the user
  const checkQuery = `
    SELECT * FROM SavedWallpapers
    WHERE wallpaperId = ? AND userId = ?
  `;

  db.query(checkQuery, [wallpaperId, userId], (err, results) => {
    if (err) {
      console.error('Database query error (check): ' + err.message);
      return res.status(500).send('ERROR: Could not check saved wallpaper.');
    }

    if (results.length > 0) {
      // If the wallpaper is already saved by the user, return a message
      return res.status(400).send('ERROR: Wallpaper already saved.');
    } else {
      // Insert into SavedWallpapers table
      const insertQuery = `
        INSERT INTO SavedWallpapers (wallpaperId, userId)
        VALUES (?, ?)
      `;

      db.query(insertQuery, [wallpaperId, userId], (err, results) => {
        if (err) {
          console.error('Database insert error: ' + err.message);
          return res.status(500).send('ERROR: Could not save wallpaper.');
        }

        // Increment the savedCount in the Wallpapers table
        const updateQuery = `
          UPDATE Wallpapers
          SET savedCount = savedCount + 1
          WHERE id = ?
        `;

        db.query(updateQuery, [wallpaperId], (err, updateResults) => {
          if (err) {
            console.error('Database update error: ' + err.message);
            return res.status(500).send('ERROR: Could not update savedCount.');
          }

          res.json({ success: true, message: 'Wallpaper saved successfully.' });
        });
      });
    }
  });
});


app.post('/api/removeSavedWallpaper', verifyToken, (req, res) => {
  const { wallpaperId } = req.body;
  const userId = req.user.id;

  // Check if the wallpaper is actually saved by the user
  const checkQuery = `
    SELECT * FROM SavedWallpapers
    WHERE wallpaperId = ? AND userId = ?
  `;

  db.query(checkQuery, [wallpaperId, userId], (err, results) => {
    if (err) {
      console.error('Database query error (check): ' + err.message);
      return res.status(500).send('ERROR: Could not check saved wallpaper.');
    }

    if (results.length === 0) {
      // If the wallpaper is not saved by the user, return an error
      return res.status(400).send('ERROR: Wallpaper is not saved by the user.');
    } else {
      // Delete from SavedWallpapers table
      const deleteQuery = `
        DELETE FROM SavedWallpapers
        WHERE wallpaperId = ? AND userId = ?
      `;

      db.query(deleteQuery, [wallpaperId, userId], (err, results) => {
        if (err) {
          console.error('Database delete error: ' + err.message);
          return res.status(500).send('ERROR: Could not remove saved wallpaper.');
        }

        // Decrement the savedCount in the Wallpapers table
        const updateQuery = `
          UPDATE Wallpapers
          SET savedCount = GREATEST(savedCount - 1, 0)
          WHERE id = ?
        `;

        db.query(updateQuery, [wallpaperId], (err, updateResults) => {
          if (err) {
            console.error('Database update error: ' + err.message);
            return res.status(500).send('ERROR: Could not update savedCount.');
          }

          res.json({ success: true, message: 'Wallpaper removed from saved successfully.' });
        });
      });
    }
  });
});


app.get('/api/loadSavedWallpapers', verifyToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT w.*
    FROM Wallpapers w
    JOIN SavedWallpapers sw ON w.id = sw.wallpaperId
    WHERE sw.userId = ?
    ORDER BY sw.dateSaved DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Database query error: ' + err.message);
      return res.status(500).send('ERROR: Could not fetch saved wallpapers.');
    }

    res.json(results);
  });
});


module.exports = admin;