[README.md](https://github.com/user-attachments/files/24644925/README.md)
# 🛡️ İSG Karar Destek Sistemi (KDS)

## 📋 Proje Hakkında

İSG Karar Destek Sistemi, iş sağlığı ve güvenliği yönetimini dijitalleştiren bir karar destek platformudur. Sistem, iş kazalarını önlemek, risk analizi yapmak, ekipman bakımlarını takip etmek ve personel eğitimlerini optimize etmek için gelişmiş analitik ve simülasyon araçları sunar.

###  Temel Amaçlar

- **Proaktif Risk Yönetimi**: İş kazalarını gerçekleşmeden önce tahmin etme ve önleme
- **Veri Odaklı Kararlar**: Gerçek zamanlı verilerle stratejik kararlar alma
- **Maliyet Optimizasyonu**: Eğitim ve bakım yatırımlarının ROI analizini yapma
- **Yasal Uyumluluk**: İSG mevzuatına uygunluğu sürekli izleme
- **Simülasyon ve Tahmin**: "Ya olursa?" senaryolarıyla geleceği planlama

##  Teknolojiler

### Backend
- **Node.js** (v16+) - Sunucu tarafı JavaScript runtime
- **Express.js** (v4.22.1) - Web framework
- **Supabase** (@supabase/supabase-js v2.88.0) - PostgreSQL veritabanı ve backend servisleri
- **CORS** (v2.8.5) - Cross-Origin Resource Sharing

### Frontend
- **Vanilla JavaScript** - Modern ES6+ özellikleri
- **Chart.js** (v4.4.0) - Veri görselleştirme ve grafikler
- **HTML5 & CSS3** - Modern, responsive UI

### Geliştirme Araçları
- **Nodemon** (v3.0.2) - Otomatik sunucu yeniden başlatma

### Mimari Yapı
- **MVC (Model-View-Controller)** - Temiz kod mimarisi
- **RESTful API** - Standart HTTP metodları ile API tasarımı
- **Modüler Yapı** - Controller bazlı organizasyon

##  Proje Yapısı

```
KDS/
├── controllers/           # İş mantığı katmanı
│   ├── baseController.js          # Temel CRUD işlemleri
│   ├── kdsController.js           # Ana KDS analiz fonksiyonları
│   ├── complianceController.js    # Yasal uyumluluk skorlama
│   ├── riskController.js          # Risk analizi ve simülasyon
│   ├── equipmentController.js     # Ekipman yönetimi
│   ├── trainingController.js      # Eğitim optimizasyonu
│   ├── advancedController.js      # Gelişmiş özellikler
│   └── simulationController.js    # Simülasyon motoru
├── models/
│   └── database.js        # Supabase bağlantı katmanı
├── routes/                # API endpoint tanımları
│   ├── baseRoutes.js      # Temel veri endpoint'leri
│   ├── kdsRoutes.js       # KDS analiz endpoint'leri
│   └── simulationRoutes.js # Simülasyon endpoint'leri
├── public/                # Frontend dosyaları
│   ├── index.html         # Ana dashboard
│   ├── login.html         # Giriş sayfası
│   ├── stratejik-risk.html # Risk analiz sayfası
│   ├── app.js             # Frontend JavaScript
│   └── styles.css         # Stil dosyaları
├── server.js              # Express sunucu yapılandırması
├── package.json           # Proje bağımlılıkları
└── SUPABASE_TABLOLAR.sql  # Veritabanı şeması

```

##  Veritabanı Yapısı

Sistem Supabase PostgreSQL veritabanı kullanır ve aşağıdaki tablolardan oluşur:

### Ana Tablolar

1. **birimler** - Şantiye birimleri ve tehlike katsayıları
2. **personel** - Çalışan bilgileri ve birim atamaları
3. **personel_egitimleri** - Eğitim kayıtları ve geçerlilik tarihleri
4. **is_kazalari** - İş kazası kayıtları
5. **santiye_is_plani** - İş yoğunluğu planlaması
6. **ekipmanlar** - Ekipman envanteri ve bakım kayıtları
7. **ramak_kala_kayitlari** - Ramak kala olay raporları
8. **risk_onlemleri** - Risk önlem önerileri

##  Kurulum

### Gereksinimler

- Node.js v16.0.0 veya üzeri
- npm veya yarn paket yöneticisi
- Supabase hesabı (ücretsiz tier yeterli)

### Adım 1: Projeyi İndirin

```bash
git clone <repository-url>
cd KDS
```

### Adım 2: Bağımlılıkları Yükleyin

```bash
npm install
```

### Adım 3: Veritabanını Kurun

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. SQL Editor'de `SUPABASE_TABLOLAR.sql` dosyasını çalıştırın
4. Tablo yapısı ve örnek veriler otomatik oluşturulacaktır

### Adım 4: Veritabanı Bağlantısını Yapılandırın

`models/database.js` dosyasında Supabase bağlantı bilgilerinizi güncelleyin:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

### Adım 5: Sunucuyu Başlatın

**Geliştirme Modu** (otomatik yeniden başlatma):
```bash
npm run dev
```

**Production Modu**:
```bash
npm start
```

Sunucu varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

##  API Dokümantasyonu

### Temel Veri Endpoint'leri

#### `GET /api/birimler`
Tüm şantiye birimlerini listeler.

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "birim_adi": "İnşaat Bölümü",
      "tehlike_katsayisi": 4,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `GET /api/personel`
Tüm personel kayıtlarını getirir.

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ad_soyad": "Ahmet Yılmaz",
      "birim_id": 1,
      "pozisyon": "Şantiye Şefi",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `GET /api/egitimler`
Personel eğitim kayıtlarını listeler.

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "personel_id": 1,
      "egitim_adi": "İş Güvenliği Temel Eğitimi",
      "gecerlilik_sonu": "2025-06-30",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `GET /api/kazalar`
İş kazası kayıtlarını getirir.

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "birim_id": 1,
      "kaza_tarihi": "2024-11-15",
      "aciklama": "Hafif yaralanma - İskele düşmesi",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `GET /api/is-plani`
Şantiye iş planı ve yoğunluk bilgilerini getirir.

#### `GET /api/ekipmanlar`
Ekipman envanteri ve bakım durumlarını listeler.

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "birim_id": 1,
      "ekipman_adi": "Vinç (Kule Vinç)",
      "seri_no": "VNC-2023-001",
      "son_bakim_tarihi": "2024-09-15",
      "bakim_araligi_gun": 90,
      "kritiklik_seviyesi": "yüksek",
      "durum": "Aktif"
    }
  ]
}
```

#### `GET /api/ramak-kala`
Ramak kala olay kayıtlarını getirir (birim adları ile birlikte).

---

### KDS Analiz Endpoint'leri

#### `GET /api/kds/stratejik-ozet`
Şantiyenin genel durumunu özetleyen kapsamlı dashboard verisi.

**Query Parametreleri:**
- `birimId` (opsiyonel): Belirli bir birimi filtreler
- `zamanAraligi` (opsiyonel): `3ay`, `6ay`, `1yil` (varsayılan: 3ay)

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "ustKartlar": {
      "kritikRiskliBirimSayisi": 2,
      "suresiDolanEgitimler": 3,
      "bakimBekleyenEkipman": 1,
      "bakimTrend": -1,
      "bakimTrendYon": "down",
      "aktifYogunluk": 65.5
    },
    "riskHaritasi": [...],
    "sonOlaylar": [...],
    "aylikKazaTrendi": {...},
    "egitimDagilimi": {...},
    "genelDurum": "Dikkat",
    "birimRiskler": [...]
  }
}
```

