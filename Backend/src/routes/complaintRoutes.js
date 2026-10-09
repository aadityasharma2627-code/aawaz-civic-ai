const express = require('express');
const complaintController = require('../controllers/complaintController');

const router = express.Router();

router.post('/', complaintController.create);
router.get('/', complaintController.list);
router.get('/:id', complaintController.getOne);
router.patch('/:id/status', complaintController.updateStatus);

module.exports = router;