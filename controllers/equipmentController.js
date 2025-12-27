const { getData, supabase } = require('../models/database');

// Ekipman Bakım Tahmini
exports.getEkipmanBakimTahmini = async (req, res) => {
    try {
        const ekipmanlar = await getData('ekipmanlar');
        const birimler = await getData('birimler');

        const bugun = new Date();
        const ekipmanAnalizleri = [];
        const bakimTakvimi = [];
        ekipmanlar.forEach(ekipman => {
            const sonBakimTarihi = new Date(ekipman.son_bakim_tarihi);
            const bakimAraligi = ekipman.bakim_araligi_gun;
            const sonrakiBakimTarihi = new Date(sonBakimTarihi);
            sonrakiBakimTarihi.setDate(sonrakiBakimTarihi.getDate() + bakimAraligi);
            const gecenGun = Math.floor((bugun - sonBakimTarihi) / (1000 * 60 * 60 * 24));
            const kalanGun = Math.floor((sonrakiBakimTarihi - bugun) / (1000 * 60 * 60 * 24));
            let saglikSkoru = ((kalanGun / bakimAraligi) * 100);
            if (kalanGun < 0) {
                saglikSkoru = Math.max(-100, saglikSkoru + (kalanGun * 2));
            }
            saglikSkoru = Math.max(0, Math.min(100, saglikSkoru));
            let durum = '';
            let durumRenk = '';
            let oncelik = '';
            if (saglikSkoru >= 70) {
                durum = 'İyi';
                durumRenk = 'green';
                oncelik = 'Normal';
            } else if (saglikSkoru >= 40) {
                durum = 'Dikkat';
                durumRenk = 'yellow';
                oncelik = 'Orta';
            } else {
                durum = 'Kritik';
                durumRenk = 'red';
                oncelik = 'Acil';
            }
            const ekipmanYasi = gecenGun / 365;
            const ortalamaOmur = {
                'vinç': 15,
                'mikser': 10,
                'jeneratör': 12,
                'forklift': 10,
                'kaynak': 8,
                'ekskavatör': 12,
                'default': 10
            };
            let ekipmanTipi = 'default';
            const ekipmanAdiLower = ekipman.ekipman_adi.toLowerCase();
            if (ekipmanAdiLower.includes('vinç')) ekipmanTipi = 'vinç';
            else if (ekipmanAdiLower.includes('mikser')) ekipmanTipi = 'mikser';
            else if (ekipmanAdiLower.includes('jeneratör')) ekipmanTipi = 'jeneratör';
            else if (ekipmanAdiLower.includes('forklift')) ekipmanTipi = 'forklift';
            else if (ekipmanAdiLower.includes('kaynak')) ekipmanTipi = 'kaynak';
            else if (ekipmanAdiLower.includes('ekskavatör')) ekipmanTipi = 'ekskavatör';

            const beklenenOmur = ortalamaOmur[ekipmanTipi];
            const kalanOmurYil = Math.max(0, beklenenOmur - ekipmanYasi);
            const kalanOmurOrani = (kalanOmurYil / beklenenOmur) * 100;
            const yillikBakimMaliyeti = gecenGun > 365 
                ? (gecenGun / 365) * 50000 
                : 30000;
            
            const tahminiYenilemeMaliyeti = 500000; 
            const bakimYenilemOrani = (yillikBakimMaliyeti / tahminiYenilemeMaliyeti) * 100;           
            let stratejikOneri = '';
            let ekonomikDurum = '';

            if (saglikSkoru < 40) {
                if (bakimYenilemOrani > 60 || kalanOmurOrani < 20) {
                    stratejikOneri = `⚠️ KRİTİK: Bu ekipman ekonomik ömrünü tamamlamak üzere. Bakım maliyeti, yenileme maliyetinin %${bakimYenilemOrani.toFixed(0)}'ına ulaştı. Değişim planlanması önerilir.`;
                    ekonomikDurum = 'Yenileme Gerekli';
                } else {
                    stratejikOneri = `🔧 ACİL BAKIM: Ekipman sağlık skoru kritik seviyede. Acil bakım planlanmalıdır. Gecikme durumunda arıza riski yüksek.`;
                    ekonomikDurum = 'Acil Bakım';
                }
            } else if (saglikSkoru < 70) {
                stratejikOneri = `⚠️ DİKKAT: Bakım tarihi yaklaşıyor (${kalanGun} gün kaldı). Önleyici bakım planlaması yapılmalıdır.`;
                ekonomikDurum = 'Bakım Planla';
            } else {
                stratejikOneri = `✅ İYİ: Ekipman sağlıklı durumda. Rutin kontroller yeterlidir.`;
                ekonomikDurum = 'İyi Durumda';
            }
            const birim = birimler.find(b => b.id === ekipman.birim_id);
            ekipmanAnalizleri.push({
                id: ekipman.id,
                ekipmanAdi: ekipman.ekipman_adi,
                seriNo: ekipman.seri_no || 'N/A',
                birimAdi: birim ? birim.birim_adi : 'Bilinmiyor',
                saglikSkoru: Number(saglikSkoru.toFixed(1)),
                durum: durum,
                durumRenk: durumRenk,
                oncelik: oncelik,
                sonBakimTarihi: sonBakimTarihi.toISOString().split('T')[0],
                sonrakiBakimTarihi: sonrakiBakimTarihi.toISOString().split('T')[0],
                kalanGun: kalanGun,
                gecenGun: gecenGun,
                bakimAraligi: bakimAraligi,
                kalanOmurYil: Number(kalanOmurYil.toFixed(1)),
                kalanOmurOrani: Number(kalanOmurOrani.toFixed(1)),
                bakimYenilemOrani: Number(bakimYenilemOrani.toFixed(1)),
                stratejikOneri: stratejikOneri,
                ekonomikDurum: ekonomikDurum
            });
            let takipTarihi = new Date(sonBakimTarihi);
            for (let i = 0; i < 12; i++) {
                takipTarihi.setDate(takipTarihi.getDate() + bakimAraligi);
                
                if (takipTarihi <= new Date(bugun.getTime() + 365 * 24 * 60 * 60 * 1000)) {
                    bakimTakvimi.push({
                        ekipmanAdi: ekipman.ekipman_adi,
                        bakimTarihi: takipTarihi.toISOString().split('T')[0],
                        ay: takipTarihi.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
                        kalanGun: Math.floor((takipTarihi - bugun) / (1000 * 60 * 60 * 24)),
                        birimAdi: birim ? birim.birim_adi : 'Bilinmiyor'
                    });
                }
            }
        });
        ekipmanAnalizleri.sort((a, b) => a.saglikSkoru - b.saglikSkoru);
        bakimTakvimi.sort((a, b) => a.kalanGun - b.kalanGun);
        const istatistikler = {
            toplamEkipman: ekipmanlar.length,
            iyiDurumda: ekipmanAnalizleri.filter(e => e.saglikSkoru >= 70).length,
            dikkat: ekipmanAnalizleri.filter(e => e.saglikSkoru >= 40 && e.saglikSkoru < 70).length,
            kritik: ekipmanAnalizleri.filter(e => e.saglikSkoru < 40).length,
            bakimGecmis: ekipmanAnalizleri.filter(e => e.kalanGun < 0).length,
            sonrakiAySonra30Gun: bakimTakvimi.filter(b => b.kalanGun <= 30).length,
            yenilemeSuggest: ekipmanAnalizleri.filter(e => e.ekonomikDurum === 'Yenileme Gerekli').length
        };
        const ortalamaSaglik = ekipmanAnalizleri.length > 0
            ? ekipmanAnalizleri.reduce((acc, e) => acc + e.saglikSkoru, 0) / ekipmanAnalizleri.length
            : 100;
        const bakimMaliyetiKisiBasiOrtalama = 5000; 
        const gelecek12AyBakimlar = bakimTakvimi.filter(b => b.kalanGun >= 0 && b.kalanGun <= 365);
        const toplamTahminiBakimMaliyeti = gelecek12AyBakimlar.length * bakimMaliyetiKisiBasiOrtalama;
        const acilBakimEkipmanlari = ekipmanAnalizleri.filter(e => e.saglikSkoru < 30);
        const acilBakimMaliyeti = acilBakimEkipmanlari.length * bakimMaliyetiKisiBasiOrtalama * 1.5; 
        const yenilemeEkipmanlari = ekipmanAnalizleri.filter(e => e.ekonomikDurum === 'Yenileme Gerekli');
        const yenilemeMaliyeti = yenilemeEkipmanlari.length * 500000; 
        
        const toplamTahminiMaliyet = toplamTahminiBakimMaliyeti + acilBakimMaliyeti + yenilemeMaliyeti;
        const aylikMaliyetDagilimi = [];
        for (let i = 0; i < 12; i++) {
            const ay = new Date(bugun);
            ay.setMonth(ay.getMonth() + i);
            const ayAdi = ay.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
            
            const ayinBakimlari = bakimTakvimi.filter(b => {
                const bakimAy = new Date(b.bakimTarihi);
                return bakimAy.getMonth() === ay.getMonth() && bakimAy.getFullYear() === ay.getFullYear();
            });
            
            aylikMaliyetDagilimi.push({
                ay: ayAdi,
                bakimSayisi: ayinBakimlari.length,
                tahminiMaliyet: ayinBakimlari.length * bakimMaliyetiKisiBasiOrtalama
            });
        }
        const sonuc = {
            ekipmanAnalizleri: ekipmanAnalizleri,
            bakimTakvimi: bakimTakvimi.slice(0, 20),
            istatistikler: istatistikler,
            ortalamaSaglik: Number(ortalamaSaglik.toFixed(1)),
            genelDurum: ortalamaSaglik >= 70 ? 'İyi' : ortalamaSaglik >= 50 ? 'Orta' : 'Kritik',
            maliyetTahmini: {
                gelecek12AyBakimSayisi: gelecek12AyBakimlar.length,
                toplamTahminiBakimMaliyeti: toplamTahminiBakimMaliyeti,
                acilBakimSayisi: acilBakimEkipmanlari.length,
                acilBakimMaliyeti: acilBakimMaliyeti,
                yenilemeSayisi: yenilemeEkipmanlari.length,
                yenilemeMaliyeti: yenilemeMaliyeti,
                toplamTahminiMaliyet: toplamTahminiMaliyet,
                aylikMaliyetDagilimi: aylikMaliyetDagilimi
            }
        };

        res.json({ success: true, data: sonuc });

    } catch (error) {
        console.error('Ekipman Bakım Tahmini Hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Ekipman Risk Analizi
exports.getEkipmanRiskAnalizi = async (req, res) => {
    try {
        console.log('🔧 Ekipman Risk Analizi başlatılıyor...');
        const { data: kazaData, error: kazaError } = await supabase
            .from('is_kazalari')
            .select('*, ekipmanlar!fk_ekipman(*)')
            .not('ekipman_id', 'is', null);
        
        if (kazaError) {
            console.error('❌ Kaza verisi çekme hatası:', kazaError);
            throw kazaError;
        }
        
        console.log(`📊 ${kazaData.length} ekipman ilişkili kaza bulundu`);
        const { data: tumEkipmanlar, error: ekipmanError } = await supabase
            .from('ekipmanlar')
            .select('*');
        
        if (ekipmanError) {
            console.error('❌ Ekipman verisi çekme hatası:', ekipmanError);
            throw ekipmanError;
        }
        
        console.log(`🔧 Toplam ${tumEkipmanlar.length} ekipman bulundu`);
        const ekipmanKazaMap = {};
        tumEkipmanlar.forEach(ekipman => {
            ekipmanKazaMap[ekipman.id] = {
                ekipman_id: ekipman.id,
                ekipman_adi: ekipman.ekipman_adi,
                ekipman_tipi: ekipman.ekipman_adi, 
                durum: ekipman.durum,
                toplam_kaza: 0,
                kazalar: [],
                kritiklik: 'Düşük',
                kritiklik_renk: 'success',
                karar_onerisi: 'Ekipman güvenli, rutin bakım yeterli.',
                acil_bakim_gerekli: false
            };
        });
        kazaData.forEach(kaza => {
            const ekipmanId = kaza.ekipman_id;
            
            if (ekipmanId && ekipmanKazaMap[ekipmanId]) {
                ekipmanKazaMap[ekipmanId].toplam_kaza++;
                ekipmanKazaMap[ekipmanId].kazalar.push({
                    kaza_tarihi: kaza.kaza_tarihi,
                    kaza_aciklamasi: kaza.kaza_aciklamasi,
                    kds_analiz_notu: kaza.kaza_aciklamasi 
                });
            }
        });
        Object.values(ekipmanKazaMap).forEach(ekipman => {
            const kazaSayisi = ekipman.toplam_kaza;
            
            if (kazaSayisi > 2) {
                ekipman.kritiklik = 'Kritik';
                ekipman.kritiklik_renk = 'danger';
                ekipman.karar_onerisi = '🚨 ACİL BAKIM GEREKLİ! Bu ekipman 2\'den fazla kazaya karıştı. Derhal teknik kontrol yapılmalı ve gerekirse kullanımdan kaldırılmalıdır.';
                ekipman.acil_bakim_gerekli = true;
            } else if (kazaSayisi === 2) {
                ekipman.kritiklik = 'Yüksek';
                ekipman.kritiklik_renk = 'warning';
                ekipman.karar_onerisi = '⚠️ YÜKSEK RİSK! Bu ekipman 2 kazaya karıştı. Önleyici bakım planlanmalı ve kullanım sıklığı azaltılmalıdır.';
                ekipman.acil_bakim_gerekli = false;
            } else if (kazaSayisi === 1) {
                ekipman.kritiklik = 'Orta';
                ekipman.kritiklik_renk = 'info';
                ekipman.karar_onerisi = 'ℹ️ ORTA RİSK. Bu ekipman 1 kazaya karıştı. Rutin kontrol sıklığı artırılmalı.';
                ekipman.acil_bakim_gerekli = false;
            }
        });
        const ekipmanAnalizleri = Object.values(ekipmanKazaMap).sort((a, b) => {
            return b.toplam_kaza - a.toplam_kaza;
        });
        const istatistikler = {
            toplam_ekipman: tumEkipmanlar.length,
            kazaya_karisan_ekipman: ekipmanAnalizleri.filter(e => e.toplam_kaza > 0).length,
            acil_bakim_gereken: ekipmanAnalizleri.filter(e => e.acil_bakim_gerekli).length,
            kritik_ekipman: ekipmanAnalizleri.filter(e => e.kritiklik === 'Kritik').length,
            yuksek_risk_ekipman: ekipmanAnalizleri.filter(e => e.kritiklik === 'Yüksek').length,
            orta_risk_ekipman: ekipmanAnalizleri.filter(e => e.kritiklik === 'Orta').length,
            guvenli_ekipman: ekipmanAnalizleri.filter(e => e.kritiklik === 'Düşük').length,
            toplam_kaza: kazaData.length
        };
        
        console.log('✅ Ekipman Risk Analizi tamamlandı');
        console.log(`   - Toplam Ekipman: ${istatistikler.toplam_ekipman}`);
        console.log(`   - Kazaya Karışan: ${istatistikler.kazaya_karisan_ekipman}`);
        console.log(`   - Acil Bakım Gereken: ${istatistikler.acil_bakim_gereken}`);
        
        const sonuc = {
            ekipmanAnalizleri: ekipmanAnalizleri,
            istatistikler: istatistikler,
            acilBakimListesi: ekipmanAnalizleri.filter(e => e.acil_bakim_gerekli),
            yuksekRiskListesi: ekipmanAnalizleri.filter(e => e.kritiklik === 'Yüksek')
        };
        
        res.json({ success: true, data: sonuc });
        
    } catch (error) {
        console.error('❌ Ekipman Risk Analizi Hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;