#### `GET /api/kds/risk-projeksiyonu`
Gelecek 6-12 ay için risk skorları projeksiyonu.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "aylar": ["Tem 2025", "Ağu 2025", ...],
    "riskSkorlari": [45.2, 48.3, 52.1, ...]
  }
}
```

#### `GET /api/kds/birim-analizi`
Birim bazında detaylı risk ve eğitim analizi.

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "birim": "İnşaat Bölümü",
      "riskSkoru": 75.5,
      "durum": "Kritik",
      "egitimiBitecekKisi": 3,
      "planlananYogunluk": 75,
      "gecmisKazalar": 4,
      "oneri": "🚨 İnşaat Bölümü birimi için acil denetim!"
    }
  ],
  "detayliTablo": [...]
}
```

#### `GET /api/kds/compliance-score`
Yasal uyumluluk skoru ve kritik eksiklikler.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "toplamSkor": 72.5,
    "durum": "İyi",
    "renk": "yellow",
    "mesaj": "⚠️ DİKKAT: Şantiyeniz genel olarak uyumlu ancak bazı iyileştirmeler gerekiyor.",
    "kategoriPuanlari": {
      "egitimUyumlulugu": 85.0,
      "ekipmanDenetimi": 60.0,
      "kazaBildirimTakibi": 75.0,
      "ramakKalaAksiyonu": 70.0
    },
    "kritikEksikler": [...],
    "istatistikler": {...}
  }
}
```

#### `GET /api/kds/mevsimsel-analiz`
Mevsimsel kaza trendleri ve risk analizi.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "mevcutMevsim": "Kış",
    "mevcutAy": "Ocak 2025",
    "enRiskliMevsim": "Yaz",
    "birimMevsimDetay": [...],
    "heatmapData": [...],
    "gelecek12AyTahmini": [...],
    "uyarilar": [...],
    "istatistikler": {...}
  }
}
```

