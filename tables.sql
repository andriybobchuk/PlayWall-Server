-- CREATE TABLE Users (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     nick VARCHAR(255),
--     email VARCHAR(255),
--     phoneNumber VARCHAR(20),
--     dateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
--     dateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     firebaseId VARCHAR(255) NOT NULL UNIQUE,
--     pushToken VARCHAR(255)
-- );

-- CREATE TABLE Wallpapers (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     fileName VARCHAR(255),
--     requesterId INT NOT NULL,
--     recipientId INT NOT NULL,
--     comment VARCHAR(255),
--     reaction ENUM('like', 'love', 'haha', 'wow', 'sad', 'angry') DEFAULT NULL,
--     dateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
--     dateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (requesterId) REFERENCES Users(id),
--     FOREIGN KEY (recipientId) REFERENCES Users(id)
-- );

CREATE TABLE Friendships (
    friendship_id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    addressee_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'declined', 'blocked') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_requester FOREIGN KEY (requester_id) REFERENCES Users(id),
    CONSTRAINT fk_addressee FOREIGN KEY (addressee_id) REFERENCES Users(id),
    CONSTRAINT unique_relationship UNIQUE (requester_id, addressee_id)
);

CREATE TABLE Wallpapers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fileName VARCHAR(255),
    type ENUM('Private', 'Popular', 'New') DEFAULT 'Private',
    sentCount INT DEFAULT 0,
    savedCount INT DEFAULT 0,
    comment VARCHAR(255),
    reaction ENUM('like', 'love', 'haha', 'wow', 'sad', 'angry') DEFAULT NULL,
    dateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
    dateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE SentWallpapers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallpaperId INT NOT NULL,
    requesterId INT NOT NULL,
    recipientId INT NOT NULL,
    FOREIGN KEY (wallpaperId) REFERENCES Wallpapers(id),
    FOREIGN KEY (requesterId) REFERENCES Users(id),
    FOREIGN KEY (recipientId) REFERENCES Users(id)
);

CREATE TABLE SavedWallpapers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallpaperId INT NOT NULL,
    userId INT NOT NULL,
    status ENUM('read', 'unread') DEFAULT 'unread',
    dateSaved DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallpaperId) REFERENCES Wallpapers(id),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nick VARCHAR(255),
    email VARCHAR(255),
    phoneNumber VARCHAR(20),
    dateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
    dateUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    firebaseId VARCHAR(255) NOT NULL UNIQUE,
    pushToken VARCHAR(255)
);
