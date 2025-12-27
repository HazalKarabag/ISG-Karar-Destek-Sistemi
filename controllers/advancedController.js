const { getData, supabase } = require('../models/database');

// Sertifika Yönetimi
exports.getSertifikaYonetimi = async (req, res) => {
    try {
        const { projeksiyonTarihi } = req.query;
        const hedefTarih = projeksiyonTarihi ? new Date(projeksiyonTarihi) : new Date();
        const bugun = new Date();
        const { data: sertifikaVerileri, error } = await supabase
            .from('personel_egitimleri')
            .select(`
                *,
                personel:personel_id (
                    id,
                    ad_soyad,
                    gorev_unvani,
                    birim_id
                ),
                egitim:egitim_id (
                    id,
                    egitim_adi,
                    zorunluluk_derecesi,
                    yenileme_maliyeti_kisi_basi
                )
            `);

        if (error) {
            console.error('Supabase JOIN hatası:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
        const sertifikaListesi = [];
        let kritikDurumlar = [];
        let gecersizSayisi = 0;
        let kritikSayisi = 0;
        let gecerliSayisi = 0;
        let toplamYenilemeMaliyeti = 0;
        sertifikaVerileri.forEach(kayit => {
            const gecerlilikValue = kayit.gecerlilik_sonu || kayit['geçerlilik_sonu'];
            const gecerlilikSonu = new Date(gecerlilikValue);
            const kalanGun = Math.floor((gecerlilikSonu - hedefTarih) / (1000 * 60 * 60 * 24));
            let durum = '';
            let durumRenk = '';
            let durumKod = 0;

            if (kalanGun < 0) {
                durum = 'GEÇERSİZ';
                durumRenk = 'red';
                durumKod = 3;
                gecersizSayisi++;
                toplamYenilemeMaliyeti += kayit.egitim?.yenileme_maliyeti_kisi_basi || 15000;
            } else if (kalanGun <= 30) {
                durum = 'KRİTİK';
                durumRenk = 'orange';
                durumKod = 2;
                kritikSayisi++;
                toplamYenilemeMaliyeti += kayit.egitim?.yenileme_maliyeti_kisi_basi || 15000;
            } else {
                durum = 'GEÇERLİ';
                durumRenk = 'green';
                durumKod = 1;
                gecerliSayisi++;
            }
            const zorunluluk = kayit.egitim?.zorunluluk_derecesi || 0;
            const kritikEgitim = zorunluluk >= 8;

            if (kritikEgitim && durumKod >= 2) {
                kritikDurumlar.push({
                    personelAdi: kayit.personel?.ad_soyad || 'Bilinmeyen',
                    gorevUnvani: kayit.personel?.gorev_unvani || '-',
                    egitimAdi: kayit.egitim?.egitim_adi || kayit.egitim_adi,
                    zorunluluk: zorunluluk,
                    gecerlilikSonu: gecerlilikValue,
                    kalanGun: kalanGun,
                    durum: durum,
                    maliyet: kayit.egitim?.yenileme_maliyeti_kisi_basi || 15000
                });
            }

            sertifikaListesi.push({
                id: kayit.id,
                personelId: kayit.personel_id,
                personelAdi: kayit.personel?.ad_soyad || 'Bilinmeyen',
                gorevUnvani: kayit.personel?.gorev_unvani || '-',
                egitimId: kayit.egitim_id,
                egitimAdi: kayit.egitim?.egitim_adi || kayit.egitim_adi,
                zorunluluk: zorunluluk,
                kritikEgitim: kritikEgitim,
                gecerlilikSonu: gecerlilikValue,
                kalanGun: kalanGun,
                durum: durum,
                durumRenk: durumRenk,
                durumKod: durumKod,
                yenilemeMaliyeti: kayit.egitim?.yenileme_maliyeti_kisi_basi || 15000
            });
        });
        sertifikaListesi.sort((a, b) => b.durumKod - a.durumKod || a.kalanGun - b.kalanGun);
        kritikDurumlar.sort((a, b) => a.kalanGun - b.kalanGun);
        const aylikTrend = [];
        for (let i = 0; i < 12; i++) {
            const ayTarihi = new Date(hedefTarih);
            ayTarihi.setMonth(ayTarihi.getMonth() + i);
            
            const ayBasi = new Date(ayTarihi.getFullYear(), ayTarihi.getMonth(), 1);
            const aySonu = new Date(ayTarihi.getFullYear(), ayTarihi.getMonth() + 1, 0);

            const ayDolacaklar = sertifikaVerileri.filter(kayit => {
                const gecerlilikValue = kayit.gecerlilik_sonu || kayit['geçerlilik_sonu'];
                if (!gecerlilikValue) return false;
                const gecerlilikSonu = new Date(gecerlilikValue);
                return gecerlilikSonu >= ayBasi && gecerlilikSonu <= aySonu;
            });

            const ayMaliyeti = ayDolacaklar.reduce((sum, k) => 
                sum + (k.egitim?.yenileme_maliyeti_kisi_basi || 15000), 0);

            aylikTrend.push({
                ay: ayTarihi.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
                dolacakSayisi: ayDolacaklar.length,
                maliyet: ayMaliyeti
            });
        }
        const toplamSertifika = sertifikaListesi.length;
        const uyumlulukOrani = toplamSertifika > 0 
            ? ((gecerliSayisi / toplamSertifika) * 100).toFixed(1)
            : 100;

        const istatistikler = {
            toplamSertifika: toplamSertifika,
            gecersiz: gecersizSayisi,
            kritik: kritikSayisi,
            gecerli: gecerliSayisi,
            uyumlulukOrani: parseFloat(uyumlulukOrani),
            toplamYenilemeMaliyeti: toplamYenilemeMaliyeti,
            kritikEgitimSayisi: kritikDurumlar.length
        };

        res.json({
            success: true,
            data: {
                hedefTarih: hedefTarih.toISOString().split('T')[0],
                bugun: bugun.toISOString().split('T')[0],
                sertifikaListesi: sertifikaListesi,
                kritikDurumlar: kritikDurumlar,
                aylikTrend: aylikTrend,
                istatistikler: istatistikler
            }
        });

    } catch (error) {
        console.error('Sertifika Yönetimi Hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Vardiya Analizi
exports.vardiyaAnalizi = async (req, res) => {
    try {
        const { gelecekAy } = req.body;
        const bugun = new Date();
        const gelecekTarih = new Date(bugun);
        gelecekTarih.setMonth(gelecekTarih.getMonth() + (parseInt(gelecekAy) || 1));
        const { data: personelEgitimVerileri, error: egitimError } = await supabase
            .from('personel_egitimleri')
            .select(`
                id,
                gecerlilik_sonu,
                egitim_maliyeti_kisi_basi,
                personel:personel_id (
                    id,
                    ad_soyad,
                    birimler:birim_id (
                        birim_adi
                    )
                ),
                egitimler:egitim_id (
                    egitim_adi
                )
            `);

        if (egitimError) throw egitimError;

        let uygunPersonel = 0;
        let sertifikaDolacakPersonel = 0;
        let egitimGereken = 0;

        const personelDurumlari = personelEgitimVerileri.map(item => {
            const gecerlilik = item.gecerlilik_sonu || item['geçerlilik_sonu'];
            const gecerlilikSonu = new Date(gecerlilik);
            const kalanGun = Math.ceil((gecerlilikSonu - gelecekTarih) / (1000 * 60 * 60 * 24));
            
            let durum = 'Uygun';
            let durumRenk = 'green';
            let egitimGerekli = false;

            if (kalanGun < 0) {
                durum = 'Süresi Dolmuş';
                durumRenk = 'red';
                egitimGerekli = true;
                egitimGereken++;
            } else if (kalanGun <= 30) {
                durum = 'Acil Yenileme';
                durumRenk = 'orange';
                egitimGerekli = true;
                sertifikaDolacakPersonel++;
            } else if (kalanGun <= 90) {
                durum = 'Yenileme Yaklaşıyor';
                durumRenk = 'yellow';
                sertifikaDolacakPersonel++;
            } else {
                uygunPersonel++;
            }

            return {
                personelId: item.personel?.id,
                personelAdi: item.personel?.ad_soyad || 'Bilinmiyor',
                birimAdi: item.personel?.birimler?.birim_adi || '-',
                egitimAdi: item.egitimler?.egitim_adi || 'Eğitim Tanımsız',
                gecerlilikSonu: gecerlilik,
                kalanGun: kalanGun,
                durum: durum,
                durumRenk: durumRenk,
                egitimGerekli: egitimGerekli,
                egitimMaliyeti: item.egitim_maliyeti_kisi_basi || 0
            };
        });

        res.json({
            success: true,
            data: {
                gelecekTarih: gelecekTarih.toISOString().split('T')[0],
                personelDurumlari: personelDurumlari.sort((a,b) => a.kalanGun - b.kalanGun),
                istatistikler: {
                    toplamPersonel: personelDurumlari.length,
                    uygunPersonel,
                    sertifikaDolacakPersonel,
                    egitimGereken,
                    yetkinlikOrani: personelDurumlari.length > 0 ? parseFloat(((uygunPersonel / personelDurumlari.length) * 100).toFixed(1)) : 0
                },
                maliyet: {
                    toplamEgitimMaliyeti: personelDurumlari.reduce((sum, p) => sum + (p.egitimGerekli ? p.egitimMaliyeti : 0), 0)
                }
            }
        });

    } catch (error) {
        console.error('🔥 Vardiya Analizi Hatası:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Vardiya Eğitim Planla
exports.vardiyaEgitimPlanla = async (req, res) => {
    try {
        const { personelId, egitimMaliyeti, birimId } = req.body;
        const birimler = await getData('birimler');
        const birim = birimler.find(b => b.id === birimId);
        const riskAzalmasi = 5;
        const yeniRiskSkoru = Math.max(0, (birim?.tehlike_katsayisi || 3) * 10 - riskAzalmasi);

        res.json({
            success: true,
            data: {
                personelId: personelId,
                egitimMaliyeti: egitimMaliyeti,
                riskAzalmasi: riskAzalmasi,
                yeniRiskSkoru: yeniRiskSkoru,
                message: 'Eğitim planlandı. Bütçe paneli güncellenecek.'
            }
        });

    } catch (error) {
        console.error('Eğitim Planlama Hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Vardiya Personel Değiştir
exports.vardiyaPersonelDegistir = async (req, res) => {
    try {
        const { birimId, yeniPersonelSayisi, vardiyaSaati } = req.body;

        const saatlikUcret = 150; 
        const aylikCalismaSaati = vardiyaSaati * 26; 
        const aylikIscilikMaliyeti = yeniPersonelSayisi * saatlikUcret * aylikCalismaSaati;
        const temelRisk = 50;
        const personelBazliAzalma = Math.min(40, (yeniPersonelSayisi - 5) * 2); 
        const yeniRiskPuani = Math.max(10, temelRisk - personelBazliAzalma);

        res.json({
            success: true,
            data: {
                birimId: birimId,
                yeniPersonelSayisi: yeniPersonelSayisi,
                vardiyaSaati: vardiyaSaati,
                aylikIscilikMaliyeti: aylikIscilikMaliyeti,
                yeniRiskPuani: yeniRiskPuani,
                riskAzalmasi: temelRisk - yeniRiskPuani,
                message: 'Vardiya planı güncellendi. Bütçe paneli etkilenecek.'
            }
        });

    } catch (error) {
        console.error('Vardiya Personel Değiştirme Hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;