#### `GET /api/kds/sertifika-yonetimi`
Personel sertifikalarının geçerlilik durumu ve yenileme takvimi.

**Query Parametreleri:**
- `projeksiyonTarihi` (opsiyonel): ISO 8601 format tarih

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "hedefTarih": "2025-01-15",
    "sertifikaListesi": [...],
    "kritikDurumlar": [...],
    "aylikTrend": [...],
    "istatistikler": {
      "toplamSertifika": 25,
      "gecersiz": 3,
      "kritik": 5,
      "gecerli": 17,
      "uyumlulukOrani": 68.0,
      "toplamYenilemeMaliyeti": 120000
    }
  }
}
```

#### `GET /api/kds/egitim-optimizasyonu`
Birim bazında eğitim ihtiyaç analizi ve önceliklendirme.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "birimAnalizleri": [
      {
        "birimId": 1,
        "birimAdi": "İnşaat Bölümü",
        "tehlikeKatsayisi": 4,
        "toplamPersonel": 15,
        "egitimUyumlulukOrani": 65.5,
        "egitimEksikligi": 5,
        "kazaSayisi": 3,
        "aciliyetSkoru": 78.5,
        "kazaRiski": "Çok Yüksek",
        "riskRenk": "red",
        "eylemOnerisi": "🚨 ACİL: 5 personele derhal eğitim verin...",
        "toplamEgitimMaliyeti": 75000,
        "oncelikSirasi": 1
      }
    ],
    "istatistikler": {...}
  }
}
```

