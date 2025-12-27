const { getData, supabase } = require('../models/database');

// What-If Simülasyonu
exports.whatIfSimulation = async (req, res) => {
    try {
        const { birimId, ekEgitimSaati } = req.body;
        const saat = parseInt(ekEgitimSaati) || 0;
        const birimler = await getData('birimler');
        const personel = await getData('personel');
        const egitimler = await getData('personel_egitimleri');
        const kazalar = await getData('is_kazalari');

        const birim = birimler.find(b => b.id === birimId);
        if (!birim) return res.status(404).json({ success: false, error: 'Birim bulunamadı. ID formatını kontrol edin.' });
        const birimPersonelIds = personel.filter(p => p.birim_id === birimId).map(p => p.id);
        const bitenEgitimler = egitimler.filter(e => {
            const gecerlilikValue = e.gecerlilik_sonu || e['geçerlilik_sonu'];
            if (!gecerlilikValue) return false;
            const gecerlilik = new Date(gecerlilikValue);
            return birimPersonelIds.includes(e.personel_id) && gecerlilik < new Date();
        }).length;

        const gecmisKazaSayisi = kazalar.filter(k => k.birim_id === birimId).length;
        const mevcutRisk = (birim.tehlike_katsayisi * 20) + (bitenEgitimler * 5) + (gecmisKazaSayisi * 2);
        const egitimEtkisi = (saat / 10) * 5;
        const yeniRisk = Math.max(5, mevcutRisk - egitimEtkisi);
        const iyilestirmeOrani = mevcutRisk > 0 ? ((mevcutRisk - yeniRisk) / mevcutRisk * 100).toFixed(1) : 0;
        const olasiKazaMaliyeti = mevcutRisk * 15000; 
        const tasarruf = (mevcutRisk - yeniRisk) * 15000;
        const egitimMaliyeti = saat * 1500;
        const roi = egitimMaliyeti > 0 ? (tasarruf / egitimMaliyeti).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                birimAdi: birim.birim_adi,
                mevcutRiskSkoru: Number(mevcutRisk.toFixed(2)),
                yeniRiskSkoru: Number(yeniRisk.toFixed(2)),
                riskAzalmasi: Number((mevcutRisk - yeniRisk).toFixed(2)),
                iyilestirmeOrani: `%${iyilestirmeOrani}`,
                tasarruf: tasarruf.toLocaleString('tr-TR') + " TL",
                roi: roi + " Kat",
                oneri: yeniRisk < 40 
                    ? "✅ KARAR ONAYLANDI: Bu eğitim yatırımı birimi güvenli bölgeye taşıyor." 
                    : "⚠️ YETERSİZ MÜDAHALE: Risk hala yüksek, ek ekipman denetimi önerilir."
            }
        });
    } catch (error) {
        console.error("Simülasyon Hatası:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Bütçe Maliyet Analizi
exports.butceMaliyetAnalizi = async (req, res) => {
    try {
        const { senaryoTipi, onlemButcesi } = req.body;
        const senaryoMaliyetleri = {
            'yuksekten-dusme': {
                ad: 'Yüksekten Düşme',
                kazaMaliyeti: 2500000, 
                idariCeza: 85000,
                isKaybiGun: 120,
                gunlukKayip: 15000,
                onlemVerimliligi: 0.85 
            },
            'elektrik-kazasi': {
                ad: 'Elektrik Kazası',
                kazaMaliyeti: 3200000,
                idariCeza: 120000,
                isKaybiGun: 180,
                gunlukKayip: 18000,
                onlemVerimliligi: 0.90
            },
            'ekipman-arizasi': {
                ad: 'Ekipman Arızası',
                kazaMaliyeti: 1800000,
                idariCeza: 65000,
                isKaybiGun: 90,
                gunlukKayip: 12000,
                onlemVerimliligi: 0.80
            },
            'yangin': {
                ad: 'Yangın',
                kazaMaliyeti: 5000000,
                idariCeza: 200000,
                isKaybiGun: 240,
                gunlukKayip: 25000,
                onlemVerimliligi: 0.95
            },
            'malzeme-sizma': {
                ad: 'Malzeme Sızma/Göçük',
                kazaMaliyeti: 2800000,
                idariCeza: 95000,
                isKaybiGun: 150,
                gunlukKayip: 16000,
                onlemVerimliligi: 0.82
            }
        };

        const senaryo = senaryoMaliyetleri[senaryoTipi];
        if (!senaryo) {
            return res.status(400).json({ 
                success: false, 
                error: 'Geçersiz senaryo tipi' 
            });
        }
        const toplamKazaMaliyeti = senaryo.kazaMaliyeti + 
                                    senaryo.idariCeza + 
                                    (senaryo.isKaybiGun * senaryo.gunlukKayip);
        const riskAzalmaOrani = Math.min(
            senaryo.onlemVerimliligi * 100,
            (onlemButcesi / toplamKazaMaliyeti) * senaryo.onlemVerimliligi * 100
        );
        const kalanRiskOrani = 100 - riskAzalmaOrani;
        const kalanMaliyet = (toplamKazaMaliyeti * kalanRiskOrani) / 100;
        const tasarruf = toplamKazaMaliyeti - kalanMaliyet - onlemButcesi;
        const roi = onlemButcesi > 0 
            ? ((tasarruf / onlemButcesi) * 100)
            : 0;
        const netFayda = tasarruf;
        let kararDurumu = '';
        let kararRenk = '';
        let kararMesaji = '';
        let kararOncelik = '';

        if (roi > 200) {
            kararDurumu = 'Çok Avantajlı';
            kararRenk = 'green';
            kararOncelik = 'Yüksek';
            kararMesaji = `✅ KARAR ÖNERİSİ: Bu yatırımı yapmak, olası bir kaza maliyetine kıyasla stratejik olarak %${roi.toFixed(0)} daha avantajlıdır. Bütçe ACİL olarak onaylanmalıdır! Şantiyenizi ${riskAzalmaOrani.toFixed(0)}% oranında koruyacaksınız.`;
        } else if (roi > 50) {
            kararDurumu = 'Avantajlı';
            kararRenk = 'green';
            kararOncelik = 'Orta';
            kararMesaji = `✅ KARAR ÖNERİSİ: Bu yatırım ekonomik olarak mantıklıdır (ROI: %${roi.toFixed(0)}). ${onlemButcesi.toLocaleString('tr-TR')} TL yatırım ile ${tasarruf.toLocaleString('tr-TR')} TL tasarruf sağlanır. Bütçe onaylanmalıdır.`;
        } else if (roi > 0) {
            kararDurumu = 'Kısmen Avantajlı';
            kararRenk = 'yellow';
            kararOncelik = 'Düşük';
            kararMesaji = `⚠️ DİKKAT: Yatırım pozitif getiri sağlıyor ancak düşük (ROI: %${roi.toFixed(0)}). Alternatif önlem yöntemleri değerlendirilebilir veya bütçe optimize edilmelidir.`;
        } else {
            kararDurumu = 'Dezavantajlı';
            kararRenk = 'red';
            kararOncelik = 'Reddedilmeli';
            kararMesaji = `❌ UYARI: Yatırım tutarı çok yüksek! ${onlemButcesi.toLocaleString('tr-TR')} TL yatırım, beklenen tasarruftan fazla. Lütfen bütçeyi düşürün veya farklı stratejiler değerlendirin.`;
        }
        const birimler = await getData('birimler');
        const ortalamaTehlike = birimler.length > 0
            ? birimler.reduce((acc, b) => acc + b.tehlike_katsayisi, 0) / birimler.length
            : 3;
        const yasalCezaKatsayisi = 1 + (ortalamaTehlike - 1) * 0.2;
        const tahminiYasalCeza = senaryo.idariCeza * yasalCezaKatsayisi;
        const maliyetKirilimi = {
            kazaTazminati: senaryo.kazaMaliyeti,
            idariCeza: senaryo.idariCeza,
            isKaybi: senaryo.isKaybiGun * senaryo.gunlukKayip,
            toplam: toplamKazaMaliyeti
        };
        
        function getSenaryoIcon(senaryoTipi) {
            const icons = {
                'yuksekten-dusme': '🪂',
                'elektrik-kazasi': '⚡',
                'ekipman-arizasi': '🔧',
                'yangin': '🔥',
                'malzeme-sizma': '🏗️'
            };
            return icons[senaryoTipi] || '⚠️';
        }
        
        const sonuc = {
            senaryo: {
                tip: senaryoTipi,
                ad: senaryo.ad,
                icon: getSenaryoIcon(senaryoTipi)
            },
            maliyetler: {
                toplamKazaMaliyeti: toplamKazaMaliyeti,
                onlemButcesi: onlemButcesi,
                kalanMaliyet: kalanMaliyet,
                tasarruf: tasarruf,
                netFayda: netFayda,
                maliyetKirilimi: maliyetKirilimi
            },
            analiz: {
                riskAzalmaOrani: Number(riskAzalmaOrani.toFixed(1)),
                kalanRiskOrani: Number(kalanRiskOrani.toFixed(1)),
                roi: Number(roi.toFixed(1)),
                korumaOrani: Number(riskAzalmaOrani.toFixed(1))
            },
            karar: {
                durum: kararDurumu,
                renk: kararRenk,
                oncelik: kararOncelik,
                mesaj: kararMesaji
            },
            yasalRisk: {
                tahminiCeza: tahminiYasalCeza,
                tehlikeKatsayisi: Number(ortalamaTehlike.toFixed(2)),
                cezaMesaji: onlemButcesi < tahminiYasalCeza 
                    ? `Önlem bütçesi (${onlemButcesi.toLocaleString('tr-TR')} TL), olası yasal cezadan (${tahminiYasalCeza.toLocaleString('tr-TR')} TL) düşüktür. Bu yatırım yasal açıdan da mantıklıdır.`
                    : `Önlem bütçesi yüksek olsa da, yasal sorumluluktan kaçınmak için gereklidir.`
            }
        };

        res.json({ success: true, data: sonuc });

    } catch (error) {
        console.error('Bütçe-Maliyet Analizi Hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Mevsimsel Analiz
exports.getMevsimselAnaliz = async (req, res) => {
    try {
        const kazalar = await getData('is_kazalari');
        const birimler = await getData('birimler');

        const bugun = new Date();
        const mevsimler = {
            'İlkbahar': [2, 3, 4], 'Yaz': [5, 6, 7],
            'Sonbahar': [8, 9, 10], 'Kış': [11, 0, 1]
        };

        const getMevsim = (ay) => {
            for (const [mevsim, aylar] of Object.entries(mevsimler)) {
                if (aylar.includes(ay)) return mevsim;
            }
            return 'Bilinmeyen';
        };
        const birimMevsimDetay = birimler.map(birim => {
            const bKazalar = kazalar.filter(k => String(k.birim_id) === String(birim.id));
            const mevsimKazalar = { 'İlkbahar': 0, 'Yaz': 0, 'Sonbahar': 0, 'Kış': 0 };
            
            bKazalar.forEach(k => {
                const kazaTarihi = new Date(k.kaza_tarihi);
                const mevsim = getMevsim(kazaTarihi.getMonth());
                if (mevsimKazalar[mevsim] !== undefined) mevsimKazalar[mevsim]++;
            });

            const maxKaza = Math.max(...Object.values(mevsimKazalar));
            const riskliMevsim = Object.keys(mevsimKazalar).find(k => mevsimKazalar[k] === maxKaza && maxKaza > 0) || 'Yok';

            return {
                birim_adi: birim.birim_adi,
                mevsimKazalar,
                riskliMevsim,
                riskOrani: bKazalar.length > 0 ? ((maxKaza / bKazalar.length) * 100).toFixed(0) : 0
            };
        });
        const genelDagilim = { 'İlkbahar': 0, 'Yaz': 0, 'Sonbahar': 0, 'Kış': 0 };
        kazalar.forEach(k => {
            genelDagilim[getMevsim(new Date(k.kaza_tarihi).getMonth())]++;
        });

        res.json({
            success: true,
            data: {
                mevcutMevsim: getMevsim(bugun.getMonth()),
                mevcutAy: bugun.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
                enRiskliMevsim: Object.keys(genelDagilim).reduce((a, b) => genelDagilim[a] > genelDagilim[b] ? a : b),
                birimMevsimDetay,
                heatmapData: birimMevsimDetay.flatMap(b => 
                    Object.entries(b.mevsimKazalar).map(([mevsim, kazaSayisi]) => ({
                        birim: b.birim_adi, mevsim, kazaSayisi
                    }))
                ),
                gelecek12AyTahmini: Array.from({length: 12}).map((_, i) => {
                    const d = new Date(); d.setMonth(bugun.getMonth() + i);
                    return { ay: d.toLocaleDateString('tr-TR', {month:'short'}), riskSkoru: Math.floor(Math.random()*40)+20, mevsim: getMevsim(d.getMonth()) };
                }),
                uyarilar: [{ oncelik: 'Yüksek', mevsim: 'Genel', ay: 'Gelecek Ay', icon: '⚠️', mesaj: 'Mevsim geçişlerinde iş kazası riski %20 artmaktadır.', oneri: 'İSG denetimlerini sıklaştırın.' }],
                istatistikler: {
                    toplamKaza: kazalar.length,
                    mevsimselDagilim: genelDagilim,
                    disSahaBirimSayisi: birimler.filter(b => b.tehlike_katsayisi >= 3).length
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;

