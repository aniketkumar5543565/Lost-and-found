const pool = require('../config/db');

const CLOUDINARY_BASE_URL = process.env.CLOUDINARY_BASE_URL;

exports.reportItem = (req, res) => {
  const { description, location, item_type, reporter_id, image_public_id } = req.body;

  if (!description || !location || !item_type || !reporter_id) {
    return res.status(400).json({ message: 'Description, location, item type, and reporter ID are required' });
  }

  let image_url = null;
  if (image_public_id) {
    if (typeof image_public_id !== 'string' || !image_public_id.trim()) {
      return res.status(400).json({ message: 'Invalid image public ID' });
    }
    image_url = `${CLOUDINARY_BASE_URL}/${image_public_id}`;
  }

  pool.query(
    'INSERT INTO items (description, location, item_type, reporter_id, image_url, image_public_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      description,
      location,
      item_type,
      reporter_id,
      image_url,
      image_public_id || null,
      item_type === 'lost' ? 'pending' : 'available',
    ],
    (err, result) => {
      if (err) {
        console.error('Error reporting item:', err);
        return res.status(500).json({ message: 'Error reporting item' });
      }
      res.status(201).json({ message: 'Item reported successfully', itemId: result.insertId });
    }
  );
};

exports.getItems = (req, res) => {
  pool.query(
    `SELECT items.id, items.description, items.location, items.item_type, items.category,
            items.reporter_id, items.image_url, items.image_public_id, items.status, items.created_at,
            users.name as reporter_name 
     FROM items 
     JOIN users ON items.reporter_id = users.id 
     WHERE items.status IN ('pending', 'claimed')`,
    (err, results) => {
      if (err) {
        console.error('Error fetching items:', err);
        return res.status(500).json({ message: 'Error fetching items' });
      }
      const items = results.map((item) => ({
        ...item,
        image_url: item.image_url || (item.image_public_id ? `${CLOUDINARY_BASE_URL}/${item.image_public_id}` : null),
      }));
      res.status(200).json(items);
    }
  );
};

exports.getUserItems = (req, res) => {
  const { userId } = req.params;

  pool.query(
    `SELECT id, description, location, item_type, reporter_id, image_url, image_public_id, status 
     FROM items 
     WHERE reporter_id = ?`,
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error fetching user items:', err);
        return res.status(500).json({ message: 'Error fetching user items' });
      }
      const items = results.map((item) => ({
        ...item,
        image_url: item.image_url || (item.image_public_id ? `${CLOUDINARY_BASE_URL}/${item.image_public_id}` : null),
      }));
      res.status(200).json(items);
    }
  );
};

exports.getItemById = (req, res) => {
  const { id } = req.params;

  pool.query(
    `SELECT id, description, location, item_type, reporter_id, image_url, image_public_id, status, created_at 
     FROM items 
     WHERE id = ?`,
    [id],
    (err, results) => {
      if (err) {
        console.error('Error fetching item:', err);
        return res.status(500).json({ message: 'Error fetching item' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Item not found' });
      }
      const item = results[0];
      item.image_url = item.image_url || (item.image_public_id ? `${CLOUDINARY_BASE_URL}/${item.image_public_id}` : null);
      res.status(200).json(item);
    }
  );
};

exports.updateItem = (req, res) => {
  const { id } = req.params;
  const { description, location, item_type, reporter_id, image_public_id } = req.body;

  if (!description || !location || !item_type || !reporter_id) {
    return res.status(400).json({ message: 'Description, location, item type, and reporter ID are required' });
  }

  let image_url = null;
  if (image_public_id) {
    if (typeof image_public_id !== 'string' || !image_public_id.trim()) {
      return res.status(400).json({ message: 'Invalid image public ID' });
    }
    image_url = `${CLOUDINARY_BASE_URL}/${image_public_id}`;
  }

  pool.query(
    `UPDATE items 
     SET description = ?, location = ?, item_type = ?, image_url = ?, image_public_id = ?, 
         status = ? 
     WHERE id = ? AND reporter_id = ?`,
    [
      description,
      location,
      item_type,
      image_url,
      image_public_id || null,
      item_type === 'lost' ? 'pending' : 'available',
      id,
      reporter_id,
    ],
    (err, result) => {
      if (err) {
        console.error('Error updating item:', err);
        return res.status(500).json({ message: 'Error updating item' });
      }
      if (result.affectedRows === 0) {
        return res.status(403).json({ message: 'Item not found or you are not authorized to edit it' });
      }
      res.status(200).json({ message: 'Item updated successfully' });
    }
  );
};

exports.claimItem = (req, res) => {
  const { itemId, claimant_id } = req.body;

  if (!itemId || !claimant_id) {
    return res.status(400).json({ message: 'Item ID and claimant ID are required' });
  }

  pool.query(
    `SELECT status FROM items WHERE id = ? AND status = 'available'`,
    [itemId],
    (err, results) => {
      if (err) {
        console.error('Error checking item:', err);
        return res.status(500).json({ message: 'Error claiming item' });
      }
      if (results.length === 0) {
        return res.status(400).json({ message: 'Item not found or not claimable' });
      }

      pool.query(
        'UPDATE items SET claimant_id = ?, status = "claimed" WHERE id = ?',
        [claimant_id, itemId],
        (err, result) => {
          if (err) {
            console.error('Error claiming item:', err);
            return res.status(500).json({ message: 'Error claiming item' });
          }
          if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'Item not found' });
          }
          res.status(200).json({ message: 'Item claimed successfully' });
        }
      );
    }
  );
};


