const express = require('express');
const router = express.Router();
const baseController = require('../controllers/baseController');

// Temel veri çekme endpoint'leri
router.get('/birimler', baseController.getBirimler);
router.get('/personel', baseController.getPersonel);
router.get('/egitimler', baseController.getEgitimler);
router.get('/kazalar', baseController.getKazalar);
router.get('/is-plani', baseController.getIsPlani);
router.get('/ekipmanlar', baseController.getEkipmanlar);
router.get('/ramak-kala', baseController.getRamakKala);

module.exports = router;

