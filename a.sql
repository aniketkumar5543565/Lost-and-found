CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_token VARCHAR(255),
    gender VARCHAR(50),
    rollno VARCHAR(15),
    department VARCHAR(255),
    year_of_study VARCHAR(50),
    phone VARCHAR(20),
    bio TEXT,
    profile_image_url VARCHAR(255),
    profile_image_public_id VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user'
);

CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT,
    location VARCHAR(255),
    item_type ENUM('lost', 'found'),
    reporter_id INT,
    claimant_id INT,
    status ENUM('pending', 'claimed', 'found') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url VARCHAR(255),
    image_public_id VARCHAR(100),
    category VARCHAR(50),
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (claimant_id) REFERENCES users(id)
);

CREATE TABLE user_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    message VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read TINYINT(1) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE saved_items (
    user_id INT,
    item_id INT,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE otp_verification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    otp_code VARCHAR(10),
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT,
    claimant_id INT,
    proof TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (claimant_id) REFERENCES users(id)
);
