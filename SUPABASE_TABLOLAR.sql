-- 1. BİRİMLER TABLOSU
CREATE TABLE IF NOT EXISTS birimler (
    id SERIAL PRIMARY KEY,
    birim_adi VARCHAR(100) NOT NULL,
    tehlike_katsayisi INTEGER DEFAULT 1 CHECK (tehlike_katsayisi BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. PERSONEL TABLOSU
CREATE TABLE IF NOT EXISTS personel (
    id SERIAL PRIMARY KEY,
    ad_soyad VARCHAR(100) NOT NULL,
    birim_id INTEGER REFERENCES birimler(id) ON DELETE CASCADE,
    pozisyon VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. PERSONEL EĞİTİMLERİ TABLOSU
CREATE TABLE IF NOT EXISTS personel_egitimleri (
    id SERIAL PRIMARY KEY,
    personel_id INTEGER REFERENCES personel(id) ON DELETE CASCADE,
    egitim_adi VARCHAR(200) NOT NULL,
    gecerlilik_sonu DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. İŞ KAZALARI TABLOSU
CREATE TABLE IF NOT EXISTS is_kazalari (
    id SERIAL PRIMARY KEY,
    birim_id INTEGER REFERENCES birimler(id) ON DELETE CASCADE,
    kaza_tarihi DATE NOT NULL,
    aciklama TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. SANTİYE İŞ PLANI TABLOSU
CREATE TABLE IF NOT EXISTS santiye_is_plani (
    id SERIAL PRIMARY KEY,
    birim_id INTEGER REFERENCES birimler(id) ON DELETE CASCADE,
    tahmini_is_yogunlugu INTEGER DEFAULT 50 CHECK (tahmini_is_yogunlugu BETWEEN 0 AND 100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. EKİPMANLAR TABLOSU 
CREATE TABLE IF NOT EXISTS ekipmanlar (
    id SERIAL PRIMARY KEY,
    birim_id INTEGER REFERENCES birimler(id) ON DELETE CASCADE,
    ekipman_adi VARCHAR(200) NOT NULL,
    seri_no VARCHAR(100),
    son_bakim_tarihi DATE NOT NULL,
    bakim_araligi_gun INTEGER DEFAULT 90,
    kritiklik_seviyesi VARCHAR(50) DEFAULT 'orta', -- 'düşük', 'orta', 'yüksek'
    durum VARCHAR(50) DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. RAMAK KALA KAYITLARI TABLOSU 
CREATE TABLE IF NOT EXISTS ramak_kala_kayitlari (
    id SERIAL PRIMARY KEY,
    birim_id INTEGER REFERENCES birimler(id) ON DELETE CASCADE,
    olay_tarihi DATE NOT NULL,
    olay_aciklamasi TEXT NOT NULL,
    tehlike_tipi VARCHAR(100), -- Tehlike türü kategorisi
    alinan_onlem TEXT,
    raporlayan VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. RİSK ÖNLEMLERİ TABLOSU 
CREATE TABLE IF NOT EXISTS risk_onlemleri (
    id SERIAL PRIMARY KEY,
    kategori VARCHAR(100) NOT NULL, -- 'Eğitim' veya 'Ekipman Bakımı'
    oneri_metni TEXT NOT NULL,
    oncelik_seviyesi VARCHAR(50) DEFAULT 'Orta', -- 'Düşük', 'Orta', 'Yüksek'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Birimler
INSERT INTO birimler (birim_adi, tehlike_katsayisi) VALUES
('İnşaat Bölümü', 4),
('Elektrik Bölümü', 3),
('Mekanik Bölümü', 3),
('İdari İşler', 1),
('Kaynak Atölyesi', 5),
('Depo ve Lojistik', 2);

-- Personel
INSERT INTO personel (ad_soyad, birim_id, pozisyon) VALUES
('Ahmet Yılmaz', 1, 'Şantiye Şefi'),
('Mehmet Demir', 1, 'İnşaat İşçisi'),
('Ayşe Kaya', 2, 'Elektrik Teknisyeni'),
('Fatma Şahin', 3, 'Mekanik Teknisyen'),
('Ali Çelik', 4, 'İdari Personel'),
('Zeynep Arslan', 5, 'Kaynak Ustası'),
('Hasan Yıldız', 1, 'Kalfa'),
('Elif Öztürk', 2, 'Elektrikçi'),
('Mustafa Aydın', 6, 'Depo Sorumlusu'),
('Selin Koç', 4, 'İK Uzmanı');

-- Eğitimler 
INSERT INTO personel_egitimleri (personel_id, egitim_adi, gecerlilik_sonu) VALUES
(1, 'İş Güvenliği Temel Eğitimi', '2025-06-30'),
(2, 'Yüksekte Çalışma Eğitimi', '2025-03-15'),
(3, 'Elektrik Güvenliği', '2025-08-20'),
(4, 'Makine Güvenliği', '2025-05-10'),
(5, 'İlk Yardım Eğitimi', '2025-12-31'),
(6, 'Kaynak Güvenliği', '2025-02-28'),
(7, 'İskele Kurma Eğitimi', '2025-04-15'),
(8, 'Elektrik Panosu Güvenliği', '2025-07-01'),
(9, 'Forklift Kullanımı', '2025-09-30'),
(10, 'Acil Durum Yönetimi', '2025-11-15');

-- İş Kazaları 
INSERT INTO is_kazalari (birim_id, kaza_tarihi, aciklama) VALUES
(1, '2024-11-15', 'Hafif yaralanma - İskele düşmesi'),
(2, '2024-10-20', 'Elektrik çarpması - Hafif şok'),
(1, '2024-09-05', 'Malzeme düşmesi - Ayak yaralanması'),
(5, '2024-08-12', 'Kaynak sıçraması - Göz tahriş'),
(3, '2024-07-30', 'El kesisi - Makine kazası'),
(1, '2024-12-01', 'Düşme - Merdiven kazası');

-- İş Planı 
INSERT INTO santiye_is_plani (birim_id, tahmini_is_yogunlugu) VALUES
(1, 85),  -- İnşaat çok yoğun
(2, 70),  -- Elektrik orta yoğun
(3, 60),  -- Mekanik orta
(4, 30),  -- İdari düşük
(5, 75),  -- Kaynak yoğun
(6, 50);  -- Depo normal

-- Ekipmanlar 
INSERT INTO ekipmanlar (birim_id, ekipman_adi, seri_no, son_bakim_tarihi, bakim_araligi_gun, kritiklik_seviyesi, durum) VALUES
(1, 'Vinç (Kule Vinç)', 'VNC-2023-001', '2024-09-15', 90, 'yüksek', 'Aktif'),
(1, 'İskele Sistemi', 'ISK-2023-045', '2024-11-20', 180, 'yüksek', 'Aktif'),
(2, 'Elektrik Panosu Ana', 'ELK-2023-012', '2024-10-01', 365, 'yüksek', 'Aktif'),
(3, 'Kompresör', 'KMP-2023-008', '2024-08-10', 90, 'orta', 'Aktif'),
(5, 'Kaynak Makinesi', 'KYN-2023-019', '2024-12-01', 90, 'yüksek', 'Aktif'),
(6, 'Forklift', 'FRK-2023-003', '2024-11-30', 60, 'orta', 'Aktif'),
(1, 'Beton Mikseri', 'BTN-2023-007', '2024-07-20', 90, 'orta', 'Aktif'),
(2, 'Test Cihazı', 'TST-2023-015', '2024-12-10', 180, 'düşük', 'Aktif');

-- Ramak Kala Kayıtları 
INSERT INTO ramak_kala_kayitlari (birim_id, olay_tarihi, olay_aciklamasi, tehlike_tipi, alinan_onlem, raporlayan) VALUES
(1, '2024-12-10', 'İskele demiri gevşek bulundu', 'Yüksekten Düşme', 'Tüm bağlantılar kontrol edildi ve sıkıldı', 'Ahmet Yılmaz'),
(2, '2024-12-05', 'Elektrik kablosu soyulmuş halde', 'Elektrik Çarpması', 'Kablo değiştirildi, ekip uyarıldı', 'Ayşe Kaya'),
(5, '2024-11-28', 'Kaynak tüpü düşme riski', 'Patlama/Yangın', 'Tüpler sabitlendi, uyarı levhası konuldu', 'Zeynep Arslan'),
(1, '2024-11-15', 'Beton dökümünde kalıp sarsıntısı', 'Yapısal Çöküş', 'Destek kolonlar eklendi', 'Ahmet Yılmaz'),
(3, '2024-11-02', 'Kompresör hortumu patladı', 'Basınçlı Hava', 'Tüm hortumlar değiştirildi', 'Fatma Şahin'),
(6, '2024-10-25', 'Forklift fren sesi', 'Araç Kazası', 'Fren sistemi bakımı yapıldı', 'Mustafa Aydın'),
(1, '2024-12-18', 'Vinç halatında aşınma tespit edildi', 'Yüksekten Düşme', 'Halat değiştirildi', 'Mehmet Demir'),
(2, '2024-12-12', 'Topraklama eksikliği bulundu', 'Elektrik Çarpması', 'Topraklama sistemi tamamlandı', 'Ali Veli'),
(3, '2024-12-08', 'Toz maskesi kullanılmıyor', 'Solunum Yolu', 'Personel eğitimi verildi, maske dağıtıldı', 'Fatma Şahin'),
(4, '2024-12-01', 'Boya deposunda havalandırma yetersiz', 'Zehirlenme', 'Havalandırma sistemi kuruldu', 'Hasan Çelik'),
(5, '2024-11-25', 'Kaynak dumanı yoğunluğu yüksek', 'Solunum Yolu', 'Aspirasyon sistemi eklendi', 'Zeynep Arslan'),
(6, '2024-11-20', 'Forklift arka görüş aynası kırık', 'Araç Kazası', 'Ayna değiştirildi', 'Mustafa Aydın'),
(2, '2024-11-18', 'Pano kapağı açık bırakılmış', 'Elektrik Çarpması', 'Kapak kilidi eklendi', 'Ayşe Kaya'),
(3, '2024-11-10', 'Gürültü seviyesi yüksek', 'İşitme Kaybı', 'Kulak koruyucu dağıtıldı', 'Fatma Şahin'),
(1, '2024-11-05', 'İskele korkuluğu eksik', 'Yüksekten Düşme', 'Korkuluk tamamlandı', 'Ahmet Yılmaz'),
(4, '2024-10-30', 'Kimyasal etiketleri okunamıyor', 'Zehirlenme', 'Tüm etiketler yenilendi', 'Hasan Çelik');

-- Geçmiş tarihli eğitimler
INSERT INTO personel_egitimleri (personel_id, egitim_adi, gecerlilik_sonu) VALUES
(1, 'Acil Durum Tatbikatı', '2024-11-30'),
(3, 'Elektrik Arıza Yönetimi', '2024-12-10'),
(5, 'Yangın Güvenliği', '2024-10-15');

-- Risk Önlemleri
INSERT INTO risk_onlemleri (kategori, oneri_metni, oncelik_seviyesi) VALUES
('Eğitim', 'Personel eğitimlerini acilen yenileyin. Süresi dolan sertifikalar iş güvenliği riskini artırır.', 'Yüksek'),
('Eğitim', 'Yeni güvenlik eğitim programı başlatın. Personel farkındalığını artırarak kazaları %40 azaltabilirsiniz.', 'Orta'),
('Eğitim', 'İleri seviye güvenlik eğitimi planlayın. Yetkinlik seviyesini yükseltin.', 'Orta'),
('Ekipman Bakımı', 'Kritik ekipmanların bakımını ertele meyin! Arıza riski çok yüksek, derhal bakım planlayın.', 'Yüksek'),
('Ekipman Bakımı', 'Önleyici bakım programı oluşturun. Ekipman ömrünü uzatır ve maliyetleri düşürür.', 'Orta'),
('Ekipman Bakımı', 'Ekipman yenileme bütçesi ayırın. Eski ekipmanlar güvenlik riski oluşturuyor.', 'Yüksek');

CREATE INDEX IF NOT EXISTS idx_personel_birim ON personel(birim_id);
CREATE INDEX IF NOT EXISTS idx_egitim_personel ON personel_egitimleri(personel_id);
CREATE INDEX IF NOT EXISTS idx_egitim_gecerlilik ON personel_egitimleri(gecerlilik_sonu);
CREATE INDEX IF NOT EXISTS idx_kaza_birim ON is_kazalari(birim_id);
CREATE INDEX IF NOT EXISTS idx_kaza_tarih ON is_kazalari(kaza_tarihi);
CREATE INDEX IF NOT EXISTS idx_plan_birim ON santiye_is_plani(birim_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_birim ON ekipmanlar(birim_id);
CREATE INDEX IF NOT EXISTS idx_ekipman_bakim ON ekipmanlar(son_bakim_tarihi);
CREATE INDEX IF NOT EXISTS idx_ramak_kala_birim ON ramak_kala_kayitlari(birim_id);
CREATE INDEX IF NOT EXISTS idx_ramak_kala_tarih ON ramak_kala_kayitlari(olay_tarihi);
CREATE INDEX IF NOT EXISTS idx_risk_onlemleri_kategori ON risk_onlemleri(kategori);

