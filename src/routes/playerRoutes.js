const express = require('express');
const router = express.Router();
const playersController = require('../controllers/playersController');

// Position-based player routes (converted from POST to GET)
router.get('/stPlayers', playersController.getStPlayers);
router.get('/amPlayers', playersController.getAmPlayers);
router.get('/lwPlayers', playersController.getLwPlayers);
router.get('/rwPlayers', playersController.getRwPlayers);
router.get('/rmPlayers', playersController.getRmPlayers);
router.get('/lmPlayers', playersController.getLmPlayers);
router.get('/dmPlayers', playersController.getDmPlayers);
router.get('/dmPlaymakerPlayers', playersController.getDmPlaymakerPlayers);
router.get('/mezellaPlayers', playersController.getMezellaPlayers);
router.get('/mcPlayers', playersController.getMcPlayers);
router.get('/boxToBoxPlayers', playersController.getBoxToBoxPlayers);
router.get('/rightFullBackPlayers', playersController.getRightFullBackPlayers);
router.get('/leftFullBackPlayers', playersController.getLeftFullBackPlayers);
router.get('/rightDefendBackPlayers', playersController.getRightDefendPlayers);
router.get('/leftDefendBackPlayers', playersController.getLeftDefendPlayers);
router.get('/dcPlayers', playersController.getDcPlayers);
router.get('/gkPlayers', playersController.getGkPlayers);

// Player detail and search routes
router.get('/player/:name', playersController.getPlayerByName);
router.get('/search', playersController.generalSearch);
router.get('/search-player', playersController.searchPlayersByName);
router.get('/formPlayers', playersController.getFormPlayers);
router.get('/player-image/:playerId', playersController.getPlayerImage);

// Advanced Elasticsearch search routes
router.get('/search/advanced', playersController.advancedSearch);
router.get('/search/by-metrics', playersController.searchByMetrics);
router.get('/top-performers', playersController.getTopPerformers);
router.get('/similar-players/:fbrefId', playersController.getSimilarPlayers);
router.get('/statistics/:position', playersController.getStatisticsByPosition);

module.exports = router;