#### `GET /api/kds/ekipman-bakim-tahmini`
Ekipman sağlık skoru, bakım takvimi ve maliyet projeksiyonu.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "ekipmanAnalizleri": [
      {
        "id": 1,
        "ekipmanAdi": "Vinç (Kule Vinç)",
        "seriNo": "VNC-2023-001",
        "birimAdi": "İnşaat Bölümü",
        "saglikSkoru": 35.5,
        "durum": "Kritik",
        "durumRenk": "red",
        "oncelik": "Acil",
        "sonBakimTarihi": "2024-09-15",
        "sonrakiBakimTarihi": "2024-12-14",
        "kalanGun": -32,
        "kalanOmurYil": 8.5,
        "kalanOmurOrani": 56.7,
        "stratejikOneri": "🔧 ACİL BAKIM: Ekipman sağlık skoru kritik seviyede...",
        "ekonomikDurum": "Acil Bakım"
      }
    ],
    "bakimTakvimi": [...],
    "istatistikler": {...},
    "ortalamaSaglik": 65.2,
    "genelDurum": "Orta",
    "maliyetTahmini": {
      "gelecek12AyBakimSayisi": 24,
      "toplamTahminiBakimMaliyeti": 120000,
      "acilBakimSayisi": 3,
      "acilBakimMaliyeti": 22500,
      "yenilemeSayisi": 1,
      "yenilemeMaliyeti": 500000,
      "toplamTahminiMaliyet": 642500,
      "aylikMaliyetDagilimi": [...]
    }
  }
}
```

#### `GET /api/kds/ekipman-risk-analizi`
Ekipman bazında kaza geçmişi ve risk değerlendirmesi.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "ekipmanAnalizleri": [...],
    "istatistikler": {
      "toplam_ekipman": 15,
      "kazaya_karisan_ekipman": 5,
      "acil_bakim_gereken": 2,
      "kritik_ekipman": 2,
      "yuksek_risk_ekipman": 3,
      "toplam_kaza": 12
    },
    "acilBakimListesi": [...],
    "yuksekRiskListesi": [...]
  }
}
```

#### `GET /api/kds/stratejik-risk-analizi`
Birim ve kaza türü bazında stratejik risk haritası.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "topRiskliBirimler": [
      {
        "birim_id": 1,
        "birim_adi": "İnşaat Bölümü",
        "kaza_sayisi": 4,
        "tehlike_katsayisi": 4,
        "risk_durumu": "Kritik",
        "risk_renk": "red"
      }
    ],
    "groupedChartData": {...},
    "istatistikler": {...},
    "kazaTuruPastaGrafigi": {...},
    "birimBazliKazalar": [...],
    "kazaDetaylari": [...]
  }
}
```

#### `GET /api/simulation`
6-12 aylık risk projeksiyonu ve stratejik öneri.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "projeksiyonTarihleri": {...},
    "riskSkorlari": {
      "altiAy": {...},
      "onikiAy": {...}
    },
    "detaylar": {
      "ekipmanRiskleri": [...],
      "personelRiskleri": [...]
    },
    "stratejikOneri": {
      "durum": "Kritik",
      "renk": "red",
      "mesaj": "🚨 YÜKSEK RİSK TESPİT EDİLDİ!...",
      "onlemler": [...]
    },
    "istatistikler": {...}
  }
}
```

---

### Simülasyon Endpoint'leri

#### `POST /api/kds/what-if`
"Ya olursa?" senaryoları ile eğitim yatırımı simülasyonu.

**İstek Gövdesi:**
```json
{
  "birimId": 1,
  "ekEgitimSaati": 40
}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "birimAdi": "İnşaat Bölümü",
    "mevcutRiskSkoru": 85.5,
    "yeniRiskSkoru": 65.5,
    "riskAzalmasi": 20.0,
    "iyilestirmeOrani": "%23.4",
    "tasarruf": "300,000 TL",
    "roi": "5.0 Kat",
    "oneri": "✅ KARAR ONAYLANDI: Bu eğitim yatırımı birimi güvenli bölgeye taşıyor."
  }
}
```

#### `POST /api/kds/butce-maliyet-analizi`
Kaza senaryolarına göre önlem bütçesi ROI analizi.

**İstek Gövdesi:**
```json
{
  "senaryoTipi": "yuksekten-dusme",
  "onlemButcesi": 150000
}
```

