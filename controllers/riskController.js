const { getData, supabase } = require('../models/database');

// Stratejik Risk Analizi
exports.getStratejikRiskAnalizi = async (req, res) => {
    try {
        const { data: kazaVerileri, error: kazaError } = await supabase
            .from('is_kazalari')
            .select(`
                id,
                kaza_aciklamasi,
                kaza_tarihi,
                birimler!inner (
                    id,
                    birim_adi,
                    tehlike_katsayisi
                )
            `);
        
        if (kazaError) {
            console.error('Kaza verileri çekme hatası:', kazaError);
            return res.status(500).json({ success: false, error: kazaError.message });
        }
        
        const birimler = await getData('birimler');
        const personel = await getData('personel');
        const kazalar = kazaVerileri || [];
        const birimKazaSayilari = {};
        birimler.forEach(birim => {
            const birimKazalari = kazalar.filter(k => 
                k.birimler && k.birimler.id === birim.id
            );
            birimKazaSayilari[birim.id] = {
                birim_id: birim.id,
                birim_adi: birim.birim_adi,
                kaza_sayisi: birimKazalari.length,
                tehlike_katsayisi: birim.tehlike_katsayisi
            };
        });
        const topRiskliBirimler = Object.values(birimKazaSayilari)
            .sort((a, b) => b.kaza_sayisi - a.kaza_sayisi)
            .slice(0, 4)
            .map(birim => {
                let riskDurumu = '';
                let riskRenk = '';               
                if (birim.kaza_sayisi >= 3 || birim.tehlike_katsayisi >= 4) {
                    riskDurumu = 'Kritik';
                    riskRenk = 'red';
                } else if (birim.kaza_sayisi >= 2 || birim.tehlike_katsayisi >= 3) {
                    riskDurumu = 'Yüksek';
                    riskRenk = 'orange';
                } else {
                    riskDurumu = 'Orta';
                    riskRenk = 'yellow';
                }
                
                return {
                    birim_id: birim.birim_id,
                    birim_adi: birim.birim_adi,
                    kaza_sayisi: birim.kaza_sayisi,
                    tehlike_katsayisi: birim.tehlike_katsayisi,
                    risk_durumu: riskDurumu,
                    risk_renk: riskRenk
                };
            });
        const sabitKazaTurleri = [
            'Düşme',
            'Ezilme',
            'Kesilme',
            'Yanık',
            'Elektrik Çarpması',
            'Malzeme Düşmesi',
            'Kayma/Takılma',
            'Sıkışma'
        ];
        
        const birimKazaTurleri = {};
        const birimToplamKazalar = {};
        birimler.forEach(birim => {
            birimKazaTurleri[birim.birim_adi] = {};
            birimToplamKazalar[birim.birim_adi] = 0;
            sabitKazaTurleri.forEach(tur => {
                birimKazaTurleri[birim.birim_adi][tur] = 0;
            });
        });
        kazalar.forEach(kaza => {
            if (!kaza.birimler) return; 
            const birimAdi = kaza.birimler.birim_adi;
            let kazaTuru = null;
            const aciklama = (kaza.kaza_aciklamasi || '').toLowerCase();
            
            if (aciklama.includes('düşme') || aciklama.includes('düş')) {
                kazaTuru = 'Düşme';
            } else if (aciklama.includes('ezil')) {
                kazaTuru = 'Ezilme';
            } else if (aciklama.includes('kesil') || aciklama.includes('kesik') || aciklama.includes('kes')) {
                kazaTuru = 'Kesilme';
            } else if (aciklama.includes('yanık') || aciklama.includes('kaynak')) {
                kazaTuru = 'Yanık';
            } else if (aciklama.includes('elektrik') || aciklama.includes('çarp')) {
                kazaTuru = 'Elektrik Çarpması';
            } else if (aciklama.includes('malzeme') && aciklama.includes('düş')) {
                kazaTuru = 'Malzeme Düşmesi';
            } else if (aciklama.includes('kayma') || aciklama.includes('takıl')) {
                kazaTuru = 'Kayma/Takılma';
            } else if (aciklama.includes('sıkış')) {
                kazaTuru = 'Sıkışma';
            }
            if (kazaTuru && sabitKazaTurleri.includes(kazaTuru)) {
                if (birimKazaTurleri[birimAdi]) {
                    birimKazaTurleri[birimAdi][kazaTuru]++;
                    birimToplamKazalar[birimAdi] = (birimToplamKazalar[birimAdi] || 0) + 1;
                }
            }
        });
        const toplamBirimSayisi = birimler.length;
        const genelOrtalama = toplamBirimSayisi > 0 
            ? kazalar.length / toplamBirimSayisi 
            : 0;
        const birimOrtalamaKiyaslamasi = {};
        Object.keys(birimToplamKazalar).forEach(birimAdi => {
            const birimKazaSayisi = birimToplamKazalar[birimAdi];
            const fark = birimKazaSayisi - genelOrtalama;
            const yuzde = genelOrtalama > 0 
                ? ((fark / genelOrtalama) * 100).toFixed(0)
                : 0;
            
            birimOrtalamaKiyaslamasi[birimAdi] = {
                kazaSayisi: birimKazaSayisi,
                fark: fark,
                yuzde: yuzde,
                durum: fark > 0 ? 'üzerinde' : (fark < 0 ? 'altında' : 'eşit'),
                renk: fark > 0 ? 'red' : (fark < 0 ? 'green' : 'gray')
            };
        });
        const groupedChartData = {
            birimler: Object.keys(birimKazaTurleri),
            kazaTurleri: sabitKazaTurleri,
            veriler: birimKazaTurleri, 
            birimOrtalamaKiyaslamasi: birimOrtalamaKiyaslamasi,
            genelOrtalama: genelOrtalama.toFixed(1)
        };
        let enRiskliBirim = {
            birim_adi: 'Veri Yok',
            kaza_sayisi: 0
        };
        
        Object.keys(birimToplamKazalar).forEach(birimAdi => {
            if (birimToplamKazalar[birimAdi] > enRiskliBirim.kaza_sayisi) {
                enRiskliBirim = {
                    birim_adi: birimAdi,
                    kaza_sayisi: birimToplamKazalar[birimAdi]
                };
            }
        });
        
        const istatistikler = {
            toplamKaza: kazalar.length,
            toplamBirim: birimler.length,
            enRiskliBirim: enRiskliBirim.birim_adi,
            enRiskliBirimKazaSayisi: enRiskliBirim.kaza_sayisi,
            ortalamaKazaPerBirim: genelOrtalama.toFixed(1)
        };     
        const kazaTuruDagilimi = {
            'Düşme': 0,
            'Ezilme': 0,
            'Kesilme': 0,
            'Yanık': 0,
            'Elektrik Çarpması': 0,
            'Malzeme Düşmesi': 0,
            'Sıkışma': 0,
            'Diğer': 0
        };
        kazalar.forEach(kaza => {
            const aciklama = (kaza.kaza_aciklamasi || '').toLowerCase();
            let kategoriBulundu = false;
            
            if (aciklama.includes('düşme') || aciklama.includes('düş')) {
                kazaTuruDagilimi['Düşme']++;
                kategoriBulundu = true;
            } else if (aciklama.includes('ezil')) {
                kazaTuruDagilimi['Ezilme']++;
                kategoriBulundu = true;
            } else if (aciklama.includes('kesil') || aciklama.includes('kesik') || aciklama.includes('kes')) {
                kazaTuruDagilimi['Kesilme']++;
                kategoriBulundu = true;
            } else if (aciklama.includes('yanık') || aciklama.includes('kaynak')) {
                kazaTuruDagilimi['Yanık']++;
                kategoriBulundu = true;
            } else if (aciklama.includes('elektrik') || aciklama.includes('çarp')) {
                kazaTuruDagilimi['Elektrik Çarpması']++;
                kategoriBulundu = true;
            } else if (aciklama.includes('malzeme') && aciklama.includes('düş')) {
                kazaTuruDagilimi['Malzeme Düşmesi']++;
                kategoriBulundu = true;
            } else if (aciklama.includes('sıkış')) {
                kazaTuruDagilimi['Sıkışma']++;
                kategoriBulundu = true;
            }
            if (!kategoriBulundu) {
                kazaTuruDagilimi['Diğer']++;
            }
        });
        const pastaGrafigiData = {
            turler: Object.keys(kazaTuruDagilimi),
            sayilar: Object.values(kazaTuruDagilimi)
        };
        const birimBazliKazalar = Object.values(birimKazaSayilari)
            .filter(b => b.kaza_sayisi > 0)
            .sort((a, b) => b.kaza_sayisi - a.kaza_sayisi)
            .slice(0, 8);        
        const kazaDetaylari = kazalar.map(kaza => {
            let saat = 12; 
            if (kaza.kaza_tarihi) {
                const tarih = new Date(kaza.kaza_tarihi);
                saat = tarih.getHours();
            }
            const aciklama = (kaza.kaza_aciklamasi || '').toLowerCase();
            let kazaTuru = 'Diğer';
            
            if (aciklama.includes('düşme') || aciklama.includes('düş')) {
                kazaTuru = 'Düşme';
            } else if (aciklama.includes('ezil')) {
                kazaTuru = 'Ezilme';
            } else if (aciklama.includes('kesil') || aciklama.includes('kesik') || aciklama.includes('kes')) {
                kazaTuru = 'Kesilme';
            } else if (aciklama.includes('yanık') || aciklama.includes('kaynak')) {
                kazaTuru = 'Yanık';
            } else if (aciklama.includes('elektrik') || aciklama.includes('çarp')) {
                kazaTuru = 'Elektrik Çarpması';
            } else if (aciklama.includes('malzeme') && aciklama.includes('düş')) {
                kazaTuru = 'Malzeme Düşmesi';
            } else if (aciklama.includes('kayma') || aciklama.includes('takıl')) {
                kazaTuru = 'Kayma/Takılma';
            } else if (aciklama.includes('sıkış')) {
                kazaTuru = 'Sıkışma';
            }
            
            return {
                birim_adi: kaza.birimler ? kaza.birimler.birim_adi : 'Bilinmeyen',
                saat: saat,
                kaza_turu: kazaTuru
            };
        }).filter(k => k.birim_adi !== 'Bilinmeyen'); 

        res.json({
            success: true,
            data: {
                topRiskliBirimler: topRiskliBirimler,
                groupedChartData: groupedChartData,
                istatistikler: istatistikler,
                kazaTuruPastaGrafigi: pastaGrafigiData,
                birimBazliKazalar: birimBazliKazalar,
                kazaDetaylari: kazaDetaylari
            }
        });

    } catch (error) {
        console.error('Stratejik Risk Analizi Hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Stratejik Risk Projeksiyonu (Simulation)
exports.getSimulation = async (req, res) => {
    try {
        const ekipmanlar = await getData('ekipmanlar');
        const personelEgitimleri = await getData('personel_egitimleri');
        const personeller = await getData('personel');
        const birimler = await getData('birimler');
        const { data: riskOnlemleri, error: onlemError } = await supabase
            .from('risk_onlemleri')
            .select('*');
        
        if (onlemError) {
            console.error('Risk önlemleri hatası:', onlemError);
        }

        const bugun = new Date();
        const altiAySonra = new Date(bugun);
        altiAySonra.setMonth(bugun.getMonth() + 6);
        const onikiAySonra = new Date(bugun);
        onikiAySonra.setMonth(bugun.getMonth() + 12);      
        const ekipmanRiskleri = [];
        let ekipmanRiskSkoru6Ay = 0;
        let ekipmanRiskSkoru12Ay = 0;

        ekipmanlar.forEach(ekipman => {
            const sonBakim = new Date(ekipman.son_bakim_tarihi);
            const sonrakiBakim = new Date(sonBakim);
            sonrakiBakim.setDate(sonrakiBakim.getDate() + ekipman.bakim_araligi_gun);
            if (ekipman.kritiklik_seviyesi === 'yüksek') {
                if (sonrakiBakim >= altiAySonra && sonrakiBakim <= onikiAySonra) {
                    const birim = birimler.find(b => b.id === ekipman.birim_id);
                    const kalanGun = Math.floor((sonrakiBakim - bugun) / (1000 * 60 * 60 * 24));
                    const ay = Math.floor(kalanGun / 30);
                    
                    ekipmanRiskleri.push({
                        ekipmanAdi: ekipman.ekipman_adi,
                        seriNo: ekipman.seri_no || 'N/A',
                        birimAdi: birim ? birim.birim_adi : 'Bilinmiyor',
                        sonrakiBakimTarihi: sonrakiBakim.toISOString().split('T')[0],
                        kalanGun: kalanGun,
                        kalanAy: ay,
                        kritiklik: ekipman.kritiklik_seviyesi,
                        riskPuani: 15 
                    });
                    if (kalanGun <= 180) { 
                        ekipmanRiskSkoru6Ay += 15;
                    }
                    if (kalanGun <= 365) {
                        ekipmanRiskSkoru12Ay += 15;
                    }
                }
            }
        });     
        const personelRiskleri = [];
        let personelRiskSkoru6Ay = 0;
        let personelRiskSkoru12Ay = 0;

        personelEgitimleri.forEach(egitim => {
            const gecerlilikValue = egitim.gecerlilik_sonu || egitim['geçerlilik_sonu'];
            if (!gecerlilikValue) return;
            const gecerlilikSonu = new Date(gecerlilikValue);
            if (gecerlilikSonu >= altiAySonra && gecerlilikSonu <= onikiAySonra) {
                const personel = personeller.find(p => p.id === egitim.personel_id);
                const birim = birimler.find(b => b.id === personel?.birim_id);
                const kalanGun = Math.floor((gecerlilikSonu - bugun) / (1000 * 60 * 60 * 24));
                const ay = Math.floor(kalanGun / 30);
                
                personelRiskleri.push({
                    personelAdi: personel ? personel.ad_soyad : 'Bilinmiyor',
                    egitimAdi: egitim.egitim_adi,
                    birimAdi: birim ? birim.birim_adi : 'Bilinmiyor',
                    gecerlilikSonu: gecerlilikSonu.toISOString().split('T')[0],
                    kalanGun: kalanGun,
                    kalanAy: ay,
                    riskPuani: 10 
                });
                if (kalanGun <= 180) { 
                    personelRiskSkoru6Ay += 10;
                }
                if (kalanGun <= 365) { 
                    personelRiskSkoru12Ay += 10;
                }
            }
        });
        const toplamRisk6Ay = ekipmanRiskSkoru6Ay + personelRiskSkoru6Ay;
        const toplamRisk12Ay = ekipmanRiskSkoru12Ay + personelRiskSkoru12Ay;       
        let stratejikOneri = {
            durum: 'İyi',
            renk: 'green',
            mesaj: '✅ Risk seviyeleri kabul edilebilir aralıkta. Rutin kontroller yeterlidir.',
            onlemler: []
        };
        if (toplamRisk12Ay > 50) {
            stratejikOneri.durum = 'Kritik';
            stratejikOneri.renk = 'red';
            stratejikOneri.mesaj = '🚨 YÜKSEK RİSK TESPİT EDİLDİ! Acil önlem alınması gerekiyor.';
            if (ekipmanRiskSkoru12Ay > 30 && riskOnlemleri) {
                const ekipmanOnlemleri = riskOnlemleri.filter(o => o.kategori === 'Ekipman Bakımı');
                if (ekipmanOnlemleri.length > 0) {
                    stratejikOneri.onlemler.push(ekipmanOnlemleri[0].oneri_metni);
                }
            }
            if (personelRiskSkoru12Ay > 20 && riskOnlemleri) {
                const egitimOnlemleri = riskOnlemleri.filter(o => o.kategori === 'Eğitim');
                if (egitimOnlemleri.length > 0) {
                    stratejikOneri.onlemler.push(egitimOnlemleri[0].oneri_metni);
                }
            }
        } else if (toplamRisk12Ay > 30) {
            stratejikOneri.durum = 'Orta';
            stratejikOneri.renk = 'orange';
            stratejikOneri.mesaj = '⚠️ DİKKAT: Orta seviye risk tespit edildi. Önleyici tedbirler alınmalı.';
            
            if (ekipmanRiskSkoru12Ay > 15 && riskOnlemleri) {
                const ekipmanOnlemleri = riskOnlemleri.filter(o => o.kategori === 'Ekipman Bakımı' && o.oncelik_seviyesi === 'Orta');
                if (ekipmanOnlemleri.length > 0) {
                    stratejikOneri.onlemler.push(ekipmanOnlemleri[0].oneri_metni);
                }
            }
            
            if (personelRiskSkoru12Ay > 10 && riskOnlemleri) {
                const egitimOnlemleri = riskOnlemleri.filter(o => o.kategori === 'Eğitim' && o.oncelik_seviyesi === 'Orta');
                if (egitimOnlemleri.length > 0) {
                    stratejikOneri.onlemler.push(egitimOnlemleri[0].oneri_metni);
                }
            }
        }
        if (stratejikOneri.onlemler.length === 0 && toplamRisk12Ay > 30) {
            stratejikOneri.onlemler.push('Ekipman bakım planlaması yapın ve personel eğitimlerini güncelleyin.');
        }
        const sonuc = {
            projeksiyonTarihleri: {
                bugun: bugun.toISOString().split('T')[0],
                altiAy: altiAySonra.toISOString().split('T')[0],
                onikiAy: onikiAySonra.toISOString().split('T')[0]
            },
            riskSkorlari: {
                altiAy: {
                    ekipmanRiski: ekipmanRiskSkoru6Ay,
                    personelRiski: personelRiskSkoru6Ay,
                    toplamRisk: toplamRisk6Ay
                },
                onikiAy: {
                    ekipmanRiski: ekipmanRiskSkoru12Ay,
                    personelRiski: personelRiskSkoru12Ay,
                    toplamRisk: toplamRisk12Ay
                }
            },
            detaylar: {
                ekipmanRiskleri: ekipmanRiskleri,
                personelRiskleri: personelRiskleri
            },
            stratejikOneri: stratejikOneri,
            istatistikler: {
                kritikEkipmanSayisi: ekipmanRiskleri.length,
                egitimiBitecekPersonel: personelRiskleri.length,
                toplamRiskFaktoru: ekipmanRiskleri.length + personelRiskleri.length
            }
        };

        res.json({ success: true, data: sonuc });

    } catch (error) {
        console.error('Stratejik Risk Projeksiyonu Hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;

