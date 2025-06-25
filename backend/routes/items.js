const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

router.post('/report', itemController.reportItem);
router.get('/', itemController.getItems);
router.get('/user/:userId', itemController.getUserItems);
router.get('/:id', itemController.getItemById);
router.put('/:id', itemController.updateItem);
router.post('/claim', itemController.claimItem);
router.post('/', itemController.createItem);
//-------------------
// router.get('/', itemController.getItems);
router.delete('/:id', itemController.deleteItem);
router.put('/:id', itemController.updateItem);
module.exports = router;