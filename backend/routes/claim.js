const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');

router.post('/', claimController.createClaim);
router.get('/', claimController.getClaims);
router.put('/:id', claimController.updateClaim);

module.exports = router;