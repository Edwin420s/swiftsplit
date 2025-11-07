const express = require('express');
const teamController = require('../controllers/teamController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', teamController.createTeam);
router.post('/:teamId/members', teamController.addTeamMember);
router.post('/:teamId/calculate-splits', teamController.calculateSplits);
router.get('/:teamId', teamController.getTeam);
router.get('/', teamController.getUserTeams);
router.put('/:teamId', teamController.updateTeam);
router.delete('/:teamId', teamController.deleteTeam);

module.exports = router;