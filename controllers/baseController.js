const { getData } = require('../models/database');

// Temel veri çekme endpoint'leri
exports.getBirimler = async (req, res) => {
    try {
        const data = await getData('birimler');
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getPersonel = async (req, res) => {
    try {
        const data = await getData('personel');
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getEgitimler = async (req, res) => {
    try {
        const data = await getData('personel_egitimleri');
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getKazalar = async (req, res) => {
    try {
        const data = await getData('is_kazalari');
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getIsPlani = async (req, res) => {
    try {
        const data = await getData('santiye_is_plani');
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getEkipmanlar = async (req, res) => {
    try {
        const data = await getData('ekipmanlar');
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getRamakKala = async (req, res) => {
    try {
        const ramakKala = await getData('ramak_kala_kayitlari');
        const birimler = await getData('birimler');
        const dataWithBirim = ramakKala.map(kayit => {
            const birim = birimler.find(b => b.id === kayit.birim_id);
            return {
                ...kayit,
                birim_adi: birim ? birim.birim_adi : 'Bilinmiyor'
            };
        });
        
        res.json({ success: true, data: dataWithBirim });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