**Senaryo Tipleri:**
- `yuksekten-dusme` - Yüksekten Düşme
- `elektrik-kazasi` - Elektrik Kazası
- `ekipman-arizasi` - Ekipman Arızası
- `yangin` - Yangın
- `malzeme-sizma` - Malzeme Sızma/Göçük

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "senaryo": {
      "tip": "yuksekten-dusme",
      "ad": "Yüksekten Düşme",
      "icon": "🪂"
    },
    "maliyetler": {
      "toplamKazaMaliyeti": 4285000,
      "onlemButcesi": 150000,
      "kalanMaliyet": 642750,
      "tasarruf": 3492250,
      "netFayda": 3492250,
      "maliyetKirilimi": {...}
    },
    "analiz": {
      "riskAzalmaOrani": 85.0,
      "kalanRiskOrani": 15.0,
      "roi": 2328.2,
      "korumaOrani": 85.0
    },
    "karar": {
      "durum": "Çok Avantajlı",
      "renk": "green",
      "oncelik": "Yüksek",
      "mesaj": "✅ KARAR ÖNERİSİ: Bu yatırımı yapmak..."
    },
    "yasalRisk": {...}
  }
}
```

#### `POST /api/kds/vardiya-analizi`
Gelecek ay için personel yetkinlik ve eğitim ihtiyacı analizi.

**İstek Gövdesi:**
```json
{
  "gelecekAy": 2
}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "gelecekTarih": "2025-03-15",
    "personelDurumlari": [...],
    "istatistikler": {
      "toplamPersonel": 50,
      "uygunPersonel": 35,
      "sertifikaDolacakPersonel": 10,
      "egitimGereken": 5,
      "yetkinlikOrani": 70.0
    },
    "maliyet": {
      "toplamEgitimMaliyeti": 75000
    }
  }
}
```

#### `POST /api/kds/vardiya-egitim-planla`
Belirli bir personel için eğitim planlama.

**İstek Gövdesi:**
```json
{
  "personelId": 5,
  "egitimMaliyeti": 15000,
  "birimId": 1
}
```

#### `POST /api/kds/vardiya-personel-degistir`
Vardiya personel sayısı değişikliğinin risk ve maliyet etkisi.

**İstek Gövdesi:**
```json
{
  "birimId": 1,
  "yeniPersonelSayisi": 12,
  "vardiyaSaati": 8
}
```

#### `POST /api/kds/egitim-yatirim-simulasyonu`
Eğitim yatırımının 6 aylık risk azaltma projeksiyonu.

**İstek Gövdesi:**
```json
{
  "birimId": 1,
  "egitimYatirimi": 100000
}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "birimAdi": "İnşaat Bölümü",
    "egitimYatirimi": 100000,
    "baslangicRiski": 80.0,
    "yatirimSonrasiRisk": 26.7,
    "toplamRiskAzalmasi": 53.3,
    "riskTrendi": [
      {"ay": "Başlangıç", "riskSkoru": 80.0},
      {"ay": "1. Ay", "riskSkoru": 71.1},
      ...
    ],
    "olasiKazaMaliyeti": 4000000,
    "yatirimSonrasiKazaMaliyeti": 1335000,
    "tasarruf": 2665000,
    "roi": 2565.0
  }
}
```

#### `POST /api/kds/egitim-toplu-planla`
Toplu eğitim planlama ve bütçe etkisi.

**İstek Gövdesi:**
```json
{
  "birimId": 1,
  "egitimMaliyeti": 50000,
  "personelSayisi": 10
}
```

---

##  Özellikler

###  Dashboard ve Görselleştirme
- **Stratejik Özet Dashboard**: Gerçek zamanlı KPI'lar ve metrikler
- **Interaktif Grafikler**: Chart.js ile dinamik veri görselleştirme
- **Risk Haritası**: Birim bazında renkli risk göstergeleri
- **Zaman Serisi Analizi**: Aylık kaza ve ramak kala trendleri

###  Yapay Zeka ve Analitik
- **Tahmine Dayalı Analiz**: 6-12 aylık risk projeksiyonları
- **Mevsimsel Trend Analizi**: Mevsime göre kaza patern tespiti
- **Ekipman Ömür Tahmini**: Makine öğrenmesi ile bakım tahmini
- **Sertifika Yönetimi**: Otomatik geçerlilik takibi ve uyarılar

###  Finansal Analiz
- **ROI Hesaplama**: Eğitim ve bakım yatırımlarının geri dönüşü
- **Maliyet-Fayda Analizi**: Kaza senaryolarına göre önlem maliyeti
- **Bütçe Optimizasyonu**: Kaynakların etkin dağılımı
- **Tasarruf Projeksiyonu**: Önleyici tedbirlerin finansal etkisi

###  Simülasyon ve Senaryo Analizi
- **What-If Simülasyonu**: Eğitim yatırımı etki analizi
- **Vardiya Planlama**: Personel ve risk optimizasyonu
- **Kaza Senaryoları**: 5 farklı kaza tipi için maliyet analizi
- **Önlem Etkinliği**: Risk azaltma oranı hesaplama

###  Yasal Uyumluluk
- **Compliance Skoru**: 4 kategori bazında uyumluluk puanı
- **Kritik Eksikler**: Önceliklendirilmiş aksiyon listesi
- **Yasal Ceza Tahmini**: Tehlike katsayısına göre ceza projeksiyonu
- **Denetim Hazırlığı**: İSG mevzuatı kontrol listesi

###  Karar Destek
- **Akıllı Öneriler**: Veri odaklı stratejik tavsiyeler
- **Önceliklendirme**: Aciliyet skoruna göre sıralama
- **Risk Matrisi**: Çok boyutlu risk değerlendirmesi
- **Eylem Planları**: Uygulanabilir adım adım kılavuzlar

##  Güvenlik

- **CORS Koruması**: Cross-origin istekler için güvenlik
- **Supabase RLS**: Row Level Security ile veri izolasyonu
- **Input Validasyonu**: SQL injection koruması
- **Error Handling**: Güvenli hata mesajları

##  Performans

- **Veritabanı İndeksleri**: Optimize edilmiş sorgu performansı
- **Lazy Loading**: İhtiyaç anında veri yükleme
- **Caching**: Supabase edge caching
- **Modüler Yapı**: Hızlı kod yükleme

##  Test ve Geliştirme

### Development Server
```bash
npm run dev
```
Nodemon ile otomatik yeniden başlatma aktif olur.

### Production Build
```bash
npm start
```

### API Test
Postman veya curl ile endpoint'leri test edebilirsiniz:

```bash
# Birimler listesi
curl http://localhost:3000/api/birimler

