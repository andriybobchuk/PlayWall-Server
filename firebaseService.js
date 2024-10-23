// firebaseService.js
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert('playwall-a1a0f-firebase-adminsdk-gy6bf-499122748c.json'),
});

// Function to send a notification
function sendNotification(message) {
  return admin.messaging().send(message)
    .then(response => {
      console.log('Notification sent successfully:', response);
      return response;
    })
    .catch(error => {
      console.error('Error sending notification:', error);
      throw error;
    });
}

module.exports = {
  sendNotification,
};