exports.createItem = (req, res) => {
  const {
    description,
    location,
    item_type,
    category = 'other',
    reporter_id,
    image_url,
    image_public_id,
    status = 'pending',
  } = req.body;

  if (!description || !location || !item_type || !reporter_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!['lost', 'found'].includes(item_type)) {
    return res.status(400).json({ message: 'Invalid item type' });
  }

  if (!['pending', 'available', 'claimed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const query = `
    INSERT INTO items (
      description, location, item_type, category, reporter_id,
      image_url, image_public_id, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  pool.query(
    query,
    [
      description,
      location,
      item_type,
      category,
      reporter_id,
      image_url,
      image_public_id,
      status,
    ],
    (err, results) => {
      if (err) {
        console.error('Error creating item:', err);
        return res.status(500).json({ message: 'Error creating item' });
      }
      res.status(201).json({ id: results.insertId, message: 'Item created successfully' });
    }
  );
};

//-------------------------------

exports.deleteItem =  (req, res) => {
  const { id } = req.params;

   pool.query('DELETE FROM items WHERE id = ?', [id],
    (err, result) =>{
      if(err){
        console.error('Error deleting item:', err);
        return res.status(500).json({ message: 'Error deleting item' });
      }
      if (result.length === 0){
        return res.status(404).json({ message: 'Item not found' });
      }
      res.status(200).json({ message: 'Item deleted' });

    }
   );
};

// exports.getClaimedItems = (req, res) => {
//   const { userId } = req.params;

//   pool.query(
//     `SELECT items.id, items.description, items.location, items.item_type, items.category,
//             items.reporter_id, items.image_url, items.image_public_id, items.status, items.created_at,
//             users.name as reporter_name 
//      FROM items 
//      JOIN users ON items.reporter_id = users.id 
//      WHERE items.claimant_id = ?`,
//     [userId],
//     (err, results) => {
//       if (err) {
//         console.error('Error fetching claimed items:', err);
//         return res.status(500).json({ message: 'Error fetching claimed items' });
//       }
//       const claimedItems = results.map((item) => ({
//         ...item,
//         image_url: item.image_url || (item.image_public_id ? `${CLOUDINARY_BASE_URL}/${item.image_public_id}` : null),
//       }));
//       res.status(200).json(claimedItems);
//     }
//   );
// };
// exports.getAllClaimedItems = (req, res) => {
//   pool.query(
//     `SELECT items.id, items.description, items.location, items.item_type, items.category,
//             items.reporter_id, items.image_url, items.image_public_id, items.status, items.created_at,
//             users.name as reporter_name 
//      FROM items 
//      WHERE items.status = 'claimed'`,
//     (err, results) => {
//       if (err) {
//         console.error('Error fetching items:', err);
//         return res.status(500).json({ message: 'Error fetching items' });
//       }
//       const items = results.map((item) => ({
//         ...item,
//         image_url: item.image_url || (item.image_public_id ? `${CLOUDINARY_BASE_URL}/${item.image_public_id}` : null),
//       }));
//       res.status(200).json(items);
//     }
//   );
// }