const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Function to upload a file to S3
async function uploadFileToS3(fileBuffer, folder) {
  const fileName = `${folder}/${uuidv4()}.jpg`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: 'image/jpeg',
  });

  try {
    await s3Client.send(command);
    return fileName; // Return S3 key (path)
  } catch (err) {
    console.error('Error uploading file to S3:', err);
    throw err;
  }
}

// Function to generate a presigned URL for downloading
async function getPresignedUrl(fileName, expiryInSeconds = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn: expiryInSeconds });
    return url;
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    throw err;
  }
}

module.exports = { uploadFileToS3, getPresignedUrl };
