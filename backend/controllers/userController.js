const pool = require('../config/db');
const bcrypt = require('bcrypt');

const CLOUDINARY_BASE_URL = process.env.CLOUDINARY_BASE_URL;

exports.getUserProfile = (req, res) => {
  const { id } = req.params;

  pool.query(
    `SELECT id, name, email, gender, rollno, department, year_of_study, phone, bio, profile_image_url, profile_image_public_id 
     FROM users 
     WHERE id = ?`,
    [id],
    (err, results) => {
      if (err) {
        console.error('Error fetching user profile:', err);
        return res.status(500).json({ message: 'Error fetching profile' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      const user = results[0];
      user.profile_image_url = user.profile_image_url || (user.profile_image_public_id ? `${CLOUDINARY_BASE_URL}/${user.profile_image_public_id}` : null);
      res.status(200).json(user);
    }
  );
};

exports.updateUserProfile = (req, res) => {
  const { id } = req.params;
  const { name, gender, rollno, department, year_of_study, phone, bio, profile_image_public_id } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  let profile_image_url = null;
  if (profile_image_public_id) {
    if (typeof profile_image_public_id !== 'string' || !profile_image_public_id.trim()) {
      return res.status(400).json({ message: 'Invalid profile image public ID' });
    }
    profile_image_url = `${CLOUDINARY_BASE_URL}/${profile_image_public_id}`;
  }

  pool.query(
    `UPDATE users 
     SET name = ?, gender = ?, rollno = ?, department = ?, year_of_study = ?, phone = ?, bio = ?, 
         profile_image_url = ?, profile_image_public_id = ? 
     WHERE id = ?`,
    [
      name,
      gender || null,
      rollno || null,
      department || null,
      year_of_study || null,
      phone || null,
      bio || null,
      profile_image_url,
      profile_image_public_id || null,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error('Error updating user profile:', err);
        return res.status(500).json({ message: 'Error updating profile' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'Profile updated successfully' });
    }
  );
};

exports.getSavedItems = (req, res) => {
    const { id } = req.params;
    pool.query(
      'SELECT item_id FROM saved_items WHERE user_id = ?',
      [id],
      (err, results) => {
        if (err) {
          console.error('Error fetching saved items:', err);
          return res.status(500).json({ message: 'Error fetching saved items' });
        }
        res.status(200).json(results.map((row) => row.item_id));
      }
    );
  };
  
  exports.updateSavedItems = (req, res) => {
    const { id } = req.params;
    const { itemId, action } = req.body;
  
    if (!itemId || !['add', 'remove'].includes(action)) {
      return res.status(400).json({ message: 'Invalid request' });
    }
  
    const query = action === 'add'
      ? 'INSERT INTO saved_items (user_id, item_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE saved_at = CURRENT_TIMESTAMP'
      : 'DELETE FROM saved_items WHERE user_id = ? AND item_id = ?';
  
    pool.query(query, [id, itemId], (err) => {
      if (err) {
        console.error('Error updating saved items:', err);
        return res.status(500).json({ message: 'Error updating saved items' });
      }
      res.status(200).json({ message: 'Saved items updated' });
    });
  };
  
//   exports.getUserActivity = (req, res) => {
//     const { id } = req.params;
//     // Mock data for now; replace with actual query
//     // pool.query(
//     //     'SELECT message, timestamp FROM user_activity WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10',
//     //     [id],
//     //     (err, results) => {
//     //       if (err) return res.status(500).json({ message: 'Error fetching activity' });
//     //       res.status(200).json(results);
//     //     }
//     //   );
//     const mockActivity = [
//       { message: 'Reported a black wallet', timestamp: '2025-04-14 10:30' },
//       { message: 'Claimed a phone', timestamp: '2025-04-13 15:45' },
//     ];
//     res.status(200).json(mockActivity);
//   };
// controllers/userController.js
exports.getUserActivity = (req, res) => {
    const { id } = req.params;
    pool.query(
      'SELECT message, timestamp FROM user_activity WHERE user_id = ? AND is_read = FALSE ORDER BY timestamp DESC LIMIT 5',
        [id],
      (err, results) => {
        if (err) {
          console.error('Error fetching activity:', err);
          return res.status(500).json({ message: 'Error fetching activity' });
        }
        res.status(200).json(results);
      }
    );
  };
  exports.logActivity = (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
  
    if (!message) {
      return res.status(400).json({ message: 'Activity message is required' });
    }
  
    pool.query(
      'INSERT INTO user_activity (user_id, message) VALUES (?, ?)',
      [id, message],
      (err) => {
        if (err) {
          console.error('Error logging activity:', err);
          return res.status(500).json({ message: 'Error logging activity' });
        }
        res.status(200).json({ message: 'Activity logged' });
      }
    );
  };
  // ------------------------------------------------- after 

// exports.register = async (req, res) => {
//   const { name, email, password, role = 'user' } = req.body;

//   if (!name || !email || !password) {
//     return res.status(400).json({ message: 'All fields are required' });
//   }

//   if (!['user', 'admin'].includes(role)) {
//     return res.status(400).json({ message: 'Invalid role' });
//   }

//   try {
//     const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
//     if (existing.length > 0) {
//       return res.status(400).json({ message: 'Email already registered' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const [result] = await pool.query(
//       'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
//       [name, email, hashedPassword, role]
//     );

//     res.status(201).json({ message: 'Registration successful' });
//   } catch (error) {
//     console.error('Error registering user:', error);
//     res.status(500).json({ message: 'Error registering user' });
//   }
// };

exports.getUsers =  (req, res) => {
    pool.query('SELECT id, name, email, role FROM users',
        (err, result) =>{
        if (err) {
          console.error('Error fetching users:', err);
          return res.status(500).json({ message: 'Error fetching users' });
        }
        if (result.length === 0) {
          return res.status(404).json({ message: 'No users found' });
        }
        res.status(200).json(result);
      }

    ); 
};

exports.deleteUser =  (req, res) => {
  const { id } = req.params;
  
    pool.query('DELETE FROM users WHERE id = ?', [id],
      (err, result) => {
      if (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({ message: 'Error deleting user' });
      }
      if (result.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User deleted' });
      }
    );
    
};