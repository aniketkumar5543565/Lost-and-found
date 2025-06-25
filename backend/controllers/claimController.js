const pool = require('../config/db');

exports.createClaim = async (req, res) => {
  const { item_id, claimant_id, proof, status = 'pending' } = req.body;

  if (!item_id || !claimant_id || !proof) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

    pool.query('SELECT id, status, item_type FROM items WHERE id = ?', [item_id],
      (err, result) =>{
        if (err) {
          console.error('Error fetching item:', err);
          return res.status(500).json({ message: 'Error fetching item' });
        }
        if (result.length === 0 || result[0].status !== 'pending' || result[0].item_type !== 'found') {
          return res.status(404).json({ message: 'Item not claimable' });
        }
        const item = result[0];
 
      }
    );
  

    pool.query(
      'INSERT INTO claims (item_id, claimant_id, proof, status) VALUES (?, ?, ?, ?)',
      [item_id, claimant_id, proof, status],
      (err, result) =>{
        if (err) {
          console.error('Error creating claim:', err);
          return res.status(500).json({ message: 'Error creating claim' });
        }
        if (result.length === 0) {
          return res.status(400).json({ message: 'Claim not created' });
        }
        res.status(201).json({ id: result.insertId, message: 'Claim submitted' });

      }
    );
};

exports.getClaims = (req, res) => {

    pool.query('SELECT * FROM claims',
      (err, result) =>{
        if (err) {
          console.error('Error fetching claims:', err);
          return res.status(500).json({ message: 'Error fetching claims' });
        }
        if (result.length === 0) {
          return res.status(404).json({ message: 'No claims found' });
        }
        res.status(200).json(result);
      }
    );
  
};

exports.updateClaim =  (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

    pool.query('UPDATE claims SET status = ? WHERE id = ?', [status, id],
      (err, result) =>{
        if (err) {
          console.error('Error updating claim:', err);
          return res.status(500).json({ message: 'Error updating claim' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Claim not found' });
        }
        res.status(200).json({ message: 'Claim updated' });

        pool.query('SELECT * from claims  WHERE id = ?', [id],
          (err, result) =>{
            if (err) {
              console.error('Error updating claim:', err);
              return res.status(500).json({ message: 'Error getting updated claim' });
            }
            if (result.length === 0) {
              return res.status(404).json({ message: 'Updated claim not found' });
            }
            if (status !== 'pending') {
              pool.query(
                'INSERT INTO user_activity (user_id, message) VALUES (?, ?)',
                [result[0].claimant_id, `Your claim for item ${result[0].item_id} was ${status}`]
              );
            }
            if (status === 'approved') {
              pool.query(
                'UPDATE items set status = ?, claimant_id = ? WHERE id = ?',
                ['claimed',result[0].claimant_id, result[0].item_id]
              );
            }
          });
      }
    );
    
};