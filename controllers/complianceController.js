const { getData } = require('../models/database');

// Compliance Score (Yasal Uyumluluk Skoru)
exports.getComplianceScore = async (req, res) => {
    try {
        const personel = await getData('personel');
        const egitimler = await getData('personel_egitimleri');
        const kazalar = await getData('is_kazalari');
        const ekipmanlar = await getData('ekipmanlar');
        const ramakKala = await getData('ramak_kala_kayitlari');
        const birimler = await getData('birimler');

        const bugun = new Date();
        const kritikEksikler = [];
        let egitimUyumPuani = 100;
        const egitimGecmisler = egitimler.filter(e => {
            const gecerlilikValue = e.gecerlilik_sonu || e['geçerlilik_sonu'];
            if (!gecerlilikValue) return false;
            const gecerlilikSonu = new Date(gecerlilikValue);
            return gecerlilikSonu < bugun;
        });

        const toplamEgitim = egitimler.length;
        const egitimGecmisSayisi = egitimGecmisler.length;

        if (toplamEgitim > 0) {
            const egitimGecmisOrani = (egitimGecmisSayisi / toplamEgitim) * 100;
            egitimUyumPuani = Math.max(0, 100 - egitimGecmisOrani);
            if (egitimGecmisler.length > 0) {
                const personelMap = {};
                personel.forEach(p => personelMap[p.id] = p.ad_soyad);

                egitimGecmisler.forEach(eg => {
                    const personelAdi = personelMap[eg.personel_id] || 'Bilinmeyen';
                    const gecerlilikValue = eg.gecerlilik_sonu || eg['geçerlilik_sonu'];
                    kritikEksikler.push({
                        kategori: 'Eğitim',
                        oncelik: 'Yüksek',
                        mesaj: `${personelAdi} - ${eg.egitim_adi} eğitimi süresi dolmuş`,
                        detay: `Geçerlilik: ${new Date(gecerlilikValue).toLocaleDateString('tr-TR')}`
                    });
                });
            }
        }
        let ekipmanUyumPuani = 100;
        
        const bakimGecmisEkipmanlar = ekipmanlar.filter(e => {
            const sonBakim = new Date(e.son_bakim_tarihi);
            const sonraBakimTarihi = new Date(sonBakim);
            sonraBakimTarihi.setDate(sonraBakimTarihi.getDate() + e.bakim_araligi_gun);
            return sonraBakimTarihi < bugun;
        });

        const toplamEkipman = ekipmanlar.length;
        const bakimGecmisSayisi = bakimGecmisEkipmanlar.length;

        if (toplamEkipman > 0) {
            if (bakimGecmisSayisi > 0) {
                ekipmanUyumPuani = Math.max(0, 100 - (bakimGecmisSayisi * 20));
                bakimGecmisEkipmanlar.forEach(ek => {
                    const sonBakim = new Date(ek.son_bakim_tarihi);
                    const sonraBakimTarihi = new Date(sonBakim);
                    sonraBakimTarihi.setDate(sonraBakimTarihi.getDate() + ek.bakim_araligi_gun);
                    
                    const gecenGun = Math.floor((bugun - sonraBakimTarihi) / (1000 * 60 * 60 * 24));
                    
                    kritikEksikler.push({
                        kategori: 'Ekipman',
                        oncelik: 'Kritik',
                        mesaj: `${ek.ekipman_adi} - Bakımı ${gecenGun} gün gecikmiş`,
                        detay: `Son Bakım: ${sonBakim.toLocaleDateString('tr-TR')}, Seri No: ${ek.seri_no}`
                    });
                });
            }
        }
        let kazaBildirimPuani = 100;
        const altiAyOnce = new Date();
        altiAyOnce.setMonth(bugun.getMonth() - 6);
        
        const sonKazalar = kazalar.filter(k => new Date(k.kaza_tarihi) >= altiAyOnce);
        const eksikBildirimler = sonKazalar.filter(k => !k.aciklama || k.aciklama.length < 10);
        
        if (sonKazalar.length > 0) {
            const eksikOrani = (eksikBildirimler.length / sonKazalar.length) * 100;
            kazaBildirimPuani = Math.max(0, 100 - eksikOrani);
            if (sonKazalar.length > 3) {
                kazaBildirimPuani = Math.max(0, kazaBildirimPuani - (sonKazalar.length - 3) * 10);
            }

            if (eksikBildirimler.length > 0) {
                kritikEksikler.push({
                    kategori: 'Kaza Bildirimi',
                    oncelik: 'Orta',
                    mesaj: `${eksikBildirimler.length} adet kaza kaydında detay eksik`,
                    detay: `Son 6 ayda toplam ${sonKazalar.length} kaza, ${eksikBildirimler.length} eksik bildirim`
                });
            }

            if (sonKazalar.length > 3) {
                kritikEksikler.push({
                    kategori: 'Kaza Bildirimi',
                    oncelik: 'Yüksek',
                    mesaj: `Son 6 ayda ${sonKazalar.length} kaza - Risk yüksek`,
                    detay: 'Önleyici tedbirlerin gözden geçirilmesi önerilir'
                });
            }
        }
        let ramakKalaPuani = 100;
        const ucAyOnce = new Date();
        ucAyOnce.setMonth(bugun.getMonth() - 3);
        const sonRamakKala = ramakKala.filter(r => new Date(r.olay_tarihi) >= ucAyOnce);
        const onlemAlınmamis = sonRamakKala.filter(r => !r.alinan_onlem || r.alinan_onlem.length < 5);
        
        if (sonRamakKala.length > 0) {
            const aylikOrtalama = sonRamakKala.length / 3;
            
            if (aylikOrtalama > 2) {
                ramakKalaPuani = Math.max(0, 100 - ((aylikOrtalama - 2) * 15));
            }

            if (onlemAlınmamis.length > 0) {
                ramakKalaPuani = Math.max(0, ramakKalaPuani - (onlemAlınmamis.length * 10));
                
                kritikEksikler.push({
                    kategori: 'Ramak Kala',
                    oncelik: 'Orta',
                    mesaj: `${onlemAlınmamis.length} ramak kala olayında önlem alınmamış`,
                    detay: `Son 3 ayda toplam ${sonRamakKala.length} ramak kala olayı`
                });
            }

            if (aylikOrtalama > 2) {
                kritikEksikler.push({
                    kategori: 'Ramak Kala',
                    oncelik: 'Yüksek',
                    mesaj: `Ramak kala olay sıklığı yüksek (Aylık ort: ${aylikOrtalama.toFixed(1)})`,
                    detay: 'İSG önlemlerinin artırılması gerekiyor'
                });
            }
        }
        const toplamSkor = (
            (egitimUyumPuani * 0.40) +    
            (ekipmanUyumPuani * 0.30) +    
            (kazaBildirimPuani * 0.20) +   
            (ramakKalaPuani * 0.10)        
        );
        let durum = '';
        let renk = '';
        let mesaj = '';

        if (toplamSkor >= 90) {
            durum = 'Mükemmel';
            renk = 'green';
            mesaj = '✅ TEBRİKLER: Şantiyeniz yasal uyumluluk standartlarını karşılıyor. Mevcut uygulamaları sürdürün.';
        } else if (toplamSkor >= 70) {
            durum = 'İyi';
            renk = 'yellow';
            mesaj = '⚠️ DİKKAT: Şantiyeniz genel olarak uyumlu ancak bazı iyileştirmeler gerekiyor. Eksikleri giderin.';
        } else {
            durum = 'Kritik';
            renk = 'red';
            mesaj = '🚨 ACİL: Şantiyeniz yasal denetimlerden geçemeyebilir! Aşağıdaki kritik eksiklikleri derhal giderin.';
        }
        kritikEksikler.sort((a, b) => {
            const oncelikSirasi = { 'Kritik': 1, 'Yüksek': 2, 'Orta': 3 };
            return oncelikSirasi[a.oncelik] - oncelikSirasi[b.oncelik];
        });
        const sonuc = {
            toplamSkor: Number(toplamSkor.toFixed(2)),
            durum: durum,
            renk: renk,
            mesaj: mesaj,
            kategoriPuanlari: {
                egitimUyumlulugu: Number(egitimUyumPuani.toFixed(2)),
                ekipmanDenetimi: Number(ekipmanUyumPuani.toFixed(2)),
                kazaBildirimTakibi: Number(kazaBildirimPuani.toFixed(2)),
                ramakKalaAksiyonu: Number(ramakKalaPuani.toFixed(2))
            },
            kritikEksikler: kritikEksikler.slice(0, 10),
            istatistikler: {
                toplamPersonel: personel.length,
                egitimGecmisPersonel: egitimGecmisSayisi,
                bakimGecmisEkipman: bakimGecmisSayisi,
                sonAltiAyKaza: sonKazalar.length,
                sonUcAyRamakKala: sonRamakKala.length
            }
        };

        res.json({ success: true, data: sonuc });

    } catch (error) {
        console.error('Compliance Score Hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;

