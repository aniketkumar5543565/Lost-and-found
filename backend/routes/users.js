const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/:id', userController.getUserProfile);
router.put('/:id', userController.updateUserProfile);
router.get('/:id/saved-items', userController.getSavedItems);
router.post('/:id/saved-items', userController.updateSavedItems);
router.get('/:id/activity', userController.getUserActivity);
router.post('/:id/activity', userController.logActivity);

//-----------------
router.get('/', userController.getUsers);
router.delete('/:id', userController.deleteUser);
module.exports = router;