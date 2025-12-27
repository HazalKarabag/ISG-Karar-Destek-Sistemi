const express = require('express');
const router = express.Router();
const kdsController = require('../controllers/kdsController');
const complianceController = require('../controllers/complianceController');
const simulationController = require('../controllers/simulationController');
const advancedController = require('../controllers/advancedController');
const trainingController = require('../controllers/trainingController');
const equipmentController = require('../controllers/equipmentController');
const riskController = require('../controllers/riskController');

// KDS Ana Endpoint'leri
router.get('/stratejik-ozet', kdsController.getStratejikOzet);
router.get('/risk-projeksiyonu', kdsController.getRiskProjeksiyonu);
router.get('/birim-analizi', kdsController.getBirimAnalizi);

// Compliance ve Yasal Uyumluluk
router.get('/compliance-score', complianceController.getComplianceScore);

// Simülasyon ve Analizler
router.post('/what-if', simulationController.whatIfSimulation);
router.post('/butce-maliyet-analizi', simulationController.butceMaliyetAnalizi);
router.get('/mevsimsel-analiz', simulationController.getMevsimselAnaliz);

// Sertifika ve Vardiya Yönetimi
router.get('/sertifika-yonetimi', advancedController.getSertifikaYonetimi);
router.post('/vardiya-analizi', advancedController.vardiyaAnalizi);
router.post('/vardiya-egitim-planla', advancedController.vardiyaEgitimPlanla);
router.post('/vardiya-personel-degistir', advancedController.vardiyaPersonelDegistir);

// Eğitim Optimizasyonu
router.get('/egitim-optimizasyonu', trainingController.getEgitimOptimizasyonu);
router.post('/egitim-yatirim-simulasyonu', trainingController.egitimYatirimSimulasyonu);
router.post('/egitim-toplu-planla', trainingController.egitimTopluPlanla);

// Ekipman Yönetimi
router.get('/ekipman-bakim-tahmini', equipmentController.getEkipmanBakimTahmini);
router.get('/ekipman-risk-analizi', equipmentController.getEkipmanRiskAnalizi);

// Risk Analizleri
router.get('/stratejik-risk-analizi', riskController.getStratejikRiskAnalizi);

module.exports = router;