# Stratejik özet
curl http://localhost:3000/api/kds/stratejik-ozet?birimId=1&zamanAraligi=3ay

# What-If simülasyonu
curl -X POST http://localhost:3000/api/kds/what-if \
  -H "Content-Type: application/json" \
  -d '{"birimId": 1, "ekEgitimSaati": 40}'
```

##  Lisans

MIT License - Detaylar için `LICENSE` dosyasına bakınız.

##  Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

##  İletişim

Proje Sahibi: İSG Ekibi

---

##  Gelecek Özellikler (Roadmap)

- [ ] Mobil uygulama (React Native)
- [ ] Gerçek zamanlı bildirimler (WebSocket)
- [ ] PDF rapor oluşturma
- [ ] Çoklu dil desteği (İngilizce, Almanca)
- [ ] Makine öğrenmesi ile kaza tahmini
- [ ] IoT sensör entegrasyonu
- [ ] Blockchain bazlı sertifika doğrulama
- [ ] Augmented Reality (AR) güvenlik eğitimleri

##  Ek Kaynaklar

- [Supabase Dokümantasyonu](https://supabase.com/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Chart.js Dokümantasyonu](https://www.chartjs.org/docs/latest/)
- [İSG Mevzuatı](https://www.mevzuat.gov.tr)

---

**⚠️ Not**: Bu sistem gerçek iş sağlığı ve güvenliği uygulamaları için bir karar destek aracıdır. Yasal sorumluluklar ve nihai kararlar yetkili İSG uzmanları tarafından alınmalıdır.

**✅ Sistem Durumu**: Aktif ve Kullanıma Hazır

**📅 Son Güncelleme**: Aralık 2025

**🎯 Versiyon**: 1.0.0

