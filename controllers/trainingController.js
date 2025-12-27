const { getData } = require('../models/database');

// Eğitim Optimizasyonu
exports.getEgitimOptimizasyonu = async (req, res) => {
    try {
        const birimler = await getData('birimler');
        const personelEgitimleri = await getData('personel_egitimleri');
        const personeller = await getData('personel');
        const kazalar = await getData('is_kazalari');

        const bugun = new Date();
        const birimAnalizleri = [];

        for (const birim of birimler) {
            const birimPersonelleri = personeller.filter(p => p.birim_id === birim.id);
            const toplamPersonel = birimPersonelleri.length;

            if (toplamPersonel === 0) continue; 

            let uygunEgitim = 0;
            let suresiBitenEgitim = 0;
            let toplamEgitimMaliyeti = 0;

            birimPersonelleri.forEach(personel => {
                const egitimler = personelEgitimleri.filter(e => e.personel_id === personel.id);
                
                egitimler.forEach(egitim => {
                    const gecerlilikValue = egitim.gecerlilik_sonu || egitim['geçerlilik_sonu'];
                    if (!gecerlilikValue) return;
                    const gecerlilikSonu = new Date(gecerlilikValue);
                    const kalanGun = Math.floor((gecerlilikSonu - bugun) / (1000 * 60 * 60 * 24));

                    if (kalanGun < 0) {
                        suresiBitenEgitim++;
                        toplamEgitimMaliyeti += 15000; 
                    } else if (kalanGun > 90) {
                        uygunEgitim++;
                    }
                });
            });

            const toplamEgitimKaydi = uygunEgitim + suresiBitenEgitim;
            const egitimUyumlulukOrani = toplamEgitimKaydi > 0 
                ? (uygunEgitim / toplamEgitimKaydi) * 100 
                : 0;

            const altiAyOnce = new Date(bugun);
            altiAyOnce.setMonth(altiAyOnce.getMonth() - 6);
            const birimKazalari = kazalar.filter(k => 
                k.birim_id === birim.id && 
                new Date(k.kaza_tarihi) >= altiAyOnce
            );
            const kazaSayisi = birimKazalari.length;

            const egitimEksikligi = suresiBitenEgitim;
            const aciliyetSkoru = Math.min(100, 
                (birim.tehlike_katsayisi * 20) + 
                (egitimEksikligi * 10) + 
                (kazaSayisi * 5) - 
                (egitimUyumlulukOrani * 0.5)
            );

            let kazaRiski = '';
            let riskRenk = '';
            if (aciliyetSkoru >= 70) {
                kazaRiski = 'Çok Yüksek';
                riskRenk = 'red';
            } else if (aciliyetSkoru >= 50) {
                kazaRiski = 'Yüksek';
                riskRenk = 'orange';
            } else if (aciliyetSkoru >= 30) {
                kazaRiski = 'Orta';
                riskRenk = 'yellow';
            } else {
                kazaRiski = 'Düşük';
                riskRenk = 'green';
            }
            let eylemOnerisi = '';
            if (aciliyetSkoru >= 70) {
                eylemOnerisi = `🚨 ACİL: ${egitimEksikligi} personele derhal eğitim verin. Kaza riski kritik seviyede!`;
            } else if (aciliyetSkoru >= 50) {
                eylemOnerisi = `⚠️ ÖNCELİKLİ: 15 gün içinde ${egitimEksikligi} eğitim planlanmalı.`;
            } else if (aciliyetSkoru >= 30) {
                eylemOnerisi = `📋 PLANLI: ${egitimEksikligi} eğitim ay sonuna kadar tamamlanabilir.`;
            } else {
                eylemOnerisi = `✅ İYİ: Birim eğitim uyumluluğu yeterli seviyede.`;
            }

            birimAnalizleri.push({
                birimId: birim.id,
                birimAdi: birim.birim_adi,
                tehlikeKatsayisi: birim.tehlike_katsayisi,
                toplamPersonel: toplamPersonel,
                egitimUyumlulukOrani: Number(egitimUyumlulukOrani.toFixed(1)),
                egitimEksikligi: egitimEksikligi,
                kazaSayisi: kazaSayisi,
                aciliyetSkoru: Number(aciliyetSkoru.toFixed(1)),
                kazaRiski: kazaRiski,
                riskRenk: riskRenk,
                eylemOnerisi: eylemOnerisi,
                toplamEgitimMaliyeti: toplamEgitimMaliyeti,
                oncelikSirasi: 0 
            });
        }
        birimAnalizleri.sort((a, b) => b.aciliyetSkoru - a.aciliyetSkoru);
        birimAnalizleri.forEach((birim, index) => {
            birim.oncelikSirasi = index + 1;
        });
        const toplamBirim = birimAnalizleri.length;
        const kritikBirimler = birimAnalizleri.filter(b => b.aciliyetSkoru >= 70).length;
        const yuksekRiskBirimler = birimAnalizleri.filter(b => b.aciliyetSkoru >= 50 && b.aciliyetSkoru < 70).length;
        const toplamEgitimIhtiyaci = birimAnalizleri.reduce((sum, b) => sum + b.egitimEksikligi, 0);
        const toplamMaliyet = birimAnalizleri.reduce((sum, b) => sum + b.toplamEgitimMaliyeti, 0);
        const ortalamaAciliyet = birimAnalizleri.length > 0
            ? birimAnalizleri.reduce((sum, b) => sum + b.aciliyetSkoru, 0) / birimAnalizleri.length
            : 0;

        res.json({
            success: true,
            data: {
                birimAnalizleri: birimAnalizleri,
                istatistikler: {
                    toplamBirim: toplamBirim,
                    kritikBirimler: kritikBirimler,
                    yuksekRiskBirimler: yuksekRiskBirimler,
                    toplamEgitimIhtiyaci: toplamEgitimIhtiyaci,
                    toplamMaliyet: toplamMaliyet,
                    ortalamaAciliyet: Number(ortalamaAciliyet.toFixed(1))
                }
            }
        });

    } catch (error) {
        console.error('Eğitim Optimizasyonu Hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Eğitim Yatırım Simülasyonu
exports.egitimYatirimSimulasyonu = async (req, res) => {
    try {
        const { birimId, egitimYatirimi } = req.body;
        const birimler = await getData('birimler');
        const birim = birimler.find(b => b.id === birimId);

        if (!birim) {
            return res.status(404).json({ success: false, error: 'Birim bulunamadı' });
        }
        const baslangicRiski = birim.tehlike_katsayisi * 20;
        const yatirimBirimleri = egitimYatirimi / 15000;
        const toplamRiskAzalmasi = Math.min(80, yatirimBirimleri * 8);
        const yatirimSonrasiRisk = Math.max(5, baslangicRiski - toplamRiskAzalmasi);
        const projeksiyonAylari = ['Başlangıç', '1. Ay', '2. Ay', '3. Ay', '4. Ay', '5. Ay', '6. Ay'];
        const riskTrendi = [];
        
        for (let i = 0; i <= 6; i++) {
            const aylikIyilesme = (toplamRiskAzalmasi / 6) * i;
            const guncelRisk = Math.max(5, baslangicRiski - aylikIyilesme);
            riskTrendi.push({
                ay: projeksiyonAylari[i],
                riskSkoru: Number(guncelRisk.toFixed(1))
            });
        }
        const olasiKazaMaliyeti = baslangicRiski * 50000; 
        const yatirimSonrasiKazaMaliyeti = yatirimSonrasiRisk * 50000;
        const tasarruf = olasiKazaMaliyeti - yatirimSonrasiKazaMaliyeti;
        const roi = egitimYatirimi > 0 
            ? ((tasarruf - egitimYatirimi) / egitimYatirimi) * 100 
            : 0;

        res.json({
            success: true,
            data: {
                birimAdi: birim.birim_adi,
                egitimYatirimi: egitimYatirimi,
                baslangicRiski: Number(baslangicRiski.toFixed(1)),
                yatirimSonrasiRisk: Number(yatirimSonrasiRisk.toFixed(1)),
                toplamRiskAzalmasi: Number(toplamRiskAzalmasi.toFixed(1)),
                riskTrendi: riskTrendi,
                olasiKazaMaliyeti: Number(olasiKazaMaliyeti.toFixed(0)),
                yatirimSonrasiKazaMaliyeti: Number(yatirimSonrasiKazaMaliyeti.toFixed(0)),
                tasarruf: Number(tasarruf.toFixed(0)),
                roi: Number(roi.toFixed(1))
            }
        });

    } catch (error) {
        console.error('Eğitim Yatırım Simülasyonu Hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Eğitim Toplu Planla
exports.egitimTopluPlanla = async (req, res) => {
    try {
        const { birimId, egitimMaliyeti, personelSayisi } = req.body;
        const birimler = await getData('birimler');
        const birim = birimler.find(b => b.id === birimId);
        if (!birim) {
            return res.status(404).json({ success: false, error: 'Birim bulunamadı' });
        }
        const riskAzalmasi = personelSayisi * 5; 
        const eskiAciliyet = birim.tehlike_katsayisi * 20;
        const yeniAciliyet = Math.max(10, eskiAciliyet - riskAzalmasi);

        res.json({
            success: true,
            data: {
                birimId: birimId,
                birimAdi: birim.birim_adi,
                egitimMaliyeti: egitimMaliyeti,
                personelSayisi: personelSayisi,
                riskAzalmasi: riskAzalmasi,
                eskiAciliyet: eskiAciliyet,
                yeniAciliyet: yeniAciliyet,
                butcePaneliEtkisi: {
                    ekMaliyet: egitimMaliyeti,
                    maliyetTipi: 'Eğitim Yatırımı'
                },
                vardiyaPaneliEtkisi: {
                    durum: 'Eğitimi Planlandı',
                    etkilenenPersonel: personelSayisi
                },
                message: `${personelSayisi} personel için eğitim planlandı. Bütçe ve vardiya panelleri güncellendi.`
            }
        });

    } catch (error) {
        console.error('Toplu Eğitim Planlama Hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;

