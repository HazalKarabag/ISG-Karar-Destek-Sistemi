const { getData, supabase } = require('../models/database');

// Stratejik Özet
exports.getStratejikOzet = async (req, res) => {
    try {
        const { birimId, zamanAraligi } = req.query;
        
        const personel = await getData('personel');
        const kazalar = await getData('is_kazalari');
        const egitimler = await getData('personel_egitimleri');
        const birimler = await getData('birimler');
        const ekipmanlar = await getData('ekipmanlar');
        const ramakKala = await getData('ramak_kala_kayitlari');
        const santiyeİsPlani = await getData('santiye_is_plani');

        const bugun = new Date();
        let baslangicTarihi = new Date();
        if (zamanAraligi === '3ay') {
            baslangicTarihi.setMonth(bugun.getMonth() - 3);
        } else if (zamanAraligi === '6ay') {
            baslangicTarihi.setMonth(bugun.getMonth() - 6);
        } else if (zamanAraligi === '1yil') {
            baslangicTarihi.setFullYear(bugun.getFullYear() - 1);
        } else {
            baslangicTarihi.setMonth(bugun.getMonth() - 3);
        }
        let filtrelenmisPersonel = personel;
        let filtrelenmisKazalar = kazalar;
        let filtrelenmisRamakKala = ramakKala;
        let filtrelenmisEkipmanlar = ekipmanlar;
        
        if (birimId && birimId !== 'tumu') {
            const birimIdInt = parseInt(birimId);
            filtrelenmisPersonel = personel.filter(p => p.birim_id === birimIdInt);
            filtrelenmisKazalar = kazalar.filter(k => k.birim_id === birimIdInt);
            filtrelenmisRamakKala = ramakKala.filter(r => r.birim_id === birimIdInt);
            filtrelenmisEkipmanlar = ekipmanlar.filter(e => e.birim_id === birimIdInt);
        }
        const birimRiskler = birimler.map(birim => {
            const birimKazalar = kazalar.filter(k => k.birim_id === birim.id && new Date(k.kaza_tarihi) >= baslangicTarihi).length;
            const birimRamakKala = ramakKala.filter(r => r.birim_id === birim.id && new Date(r.olay_tarihi) >= baslangicTarihi).length;
            const riskSkoru = (birim.tehlike_katsayisi * 10) + (birimKazalar * 15) + (birimRamakKala * 5);
            return { birim_id: birim.id, birim_adi: birim.birim_adi, riskSkoru };
        });
        const kritikRiskliBirimSayisi = birimRiskler.filter(b => b.riskSkoru > 50).length;
        const suresiDolanEgitimler = egitimler.filter(e => {
            const gecerlilik = e.gecerlilik_sonu || e['geçerlilik_sonu'];
            return gecerlilik && new Date(gecerlilik) < bugun;
        }).length;
        const bakimBekleyenEkipman = filtrelenmisEkipmanlar.filter(e => {
            const durumKontrol = e.durum === 'Bakım Bekleyen' || e.durum === 'Arızalı';
            const sonBakim = new Date(e.son_bakim_tarihi);
            const sonrakiBakim = new Date(sonBakim);
            sonrakiBakim.setDate(sonrakiBakim.getDate() + (e.bakim_araligi_gun || 90));
            const yediGunSonra = new Date();
            yediGunSonra.setDate(bugun.getDate() + 7);
            const bakimKontrol = sonrakiBakim <= yediGunSonra;
            
            return durumKontrol || bakimKontrol;
        }).length;
        const gecenAyBaslangic = new Date(bugun.getFullYear(), bugun.getMonth() - 1, 1);
        const gecenAyBitis = new Date(bugun.getFullYear(), bugun.getMonth(), 0);
        const gecenAyBakimBekleyen = filtrelenmisEkipmanlar.filter(e => {
            const durumKontrol = e.durum === 'Bakım Bekleyen' || e.durum === 'Arızalı';
            const sonBakim = new Date(e.son_bakim_tarihi);
            const sonrakiBakim = new Date(sonBakim);
            sonrakiBakim.setDate(sonrakiBakim.getDate() + (e.bakim_araligi_gun || 90));
            const bakimKontrol = sonrakiBakim <= gecenAyBitis;
            return durumKontrol || bakimKontrol;
        }).length;
        const bakimTrend = bakimBekleyenEkipman - gecenAyBakimBekleyen;
        const bakimTrendYon = bakimTrend > 0 ? 'up' : bakimTrend < 0 ? 'down' : 'stable';
        const buAyBaslangic = new Date(bugun.getFullYear(), bugun.getMonth(), 1);
        const mevcutPlan = santiyeİsPlani.filter(p => {
            return true;
        });
        const aktifYogunluk = mevcutPlan.length > 0 
            ? (mevcutPlan.reduce((acc, curr) => acc + curr.tahmini_is_yogunlugu, 0) / mevcutPlan.length).toFixed(1)
            : 50;
        const riskHaritasi = birimler.map(birim => {
            const birimKazalar = filtrelenmisKazalar.filter(k => k.birim_id === birim.id && new Date(k.kaza_tarihi) >= baslangicTarihi).length;
            const tehlikeKatsayisi = birim.tehlike_katsayisi;
            const riskPuani = (tehlikeKatsayisi * 20) + (birimKazalar * 10);
            
            return {
                birim: birim.birim_adi,
                tehlikeKatsayisi: tehlikeKatsayisi,
                kazaSayisi: birimKazalar,
                riskPuani: riskPuani
            };
        });
        const sonOlaylar = [];
        filtrelenmisKazalar
            .filter(k => new Date(k.kaza_tarihi) >= baslangicTarihi)
            .forEach(kaza => {
                const birim = birimler.find(b => b.id === kaza.birim_id);
                sonOlaylar.push({
                    tarih: kaza.kaza_tarihi,
                    birim: birim ? birim.birim_adi : 'Bilinmiyor',
                    olayTipi: 'İş Kazası',
                    siddet: 'Yüksek',
                    renk: 'red',
                    aciklama: kaza.aciklama || 'Detay yok'
                });
            });
        filtrelenmisRamakKala
            .filter(r => new Date(r.olay_tarihi) >= baslangicTarihi)
            .forEach(ramak => {
                const birim = birimler.find(b => b.id === ramak.birim_id);
                sonOlaylar.push({
                    tarih: ramak.olay_tarihi,
                    birim: birim ? birim.birim_adi : 'Bilinmiyor',
                    olayTipi: 'Ramak Kala',
                    siddet: 'Orta',
                    renk: 'yellow',
                    aciklama: ramak.aciklama || 'Detay yok'
                });
            });
        sonOlaylar.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
        const son5Olay = sonOlaylar.slice(0, 5);
        const aylikKazaMap = {};
        const aylikRamakKalaMap = {};
        for (let i = 11; i >= 0; i--) {
            const tarih = new Date();
            tarih.setMonth(bugun.getMonth() - i);
            const ayAdi = tarih.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
            aylikKazaMap[ayAdi] = 0;
            aylikRamakKalaMap[ayAdi] = 0;
        }
        filtrelenmisKazalar.forEach(kaza => {
            const kazaTarihi = new Date(kaza.kaza_tarihi);
            const ayAdi = kazaTarihi.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
            if (aylikKazaMap.hasOwnProperty(ayAdi)) {
                aylikKazaMap[ayAdi]++;
            }
        });
        filtrelenmisRamakKala.forEach(ramak => {
            const ramakTarihi = new Date(ramak.olay_tarihi);
            const ayAdi = ramakTarihi.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
            if (aylikRamakKalaMap.hasOwnProperty(ayAdi)) {
                aylikRamakKalaMap[ayAdi]++;
            }
        });
        
        const aylikKazaTrendi = {
            aylar: Object.keys(aylikKazaMap),
            kazaSayilari: Object.values(aylikKazaMap),
            ramakKalaSayilari: Object.values(aylikRamakKalaMap)
        };
        let tamamlandi = 0;
        let bekliyor = 0;
        let suresiDoldu = 0;
        
        const otuzGunSonra = new Date();
        otuzGunSonra.setDate(bugun.getDate() + 30);
        
        egitimler.forEach(egitim => {
            const gecerlilik = egitim.gecerlilik_sonu || egitim['geçerlilik_sonu'];
            const gecerlilikSonu = new Date(gecerlilik);
            
            if (gecerlilikSonu < bugun) {
                suresiDoldu++;
            } else if (gecerlilikSonu <= otuzGunSonra) {
                bekliyor++;
            } else {
                tamamlandi++;
            }
        });
        
        const egitimDagilimi = {
            tamamlandi: tamamlandi,
            bekliyor: bekliyor,
            suresiDoldu: suresiDoldu
        };

        let genelDurum = 'İyi';
        if (kritikRiskliBirimSayisi > 2 || suresiDolanEgitimler > 5 || bakimBekleyenEkipman > 3) {
            genelDurum = 'Kritik';
        } else if (kritikRiskliBirimSayisi > 0 || suresiDolanEgitimler > 2 || bakimBekleyenEkipman > 1) {
            genelDurum = 'Dikkat';
        }
        const sonuc = {
            ustKartlar: {
                kritikRiskliBirimSayisi: kritikRiskliBirimSayisi,
                suresiDolanEgitimler: suresiDolanEgitimler,
                bakimBekleyenEkipman: bakimBekleyenEkipman,
                bakimTrend: bakimTrend,
                bakimTrendYon: bakimTrendYon,
                aktifYogunluk: Number(aktifYogunluk)
            },
            riskHaritasi: riskHaritasi,
            sonOlaylar: son5Olay,
            aylikKazaTrendi: aylikKazaTrendi,
            egitimDagilimi: egitimDagilimi,
            genelDurum: genelDurum,
            birimRiskler: birimRiskler.sort((a, b) => b.riskSkoru - a.riskSkoru).slice(0, 5)
        };

        res.json({ success: true, data: sonuc });
    } catch (error) {
        console.error('Stratejik özet hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Risk Projeksiyonu
exports.getRiskProjeksiyonu = async (req, res) => {
    try {
        const personel = await getData('personel');
        const egitimler = await getData('personel_egitimleri');
        const kazalar = await getData('is_kazalari');
        const plan = await getData('santiye_is_plani');
        const birimler = await getData('birimler');

        const bugun = new Date();
        const aylar = [];
        const riskSkorlari = [];
        for (let i = 6; i <= 12; i++) {
            const hedefTarih = new Date();
            hedefTarih.setMonth(bugun.getMonth() + i);         
            const ayAdi = hedefTarih.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
            aylar.push(ayAdi);
            let toplamRisk = 0;

            birimler.forEach(birim => {
                const birimPersonelIds = personel
                    .filter(p => p.birim_id === birim.id)
                    .map(p => p.id);
                const bitenEgitimler = egitimler.filter(e => {
                    const gecerlilik = e.gecerlilik_sonu || e['geçerlilik_sonu'];
                    if (!gecerlilik) return false;
                    const gecerlilikSonu = new Date(gecerlilik);
                    return birimPersonelIds.includes(e.personel_id) && 
                           gecerlilikSonu.getMonth() === hedefTarih.getMonth() &&
                           gecerlilikSonu.getFullYear() === hedefTarih.getFullYear();
                }).length;
                const birimPlan = plan.filter(p => p.birim_id === birim.id);
                const isYogunlugu = birimPlan.length > 0 
                    ? birimPlan.reduce((acc, curr) => acc + curr.tahmini_is_yogunlugu, 0) / birimPlan.length 
                    : 50;
                const gecmisKazaSayisi = kazalar.filter(k => k.birim_id === birim.id).length;
                const birimRisk = (birim.tehlike_katsayisi * 20) + 
                                  (bitenEgitimler * 5) + 
                                  (isYogunlugu * 0.3) + 
                                  (gecmisKazaSayisi * 2);

                toplamRisk += birimRisk;
            });
            const ortalamaRisk = birimler.length > 0 ? toplamRisk / birimler.length : 0;
            riskSkorlari.push(Number(ortalamaRisk.toFixed(2)));
        }

        res.json({ 
            success: true, 
            data: { aylar, riskSkorlari } 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Birim Analizi
exports.getBirimAnalizi = async (req, res) => {
    try {
        const birimler = await getData('birimler');
        const kazalar = await getData('is_kazalari');
        const plan = await getData('santiye_is_plani');

        const { data: personelEgitimVerileri, error: egitimError } = await supabase
            .from('personel_egitimleri')
            .select(`
                id,
                gecerlilik_sonu, 
                egitim_maliyeti_kisi_basi,
                personel:personel_id (id, ad_soyad, birim_id),
                egitimler:egitim_id (egitim_adi)
            `);

        if (egitimError) throw egitimError;

        const bugun = new Date();
        const birimAnalizleri = birimler.map(birim => {
            const birimKazalar = kazalar.filter(k => k.birim_id === birim.id).length;
            const birimEgitimler = personelEgitimVerileri.filter(e => e.personel?.birim_id === birim.id);
            const egitimiBitecek = birimEgitimler.filter(e => {
                const gecerlilik = e.gecerlilik_sonu || e['geçerlilik_sonu'];
                return gecerlilik && new Date(gecerlilik) <= new Date(bugun.getTime() + 30*24*60*60*1000);
            }).length;
            
            const riskSkoru = (birim.tehlike_katsayisi * 15) + (birimKazalar * 10) + (egitimiBitecek * 5);
            
            return {
                birim: birim.birim_adi,
                riskSkoru: Number(riskSkoru.toFixed(1)),
                durum: riskSkoru > 70 ? 'Kritik' : (riskSkoru > 40 ? 'Orta' : 'Güvenli'),
                egitimiBitecekKisi: egitimiBitecek,
                planlananYogunluk: 75, 
                gecmisKazalar: birimKazalar,
                oneri: riskSkoru > 60 ? `🚨 ${birim.birim_adi} birimi için acil denetim!` : `✅ ${birim.birim_adi} stabil.`
            };
        });
        const detayliTablo = personelEgitimVerileri.map(egitim => {
            const gecerlilikValue = egitim.gecerlilik_sonu || egitim['geçerlilik_sonu'];
            const gecerlilik = new Date(gecerlilikValue);
            const kalan = Math.ceil((gecerlilik - bugun) / (1000 * 60 * 60 * 24));
            
            return {
                personelAdi: egitim.personel?.ad_soyad || 'Bilinmiyor',
                birimAdi: birimler.find(b => b.id === egitim.personel?.birim_id)?.birim_adi || '-',
                egitimAdi: egitim.egitimler?.egitim_adi || 'Eğitim Yok',
                gecerlilikSonu: gecerlilikValue,
                kalanGun: kalan,
                durum: kalan < 0 ? 'SÜRESİ DOLDU' : (kalan <= 30 ? 'KRİTİK' : 'UYGUN'),
                maliyet: egitim.egitim_maliyeti_kisi_basi || 0
            };
        });
        

        res.json({ success: true, data: birimAnalizleri, detayliTablo: detayliTablo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;

