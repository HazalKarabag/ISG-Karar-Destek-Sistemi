// İSG KARAR DESTEK SİSTEMİ - FRONTEND
const API_BASE_URL = 'http://localhost:3000/api';
// Global değişkenler
let riskChart = null;
let complianceGaugeChart = null;
let heatmapChart = null;
let forecastChart = null;
let riskRadarChart = null;
let birimRiskRadarChart = null;
let aylikTrendChart = null;
let egitimDoughnutChart = null;
let budgetComparisonChart = null;
let yetkinlikChart = null;
let birimlerData = [];
// GLOBAL STATE YÖNETİMİ
const AppState = {
    budget: {
        onlemButcesi: 100000,
        senaryoTipi: 'yuksekten-dusme',
        ekEgitimMaliyeti: 0,
        ekIscilikMaliyeti: 0,
        riskAzalmasi: 0
    },
    vardiya: {
        seciliAy: 1,
        seciliBirim: null,
        personelSayisi: 5,
        vardiyaSaati: 8,
        egitimPlanlananlar: []
    },
    updateBudget: function(updates) {
        Object.assign(this.budget, updates);
        this.notifyListeners('budget', this.budget);
    },
    updateVardiya: function(updates) {
        Object.assign(this.vardiya, updates);
        this.notifyListeners('vardiya', this.vardiya);
    },
    listeners: { budget: [], vardiya: [] },
    subscribe: function(event, callback) {
        if (this.listeners[event]) this.listeners[event].push(callback);
    },
    notifyListeners: function(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
};
// SAYFA YÜKLENDİĞİNDE
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 İSG KDS Frontend yüklendi');
    setupNavigation();
    setupSlider();
    await yenile(); 
    await loadEkipmanRiskAnalizi(); 
});
// NAVİGASYON SİSTEMİ
function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            menuItems.forEach(m => m.classList.remove('active'));
            item.classList.add('active');
            const sectionId = item.getAttribute('data-section');
            console.log('📂 Geçiş yapılan bölüm:', sectionId);
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(s => s.classList.remove('active'));
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            const titleSpan = item.querySelector('span:last-child');
            if (titleSpan) {
                document.getElementById('page-title').textContent = titleSpan.textContent;
            }
            await loadSectionData(sectionId);
        });
    });
}
function setupSlider() {
    const egitimSlider = document.getElementById('egitim-saati');
    const egitimValue = document.getElementById('egitim-value');
    if (egitimSlider && egitimValue) {
        egitimSlider.addEventListener('input', (e) => {
            egitimValue.textContent = e.target.value;
        });
    }
    const butceSlider = document.getElementById('onlem-butce-slider');
    const butceValue = document.getElementById('onlem-butce-value');
    if (butceSlider && butceValue) {
        butceSlider.addEventListener('input', (e) => {
            butceValue.textContent = parseInt(e.target.value).toLocaleString('tr-TR');
        });
    }
    const yatirimSlider = document.getElementById('egitim-yatirim-slider');
    const yatirimValue = document.getElementById('egitim-yatirim-value');
    if (yatirimSlider && yatirimValue) {
        yatirimSlider.addEventListener('input', (e) => {
            yatirimValue.textContent = parseInt(e.target.value).toLocaleString('tr-TR');
        });
    }
    const personelSlider = document.getElementById('personel-sayisi-slider');
    const personelValue = document.getElementById('personel-sayisi-value');
    if (personelSlider && personelValue) {
        personelSlider.addEventListener('input', (e) => {
            personelValue.textContent = e.target.value;
        });
    }
    const vardiyaSlider = document.getElementById('vardiya-saati-slider');
    const vardiyaValue = document.getElementById('vardiya-saati-value');
    if (vardiyaSlider && vardiyaValue) {
        vardiyaSlider.addEventListener('input', (e) => {
            vardiyaValue.textContent = e.target.value;
        });
    }
    
    console.log('✅ Tüm slider\'lar aktif edildi');
}
// YENİLE FONKSİYONU
async function yenile() {
    console.log('🔄 Veriler yenileniyor...');
    const activeSection = document.querySelector('.content-section.active');
    const sectionId = activeSection.id;
    await loadSectionData(sectionId);
}
// ÇIKIŞ FONKSİYONU
function cikisYap() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        // SessionStorage'ı temizle
        sessionStorage.removeItem('isg_logged_in');
        sessionStorage.removeItem('isg_user');
        sessionStorage.removeItem('isg_login_time');
        window.location.href = 'login.html';
    }
}
// BÖLÜM VERİSİ YÜKLEME
async function loadSectionData(sectionId) {
    try {
        switch(sectionId) {
            case 'stratejik-ozet':
                await loadStratejikOzet();
                break;
            case 'sertifika-yonetimi': 
                await loadSertifikaYonetimi();
                break;
            case 'yasal-uyumluluk':
                await loadYasalUyumluluk();
                break;
            case 'birim-analizi':
                await loadBirimAnalizi();
                break;
            // BÖLÜM 2: Tahminleme ve Stratejik Analiz (Zeka)
            case 'stratejik-risk-analizi':
                await loadStratejikRiskAnalizi();
                break;
            
            case 'mevsimsel-analiz':
                await loadMevsimselAnaliz();
                break;
            
            case 'risk-projeksiyonu':
                await loadRiskProjeksiyonu();
                break;
                
            case 'ekipman-bakim':
                await loadEkipmanBakimTahmini();
                await loadEkipmanRiskAnalizi(); 
                break;

            // BÖLÜM 3: Müdahale ve Karar Destek (Eylem)
            case 'what-if':
                await loadBirimlerForSimulation();
                break;
            case 'egitim-optimizasyonu':
                await loadEgitimOptimizasyonu();
                break;
            case 'vardiya-planlayici':
                await loadVardiyaAnalizi(1); 
                break;
            case 'butce-maliyet':
                break;
        }
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        alert('Veri yüklenirken hata oluştu. Lütfen backend sunucusunun çalıştığından emin olun.');
    }
}

// 1. STRATEJİK ÖZET 

async function loadStratejikOzet(birimId = 'tumu', zamanAraligi = '3ay') {
    try {
        console.log('🔄 Dashboard verileri çekiliyor...');
        await loadBirimlerForFilter();
        const response = await fetch(`${API_BASE_URL}/kds/stratejik-ozet?birimId=${birimId}&zamanAraligi=${zamanAraligi}`);
        const result = await response.json();
        if (result.success && result.data) {
            const data = result.data;
            const cards = {
                'cmd-kritik-birim': data.ustKartlar?.kritikRiskliBirimSayisi,
                'cmd-suresi-dolan': data.ustKartlar?.suresiDolanEgitimler,
                'cmd-bakim-bekleyen': data.ustKartlar?.bakimBekleyenEkipman,
                'cmd-aktif-yogunluk': `%${data.ustKartlar?.aktifYogunluk || 0}`
            };
            for (const [id, value] of Object.entries(cards)) {
                const element = document.getElementById(id);
                if (element) element.textContent = value !== undefined ? value : '--';
            }
            const bakimBekleyenSayisi = data.ustKartlar?.bakimBekleyenEkipman || 0;
            const bakimTrendYon = data.ustKartlar?.bakimTrendYon || 'stable';    
            console.log('🔧 Bakım Bekleyen Ekipman:', {
                sayi: bakimBekleyenSayisi,
                trend: bakimTrendYon,
                trendDegeri: data.ustKartlar?.bakimTrend
            });
            const allCards = document.querySelectorAll('.command-card');
            let bakimKarti = null;
            allCards.forEach(card => {
                const text = card.textContent;
                if (text && text.includes('Bakım Bekleyen Ekipman')) {
                    bakimKarti = card;
                }
            });
            
            if (bakimKarti) {
                const trendElement = bakimKarti.querySelector('.command-card-trend');
                if (trendElement) {
                    trendElement.classList.remove('up', 'down', 'stable');
                    if (bakimTrendYon === 'up') {
                        trendElement.classList.add('up');
                        trendElement.textContent = '▲';
                        trendElement.style.color = '#ef4444'; 
                        console.log('✅ Bakım trendi: Arttı (Kırmızı ▲)');
                    } else if (bakimTrendYon === 'down') {
                        trendElement.classList.add('down');
                        trendElement.textContent = '▼';
                        trendElement.style.color = '#10b981'; 
                        console.log('✅ Bakım trendi: Azaldı (Yeşil ▼)');
                    } else {
                        trendElement.classList.add('stable');
                        trendElement.textContent = '━';
                        trendElement.style.color = '#94a3b8'; 
                        console.log('✅ Bakım trendi: Sabit (Gri ━)');
                    }
                } else {
                    console.warn('⚠️ Bakım kartında trend elementi bulunamadı');
                }
                if (bakimBekleyenSayisi > 5) {
                    bakimKarti.classList.remove('dikkat');
                    bakimKarti.classList.add('kritik');
                    console.log('🔴 Bakım kartı kritik seviyeye alındı (>5)');
                } else {
                    bakimKarti.classList.remove('kritik');
                    bakimKarti.classList.add('dikkat');
                    console.log('🟠 Bakım kartı dikkat seviyesinde (<= 5)');
                }
            } else {
                console.error('❌ Bakım bekleyen ekipman kartı bulunamadı!');
            }
            const tbody = document.getElementById('son-olaylar-tbody');
            if (tbody) {
                tbody.innerHTML = ''; 
                if (data.sonOlaylar && data.sonOlaylar.length > 0) {
                    data.sonOlaylar.forEach(olay => {
                        const row = document.createElement('tr');
                        row.className = olay.renk || ''; 
                        row.innerHTML = `
                            <td>${new Date(olay.tarih).toLocaleDateString('tr-TR')}</td>
                            <td><strong>${olay.birim || 'Bilinmiyor'}</strong></td>
                            <td><span class="event-badge ${olay.olayTipi === 'İş Kazası' ? 'kaza' : 'ramak'}">${olay.olayTipi}</span></td>
                            <td><span class="event-siddet ${olay.siddet === 'Yüksek' ? 'yuksek' : 'orta'}">${olay.siddet}</span></td>
                        `;
                        tbody.appendChild(row);
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Son olay kaydı bulunamadı.</td></tr>';
                }
            }
            if (typeof createRiskRadarChart === 'function' && data.riskHaritasi) {
                createRiskRadarChart(data.riskHaritasi);
            }
            if (typeof createAylikTrendChart === 'function' && data.aylikKazaTrendi) {
                createAylikTrendChart(data.aylikKazaTrendi);
            }
            if (typeof createEgitimDoughnutChart === 'function' && data.egitimDagilimi) {
                createEgitimDoughnutChart(data.egitimDagilimi);
            }
            if (typeof updateGenelDurumBanner === 'function' && data.genelDurum) {
                updateGenelDurumBanner(data.genelDurum);
            }
            await loadSmartTriggers();
            console.log('✅ Dashboard başarıyla dolduruldu!');
        } else {
            console.error('❌ API yanıtı başarısız:', result);
            throw new Error(result.error || 'Veri yüklenemedi');
        }
    } catch (error) {
        console.error('❌ Dashboard yükleme hatası:', error);
        const errorContainer = document.getElementById('cmd-kritik-birim');
        if (errorContainer) {
            errorContainer.textContent = 'Hata!';
        }
    }
}

async function loadBirimlerForFilter() {
    try {
        const response = await fetch(`${API_BASE_URL}/birimler`);
        const result = await response.json();
        if (result.success) {
            const select = document.getElementById('birim-filter');
            select.innerHTML = '<option value="tumu">Tüm Birimler</option>';
            
            result.data.forEach(birim => {
                const option = document.createElement('option');
                option.value = birim.id;
                option.textContent = birim.birim_adi;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Birim filtresi yükleme hatası:', error);
    }
}

/**
 * Filtre uygulama fonksiyonu
 */
function stratejikOzetFiltrele() {
    const birimId = document.getElementById('birim-filter').value;
    const zamanAraligi = document.getElementById('zaman-filter').value;
    
    loadStratejikOzet(birimId, zamanAraligi);
}

/**
 * Risk Radar Chart oluşturur (Polar Area Chart)
 */
function createRiskRadarChart(riskHaritasi) {
    const chartCanvas = document.getElementById('riskRadarChart');
    if (!chartCanvas) return;
    // Mevcut grafiği temizle
    if (riskRadarChart) {
        riskRadarChart.destroy();
    }
    
    const ctx = document.getElementById('riskRadarChart').getContext('2d');
    
    const labels = riskHaritasi.map(r => r.birim);
    const riskPuanlari = riskHaritasi.map(r => r.riskPuani);
    
    
    const backgroundColors = riskPuanlari.map(puan => {
        if (puan > 70) return 'rgba(231, 76, 60, 0.6)';  
        if (puan > 40) return 'rgba(241, 196, 15, 0.6)'; 
        return 'rgba(46, 204, 113, 0.6)';                
    });
    
    const borderColors = riskPuanlari.map(puan => {
        if (puan > 70) return '#e74c3c';
        if (puan > 40) return '#f1c40f';
        return '#2ecc71';
    });
    
    riskRadarChart = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: labels,
            datasets: [{
                label: 'Risk Puanı',
                data: riskPuanlari,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Risk Puanı: ${context.parsed.r.toFixed(1)}`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        display: true,
                        stepSize: 20
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

function fillSonOlaylarTable(sonOlaylar) {
    const tbody = document.getElementById('son-olaylar-tbody');
    tbody.innerHTML = '';
    
    if (sonOlaylar.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    Son olay bulunamadı.
                </td>
            </tr>
        `;
        return;
    }
    
    sonOlaylar.forEach(olay => {
        const row = document.createElement('tr');
        row.className = olay.renk;
        
        const tarih = new Date(olay.tarih).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const olayTipiBadge = olay.olayTipi === 'İş Kazası' ? 'kaza' : 'ramak';
        const siddetClass = olay.siddet === 'Yüksek' ? 'yuksek' : 'orta';
        
        row.innerHTML = `
            <td>${tarih}</td>
            <td><strong>${olay.birim}</strong></td>
            <td><span class="event-badge ${olayTipiBadge}">${olay.olayTipi}</span></td>
            <td><span class="event-siddet ${siddetClass}">${olay.siddet}</span></td>
        `;
        
        tbody.appendChild(row);
    });
}


function createAylikTrendChart(aylikKazaTrendi) {
    if (aylikTrendChart) {
        aylikTrendChart.destroy();
    }
    
    const ctx = document.getElementById('aylikTrendChart').getContext('2d');
    
    aylikTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: aylikKazaTrendi.aylar,
            datasets: [
                {
                label: 'Kaza Sayısı',
                data: aylikKazaTrendi.kazaSayilari,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderColor: '#ef4444',
                borderWidth: 3,
                    borderDash: [5, 5], 
                fill: true,
                tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#ef4444',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
                },
                {
                    label: 'Ramak Kala Sayısı',
                    data: aylikKazaTrendi.ramakKalaSayilari || aylikKazaTrendi.aylar.map(() => 0),
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderColor: '#f59e0b',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#f59e0b',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 13,
                            weight: 'bold'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    bodySpacing: 6,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y + ' adet';
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Olay Sayısı',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Ay',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function createEgitimDoughnutChart(egitimDagilimi) {
    // Mevcut grafiği temizle
    if (egitimDoughnutChart) {
        egitimDoughnutChart.destroy();
    }
    
    const ctx = document.getElementById('egitimDoughnutChart').getContext('2d');
    
   
    document.getElementById('egitim-tamamlandi').textContent = egitimDagilimi.tamamlandi;
    document.getElementById('egitim-bekliyor').textContent = egitimDagilimi.bekliyor;
    document.getElementById('egitim-doldu').textContent = egitimDagilimi.suresiDoldu;
    
    egitimDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Tamamlandı', 'Bekliyor', 'Süresi Doldu'],
            datasets: [{
                data: [
                    egitimDagilimi.tamamlandi,
                    egitimDagilimi.bekliyor,
                    egitimDagilimi.suresiDoldu
                ],
                backgroundColor: [
                    '#2ecc71',
                    '#f1c40f',
                    '#e74c3c'
                ],
                borderColor: '#fff',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (%${percentage})`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function updateGenelDurumBanner(genelDurum) {
    const banner = document.getElementById('genel-durum-banner');
    const durumText = document.getElementById('genel-durum-text');
    const bannerIcon = banner.querySelector('.status-banner-icon');
    const bannerContent = banner.querySelector('.status-banner-content p');
    
    durumText.textContent = genelDurum;
    
    banner.classList.remove('kritik', 'dikkat');
    
    if (genelDurum === 'Kritik') {
        banner.classList.add('kritik');
        bannerIcon.textContent = '🚨';
        bannerContent.textContent = 'Acil müdahale gerektirir! Kritik eksikleri derhal giderin ve risk azaltma önlemlerini devreye alın.';
    } else if (genelDurum === 'Dikkat') {
        banner.classList.add('dikkat');
        bannerIcon.textContent = '⚠️';
        bannerContent.textContent = 'Bazı iyileştirmeler gerekiyor. Önleyici tedbirleri gözden geçirin ve eksikleri tamamlayın.';
    } else {
        bannerIcon.textContent = '✅';
        bannerContent.textContent = 'Tüm operasyonlar normal parametreler içinde. İyi çalışmalar dileriz.';
    }
}

async function loadSmartTriggers() {
    try {
        const container = document.getElementById('smart-triggers-container');
        if (!container) return;

        const response = await fetch(`${API_BASE_URL}/kds/stratejik-ozet`);
        const result = await response.json();
        
        if (!result.success || !result.data) {
            container.innerHTML = '<p style="color: #6b7280;">Bildirim verisi yüklenemedi.</p>';
            return;
        }

        const data = result.data;
        const triggers = [];

        if (data.ustKartlar?.suresiDolanEgitimler > 5) {
            triggers.push({
                type: 'alert-danger',
                icon: '⚖️',
                title: 'Yasal Risk!',
                message: `${data.ustKartlar.suresiDolanEgitimler} personelin eğitim sertifikası süresi dolmuş. Yasal yükümlülükler nedeniyle acil yenileme gerekiyor.`,
                time: 'Şimdi',
                action: 'Detay Gör'
            });
        }

        if (data.ustKartlar?.bakimBekleyenEkipman > 3) {
            triggers.push({
                type: 'alert-warning',
                icon: '🔧',
                title: 'Ekipman Güvenliği',
                message: `${data.ustKartlar.bakimBekleyenEkipman} ekipman bakım bekliyor. Güvenlik riski oluşmadan önlem alınmalı.`,
                time: '2 saat önce',
                action: 'Bakım Planla'
            });
        }

        if (data.ustKartlar?.kritikRiskliBirimSayisi > 0) {
            triggers.push({
                type: 'alert-danger',
                icon: '🚨',
                title: 'Saha Alarmı',
                message: `${data.ustKartlar.kritikRiskliBirimSayisi} birim kritik risk seviyesinde. Acil denetim ve önlem gerekiyor.`,
                time: '30 dakika önce',
                action: 'Birimleri Gör'
            });
        }

        if (data.ustKartlar?.aktifYogunluk > 80) {
            triggers.push({
                type: 'alert-warning',
                icon: '📊',
                title: 'Yoğunluk Uyarısı',
                message: `Şantiye yoğunluğu %${data.ustKartlar.aktifYogunluk} seviyesinde. Personel ve ekipman planlaması gözden geçirilmeli.`,
                time: '1 saat önce',
                action: 'Plan Gör'
            });
        }

        if (triggers.length === 0) {
            triggers.push({
                type: 'alert-info',
                icon: '✅',
                title: 'Sistem Sağlıklı',
                message: 'Tüm operasyonlar normal parametreler içinde çalışıyor. Kritik bir durum bulunmuyor.',
                time: 'Canlı',
                action: null
            });
        }

        container.innerHTML = triggers.map(trigger => `
            <div class="smart-trigger-card ${trigger.type}">
                <div class="smart-trigger-header">
                    <div class="smart-trigger-icon">${trigger.icon}</div>
                    <div class="smart-trigger-title">${trigger.title}</div>
                </div>
                <div class="smart-trigger-body">
                    ${trigger.message}
                </div>
                <div class="smart-trigger-footer">
                    <span>${trigger.time}</span>
                    ${trigger.action ? `<button class="smart-trigger-action">${trigger.action}</button>` : ''}
                </div>
            </div>
        `).join('');

        console.log('✅ Akıllı bildirimler yüklendi:', triggers.length);
    } catch (error) {
        console.error('❌ Akıllı bildirimler yükleme hatası:', error);
        const container = document.getElementById('smart-triggers-container');
        if (container) {
            container.innerHTML = '<p style="color: #ef4444;">Bildirimler yüklenirken hata oluştu.</p>';
        }
    }
}

// 2. YASAL UYUMLULUK SKORU

async function loadYasalUyumluluk() {
    try {
        const response = await fetch(`${API_BASE_URL}/kds/compliance-score`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            createComplianceGauge(data.toplamSkor, data.renk);
            const scoreEl = document.getElementById('compliance-score-text');
            if (scoreEl) {
                scoreEl.textContent = data.toplamSkor;
                scoreEl.style.color = data.renk === 'green' ? '#10b981' : (data.renk === 'yellow' ? '#f59e0b' : '#ef4444');
            }

            const statusEl = document.getElementById('compliance-status');
            if (statusEl) statusEl.textContent = data.durum;

            const messageBox = document.getElementById('compliance-message-box');
            if (messageBox) { // Sadece element varsa işlem yap
                messageBox.className = `alert-box ${data.renk}`;
            }
            const messageText = document.getElementById('compliance-message');
            if (messageText) messageText.textContent = data.mesaj;

            updateCategoryScores(data.kategoriPuanlari);
            displayCriticalIssues(data.kritikEksikler);
            updateComplianceStats(data.istatistikler);
            
            console.log('✅ Yasal uyumluluk skoru başarıyla yüklendi');
        }
    } catch (error) {
        console.error('Yasal uyumluluk hatası:', error);
    }
}

function createComplianceGauge(score, renk) {
    if (!document.getElementById('complianceGauge')) return;
    if (complianceGaugeChart) {
        complianceGaugeChart.destroy();
    }
    
    const ctx = document.getElementById('complianceGauge').getContext('2d');

    let gaugeColor = '';
    if (renk === 'green') {
        gaugeColor = '#10b981';
    } else if (renk === 'yellow') {
        gaugeColor = '#f59e0b';
    } else {
        gaugeColor = '#ef4444';
    }
    
    complianceGaugeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [
                    gaugeColor,
                    '#e5e7eb'
                ],
                borderWidth: 0,
                circumference: 180,
                rotation: 270
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            cutout: '75%'
        }
    });
}

function updateCategoryScores(puanlar) {
    document.getElementById('cat-egitim').textContent = puanlar.egitimUyumlulugu;
    const barEgitim = document.getElementById('bar-egitim');
    barEgitim.style.width = `${puanlar.egitimUyumlulugu}%`;
    barEgitim.style.backgroundColor = getCategoryColor(puanlar.egitimUyumlulugu);
    
    document.getElementById('cat-ekipman').textContent = puanlar.ekipmanDenetimi;
    const barEkipman = document.getElementById('bar-ekipman');
    barEkipman.style.width = `${puanlar.ekipmanDenetimi}%`;
    barEkipman.style.backgroundColor = getCategoryColor(puanlar.ekipmanDenetimi);

    document.getElementById('cat-kaza').textContent = puanlar.kazaBildirimTakibi;
    const barKaza = document.getElementById('bar-kaza');
    barKaza.style.width = `${puanlar.kazaBildirimTakibi}%`;
    barKaza.style.backgroundColor = getCategoryColor(puanlar.kazaBildirimTakibi);

    document.getElementById('cat-ramak').textContent = puanlar.ramakKalaAksiyonu;
    const barRamak = document.getElementById('bar-ramak');
    barRamak.style.width = `${puanlar.ramakKalaAksiyonu}%`;
    barRamak.style.backgroundColor = getCategoryColor(puanlar.ramakKalaAksiyonu);
}


function getCategoryColor(puan) {
    if (puan >= 80) return '#10b981';  
    if (puan >= 60) return '#f59e0b';  
    return '#ef4444';  
}

function displayCriticalIssues(eksikler) {
    const container = document.getElementById('critical-issues-list');
    container.innerHTML = '';
    
    if (eksikler.length === 0) {
        container.innerHTML = `
            <div class="alert-box success">
                <strong>✅ Harika!</strong> Şu anda kritik bir yasal eksik bulunmuyor.
            </div>
        `;
        return;
    }
    
    eksikler.forEach(eksik => {
        const item = document.createElement('div');
        item.className = `issue-item ${eksik.oncelik.toLowerCase()}`;
        
        item.innerHTML = `
            <div class="issue-header">
                <span class="issue-category">${eksik.kategori}</span>
                <span class="issue-priority ${eksik.oncelik.toLowerCase()}">${eksik.oncelik}</span>
            </div>
            <div class="issue-message">${eksik.mesaj}</div>
            <div class="issue-detail">${eksik.detay}</div>
        `;
        
        container.appendChild(item);
    });
}

function updateComplianceStats(stats) {
    document.getElementById('stat-personel-total').textContent = stats.toplamPersonel;
    document.getElementById('stat-egitim-gecmis').textContent = stats.egitimGecmisPersonel;
    document.getElementById('stat-ekipman-gecmis').textContent = stats.bakimGecmisEkipman;
    document.getElementById('stat-kaza-6ay').textContent = stats.sonAltiAyKaza;
    document.getElementById('stat-ramak-3ay').textContent = stats.sonUcAyRamakKala;
}

// 3. MEVSİMSEL RİSK ANALİZİ
async function loadMevsimselAnaliz() {
    try {
        const response = await fetch(`${API_BASE_URL}/kds/mevsimsel-analiz`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;

            document.getElementById('stat-toplam-kaza').textContent = data.istatistikler.toplamKaza;
            document.getElementById('current-month').textContent = data.mevcutAy;
            document.getElementById('current-season').textContent = data.mevcutMevsim;
            document.getElementById('risk-season').textContent = data.enRiskliMevsim;

            const tbody = document.getElementById('seasonal-detail-tbody');
            if (tbody) {
                tbody.innerHTML = ''; 
                data.birimMevsimDetay.forEach(birim => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><strong>${birim.birim_adi}</strong></td>
                        <td>${birim.mevsimKazalar['İlkbahar']}</td>
                        <td>${birim.mevsimKazalar['Yaz']}</td>
                        <td>${birim.mevsimKazalar['Sonbahar']}</td>
                        <td>${birim.mevsimKazalar['Kış']}</td>
                        <td><span class="risk-mevsim-badge">${birim.riskliMevsim}</span></td>
                        <td><strong>%${birim.riskOrani}</strong></td>
                    `;
                    tbody.appendChild(row);
                });
            }

            document.getElementById('stat-ilkbahar').textContent = data.istatistikler.mevsimselDagilim['İlkbahar'];
            document.getElementById('stat-yaz').textContent = data.istatistikler.mevsimselDagilim['Yaz'];
            document.getElementById('stat-sonbahar').textContent = data.istatistikler.mevsimselDagilim['Sonbahar'];
            document.getElementById('stat-kis').textContent = data.istatistikler.mevsimselDagilim['Kış'];
            document.getElementById('stat-dis-saha').textContent = data.istatistikler.disSahaBirimSayisi;

            createHeatmap(data.heatmapData);
            createForecastChart(data.gelecek12AyTahmini);
            displaySeasonalWarnings(data.uyarilar);
        }
    } catch (error) {
        console.error('Mevsimsel Analiz Hatası:', error);
    }
}
function updateSeasonalStatsCards(data) {
   
    document.getElementById('total-accidents').textContent = data.istatistikler.toplamKaza;
    
    const enRiskliMevsim = data.enRiskliMevsim;
    const enRiskliKazaSayisi = data.istatistikler.mevsimselDagilim[enRiskliMevsim];
    document.getElementById('most-risky-season').textContent = enRiskliMevsim;
    document.getElementById('risky-season-count').textContent = `${enRiskliKazaSayisi} kaza`;
    
    document.getElementById('current-season-stat').textContent = data.mevcutMevsim;
    document.getElementById('current-month-stat').textContent = data.mevcutAy;
    
    document.getElementById('active-warnings').textContent = data.uyarilar.length;
    
    console.log('✅ İstatistik kartları güncellendi');
}

function createSeasonalBarChart(heatmapData) {
    if (heatmapChart) {
        heatmapChart.destroy();
    }
    
    const ctx = document.getElementById('heatmapChart').getContext('2d');
    
    const birimler = [...new Set(heatmapData.map(d => d.birim))];
    const mevsimler = ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'];
    
    const mevsimRenkleri = {
        'İlkbahar': { bg: 'rgba(16, 185, 129, 0.7)', border: 'rgb(16, 185, 129)' },
        'Yaz': { bg: 'rgba(245, 158, 11, 0.7)', border: 'rgb(245, 158, 11)' },
        'Sonbahar': { bg: 'rgba(239, 68, 68, 0.7)', border: 'rgb(239, 68, 68)' },
        'Kış': { bg: 'rgba(59, 130, 246, 0.7)', border: 'rgb(59, 130, 246)' }
    };
    
    const datasets = mevsimler.map(mevsim => {
        const mevsimData = birimler.map(birim => {
            const veri = heatmapData.find(d => d.birim === birim && d.mevsim === mevsim);
            return veri ? veri.kazaSayisi : 0;
        });
        
        return {
            label: mevsim,
            data: mevsimData,
            backgroundColor: mevsimRenkleri[mevsim].bg,
            borderColor: mevsimRenkleri[mevsim].border,
            borderWidth: 2
        };
    });
    
    heatmapChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: birimler,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 14, weight: 'bold' },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} kaza`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Birimler',
                        font: { size: 15, weight: 'bold' }
                    },
                    ticks: {
                        font: { size: 13 }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Kaza Sayısı',
                        font: { size: 15, weight: 'bold' }
                    },
                    ticks: {
                        stepSize: 1,
                        font: { size: 13 }
                    }
                }
            }
        }
    });
    
    console.log('✅ Mevsimlik bar chart oluşturuldu');
}

function getHeatmapColor(kazaSayisi) {
    if (kazaSayisi === 0) return '#d1fae5';  // Açık yeşil
    if (kazaSayisi === 1) return '#fef3c7';  // Sarı
    if (kazaSayisi === 2) return '#fed7aa';  // Turuncu
    return '#fecaca';  // Kırmızı
}

function createForecastLineChart(tahminler) {
    if (forecastChart) {
        forecastChart.destroy();
    }
    
    const ctx = document.getElementById('forecastChart').getContext('2d');
    
    const aylar = tahminler.map(t => t.ay);
    const riskSkorlari = tahminler.map(t => t.riskSkoru);
    const mevsimler = tahminler.map(t => t.mevsim);
    
    const pointColors = mevsimler.map(m => {
        if (m === 'İlkbahar') return 'rgb(16, 185, 129)';
        if (m === 'Yaz') return 'rgb(245, 158, 11)';
        if (m === 'Sonbahar') return 'rgb(239, 68, 68)';
        return 'rgb(59, 130, 246)';
    });
    
    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: aylar,
            datasets: [{
                label: 'Tahmini Risk Skoru',
                data: riskSkorlari,
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: pointColors,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 14, weight: 'bold' },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    padding: 15,
                    callbacks: {
                        label: function(context) {
                            const mevsim = mevsimler[context.dataIndex];
                            const risk = context.parsed.y.toFixed(2);
                            return `${mevsim}: ${risk} risk skoru`;
                        },
                        afterLabel: function(context) {
                            const mevsim = mevsimler[context.dataIndex];
                            if (mevsim === 'Sonbahar') return '⚠️ Yüksek Risk Dönemi';
                            return '';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Risk Skoru',
                        font: { size: 15, weight: 'bold' }
                    },
                    ticks: {
                        font: { size: 13 }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Gelecek 12 Ay',
                        font: { size: 15, weight: 'bold' }
                    },
                    ticks: {
                        font: { size: 11 },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
    
    console.log('✅ Tahmin çizgi grafiği oluşturuldu');
}

function displaySeasonalAlertCards(uyarilar) {
    const container = document.getElementById('seasonal-warnings-list');
    
    if (!container) return;
    
    if (!uyarilar || uyarilar.length === 0) {
        container.innerHTML = '<div class="no-warnings">✅ Önümüzdeki 3 ay için mevsimsel uyarı bulunmamaktadır.</div>';
        return;
    }
    
    container.innerHTML = '';
    
    uyarilar.forEach(uyari => {
        const card = document.createElement('div');
        card.className = `seasonal-alert-card ${uyari.oncelik.toLowerCase()}`;
        
        let mevsimIcon = '🌦️';
        if (uyari.mevsim === 'Kış') mevsimIcon = '❄️';
        else if (uyari.mevsim === 'Yaz') mevsimIcon = '☀️';
        else if (uyari.mevsim === 'Sonbahar') mevsimIcon = '🌧️';
        else if (uyari.mevsim === 'İlkbahar') mevsimIcon = '🌸';
        
        card.innerHTML = `
            <div class="alert-header">
                <span class="alert-season-icon">${mevsimIcon}</span>
                <div class="alert-title">
                    <h4>${uyari.mesaj}</h4>
                    <span class="alert-priority ${uyari.oncelik.toLowerCase()}">${uyari.oncelik} Öncelik</span>
                </div>
            </div>
            <div class="alert-body">
                <p><strong>📋 Öneri:</strong> ${uyari.oneri}</p>
                <div class="alert-meta">
                    <span>📅 ${uyari.ay}</span>
                    <span>🏢 ${uyari.birim}</span>
                    <span>🌦️ ${uyari.mevsim}</span>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    console.log(`✅ ${uyarilar.length} uyarı kartı oluşturuldu`);
}

function createForecastChart(tahminler) {
    createForecastLineChart(tahminler);
}

function displaySeasonalWarnings(uyarilar) {
    displaySeasonalAlertCards(uyarilar);
}

function getMevsimRenk(mevsim) {
    const renkler = {
        'İlkbahar': 'rgb(16, 185, 129)',
        'Yaz': 'rgb(245, 158, 11)',
        'Sonbahar': 'rgb(239, 68, 68)',
        'Kış': 'rgb(59, 130, 246)'
    };
    return renkler[mevsim] || '#6b7280';
}

function createHeatmap(heatmapData) {
    createSeasonalBarChart(heatmapData);
}


function updateSeasonalStats(istatistikler) {
}

function getHeatmapColor(kazaSayisi) {
    if (kazaSayisi === 0) return '#d1fae5';
    if (kazaSayisi === 1) return '#fef3c7';
    if (kazaSayisi === 2) return '#fed7aa';
    return '#fecaca';
}

function getOldBorderColors() {
    
    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: aylar,
            datasets: [{
                label: 'Tahmini Risk Skoru',
                data: riskSkorlari,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: borderColors,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                segment: {
                    borderColor: (ctx) => {
                        const mevsim = mevsimler[ctx.p0DataIndex];
                        if (mevsim === 'Sonbahar') return '#ef4444';
                        if (mevsim === 'Yaz') return '#f59e0b';
                        if (mevsim === 'Kış') return '#3b82f6';
                        return '#10b981';
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const mevsim = mevsimler[context.dataIndex];
                            return [
                                `Risk Skoru: ${context.parsed.y.toFixed(2)}`,
                                `Mevsim: ${mevsim}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Risk Skoru',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Ay',
                        font: { size: 14, weight: 'bold' }
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function displaySeasonalWarnings(uyarilar) {
    const container = document.getElementById('seasonal-warnings-list');
    container.innerHTML = '';
    
    if (uyarilar.length === 0) {
        container.innerHTML = `
            <div class="alert-box success">
                <strong>✅ Harika!</strong> Yakın gelecekte mevsimsel risk uyarısı bulunmuyor.
            </div>
        `;
        return;
    }
    
    uyarilar.forEach(uyari => {
        const item = document.createElement('div');
        item.className = `warning-item ${uyari.oncelik.toLowerCase()}`;
        
        item.innerHTML = `
            <div class="warning-icon">${uyari.icon}</div>
            <div class="warning-content">
                <div class="warning-header">
                    <span class="warning-season">${uyari.mevsim} - ${uyari.ay}</span>
                    <span class="warning-priority ${uyari.oncelik.toLowerCase()}">${uyari.oncelik}</span>
                </div>
                <div class="warning-message">${uyari.mesaj}</div>
                <div class="warning-advice">💡 ${uyari.oneri}</div>
            </div>
        `;
        
        container.appendChild(item);
    });
}

function fillSeasonalDetailTable(birimDetay) {
    const tbody = document.getElementById('seasonal-detail-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    birimDetay.forEach(birim => {
        const row = document.createElement('tr');
        const ad = birim.birimAdi || birim.birim_adi || 'Bilinmiyor';
        
        row.innerHTML = `
            <td><strong>${ad}</strong></td>
            <td>${birim.mevsimKazalar['İlkbahar'] || 0}</td>
            <td>${birim.mevsimKazalar['Yaz'] || 0}</td>
            <td>${birim.mevsimKazalar['Sonbahar'] || 0}</td>
            <td>${birim.mevsimKazalar['Kış'] || 0}</td>
            <td><span class="risk-mevsim-badge">${birim.riskliMevsim || '-'}</span></td>
            <td><strong>%${birim.riskOrani || 0}</strong></td>
        `;
        tbody.appendChild(row);
    });
}

function updateSeasonalStats(stats) {
    document.getElementById('stat-toplam-kaza').textContent = stats.toplamKaza;
    document.getElementById('stat-ilkbahar').textContent = stats.mevsimselDagilim['İlkbahar'];
    document.getElementById('stat-yaz').textContent = stats.mevsimselDagilim['Yaz'];
    document.getElementById('stat-sonbahar').textContent = stats.mevsimselDagilim['Sonbahar'];
    document.getElementById('stat-kis').textContent = stats.mevsimselDagilim['Kış'];
    document.getElementById('stat-dis-saha').textContent = stats.disSahaBirimSayisi;
}

function getMevsimRenk(mevsim) {
    if (mevsim === 'İlkbahar') return '#10b981';
    if (mevsim === 'Yaz') return '#f59e0b';
    if (mevsim === 'Sonbahar') return '#ef4444';
    if (mevsim === 'Kış') return '#3b82f6';
    return '#6b7280';
}
// 4. 6 AYLIK RİSK PROJEKSİYONU
async function loadRiskProjeksiyonu() {
    try {
        console.log('🔄 6-12 Aylık risk projeksiyonu yükleniyor...');
        
        const response = await fetch(`${API_BASE_URL}/kds/risk-projeksiyonu`);
        const result = await response.json();
        
        console.log('📦 Risk Projeksiyonu Yanıtı:', result);
        
        if (result.success) {
            const { aylar, riskSkorlari } = result.data;
            
            console.log('📊 Aylar:', aylar);
            console.log('📈 Risk Skorları:', riskSkorlari);
            
            const maxRisk = Math.max(...riskSkorlari);
            console.log('⚠️ Maksimum Risk Skoru:', maxRisk);
            
            updateStrategicDecisionBox(maxRisk, riskSkorlari);
            
            if (riskChart) {
                riskChart.destroy();
            }
            
            const colors = createDynamicColorGradient(riskSkorlari);
            
            const ctx = document.getElementById('riskChart').getContext('2d');
            
            riskChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: aylar,
                    datasets: [{
                        label: 'Stratejik Risk Skoru',
                        data: riskSkorlari,
                        borderColor: colors.borderColor,
                        backgroundColor: createSoftGradient(ctx, riskSkorlari),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 7,
                        pointHoverRadius: 10,
                        pointBackgroundColor: colors.pointColors,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 3,
                        pointHoverBorderWidth: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        annotation: {
                            annotations: {
                                criticalLine: {
                                    type: 'line',
                                    yMin: 75,
                                    yMax: 75,
                                    borderColor: '#ef4444',
                                    borderWidth: 3,
                                    borderDash: [10, 5],
                                    label: {
                                        content: 'Kritik Eşik (75)',
                                        enabled: true,
                                        position: 'end',
                                        backgroundColor: '#ef4444',
                                        color: '#ffffff',
                                        font: {
                                            size: 11,
                                            weight: 'bold'
                                        }
                                    }
                                }
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                font: {
                                    size: 15,
                                    weight: 'bold'
                                },
                                color: '#1f2937',
                                padding: 15
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.85)',
                            padding: 15,
                            titleFont: {
                                size: 15,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 14
                            },
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y.toFixed(2);
                                    let status = '';
                                    if (value > 70) status = ' (🔴 Kritik)';
                                    else if (value > 50) status = ' (🟡 Yüksek)';
                                    else if (value > 30) status = ' (🟠 Orta)';
                                    else status = ' (🟢 Düşük)';
                                    return `Risk Skoru: ${value}${status}`;
                                },
                                afterLabel: function(context) {
                                    const monthIndex = context.dataIndex;
                                    const riskReason = getRiskReason(riskSkorlari[monthIndex], monthIndex);
                                    return ['', `📌 Ana Sebep: ${riskReason}`, 'Şimdiden önlem alın!'];
                                }
                            }
                        },
                        title: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Risk Skoru',
                                font: {
                                    size: 15,
                                    weight: 'bold'
                                },
                                color: '#374151'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.06)',
                                lineWidth: 1
                            },
                            ticks: {
                                font: {
                                    size: 13
                                },
                                color: '#6b7280'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: '6-12 Aylık Dönem',
                                font: {
                                    size: 15,
                                    weight: 'bold'
                                },
                                color: '#374151'
                            },
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 13,
                                    weight: '500'
                                },
                                color: '#374151'
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
            
            console.log('✅ Stratejik risk projeksiyonu grafiği çizildi');
        }
    } catch (error) {
        console.error('❌ Risk projeksiyonu hatası:', error);
    }
}

function createDynamicColorGradient(riskSkorlari) {
    const maxRisk = Math.max(...riskSkorlari);
    let borderColor, backgroundColor, pointColors;
    if (maxRisk > 50) {
        borderColor = '#f59e0b';
        backgroundColor = 'rgba(245, 158, 11, 0.2)';
        pointColors = riskSkorlari.map(risk => 
            risk > 50 ? '#f59e0b' : '#3b82f6'
        );
    } else {
        borderColor = '#3b82f6';
        backgroundColor = 'rgba(59, 130, 246, 0.2)';
        pointColors = riskSkorlari.map(() => '#3b82f6');
    }
    return { borderColor, backgroundColor, pointColors };
}

function updateStrategicDecisionBox(maxRisk, riskSkorlari) {
    const decisionBox = document.getElementById('strategic-decision-box');
    const decisionText = document.getElementById('decision-text');
    const actionList = document.getElementById('action-list');
    
    if (!decisionBox || !decisionText || !actionList) return;

    let summaryText = '';
    let actions = [];
    
    if (maxRisk > 70) {
        decisionBox.className = 'strategic-decision-box critical floating-card';
        summaryText = `<strong>🚨 KRİTİK UYARI:</strong> 6-12 ay arası dönemde risk skoru <strong>${maxRisk.toFixed(1)}</strong> seviyesine ulaşıyor. Acil müdahale gerekiyor!`;
        actions = [
            'Sertifikası dolacak tüm personeli belirleyin ve öncelik listesi oluşturun',
            'Eğitim bütçesini hemen ayırın ve tedarikçilerle iletişime geçin',
            'Kritik birimlerde yedek personel planlaması yapın'
        ];
    } else if (maxRisk > 50) {
        decisionBox.className = 'strategic-decision-box warning floating-card';
        summaryText = `<strong>⚠️ DİKKAT:</strong> Risk skoru <strong>${maxRisk.toFixed(1)}</strong> seviyesinde. Önleyici tedbirler alınmalı.`;
        actions = [
            'Gelecek 6 ay için eğitim takvimi hazırlayın',
            'Bütçe planlamasına risk primi ekleyin',
            'Kritik birimlerdeki personel durumunu gözden geçirin'
        ];
    } else {
        decisionBox.className = 'strategic-decision-box safe floating-card';
        summaryText = `<strong>✅ OLUMLU:</strong> Risk seviyesi <strong>${maxRisk.toFixed(1)}</strong> ile kontrol altında. Mevcut planlar yeterli.`;
        actions = [
            'Rutin eğitim programlarını sürdürün',
            'Sertifika takip sistemini düzenli kontrol edin',
            'Personel gelişim planlarını güncel tutun'
        ];
    }
    decisionText.innerHTML = summaryText;
    actionList.innerHTML = actions.map(action => `<li class="action-item">${action}</li>`).join('');
    populateFactorAnalysisTable(riskSkorlari);
    console.log(`✅ Akıllı eylem planı güncellendi (Risk: ${maxRisk.toFixed(2)})`);
}

function getRiskReason(riskScore, monthIndex) {
    if (riskScore > 70) {
        return 'Sertifika Bitiş Yoğunluğu';
    } else if (riskScore > 50) {
        return 'Mevsimsel Yoğunluk + Sertifika';
    } else if (riskScore > 30) {
        return 'Orta Seviye Risk Faktörleri';
    } else {
        return 'Düşük Risk Dönemi';
    }
}

function createSoftGradient(ctx, riskSkorlari) {
    const maxRisk = Math.max(...riskSkorlari);
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    
    if (maxRisk > 70) {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0.1)');
    } else if (maxRisk > 50) {
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
    } else {
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
    }
    return gradient;
}

function populateFactorAnalysisTable(riskSkorlari) {
    const tbody = document.getElementById('factor-tbody');
    if (!tbody) return;
    
    const avgRisk = riskSkorlari.reduce((a, b) => a + b, 0) / riskSkorlari.length;
    const maxRisk = Math.max(...riskSkorlari);

    const factors = [
        {
            name: 'Sertifika Geçerlilik Sonu',
            contribution: maxRisk > 70 ? 45 : maxRisk > 50 ? 35 : 25,
            trend: maxRisk > 70 ? '⬆' : '➡',
            description: 'Gelecek 6-12 ayda süresi dolacak sertifika sayısı'
        },
        {
            name: 'Mevsimsel Katsayı',
            contribution: 25,
            trend: '⬆',
            description: 'Yaz ve kış aylarındaki iş yoğunluğu artışı'
        },
        {
            name: 'Geçmiş Kaza Verisi',
            contribution: 20,
            trend: avgRisk > 50 ? '⬆' : '⬇',
            description: 'Son 12 aydaki kaza istatistikleri'
        },
        {
            name: 'Personel Devir Hızı',
            contribution: 10,
            trend: '➡',
            description: 'Yeni personel alımı ve eğitim ihtiyacı'
        }
    ];
    
    tbody.innerHTML = factors.map(factor => `
        <tr>
            <td><strong>${factor.name}</strong></td>
            <td><strong>${factor.contribution}%</strong></td>
            <td class="trend-${factor.trend === '⬆' ? 'up' : factor.trend === '⬇' ? 'down' : 'stable'}">${factor.trend}</td>
            <td style="color: #6b7280; font-size: 0.9rem;">${factor.description}</td>
        </tr>
    `).join('');
    
    console.log('✅ Faktör analiz tablosu dolduruldu');
}
// 5. BİRİM BAZLI KARAR ANALİZİ
async function loadBirimAnalizi() {
    try {
        console.log('🔄 Birim analizi verileri çekiliyor...');
        const response = await fetch(`${API_BASE_URL}/kds/birim-analizi`);
        const result = await response.json();
        
        if (result.success) {
            if (result.data && result.data.length > 0) {
                createBirimRiskRadarChart(result.data);
                createStackedRiskChart(result.data);
                updateBirimStats(result.data);
            }
            const tbody = document.getElementById('birim-tbody');
            if (tbody && result.data) {
                tbody.innerHTML = '';
                result.data.forEach(birim => {
                    const row = document.createElement('tr');
                    const badgeClass = birim.durum === 'Kritik' ? 'kritik' : (birim.durum === 'Orta' ? 'orta' : 'guvenli');
                    let rowClass = '';
                    if (birim.riskSkoru >= 70) {
                        rowClass = 'risk-row-critical'; 
                    } else if (birim.riskSkoru >= 40) {
                        rowClass = 'risk-row-medium'; 
                    } else {
                        rowClass = 'risk-row-safe'; 
                    }
                    row.className = rowClass;
                    const egitimButcesi = (birim.egitimiBitecekKisi || 0) * 5000;
                    const potansiyelKazaMaliyeti = birim.riskSkoru * 10000; 
                    const riskAzalmaOrani = 0.3; 
                    const tasarruf = potansiyelKazaMaliyeti * riskAzalmaOrani;
                    const roi = egitimButcesi > 0 ? ((tasarruf - egitimButcesi) / egitimButcesi * 100).toFixed(0) : 0;
                    row.innerHTML = `
                        <td><strong>${birim.birim}</strong></td>
                        <td><strong>${birim.riskSkoru}</strong></td>
                        <td><span class="badge ${badgeClass}">${birim.durum}</span></td>
                        <td>${birim.egitimiBitecekKisi} kişi</td>
                        <td>%${birim.planlananYogunluk}</td>
                        <td>${birim.gecmisKazalar}</td>
                        <td><strong>${egitimButcesi.toLocaleString('tr-TR')} ₺</strong></td>
                        <td><span class="roi-badge ${roi > 50 ? 'roi-positive' : roi > 0 ? 'roi-neutral' : 'roi-negative'}">${roi > 0 ? '+' : ''}${roi}%</span></td>
                    `;
                    tbody.appendChild(row);
                });
            }
            const detailedTbody = document.getElementById('detailed-training-tbody');
            if (detailedTbody && result.detayliTablo) {
                detailedTbody.innerHTML = '';
                result.detayliTablo.forEach(kayit => {
                    const row = document.createElement('tr');
                    const tarih = new Date(kayit.gecerlilikSonu).toLocaleDateString('tr-TR');
                    row.innerHTML = `
                        <td><strong>${kayit.personelAdi}</strong></td>
                        <td>${kayit.birimAdi}</td>
                        <td>${kayit.egitimAdi}</td>
                        <td>${tarih}</td>
                        <td>${kayit.kalanGun} gün</td>
                        <td><span class="durum-badge">${kayit.durum}</span></td>
                        <td><strong>${kayit.maliyet.toLocaleString('tr-TR')} ₺</strong></td>
                    `;
                    detailedTbody.appendChild(row);
                });
            }
            console.log('✅ Birim analizi paneli güncellendi');
        }
    } catch (error) {
        console.error('❌ HATA:', error);
    }
}
function displayDetailedTrainingTable(detayliTablo) {
    const tbody = document.getElementById('detailed-training-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (detayliTablo.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
                    Eğitim kaydı bulunamadı.
                </td>
            </tr>
        `;
        return;
    } 
    detayliTablo.forEach(kayit => {
        const row = document.createElement('tr');       
        let badgeClass = 'badge ';
        let badgeStyle = '';
        if (kayit.durum === 'SÜRESİ DOLDU') {
            badgeClass += 'kritik';
            badgeStyle = 'background: #ef4444; color: white;';
        } else if (kayit.durum === 'KRİTİK') {
            badgeClass += 'orta';
            badgeStyle = 'background: #f59e0b; color: white;';
        } else {
            badgeClass += 'guvenli';
            badgeStyle = 'background: #10b981; color: white;';
        }
        const gecerlilikTarihi = kayit.gecerlilikSonu ? 
            new Date(kayit.gecerlilikSonu).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }) : '-';
        const kalanGunText = kayit.kalanGun !== null && kayit.kalanGun !== undefined ? 
            (kayit.kalanGun < 0 ? `${Math.abs(kayit.kalanGun)} gün geçti` : `${kayit.kalanGun} gün`) : 
            '-';
        const maliyetText = kayit.maliyet ? 
            `${kayit.maliyet.toLocaleString('tr-TR')} ₺` : 
            '-';
        row.innerHTML = `
            <td><strong>${kayit.personelAdi || 'Bilinmeyen'}</strong></td>
            <td>${kayit.birimAdi || '-'}</td>
            <td>${kayit.egitimAdi || 'Bilinmeyen'}</td>
            <td>${gecerlilikTarihi}</td>
            <td><strong>${kalanGunText}</strong></td>
            <td><span class="${badgeClass}" style="${badgeStyle}">${kayit.durum}</span></td>
            <td><strong>${maliyetText}</strong></td>
        `;
        
        tbody.appendChild(row);
    });
    setupTrainingTableFilters(detayliTablo);
}

let allTrainingData = []; 
let filtersInitialized = false;

function setupTrainingTableFilters(detayliTablo) {
    allTrainingData = detayliTablo; 
    if (filtersInitialized) {
        console.log('ℹ️ Filtre event listener\'ları zaten aktif');
        return;
    }    
    const birimFilter = document.getElementById('training-birim-filter');
    const egitimFilter = document.getElementById('training-egitim-filter');
    const clearBtn = document.getElementById('training-clear-filters');    
    filtersInitialized = true;
    console.log('ℹ️ Filtreleme sistemi geçici olarak devre dışı (event listener\'lar eklenmedi)');
}

function populateTrainingBirimFilter(detayliTablo) {
    console.log('ℹ️ Birim filtresi HTML\'de sabit olarak tanımlandı');
}

function applyTrainingFilters() {
    const birimFilter = document.getElementById('training-birim-filter');
    const egitimFilter = document.getElementById('training-egitim-filter');
    const tbody = document.getElementById('detailed-training-tbody');
    
    if (!birimFilter || !egitimFilter || !tbody) {
        return;
    }
    
    const selectedBirim = birimFilter.value.trim();
    const selectedEgitim = egitimFilter.value.trim();
    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) {
            row.style.display = 'table-row';
            return;
        }
        const rowBirim = cells[1] ? cells[1].textContent.trim() : '';
        const rowEgitim = cells[2] ? cells[2].textContent.trim() : '';
        let showRow = true;
        if (selectedBirim && selectedBirim !== '') {
            if (rowBirim !== selectedBirim) {
                showRow = false;
            }
        }
        if (selectedEgitim && selectedEgitim !== '') {
            if (rowEgitim !== selectedEgitim) {
                showRow = false;
            }
        }
        if (showRow) {
            row.style.display = 'table-row';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    showFilterInfo(visibleCount, rows.length);
    console.log(`🔍 Filtre uygulandı: ${visibleCount}/${rows.length} kayıt (Birim: "${selectedBirim}", Eğitim: "${selectedEgitim}")`);
}
function updateTrainingTableWithFilters(filteredData) {
    console.warn('⚠️ updateTrainingTableWithFilters deprecated - display property kullanılıyor');
}
function showFilterInfo(filteredCount, totalCount) {
    const infoDiv = document.getElementById('training-filter-info');
    const countSpan = document.getElementById('training-filter-count');    
    if (!infoDiv || !countSpan) return;   
    if (filteredCount < totalCount) {
        infoDiv.style.display = 'block';
        countSpan.textContent = `${filteredCount} / ${totalCount}`;
    } else {
        infoDiv.style.display = 'none';
    }
}

function clearTrainingFilters() {
    const birimFilter = document.getElementById('training-birim-filter');
    const egitimFilter = document.getElementById('training-egitim-filter');
    const infoDiv = document.getElementById('training-filter-info');
    const tbody = document.getElementById('detailed-training-tbody');
    if (!birimFilter || !egitimFilter) {
        return;
    }
    if (birimFilter) birimFilter.selectedIndex = 0;
    if (egitimFilter) egitimFilter.selectedIndex = 0;
    if (infoDiv) infoDiv.style.display = 'none';
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            row.style.display = 'table-row';
        });
    }
    console.log('🔄 Filtreler temizlendi - tüm satırlar görünür');
}
let globalBirimData = []; // Global değişken

function createBirimRiskRadarChart(birimData) {
    globalBirimData = birimData; 
    populateBenchmarkBirimDropdown(birimData);
    if (birimData && birimData.length > 0) {
        updateBenchmarkRadarChart(birimData[0]);
    }
}
function populateBenchmarkBirimDropdown(birimData) {
    const select = document.getElementById('benchmark-birim-select');
    if (!select) return;
    select.innerHTML = '<option value="">Birim seçiniz...</option>';
    birimData.forEach((birim, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = birim.birim;
        select.appendChild(option);
    });
    select.addEventListener('change', function() {
        const selectedIndex = this.value;
        if (selectedIndex !== '' && globalBirimData[selectedIndex]) {
            updateBenchmarkRadarChart(globalBirimData[selectedIndex]);
        }
    });
}
function updateBenchmarkRadarChart(birim) {
    const canvas = document.getElementById('birimRiskRadarChart');
    if (!canvas) return;
    if (birimRiskRadarChart) {
        birimRiskRadarChart.destroy();
    }
    const ctx = canvas.getContext('2d');
    const kriterler = [
        'Kaza Sıklığı',
        'Eğitim Tamamlama',
        'Ekipman Kondisyonu',
        'Denetim Skoru',
        'Yasal Uyumluluk'
    ];
    const mevcutDurum = calculateMevcutDurum(birim);
    const hedefSeviye = [90, 95, 90, 85, 95];    
    birimRiskRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: kriterler,
            datasets: [
                {
                    label: 'Mevcut Risk Durumu',
                    data: mevcutDurum,
                    backgroundColor: 'rgba(239, 68, 68, 0.3)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(239, 68, 68, 1)',
                    fill: true
                },
                {
                    label: 'Hedeflenen Güvenli Seviye',
                    data: hedefSeviye,
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return value;
                        }
                    },
                    pointLabels: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#1e293b'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        circular: true
                    },
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Manuel legend kullanıyoruz
                },
                title: {
                    display: true,
                    text: `${birim.birim} - Performans Analizi`,
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.r;
                            const diff = context.datasetIndex === 0 ? 
                                (hedefSeviye[context.dataIndex] - value).toFixed(1) : 0;
                            
                            if (context.datasetIndex === 0) {
                                return [
                                    `${label}: ${value}`,
                                    `İyileştirme Gereksinimi: ${diff > 0 ? '+' + diff : diff} puan`
                                ];
                            }
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    });
    
    console.log(`✅ Benchmark radar grafiği güncellendi: ${birim.birim}`);
}
function calculateMevcutDurum(birim) {
    const basePerformans = 100 - (birim.riskSkoru || 50);
    const kazaSikligi = Math.max(20, Math.min(100, basePerformans - (birim.gecmisKazalar || 0) * 5));
    const egitimTamamlama = Math.max(30, Math.min(100, basePerformans + 10 - (birim.egitimiBitecekKisi || 0) * 3));
    const ekipmanKondisyonu = Math.max(25, Math.min(100, basePerformans + 5));
    const denetimSkoru = Math.max(30, Math.min(100, basePerformans - 5));
    const yasalUyumluluk = Math.max(40, Math.min(100, basePerformans + 15 - (birim.egitimiBitecekKisi || 0) * 2));   
    return [
        Math.round(kazaSikligi),
        Math.round(egitimTamamlama),
        Math.round(ekipmanKondisyonu),
        Math.round(denetimSkoru),
        Math.round(yasalUyumluluk)
    ];
}

let stackedRiskChart = null;
function createStackedRiskChart(birimData) {
    populateStackedBirimDropdown(birimData);
    if (birimData && birimData.length > 0) {
        updateStackedRiskChart(birimData[0]);
    }
}

function populateStackedBirimDropdown(birimData) {
    const select = document.getElementById('stacked-birim-select');
    if (!select) return;   
    select.innerHTML = '<option value="">Birim seçiniz...</option>';    
    birimData.forEach((birim, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = birim.birim;
        select.appendChild(option);
    });
    select.addEventListener('change', function() {
        const selectedIndex = this.value;
        if (selectedIndex !== '' && globalBirimData[selectedIndex]) {
            updateStackedRiskChart(globalBirimData[selectedIndex]);
        }
    });
}
function updateStackedRiskChart(birim) {
    const canvas = document.getElementById('stackedRiskChart');
    if (!canvas) return;
    if (stackedRiskChart) {
        stackedRiskChart.destroy();
    }
    const ctx = canvas.getContext('2d');
    const egitimRiski = calculateEgitimRiski(birim);
    const kazaRiski = calculateKazaRiski(birim);
    const ekipmanRiski = calculateEkipmanRiski(birim);
    stackedRiskChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [birim.birim],
            datasets: [
                {
                    label: 'Eğitim Riski',
                    data: [egitimRiski],
                    backgroundColor: '#ef4444',
                    borderColor: '#dc2626',
                    borderWidth: 2,
                    borderRadius: 6
                },
                {
                    label: 'Kaza Riski',
                    data: [kazaRiski],
                    backgroundColor: '#f97316',
                    borderColor: '#ea580c',
                    borderWidth: 2,
                    borderRadius: 6
                },
                {
                    label: 'Ekipman Riski',
                    data: [ekipmanRiski],
                    backgroundColor: '#fbbf24',
                    borderColor: '#f59e0b',
                    borderWidth: 2,
                    borderRadius: 6
                }
            ]
        },
        options: {
            indexAxis: 'y', // Yatay çubuk
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Risk Yüzdesi (%)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Manuel legend kullanıyoruz
                },
                title: {
                    display: true,
                    text: 'Risk Kategori Dağılımı',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.x || 0;
                            return `${label}: ${value.toFixed(1)}%`;
                        },
                        footer: function(tooltipItems) {
                            let total = 0;
                            tooltipItems.forEach(item => {
                                total += item.parsed.x;
                            });
                            return `Toplam Risk: ${total.toFixed(1)}%`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    },
                    footerFont: {
                        size: 12,
                        weight: 'bold'
                    }
                }
            }
        }
    });
    
    console.log(`✅ Stacked bar chart güncellendi: ${birim.birim}`);
}
function calculateEgitimRiski(birim) {
    const egitimiBitecek = birim.egitimiBitecekKisi || 0;
    const toplamPersonel = 50;
    const egitimRiskYuzdesi = Math.min(100, (egitimiBitecek / toplamPersonel) * 100 * 1.5);
    return Math.round(egitimRiskYuzdesi * 10) / 10;
}
function calculateKazaRiski(birim) {
    const gecmisKazalar = birim.gecmisKazalar || 0;
    const kazaRiskYuzdesi = Math.min(100, gecmisKazalar * 8);
    return Math.round(kazaRiskYuzdesi * 10) / 10;
}
function calculateEkipmanRiski(birim) {
    const isYogunlugu = birim.isYogunlugu || 'Orta';
    const riskSkoru = birim.riskSkoru || 50;
    let ekipmanBazRisk = 0;
    if (isYogunlugu === 'Yüksek') ekipmanBazRisk = 25;
    else if (isYogunlugu === 'Orta') ekipmanBazRisk = 15;
    else ekipmanBazRisk = 10;   
    const ekipmanRiskYuzdesi = Math.min(100, ekipmanBazRisk + (riskSkoru * 0.3));
    return Math.round(ekipmanRiskYuzdesi * 10) / 10;
}
function updateBirimStats(birimData) {
    const kritik = birimData.filter(b => b.riskSkoru >= 70).length;
    const orta = birimData.filter(b => b.riskSkoru >= 40 && b.riskSkoru < 70).length;
    const guvenli = birimData.filter(b => b.riskSkoru < 40).length;
    const ortalama = (birimData.reduce((sum, b) => sum + b.riskSkoru, 0) / birimData.length).toFixed(1);
    const kritikEl = document.getElementById('kritik-birim-sayisi');
    const ortaEl = document.getElementById('orta-birim-sayisi');
    const guvenliEl = document.getElementById('guvenli-birim-sayisi');
    const ortalamaEl = document.getElementById('ortalama-risk-skoru');   
    if (kritikEl) kritikEl.textContent = kritik;
    if (ortaEl) ortaEl.textContent = orta;
    if (guvenliEl) guvenliEl.textContent = guvenli;
    if (ortalamaEl) ortalamaEl.textContent = ortalama;
}
function fillRiskTable(data) {
    const tbody = document.getElementById('birim-tbody');
    if (!tbody) return;   
    tbody.innerHTML = '';    
    data.forEach(birim => {
        const row = document.createElement('tr');        
        if (birim.durum === 'Kritik') {
            row.className = 'risk-row-kritik';
        } else if (birim.durum === 'Orta') {
            row.className = 'risk-row-orta';
        } else {
            row.className = 'risk-row-guvenli';
        }
        let badgeClass = 'risk-badge ';
        let badgeIcon = '';
        if (birim.durum === 'Kritik') {
            badgeClass += 'badge-kritik';
            badgeIcon = '🔴';
        } else if (birim.durum === 'Orta') {
            badgeClass += 'badge-orta';
            badgeIcon = '🟡';
        } else {
            badgeClass += 'badge-guvenli';
            badgeIcon = '🟢';
        }
        row.innerHTML = `
            <td><strong>${birim.birim}</strong></td>
            <td><strong class="risk-score">${birim.riskSkoru}</strong></td>
            <td><span class="${badgeClass}">${badgeIcon} ${birim.durum}</span></td>
            <td>${birim.egitimiBitecekKisi} kişi</td>
            <td>%${birim.planlananYogunluk}</td>
            <td><strong>${birim.gecmisKazalar}</strong></td>
        `;        
        tbody.appendChild(row);
    });   
    console.log(`✅ ${data.length} birim risk tablosuna eklendi`);
}
function displayISGRecommendations(data) {
    const container = document.getElementById('recommendations');
    if (!container) return;    
    container.innerHTML = '<h3 style="margin-bottom: 1.5rem;">💡 İSG Müdürü Tavsiyeleri</h3>';
    const criticalUnits = data.filter(b => b.durum === 'Kritik' || b.durum === 'Orta');    
    if (criticalUnits.length === 0) {
        container.innerHTML += '<div class="recommendation-card guvenli"><p>✅ Tüm birimler güvenli durumda!</p></div>';
        return;
    }    
    criticalUnits.forEach(birim => {
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        if (birim.durum === 'Kritik') {
            card.classList.add('kritik');
        } else if (birim.durum === 'Orta') {
            card.classList.add('orta');
        }
        const icon = birim.durum === 'Kritik' ? '🚨' : '⚠️';       
        card.innerHTML = `
            <div class="recommendation-header">
                <span class="recommendation-icon">${icon}</span>
                <h4>${birim.birim}</h4>
            </div>
            <div class="recommendation-body">
                <div class="recommendation-stats">
                    <div class="stat-item">
                        <span class="stat-label">Risk Skoru</span>
                        <span class="stat-value">${birim.riskSkoru}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Durum</span>
                        <span class="stat-value ${birim.durum.toLowerCase()}">${birim.durum}</span>
                    </div>
                </div>
                <div class="recommendation-text">
                    <strong>📋 Tavsiye:</strong>
                    <p>${birim.oneri}</p>
                </div>
                <div class="recommendation-details">
                    <span>📚 Eğitim Bitecek: <strong>${birim.egitimiBitecekKisi} kişi</strong></span>
                    <span>🚨 Geçmiş Kazalar: <strong>${birim.gecmisKazalar}</strong></span>
                </div>
            </div>
        `;      
        container.appendChild(card);
    });   
    console.log(`✅ ${criticalUnits.length} birim için tavsiye kartı oluşturuldu`);
}
function displayRecommendations(data) {
    displayISGRecommendations(data);
}
// 6. WHAT-IF SİMÜLASYONU
async function loadBirimlerForSimulation() {
    try {
        console.log('🔄 What-If için birimler yükleniyor...');       
        const response = await fetch(`${API_BASE_URL}/birimler`);
        const result = await response.json();        
        console.log('📦 Birim API Yanıtı:', result);        
        if (result.success && result.data) {
            const select = document.getElementById('birim-select');           
            if (!select) {
                console.error('❌ birim-select elementi bulunamadı!');
                return;
            }
            select.innerHTML = '<option value="">-- Birim Seçiniz --</option>';
            result.data.forEach((birim, index) => {
                const option = document.createElement('option');
                option.value = birim.id;  
                option.textContent = birim.birim_adi;   
                select.appendChild(option);
                if (index === 0) {
                    console.log('📋 Örnek Birim:', {
                        id: birim.id,
                        birim_adi: birim.birim_adi,
                        id_tipi: typeof birim.id
                    });
                }
            });
            
            console.log(`✅ ${result.data.length} birim yüklendi`);
            select.addEventListener('change', function() {
                const selectedId = this.value;
                const selectedText = this.options[this.selectedIndex].text;
                console.log('🔄 Birim Seçimi Değişti:');
                console.log('  - Seçilen ID:', selectedId);
                console.log('  - Seçilen Birim:', selectedText);
                console.log('  - ID Tipi:', typeof selectedId);
            });
        } else {
            console.error('❌ Birim verisi alınamadı:', result);
        }
    } catch (error) {
        console.error('❌ Birim yükleme hatası:', error);
    }
}

async function whatIfSimulasyonu() {
    const birimId = document.getElementById('birim-select').value;
    const ekEgitimSaati = parseInt(document.getElementById('egitim-saati').value);
    console.log('=== WHAT-IF SİMÜLASYON GİRDİLERİ ===');
    console.log('Seçilen Birim ID:', birimId);
    console.log('Birim ID Tipi:', typeof birimId);
    console.log('Birim ID Boş mu?:', !birimId);
    console.log('Ek Eğitim Saati:', ekEgitimSaati);
    console.log('====================================');
    if (!birimId || birimId === '' || birimId === 'undefined') {
        console.error('❌ Birim seçimi yapılmadı!');
        alert('Lütfen bir birim seçiniz!');
        return;
    }
    if (ekEgitimSaati === 0 || isNaN(ekEgitimSaati)) {
        console.error('❌ Eğitim saati belirtilmedi!');
        alert('Lütfen ek eğitim saati belirleyiniz!');
        return;
    }
    console.log('✅ Validasyon başarılı, simülasyon başlatılıyor...');
    try {
        const response = await fetch(`${API_BASE_URL}/kds/what-if`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                birimId: birimId,
                ekEgitimSaati: ekEgitimSaati
            })
        });        
        const result = await response.json();        
        if (result.success) {
            const data = result.data;
            console.log("=== WHAT-IF SİMÜLASYON VERİSİ ===");
            console.log("Gelen Veri:", data);
            console.log("================================");
            document.getElementById('simulation-result').style.display = 'block';
            updateWhatIfKPICards(data);
            createWhatIfBarChart(data);
            updateWhatIfFinancialAnalysis(data);
            updateWhatIfRecommendation(data);          
            console.log('✅ What-If simülasyonu tamamlandı');
            document.getElementById('simulation-result').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }
    } catch (error) {
        console.error('Simülasyon hatası:', error);
        alert('Simülasyon çalıştırılırken hata oluştu!');
    }
}
function updateWhatIfKPICards(data) {
    const kpiContainer = document.getElementById('whatif-kpi-cards');
    if (!kpiContainer) return;
    const riskAzalmaYuzdesi = ((data.riskAzalmasi / data.mevcutRiskSkoru) * 100).toFixed(1);   
    kpiContainer.innerHTML = `
        <div class="kpi-card-whatif before">
            <div class="kpi-icon">📊</div>
            <div class="kpi-content">
                <h4>Mevcut Risk Skoru</h4>
                <div class="kpi-value">${data.mevcutRiskSkoru}</div>
                <p class="kpi-label">Şu Anki Durum</p>
            </div>
        </div>
        
        <div class="kpi-card-whatif after">
            <div class="kpi-icon">✅</div>
            <div class="kpi-content">
                <h4>Yeni Risk Skoru</h4>
                <div class="kpi-value success">${data.yeniRiskSkoru}</div>
                <p class="kpi-label">Eğitim Sonrası</p>
            </div>
        </div>
        
        <div class="kpi-card-whatif improvement">
            <div class="kpi-icon">📉</div>
            <div class="kpi-content">
                <h4>Risk Azalması</h4>
                <div class="kpi-value highlight">${data.riskAzalmasi}</div>
                <p class="kpi-label">${data.iyilestirmeOrani} İyileşme</p>
            </div>
        </div>
    `;
}
let whatIfBarChart = null;
function createWhatIfBarChart(data) {
    const canvas = document.getElementById('whatif-bar-chart');
    if (!canvas) return;   
    if (whatIfBarChart) {
        whatIfBarChart.destroy();
    }   
    const ctx = canvas.getContext('2d');   
    whatIfBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mevcut Durum', 'Eğitim Sonrası'],
            datasets: [{
                label: 'Risk Skoru',
                data: [data.mevcutRiskSkoru, data.yeniRiskSkoru],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)', 
                    'rgba(16, 185, 129, 0.8)'  
                ],
                borderColor: [
                    'rgb(239, 68, 68)',
                    'rgb(16, 185, 129)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Risk Skoru Karşılaştırması',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Risk Skoru: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Risk Skoru'
                    }
                }
            }
        }
    });
}
function updateWhatIfFinancialAnalysis(data) {
    const financialBox = document.getElementById('whatif-financial-box');
    if (!financialBox) return;
    const tahminiTasarruf = data.riskAzalmasi * 50000;
    const egitimMaliyeti = data.ekEgitimSaati * 500;
    const roi = egitimMaliyeti > 0 ? ((tahminiTasarruf / egitimMaliyeti) * 100).toFixed(1) : 0;
    financialBox.innerHTML = `
        <div class="financial-header">
            <h4>💰 Finansal Analiz</h4>
        </div>
        <div class="financial-grid">
            <div class="financial-item">
                <div class="financial-icon">💵</div>
                <div class="financial-content">
                    <p class="financial-label">Eğitim Maliyeti</p>
                    <p class="financial-value">${formatNumber(egitimMaliyeti)} TL</p>
                    <p class="financial-detail">${data.ekEgitimSaati} saat × 500 TL</p>
                </div>
            </div>
            <div class="financial-item">
                <div class="financial-icon">💰</div>
                <div class="financial-content">
                    <p class="financial-label">Tahmini Tasarruf</p>
                    <p class="financial-value success">${formatNumber(tahminiTasarruf)} TL</p>
                    <p class="financial-detail">Risk azalması × 50.000 TL</p>
                </div>
            </div>
            <div class="financial-item highlight">
                <div class="financial-icon">📈</div>
                <div class="financial-content">
                    <p class="financial-label">Yatırım Getirisi (ROI)</p>
                    <p class="financial-value roi">${roi}%</p>
                    <p class="financial-detail">${roi > 100 ? '✅ Yüksek Getiri' : roi > 50 ? '⚠️ Orta Getiri' : '❌ Düşük Getiri'}</p>
                </div>
            </div>
        </div>
    `;
}
function updateWhatIfRecommendation(data) {
    const recommendationBand = document.getElementById('whatif-recommendation-band');
    if (!recommendationBand) return;
    const riskAzalmaYuzdesi = ((data.riskAzalmasi / data.mevcutRiskSkoru) * 100);
    const theme = riskAzalmaYuzdesi > 20 ? 'success' : 'warning';
    const icon = riskAzalmaYuzdesi > 20 ? '✅' : '⚠️';   
    recommendationBand.className = `recommendation-band ${theme}`;
    recommendationBand.innerHTML = `
        <div class="recommendation-icon">${icon}</div>
        <div class="recommendation-content">
            <h4>Karar Önerisi</h4>
            <p>${data.oneri}</p>
            <div class="recommendation-stats">
                <span class="stat-badge">
                    <strong>Risk Azalması:</strong> ${data.riskAzalmasi} puan (${riskAzalmaYuzdesi.toFixed(1)}%)
                </span>
                <span class="stat-badge">
                    <strong>Eğitim Saati:</strong> ${data.ekEgitimSaati} saat
                </span>
            </div>
        </div>
    `;
}
// 7. BÜTÇE VE MALİYET ETKİSİ
document.getElementById('onlem-butce-slider')?.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    document.getElementById('onlem-butce-value').textContent = value.toLocaleString('tr-TR');
    const resultsPanel = document.getElementById('budget-results-panel');
    if (resultsPanel && resultsPanel.style.display !== 'none') {
        updateBudgetAnalysisRealtime(value);
    }
});
let lastBudgetAnalysisData = null;
async function analizBaslat() {
    const senaryoTipi = document.getElementById('senaryo-select').value;
    const onlemButcesi = parseInt(document.getElementById('onlem-butce-slider').value);   
    if (!senaryoTipi) {
        alert('Lütfen bir senaryo seçiniz!');
        return;
    }
    
    if (onlemButcesi === 0) {
        alert('Lütfen önlem bütçesi belirleyiniz!');
        return;
    }
    try {
        document.getElementById('budget-results-panel').style.display = 'block';
        document.getElementById('budget-initial-message').style.display = 'none';    
        const response = await fetch(`${API_BASE_URL}/kds/butce-maliyet-analizi`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                senaryoTipi: senaryoTipi,
                onlemButcesi: onlemButcesi
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            lastBudgetAnalysisData = data;
            createBudgetComparisonChart(data);
            updateRiskGauges(data);
            updateDecisionCards(data);
            updateDecisionBanner(data);
            updateCostBreakdown(data);            
            console.log('✅ Bütçe analizi tamamlandı');
            document.getElementById('budget-results-panel').scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    } catch (error) {
        console.error('Bütçe analizi hatası:', error);
        alert('Analiz yapılırken hata oluştu!');
    }
}
function updateBudgetAnalysisRealtime(yeniOnlemButcesi) {
    if (!lastBudgetAnalysisData) return;
    const updatedData = { ...lastBudgetAnalysisData };
    updatedData.maliyetler.onlemButcesi = yeniOnlemButcesi;
    updateDecisionCards(updatedData);
    updateDecisionBanner(updatedData);
    document.getElementById('breakdown-yatirim').textContent = 
        `${yeniOnlemButcesi.toLocaleString('tr-TR')} TL`;
    console.log(`🔄 Anlık güncelleme: Yeni bütçe ${yeniOnlemButcesi.toLocaleString('tr-TR')} TL`);
}
function createBudgetComparisonChart(data) {
    if (budgetComparisonChart) {
        budgetComparisonChart.destroy();
    }    
    const ctx = document.getElementById('budgetComparisonChart').getContext('2d');    
    budgetComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Maliyet Karşılaştırması'],
            datasets: [
                {
                    label: 'Önlem Yatırımı',
                    data: [data.maliyetler.onlemButcesi],
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 2
                },
                {
                    label: 'Olası Kaza Maliyeti',
                    data: [data.maliyetler.toplamKazaMaliyeti],
                    backgroundColor: '#ef4444',
                    borderColor: '#dc2626',
                    borderWidth: 2
                },
                {
                    label: 'Kalan Maliyet (Önlem Sonrası)',
                    data: [data.maliyetler.kalanMaliyet],
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 13,
                            weight: 'bold'
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 15,
                    titleFont: {
                        size: 15
                    },
                    bodyFont: {
                        size: 14
                    },
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            return `${context.dataset.label}: ${value.toLocaleString('tr-TR')} TL`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Tutar (TL)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('tr-TR') + ' TL';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
function updateRiskGauges(data) {
    document.getElementById('kalan-risk-text').textContent = `%${data.analiz.kalanRiskOrani}`;
    document.getElementById('koruma-text').textContent = `%${data.analiz.korumaOrani}`;
    const progressFill = document.getElementById('risk-progress-fill');
    progressFill.style.width = `${data.analiz.korumaOrani}%`;
    document.getElementById('risk-explanation').textContent = 
        `Bu ${data.maliyetler.onlemButcesi.toLocaleString('tr-TR')} TL yatırım ile şantiyenizi ${data.analiz.korumaOrani}% oranında "${data.senaryo.ad}" senaryosuna karşı koruyabilirsiniz.`;
}
function updateDecisionCards(data) {
    const onlemYatirimi = data.maliyetler.onlemButcesi;
    const toplamOlasiMaliyet = data.maliyetler.toplamKazaMaliyeti;
    const beklenenTasarruf = toplamOlasiMaliyet - data.maliyetler.kalanMaliyet;
    let roi = 0;
    if (onlemYatirimi > 0) {
        roi = ((beklenenTasarruf - onlemYatirimi) / onlemYatirimi) * 100;
    }
    const roiValue = document.getElementById('roi-value');
    roiValue.textContent = `%${roi.toFixed(1)}`;
    roiValue.style.color = roi > 0 ? '#10b981' : '#ef4444';
    document.getElementById('roi-desc').textContent = 
        roi > 0 
        ? `Her 1 TL yatırım, ${(roi / 100 + 1).toFixed(2)} TL getiri sağlar`
        : 'Yatırım tutarı beklenen getiriden yüksek';
    const netTasarruf = beklenenTasarruf - onlemYatirimi;
    document.getElementById('tasarruf-value').textContent = 
        `${netTasarruf.toLocaleString('tr-TR')} TL`;
    document.getElementById('tasarruf-desc').textContent = 
        netTasarruf > 0
        ? 'Yatırım ile sağlanacak net tasarruf'
        : 'Maliyet, beklenen faydadan yüksek';
    document.getElementById('ceza-value').textContent = 
        `${data.yasalRisk.tahminiCeza.toLocaleString('tr-TR')} TL`;
    document.getElementById('ceza-desc').textContent = 
        'Önlem alınmazsa kesilecek idari para cezası';
}
function updateDecisionBanner(data) {
    const banner = document.getElementById('budget-decision-banner');
    const icon = document.getElementById('decision-icon');
    const title = document.getElementById('decision-title');
    const message = document.getElementById('decision-message');
    const onlemYatirimi = data.maliyetler.onlemButcesi;
    const toplamOlasiMaliyet = data.maliyetler.toplamKazaMaliyeti;
    const beklenenTasarruf = data.maliyetler.toplamKazaMaliyeti - data.maliyetler.kalanMaliyet;
    const dinamikEsik = beklenenTasarruf * 0.8; 
    let karar = {
        durum: '',
        oncelik: '',
        mesaj: '',
        renk: '',
        icon: ''
    };
    if (onlemYatirimi < toplamOlasiMaliyet || onlemYatirimi < dinamikEsik) {
        karar.durum = 'Avantajlı';
        karar.oncelik = 'Kabul Edilmeli';
        karar.mesaj = '✅ ONAY: Yatırım tutarı makul. Beklenen tasarruf, yatırım maliyetini karşılıyor. Strateji uygulanabilir.';
        karar.renk = 'green';
        karar.icon = '✅';
    } else {
        karar.durum = data.karar?.durum || 'Dezavantajlı';
        karar.oncelik = data.karar?.oncelik || 'Reddedilmeli';
        karar.mesaj = data.karar?.mesaj || 'Yatırım tutarı beklenen getiriden yüksek. Alternatif stratejiler değerlendirilmeli.';
        karar.renk = data.karar?.renk || 'red';
        karar.icon = '❌';
    }
    banner.classList.remove('green', 'yellow', 'red');
    banner.classList.add(karar.renk);
    icon.textContent = karar.icon;
    title.textContent = `${karar.durum} - Öncelik: ${karar.oncelik}`;
    message.textContent = karar.mesaj;
}
function updateCostBreakdown(data) {
    document.getElementById('breakdown-tazminat').textContent = 
        `${data.maliyetler.maliyetKirilimi.kazaTazminati.toLocaleString('tr-TR')} TL`;    
    document.getElementById('breakdown-ceza').textContent = 
        `${data.maliyetler.maliyetKirilimi.idariCeza.toLocaleString('tr-TR')} TL`;   
    document.getElementById('breakdown-iskaybi').textContent = 
        `${data.maliyetler.maliyetKirilimi.isKaybi.toLocaleString('tr-TR')} TL`;   
    document.getElementById('breakdown-toplam').textContent = 
        `${data.maliyetler.maliyetKirilimi.toplam.toLocaleString('tr-TR')} TL`;   
    document.getElementById('breakdown-yatirim').textContent = 
        `${data.maliyetler.onlemButcesi.toLocaleString('tr-TR')} TL`;
}
// 8. STRATEJİK VARDİYA PLANLAYICI
let currentVardiyaData = null;
let allPersonelData = []; 
async function loadVardiyaAnalizi(gelecekAy = 1) {
    try {
        AppState.updateVardiya({ seciliAy: gelecekAy });
        const response = await fetch(`${API_BASE_URL}/kds/vardiya-analizi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gelecekAy })
        });
        const result = await response.json();        
        if (result.success) {
            currentVardiyaData = result.data;
            allPersonelData = result.data.personelDurumlari || []; 
            console.log("=== VARDIYA ANALİZİ HAM VERİ ===");
            console.log("Gelen Ham Veri:", result.data);
            console.log("Personel Durumları:", result.data.personelDurumlari);
            if (result.data.personelDurumlari && result.data.personelDurumlari.length > 0) {
                console.log("İlk Personel Örneği:", result.data.personelDurumlari[0]);
                console.log("Personel Adı Alanı:", result.data.personelDurumlari[0].personelAdi);
            }
            console.log("=================================");
            document.getElementById('selected-future-date').textContent = 
                new Date(result.data.gelecekTarih).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            updateVardiyaStats(result.data.istatistikler, result.data.maliyet);
            populateSertifikaTable(result.data.personelDurumlari);
            createYetkinlikChart(result.data.istatistikler);
            await populateBirimSelect();
            populateFilterOptions(result.data.personelDurumlari);
            setupFilterListeners();
            console.log('✅ Vardiya analizi yüklendi');
        }
    } catch (error) {
        console.error('Vardiya analizi hatası:', error);
        alert('Vardiya verileri yüklenirken hata oluştu!');
    }
}
function updateVardiyaStats(stats, maliyet) {
    document.getElementById('uygun-personel-count').textContent = stats.uygunPersonel;
    document.getElementById('dolacak-sertifika-count').textContent = stats.sertifikaDolacakPersonel;
    document.getElementById('egitim-gereken-count').textContent = stats.egitimGereken;
    document.getElementById('toplam-egitim-maliyet').textContent = 
        `${formatNumber(maliyet.toplamEgitimMaliyeti)} TL`;
}
function populateSertifikaTable(personelDurumlari) {
    const tbody = document.getElementById('sertifika-tbody');
    tbody.innerHTML = '';   
    if (!personelDurumlari || personelDurumlari.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem; color: #6b7280;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                    <strong style="font-size: 1.1rem; display: block; margin-bottom: 0.5rem;">
                        Seçilen kriterlere uygun personel bulunamadı
                    </strong>
                    <p style="font-size: 0.9rem;">Lütfen filtreleri değiştirerek tekrar deneyin</p>
                </td>
            </tr>
        `;
        return;
    }
    console.log("=== TABLO DOLDURMA BAŞLADI ===");
    console.log("Toplam Kayıt:", personelDurumlari.length);
    
    personelDurumlari.forEach((item, index) => {
        if (index === 0) {
            console.log("İlk Kayıt Detayı:", item);
            console.log("- personelAdi:", item.personelAdi);
            console.log("- ad_soyad:", item.ad_soyad);
            console.log("- personel?.ad_soyad:", item.personel?.ad_soyad);
        }       
        const row = document.createElement('tr');        
        if (item.durumRenk === 'red') {
            row.style.backgroundColor = '#fee2e2';
        } else if (item.durumRenk === 'orange') {
            row.style.backgroundColor = '#fed7aa';
        } else if (item.durumRenk === 'yellow') {
            row.style.backgroundColor = '#fef3c7';
        }   
        const isPlanned = AppState.vardiya.egitimPlanlananlar.includes(item.personelId);
        const personelAdi = item.personelAdi || item.ad_soyad || item.personel?.ad_soyad || 'Bilinmeyen';
        const birimAdi = item.birimAdi || item.birim_adi || item.birimler?.birim_adi || '-';
        const egitimAdi = item.egitimAdi || item.egitim_adi || item.egitimler?.egitim_adi || 'Bilinmeyen';
        const gecerlilikTarihi = item.gecerlilikSonu ? 
            new Date(item.gecerlilikSonu).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }) : '-';
        const kalanGunText = item.kalanGun !== null && item.kalanGun !== undefined ? 
            (item.kalanGun < 0 ? 
                `<span style="color: #ef4444; font-weight: 700;">Süresi Dolmuş (${Math.abs(item.kalanGun)} gün geçti)</span>` : 
                `${item.kalanGun} gün`) : 
            '-';
        const maliyetText = item.egitimMaliyeti !== null && item.egitimMaliyeti !== undefined ? 
            formatNumber(item.egitimMaliyeti) + ' TL' : 
            '-';
        const durum = item.durum || '-';
        const durumRenk = item.durumRenk || 'gray';
        row.innerHTML = `
            <td><strong>${personelAdi}</strong> <span class="accordion-icon">▼</span></td>
            <td>${birimAdi}</td>
            <td>${egitimAdi}</td>
            <td>${gecerlilikTarihi}</td>
            <td>${kalanGunText}</td>
            <td><span class="durum-badge ${durumRenk}">${durum}</span></td>
            <td><strong>${maliyetText}</strong></td>
            <td>
                ${item.egitimGerekli ? 
                    `<button class="btn-egitim-planla" 
                            onclick="egitimPlanla('${item.personelId}', ${item.egitimMaliyeti || 0})"
                            ${isPlanned ? 'disabled' : ''}>
                        ${isPlanned ? '✅ Planlandı' : '📚 Eğitim Planla'}
                    </button>` 
                    : '<span style="color: #10b981; font-weight: 600;">✅ Uygun</span>'}
            </td>
        `;
        row.style.cursor = 'pointer';
        row.classList.add('accordion-row');
        const detailRow = document.createElement('tr');
        detailRow.classList.add('detail-row');
        detailRow.style.display = 'none';
        detailRow.innerHTML = `
            <td colspan="8" class="detail-cell">
                <div class="detail-panel">
                    <div class="detail-section">
                        <h4>📊 Risk Profili</h4>
                        <p><strong>Risk Skoru:</strong> ${item.kalanGun < 0 ? '🔴 Yüksek' : item.kalanGun <= 30 ? '🟡 Orta' : '🟢 Düşük'}</p>
                        <p><strong>Öncelik:</strong> ${item.egitimGerekli ? 'Acil' : 'Normal'}</p>
                    </div>
                    <div class="detail-section">
                        <h4>👤 Personel Bilgileri</h4>
                        <p><strong>Personel ID:</strong> ${item.personelId || '-'}</p>
                        <p><strong>Birim:</strong> ${birimAdi}</p>
                        <p><strong>Mevcut Eğitim:</strong> ${egitimAdi}</p>
                    </div>
                    <div class="detail-section">
                        <h4>💰 Maliyet Analizi</h4>
                        <p><strong>Eğitim Maliyeti:</strong> ${maliyetText}</p>
                        <p><strong>Planlama Durumu:</strong> ${isPlanned ? '✅ Planlandı' : '⏳ Bekliyor'}</p>
                    </div>
                </div>
            </td>
        `;
        row.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-egitim-planla')) return;            
            const isOpen = detailRow.style.display === 'table-row';
            detailRow.style.display = isOpen ? 'none' : 'table-row';           
            const icon = row.querySelector('.accordion-icon');
            if (icon) {
                icon.textContent = isOpen ? '▼' : '▲';
            }
        });       
        tbody.appendChild(row);
        tbody.appendChild(detailRow);
    });
    console.log("=== TABLO DOLDURMA TAMAMLANDI ===");
}
function populateFilterOptions(personelDurumlari) {
    if (!personelDurumlari || personelDurumlari.length === 0) return;
    const birimler = [...new Set(personelDurumlari.map(p => p.birimAdi || p.birim_adi || '-'))].filter(b => b !== '-').sort();
    const birimSelect = document.getElementById('filter-birim');
    birimSelect.innerHTML = '<option value="">Tüm Birimler</option>';
    birimler.forEach(birim => {
        const option = document.createElement('option');
        option.value = birim;
        option.textContent = birim;
        birimSelect.appendChild(option);
    });
    const egitimler = [...new Set(personelDurumlari.map(p => p.egitimAdi || p.egitim_adi || '-'))].filter(e => e !== '-' && e !== 'Bilinmeyen').sort();
    const egitimSelect = document.getElementById('filter-egitim');
    egitimSelect.innerHTML = '<option value="">Tüm Eğitimler</option>';
    egitimler.forEach(egitim => {
        const option = document.createElement('option');
        option.value = egitim;
        option.textContent = egitim;
        egitimSelect.appendChild(option);
    });   
    console.log('✅ Filtre seçenekleri dolduruldu');
}
function setupFilterListeners() {
    const birimFilter = document.getElementById('filter-birim');
    const egitimFilter = document.getElementById('filter-egitim');
    const durumFilter = document.getElementById('filter-durum');
    const clearBtn = document.getElementById('clear-filters-btn');    
    if (birimFilter) birimFilter.addEventListener('change', filterVardiyaTable);
    if (egitimFilter) egitimFilter.addEventListener('change', filterVardiyaTable);
    if (durumFilter) durumFilter.addEventListener('change', filterVardiyaTable);   
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            birimFilter.value = '';
            egitimFilter.value = '';
            durumFilter.value = '';
            filterVardiyaTable();
        });
    }
}
function filterVardiyaTable() {
    const birimFilter = document.getElementById('filter-birim').value;
    const egitimFilter = document.getElementById('filter-egitim').value;
    const durumFilter = document.getElementById('filter-durum').value;   
    console.log('🔍 Filtreler:', { birimFilter, egitimFilter, durumFilter });
    let filteredData = allPersonelData.filter(item => {
        const birimAdi = item.birimAdi || item.birim_adi || '-';
        const egitimAdi = item.egitimAdi || item.egitim_adi || '-';
        const durum = item.durum || '-';       
        const birimMatch = !birimFilter || birimAdi === birimFilter;
        const egitimMatch = !egitimFilter || egitimAdi === egitimFilter;
        const durumMatch = !durumFilter || durum === durumFilter;       
        return birimMatch && egitimMatch && durumMatch;
    });    
    console.log(`📊 Filtreleme sonucu: ${filteredData.length} / ${allPersonelData.length} kayıt`);
    populateSertifikaTable(filteredData);
    updateFilteredStats(filteredData);
}
function updateFilteredStats(filteredData) {
    const uygun = filteredData.filter(p => p.durum === 'Uygun').length;
    const dolacak = filteredData.filter(p => p.durum === 'Yenileme Yaklaşıyor' || p.durum === 'Acil Yenileme').length;
    const gereken = filteredData.filter(p => p.durum === 'Süresi Dolmuş').length;
    const toplamMaliyet = filteredData
        .filter(p => p.egitimGerekli)
        .reduce((sum, p) => sum + (p.egitimMaliyeti || 0), 0);   
    document.getElementById('uygun-personel-count').textContent = uygun;
    document.getElementById('dolacak-sertifika-count').textContent = dolacak;
    document.getElementById('egitim-gereken-count').textContent = gereken;
    document.getElementById('toplam-egitim-maliyet').textContent = `${formatNumber(toplamMaliyet)} TL`;
}
function createYetkinlikChart(stats) {
    if (yetkinlikChart) {
        yetkinlikChart.destroy();
    }
    const ctx = document.getElementById('yetkinlikChart').getContext('2d');    
    yetkinlikChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Uygun', 'Sertifika Dolacak', 'Eğitim Gerekli'],
            datasets: [{
                data: [stats.uygunPersonel, stats.sertifikaDolacakPersonel, stats.egitimGereken],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderColor: ['#fff', '#fff', '#fff'],
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12, weight: '600' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} kişi (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    const durumText = document.getElementById('yetkinlik-durum-text');
    if (stats.yetkinlikOrani >= 80) {
        durumText.textContent = `Mükemmel (%${stats.yetkinlikOrani})`;
        durumText.style.color = '#10b981';
    } else if (stats.yetkinlikOrani >= 60) {
        durumText.textContent = `Orta (%${stats.yetkinlikOrani})`;
        durumText.style.color = '#f59e0b';
    } else {
        durumText.textContent = `Kritik (%${stats.yetkinlikOrani})`;
        durumText.style.color = '#ef4444';
    }
}
async function populateBirimSelect() {
    try {
        const response = await fetch(`${API_BASE_URL}/birimler`);
        const result = await response.json();
        
        const select = document.getElementById('vardiya-birim-select');
        if (!select) return;
        select.innerHTML = '<option value="">Birim seçin...</option>';
        const birimListesi = result.data || result; 
        if (Array.isArray(birimListesi)) {
            birimListesi.forEach(birim => {
                const option = document.createElement('option');
                option.value = birim.id;
                option.textContent = birim.birim_adi || birim.birimAdi || "İsimsiz Birim";
                select.appendChild(option);
            });
            console.log("✅ Birim listesi başarıyla yüklendi.");
        } else {
            console.error("❌ Birim verisi bir liste (array) değil:", birimListesi);
        }
    } catch (error) {
        console.error('Birim yükleme hatası:', error);
    }
}
async function egitimPlanla(personelId, egitimMaliyeti) {
    try {
        AppState.vardiya.egitimPlanlananlar.push(personelId);
        const response = await fetch(`${API_BASE_URL}/kds/vardiya-egitim-planla`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                personelId, 
                egitimMaliyeti,
                birimId: AppState.vardiya.seciliBirim
            })
        });        
        const result = await response.json();       
        if (result.success) {
            // Bütçe state'ini güncelle
            AppState.updateBudget({
                ekEgitimMaliyeti: AppState.budget.ekEgitimMaliyeti + egitimMaliyeti,
                riskAzalmasi: AppState.budget.riskAzalmasi + result.data.riskAzalmasi
            });
            populateSertifikaTable(currentVardiyaData.personelDurumlari);
            showCrossPanelAlert(
                `📚 Eğitim planlandı: +${formatNumber(egitimMaliyeti)} TL bütçeye eklendi. Risk skoru %${result.data.riskAzalmasi} azaldı.`
            );           
            console.log('✅ Eğitim planlandı, bütçe güncellendi');
        }
    } catch (error) {
        console.error('Eğitim planlama hatası:', error);
        alert('Eğitim planlanırken hata oluştu!');
    }
}
async function vardiyaPersonelDegistir() {
    try {
        const birimId = document.getElementById('vardiya-birim-select').value;
        const personelSayisi = parseInt(document.getElementById('personel-sayisi-slider').value);
        const vardiyaSaati = parseInt(document.getElementById('vardiya-saati-slider').value);        
        if (!birimId) {
            alert('Lütfen bir birim seçin!');
            return;
        }       
        AppState.updateVardiya({ 
            seciliBirim: birimId, 
            personelSayisi, 
            vardiyaSaati 
        });        
        const response = await fetch(`${API_BASE_URL}/kds/vardiya-personel-degistir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birimId, yeniPersonelSayisi: personelSayisi, vardiyaSaati })
        });        
        const result = await response.json();        
        if (result.success) {
            AppState.updateBudget({
                ekIscilikMaliyeti: result.data.aylikIscilikMaliyeti,
                riskAzalmasi: AppState.budget.riskAzalmasi + result.data.riskAzalmasi
            });
            document.getElementById('iscilik-maliyet-preview').textContent = 
                formatNumber(result.data.aylikIscilikMaliyeti) + ' TL';
            document.getElementById('risk-azalma-preview').textContent = 
                result.data.riskAzalmasi + '%';
            document.getElementById('vardiya-impact-preview').style.display = 'block';
            showCrossPanelAlert(
                `👥 Vardiya planı güncellendi: ${personelSayisi} personel, ${vardiyaSaati} saat. ` +
                `Aylık maliyet: ${formatNumber(result.data.aylikIscilikMaliyeti)} TL. ` +
                `Risk %${result.data.riskAzalmasi} azaldı.`
            );           
            console.log('✅ Vardiya planı uygulandı, bütçe güncellendi');
        }
    } catch (error) {
        console.error('Vardiya güncelleme hatası:', error);
        alert('Vardiya güncellenirken hata oluştu!');
    }
}
function showCrossPanelAlert(message) {
    const alert = document.getElementById('cross-panel-alert');
    document.getElementById('cross-panel-message').textContent = message;
    alert.style.display = 'flex';
    setTimeout(() => {
        alert.style.display = 'none';
    }, 10000);
}
function goToBudgetPanel() {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('butce-maliyet').classList.add('active');
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('[data-section="butce-maliyet"]').classList.add('active');
    updateBudgetPanelFromState();
}
function updateBudgetPanelFromState() {
    if (AppState.budget.ekEgitimMaliyeti > 0 || AppState.budget.ekIscilikMaliyeti > 0) {
        const toplamEkMaliyet = AppState.budget.ekEgitimMaliyeti + AppState.budget.ekIscilikMaliyeti;
        const newBudget = AppState.budget.onlemButcesi + toplamEkMaliyet;
        document.getElementById('onlem-butcesi').value = newBudget;
        document.getElementById('butce-value').textContent = formatNumber(newBudget);
        loadButceMaliyetAnalizi();
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const timeButtons = document.querySelectorAll('.time-btn');
    timeButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            timeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const savedFilters = {
                birim: document.getElementById('filter-birim')?.value || '',
                egitim: document.getElementById('filter-egitim')?.value || '',
                durum: document.getElementById('filter-durum')?.value || ''
            };
            const month = parseInt(btn.dataset.month);
            await loadVardiyaAnalizi(month);
            setTimeout(() => {
                if (document.getElementById('filter-birim')) {
                    document.getElementById('filter-birim').value = savedFilters.birim;
                    document.getElementById('filter-egitim').value = savedFilters.egitim;
                    document.getElementById('filter-durum').value = savedFilters.durum;
                    if (savedFilters.birim || savedFilters.egitim || savedFilters.durum) {
                        filterVardiyaTable();
                    }
                }
            }, 100);
        });
    });
    const personelSlider = document.getElementById('personel-sayisi-slider');
    const personelValue = document.getElementById('personel-sayisi-value');
    if (personelSlider && personelValue) {
        personelSlider.addEventListener('input', () => {
            personelValue.textContent = personelSlider.value;
        });
    }
    const vardiyaSlider = document.getElementById('vardiya-saati-slider');
    const vardiyaValue = document.getElementById('vardiya-saati-value');
    if (vardiyaSlider && vardiyaValue) {
        vardiyaSlider.addEventListener('input', () => {
            vardiyaValue.textContent = vardiyaSlider.value;
        });
    }
});
// 9. EKİPMAN ÖMRÜ VE BAKIM TAHMİNİ
async function loadEkipmanBakimTahmini() {
    try {
        const response = await fetch(`${API_BASE_URL}/kds/ekipman-bakim-tahmini`);
        const result = await response.json();
        if (result.success) {
            const data = result.data;
            console.log("=== EKİPMAN BAKIM TAHMİNİ VERİSİ ===");
            console.log("Ekipman Analizleri:", data.ekipmanAnalizleri);
            console.log("Maliyet Tahmini:", data.maliyetTahmini);
            console.log("====================================");
            document.getElementById('equip-iyi-count').textContent = data.istatistikler.iyiDurumda;
            document.getElementById('equip-dikkat-count').textContent = data.istatistikler.dikkat;
            document.getElementById('equip-kritik-count').textContent = data.istatistikler.kritik;
            document.getElementById('equip-yenileme-count').textContent = data.istatistikler.yenilemeSuggest;
            if (data.maliyetTahmini) {
                const maliyetKPI = document.getElementById('maliyet-kpi-container');
                if (maliyetKPI) {
                    maliyetKPI.innerHTML = `
                        <div class="kpi-card-large">
                            <div class="kpi-icon">💰</div>
                            <div class="kpi-content">
                                <h3>${formatNumber(data.maliyetTahmini.toplamTahminiMaliyet)} TL</h3>
                                <p>Toplam Tahmini Maliyet (12 Ay)</p>
                            </div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-icon">🔧</div>
                            <div class="kpi-content">
                                <h4>${data.maliyetTahmini.gelecek12AyBakimSayisi} Bakım</h4>
                                <p>${formatNumber(data.maliyetTahmini.toplamTahminiBakimMaliyeti)} TL</p>
                            </div>
                        </div>
                        <div class="kpi-card warning">
                            <div class="kpi-icon">⚠️</div>
                            <div class="kpi-content">
                                <h4>${data.maliyetTahmini.acilBakimSayisi} Acil Bakım</h4>
                                <p>${formatNumber(data.maliyetTahmini.acilBakimMaliyeti)} TL</p>
                            </div>
                        </div>
                        <div class="kpi-card critical">
                            <div class="kpi-icon">🔄</div>
                            <div class="kpi-content">
                                <h4>${data.maliyetTahmini.yenilemeSayisi} Yenileme</h4>
                                <p>${formatNumber(data.maliyetTahmini.yenilemeMaliyeti)} TL</p>
                            </div>
                        </div>
                    `;
                }
            }
            const avgHealth = data.ortalamaSaglik;
            document.getElementById('average-health-score').textContent = `${avgHealth.toFixed(1)}%`;
            document.getElementById('health-gauge-text').textContent = `${avgHealth.toFixed(0)}%`;
            const banner = document.getElementById('equip-health-banner');
            const bannerIcon = document.querySelector('.health-banner-icon');
            const bannerMessage = document.getElementById('health-banner-message');
            const gaugeCircle = document.getElementById('health-gauge-circle');
            banner.className = 'equipment-health-banner';
            if (avgHealth >= 70) {
                banner.classList.add('good');
                bannerIcon.textContent = '💚';
                bannerMessage.textContent = 'Filo genel durumu iyi. Rutin kontroller devam etmelidir.';
                gaugeCircle.style.background = 'linear-gradient(135deg, #d1fae5, #a7f3d0)';
                gaugeCircle.style.borderColor = '#10b981';
            } else if (avgHealth >= 50) {
                banner.classList.add('warning');
                bannerIcon.textContent = '⚠️';
                bannerMessage.textContent = 'Dikkat! Bazı ekipmanlarda bakım gecikmesi var. Önleyici bakım planlanmalıdır.';
                gaugeCircle.style.background = 'linear-gradient(135deg, #fef3c7, #fde68a)';
                gaugeCircle.style.borderColor = '#f59e0b';
            } else {
                banner.classList.add('critical');
                bannerIcon.textContent = '🚨';
                bannerMessage.textContent = 'KRİTİK DURUM! Acil müdahale gerektiren ekipmanlar var. Hemen önlem alınmalıdır.';
                gaugeCircle.style.background = 'linear-gradient(135deg, #fee2e2, #fecaca)';
                gaugeCircle.style.borderColor = '#ef4444';
            }
            const equipmentList = document.getElementById('equipment-health-list');
            equipmentList.innerHTML = '';
            data.ekipmanAnalizleri.forEach(ekipman => {
                const itemDiv = document.createElement('div');
                itemDiv.className = `equipment-health-item ${ekipman.durumRenk}`;
                itemDiv.innerHTML = `
                    <div class="equipment-header">
                        <div class="equipment-name">${ekipman.ekipmanAdi}</div>
                        <div class="equipment-badges">
                            <span class="equipment-badge ${ekipman.durumRenk}">${ekipman.durum}</span>
                        </div>
                    </div>
                    <div class="equipment-info-row">
                        <div class="equipment-info-item">
                            <span class="equipment-info-label">Seri No</span>
                            <span class="equipment-info-value">${ekipman.seriNo}</span>
                        </div>
                        <div class="equipment-info-item">
                            <span class="equipment-info-label">Birim</span>
                            <span class="equipment-info-value">${ekipman.birimAdi}</span>
                        </div>
                        <div class="equipment-info-item">
                            <span class="equipment-info-label">Son Bakım</span>
                            <span class="equipment-info-value">${ekipman.sonBakimTarihi}</span>
                        </div>
                        <div class="equipment-info-item">
                            <span class="equipment-info-label">Sonraki Bakım</span>
                            <span class="equipment-info-value">${ekipman.sonrakiBakimTarihi} ${ekipman.kalanGun < 0 ? '(GEÇMİŞ!)' : `(${ekipman.kalanGun} gün)`}</span>
                        </div>
                    </div>
                    <div class="equipment-health-bar">
                        <div class="health-bar-label">
                            <span class="health-bar-label-text">Sağlık Skoru:</span>
                            <span class="health-bar-percentage ${ekipman.durumRenk}">${ekipman.saglikSkoru}%</span>
                        </div>
                        <div class="health-progress-container">
                            <div class="health-progress-fill ${ekipman.durumRenk}" style="width: ${ekipman.saglikSkoru}%"></div>
                        </div>
                    </div>
                    <div class="equipment-info-row" style="margin-top: 1rem;">
                        <div class="equipment-info-item">
                            <span class="equipment-info-label">Kalan Ömür (Yıl)</span>
                            <span class="equipment-info-value">${ekipman.kalanOmurYil} yıl (${ekipman.kalanOmurOrani.toFixed(0)}%)</span>
                        </div>
                        <div class="equipment-info-item">
                            <span class="equipment-info-label">Ekonomik Durum</span>
                            <span class="equipment-info-value">${ekipman.ekonomikDurum}</span>
                        </div>
                    </div>
                `;
                equipmentList.appendChild(itemDiv);
            });
            const kritikEkipmanlar = data.ekipmanAnalizleri.filter(e => e.saglikSkoru < 40);
            const criticalCard = document.getElementById('critical-equipment-card');
            const criticalList = document.getElementById('critical-equipment-list');
            if (kritikEkipmanlar.length > 0) {
                criticalCard.style.display = 'block';
                criticalList.innerHTML = '';
                kritikEkipmanlar.forEach(ekipman => {
                    const alertDiv = document.createElement('div');
                    alertDiv.className = 'critical-alert-item';
                    alertDiv.innerHTML = `
                        <div class="critical-alert-header">
                            <span class="critical-alert-icon">🚨</span>
                            <span class="critical-alert-title">${ekipman.ekipmanAdi} (${ekipman.birimAdi})</span>
                        </div>
                        <div class="critical-alert-message">${ekipman.stratejikOneri}</div>
                    `;
                    criticalList.appendChild(alertDiv);
                });
            } else {
                criticalCard.style.display = 'none';
            }
            populateEkipmanKararTablosu(data.ekipmanAnalizleri);
            createEkipmanBirimRiskGrafik(data.ekipmanAnalizleri);
            setupEkipmanFilters(data.ekipmanAnalizleri, data.bakimTakvimi);
            initializeAccordions();
            const timeline = document.getElementById('maintenance-timeline');
            timeline.innerHTML = '';
            const timelineItems = data.bakimTakvimi.slice(0, 10); 
            timelineItems.forEach(bakim => {
                const timelineDiv = document.createElement('div');
                let urgencyClass = 'normal';
                if (bakim.kalanGun < 0) {
                    urgencyClass = 'urgent';
                } else if (bakim.kalanGun <= 30) {
                    urgencyClass = 'soon';
                }
                timelineDiv.className = `timeline-item ${urgencyClass}`;
                timelineDiv.innerHTML = `
                    <span class="timeline-date">${bakim.bakimTarihi}</span>
                    <span class="timeline-equipment">${bakim.ekipmanAdi} - ${bakim.birimAdi}</span>
                    <span class="timeline-days">${bakim.kalanGun < 0 ? 'GEÇMİŞ!' : `${bakim.kalanGun} gün kaldı`}</span>
                `;
                timeline.appendChild(timelineDiv);
            });
            const tableBody = document.getElementById('maintenance-schedule-tbody');
            tableBody.innerHTML = '';
            data.bakimTakvimi.forEach(bakim => {
                const row = document.createElement('tr');
                let statusClass = '';
                let statusText = '';
                if (bakim.kalanGun < 0) {
                    statusClass = 'status-critical';
                    statusText = 'GEÇMİŞ';
                } else if (bakim.kalanGun <= 15) {
                    statusClass = 'status-critical';
                    statusText = 'ACİL';
                } else if (bakim.kalanGun <= 30) {
                    statusClass = 'status-warning';
                    statusText = 'YAKIN';
                } else {
                    statusClass = 'status-success';
                    statusText = 'PLANLI';
                }
                row.innerHTML = `
                    <td>${bakim.ekipmanAdi}</td>
                    <td>${bakim.birimAdi}</td>
                    <td>${bakim.bakimTarihi}</td>
                    <td>${bakim.kalanGun < 0 ? 'GEÇMİŞ' : `${bakim.kalanGun} gün`}</td>
                    <td>${bakim.ay}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                `;
                tableBody.appendChild(row);
            });
            console.log('✅ Ekipman Bakım Tahmini yüklendi');
        }
    } catch (error) {
        console.error('Ekipman Bakım Tahmini hatası:', error);
        alert('Ekipman verileri yüklenirken hata oluştu!');
    }
}
// 9. AKILLI EKİPMAN RİSK ANALİZİ
async function loadEkipmanRiskAnalizi() {
    try {
        const response = await fetch('http://localhost:3000/api/kds/ekipman-risk-analizi');
        const result = await response.json();
        if (result.success && result.data) {
            const stats = result.data.istatistikler;
            document.getElementById('total-equipment-count').textContent = stats.toplam_ekipman;
            document.getElementById('emergency-maintenance-count').textContent = stats.acil_bakim_gereken;
            document.getElementById('critical-equipment-count').textContent = stats.kritik_ekipman;
            document.getElementById('safe-equipment-count').textContent = stats.guvenli_ekipman;
            const tbody = document.getElementById('ekipman-risk-tbody');
            if (!tbody) return;
            tbody.innerHTML = ''; 
            result.data.ekipmanAnalizleri.forEach(item => {
                const row = document.createElement('tr');
                let badgeClass = 'badge-guvenli';
                if (item.kritiklik === 'Kritik') badgeClass = 'badge-kritik';
                else if (item.kritiklik === 'Yüksek' || item.kritiklik === 'Orta') badgeClass = 'badge-orta';
                row.innerHTML = `
                    <td><strong>${item.ekipman_adi}</strong></td>
                    <td style="text-align: center;">${item.toplam_kaza}</td>
                    <td><span class="risk-badge ${badgeClass}">${item.kritiklik}</span></td>
                    <td style="font-size: 0.85rem;">${item.karar_onerisi}</td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (err) {
        console.error("Dashboard eşleşme hatası:", err);
    }
}
function populateEkipmanRiskTablosu(ekipmanlar) {
    const tbody = document.getElementById('ekipman-risk-tbody');    
    if (!tbody) {
        console.warn('⚠️ ekipman-risk-tbody tablosu bulunamadı!');
        return;
    }   
    tbody.innerHTML = '';   
    if (!ekipmanlar || ekipmanlar.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #6b7280;">Ekipman verisi bulunamadı.</td></tr>';
        return;
    }    
    ekipmanlar.forEach(ekipman => {
        const row = document.createElement('tr');
        let badgeClass = 'badge-success';
        if (ekipman.kritiklik === 'Kritik') badgeClass = 'badge-danger';
        else if (ekipman.kritiklik === 'Yüksek') badgeClass = 'badge-warning';
        else if (ekipman.kritiklik === 'Orta') badgeClass = 'badge-info';
        let kdsAnaliz = '-';
        if (ekipman.kazalar && ekipman.kazalar.length > 0) {
            kdsAnaliz = ekipman.kazalar[0].kds_analiz_notu || ekipman.kazalar[0].kaza_aciklamasi || '-';
            if (kdsAnaliz.length > 80) {
                kdsAnaliz = kdsAnaliz.substring(0, 80) + '...';
            }
        }       
        row.innerHTML = `
            <td>
                <strong>${ekipman.ekipman_adi}</strong>
                <br>
                <small style="color: #6b7280;">${ekipman.ekipman_tipi || 'Tip Belirtilmemiş'}</small>
            </td>
            <td style="text-align: center;">
                <span style="font-size: 1.5rem; font-weight: 700; color: ${ekipman.toplam_kaza > 2 ? '#ef4444' : ekipman.toplam_kaza > 0 ? '#f59e0b' : '#10b981'};">
                    ${ekipman.toplam_kaza}
                </span>
            </td>
            <td style="text-align: center;">
                <span class="badge ${badgeClass}">
                    ${ekipman.kritiklik}
                </span>
            </td>
            <td>
                <div style="margin-bottom: 0.5rem;">
                    ${ekipman.karar_onerisi}
                </div>
                ${ekipman.toplam_kaza > 0 ? `
                    <div style="font-size: 0.875rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 0.5rem; margin-top: 0.5rem;">
                        <strong>📋 KDS Analiz Notu:</strong> ${kdsAnaliz}
                    </div>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log(`✅ ${ekipmanlar.length} ekipman risk tablosu dolduruldu`);
}
function updateEkipmanRiskStats(istatistikler) {
    const totalEkipman = document.getElementById('risk-total-ekipman');
    const acilBakim = document.getElementById('risk-acil-bakim');
    const kritikEkipman = document.getElementById('risk-kritik-ekipman');
    const guvenliEkipman = document.getElementById('risk-guvenli-ekipman'); 
    if (totalEkipman) totalEkipman.textContent = istatistikler.toplam_ekipman;
    if (acilBakim) acilBakim.textContent = istatistikler.acil_bakim_gereken;
    if (kritikEkipman) kritikEkipman.textContent = istatistikler.kritik_ekipman;
    if (guvenliEkipman) guvenliEkipman.textContent = istatistikler.guvenli_ekipman;
    console.log('✅ Ekipman risk istatistikleri güncellendi');
}
function populateEkipmanKararTablosu(ekipmanlar) {
    const tbody = document.getElementById('ekipman-karar-tbody');
    if (!tbody) return;   
    tbody.innerHTML = '';   
    if (!ekipmanlar || ekipmanlar.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Ekipman bulunamadı</td></tr>';
        return;
    }
    const sortedEkipmanlar = [...ekipmanlar].sort((a, b) => a.saglikSkoru - b.saglikSkoru);
    sortedEkipmanlar.forEach(ekipman => {
        const row = document.createElement('tr');
        if (ekipman.durumRenk === 'red') {
            row.style.backgroundColor = '#fee2e2';
        } else if (ekipman.durumRenk === 'yellow') {
            row.style.backgroundColor = '#fef3c7';
        }
        const sonBakimTarihi = ekipman.sonBakimTarihi ? 
            new Date(ekipman.sonBakimTarihi).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }) : '-';
        const sonrakiBakimTarihi = ekipman.sonrakiBakimTarihi ? 
            new Date(ekipman.sonrakiBakimTarihi).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }) : '-';
        let saglikBadgeClass = 'badge ';
        let progressBarColor = '';       
        if (ekipman.saglikSkoru >= 70) {
            saglikBadgeClass += 'guvenli';
            progressBarColor = 'linear-gradient(90deg, #10b981, #059669)';
        } else if (ekipman.saglikSkoru >= 40) {
            saglikBadgeClass += 'orta';
            progressBarColor = 'linear-gradient(90deg, #fbbf24, #f59e0b)';
        } else {
            saglikBadgeClass += 'kritik';
            progressBarColor = 'linear-gradient(90deg, #ef4444, #dc2626)';
        }
        const seriNoDisplay = ekipman.seriNo && ekipman.seriNo !== 'N/A' 
            ? ekipman.seriNo 
            : '<span style="color: #cbd5e1; font-style: italic; font-size: 0.85rem;">N/A</span>';
        let stratejikKarar = '';
        let kararIcon = '';
        let kararClass = '';        
        if (ekipman.saglikSkoru < 10 && ekipman.kalanOmurYil < 2) {
            stratejikKarar = 'YENİLEME GEREKLİ';
            kararIcon = '🔄';
            kararClass = 'karar-yenileme';
        } else if (ekipman.saglikSkoru < 30) {
            stratejikKarar = 'ACİL BAKIM';
            kararIcon = '🚨';
            kararClass = 'karar-acil';
        } else if (ekipman.saglikSkoru < 50) {
            stratejikKarar = 'BAKIM PLANLA';
            kararIcon = '⚠️';
            kararClass = 'karar-planla';
        } else {
            stratejikKarar = 'RUTİN TAKİP';
            kararIcon = '✅';
            kararClass = 'karar-rutin';
        }        
        row.innerHTML = `
            <td><strong>${ekipman.ekipmanAdi || 'Bilinmeyen'}</strong></td>
            <td>${seriNoDisplay}</td>
            <td>${ekipman.birimAdi || '-'}</td>
            <td><strong>${ekipman.kalanOmurYil} yıl</strong></td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${ekipman.saglikSkoru}%; height: 100%; background: ${progressBarColor}; transition: width 0.3s ease;"></div>
                    </div>
                    <span class="${saglikBadgeClass}" style="font-weight: 700;">
                    ${ekipman.saglikSkoru}%
                </span>
                </div>
            </td>
            <td>
                <span class="karar-badge ${kararClass}">
                    ${kararIcon} ${stratejikKarar}
                </span>
            </td>
            <td style="font-size: 0.85rem; color: #6b7280;">
                ${ekipman.stratejikOneri || '-'}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}
function initializeAccordions() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const content = document.getElementById(targetId);
            this.classList.toggle('active');
            content.classList.toggle('active');
        });
    });
    
    console.log('✅ Akordeon yapısı başlatıldı - Tüm bölümler kapalı');
}
let ekipmanBirimRiskChart = null;
let allEkipmanData = [];
let allBakimData = [];
function setupEkipmanFilters(ekipmanlar, bakimTakvimi) {
    allEkipmanData = ekipmanlar;
    allBakimData = bakimTakvimi;
    const birimSelect = document.getElementById('filter-birim');
    if (birimSelect) {
        const birimler = [...new Set(ekipmanlar.map(e => e.birimAdi || e.birim_adi || 'Bilinmeyen'))].sort();
        birimler.forEach(birim => {
            if (birim && birim !== 'Bilinmeyen') {
                const option = document.createElement('option');
                option.value = birim;
                option.textContent = birim;
                birimSelect.appendChild(option);
            }
        });
        birimSelect.addEventListener('change', applyEkipmanFilters);
    }
    const kararSelect = document.getElementById('filter-karar');
    if (kararSelect) {
        kararSelect.addEventListener('change', applyEkipmanFilters);
    }
}
function applyEkipmanFilters() {
    const birimFilter = document.getElementById('filter-birim').value;
    const kararFilter = document.getElementById('filter-karar').value;
    let filteredEkipman = allEkipmanData;   
    if (birimFilter) {
        filteredEkipman = filteredEkipman.filter(e => (e.birimAdi || e.birim_adi) === birimFilter);
    }    
    if (kararFilter) {
        filteredEkipman = filteredEkipman.filter(e => {
            let stratejikKarar = '';
            if (e.saglikSkoru < 10 && e.kalanOmurYil < 2) {
                stratejikKarar = 'YENİLEME GEREKLİ';
            } else if (e.saglikSkoru < 30) {
                stratejikKarar = 'ACİL BAKIM';
            } else if (e.saglikSkoru < 50) {
                stratejikKarar = 'BAKIM PLANLA';
            } else {
                stratejikKarar = 'RUTİN TAKİP';
            }
            return stratejikKarar === kararFilter;
        });
    }
    let filteredBakim = allBakimData;   
    if (birimFilter) {
        filteredBakim = filteredBakim.filter(b => b.birimAdi === birimFilter);
    }
    populateEkipmanKararTablosu(filteredEkipman);
    populateBakimTablosu(filteredBakim);
    createEkipmanBirimRiskGrafik(filteredEkipman);
}
function populateBakimTablosu(bakimTakvimi) {
    const tableBody = document.getElementById('maintenance-schedule-tbody');
    if (!tableBody) return;   
    tableBody.innerHTML = '';  
    if (!bakimTakvimi || bakimTakvimi.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Bakım kaydı bulunamadı</td></tr>';
        return;
    }
    bakimTakvimi.forEach(bakim => {
        const row = document.createElement('tr');
        let statusClass = '';
        let statusText = '';
        if (bakim.kalanGun < 0) {
            statusClass = 'status-critical';
            statusText = 'GEÇMİŞ';
        } else if (bakim.kalanGun <= 15) {
            statusClass = 'status-critical';
            statusText = 'ACİL';
        } else if (bakim.kalanGun <= 30) {
            statusClass = 'status-warning';
            statusText = 'YAKIN';
        } else {
            statusClass = 'status-success';
            statusText = 'PLANLI';
        }
        row.innerHTML = `
            <td>${bakim.ekipmanAdi}</td>
            <td>${bakim.birimAdi}</td>
            <td>${bakim.bakimTarihi}</td>
            <td>${bakim.kalanGun < 0 ? 'GEÇMİŞ' : `${bakim.kalanGun} gün`}</td>
            <td>${bakim.ay}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        `;
        tableBody.appendChild(row);
    });
}
function createEkipmanBirimRiskGrafik(ekipmanlar) {
    const canvas = document.getElementById('ekipmanBirimRiskGrafik');
    if (!canvas) return;
    if (ekipmanBirimRiskChart) {
        ekipmanBirimRiskChart.destroy();
    }
    const birimMap = {};   
    ekipmanlar.forEach(ekipman => {
        const birim = ekipman.birimAdi || 'Bilinmeyen';
        if (!birimMap[birim]) {
            birimMap[birim] = {
                kritik: 0,    
                orta: 0,      
                iyi: 0        
            };
        }
        const skor = ekipman.saglikSkoru;
        if (skor <= 30) {
            birimMap[birim].kritik++;
        } else if (skor <= 70) {
            birimMap[birim].orta++;
        } else {
            birimMap[birim].iyi++;
        }
    });
    const birimler = Object.keys(birimMap).sort();
    const kritikData = birimler.map(b => birimMap[b].kritik);
    const ortaData = birimler.map(b => birimMap[b].orta);
    const iyiData = birimler.map(b => birimMap[b].iyi);   
    const ctx = canvas.getContext('2d');   
    ekipmanBirimRiskChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: birimler,
            datasets: [
                {
                    label: 'Kritik (0-30%)',
                    data: kritikData,
                    backgroundColor: '#ef4444',
                    borderColor: '#dc2626',
                    borderWidth: 1
                },
                {
                    label: 'Orta (31-70%)',
                    data: ortaData,
                    backgroundColor: '#fbbf24',
                    borderColor: '#f59e0b',
                    borderWidth: 1
                },
                {
                    label: 'İyi (71-100%)',
                    data: iyiData,
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function(context) {
                            return 'Birim: ' + context[0].label;
                        },
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' ekipman';
                        },
                        footer: function(context) {
                            let total = 0;
                            context.forEach(item => {
                                total += item.parsed.y;
                            });
                            return 'Toplam: ' + total + ' ekipman';
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '600'
                        },
                        color: '#475569'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 11
                        },
                        color: '#475569'
                    },
                    title: {
                        display: true,
                        text: 'Ekipman Sayısı',
                        font: {
                            size: 13,
                            weight: 'bold'
                        },
                        color: '#1e293b'
                    },
                    grid: {
                        color: '#e2e8f0'
                    }
                }
            }
        }
    });
    
    console.log('✅ Birim bazlı risk grafiği oluşturuldu');
}
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
function formatNumber(num) {
    return new Intl.NumberFormat('tr-TR').format(num);
}
// 10. EĞİTİM OPTİMİZASYONU
let riskTrendChart = null;
let currentOptimizationData = null;
let currentBulkSelection = null;
async function loadEgitimOptimizasyonu() {
    try {
        const response = await fetch(`${API_BASE_URL}/kds/egitim-optimizasyonu`);
        const result = await response.json();
        if (result.success) {
            currentOptimizationData = result.data;
            updateOptimizasyonStats(result.data.istatistikler);
            populateHeatmapTable(result.data.birimAnalizleri);
            populateSimBirimSelect(result.data.birimAnalizleri);
            console.log('✅ Eğitim optimizasyonu yüklendi');
        }
    } catch (error) {
        console.error('Eğitim optimizasyonu hatası:', error);
        alert('Eğitim optimizasyonu verileri yüklenirken hata oluştu!');
    }
}
function updateOptimizasyonStats(stats) {
    document.getElementById('kritik-birim-count').textContent = stats.kritikBirimler;
    document.getElementById('yuksek-risk-count').textContent = stats.yuksekRiskBirimler;
    document.getElementById('toplam-egitim-ihtiyaci').textContent = stats.toplamEgitimIhtiyaci + ' personel';
    document.getElementById('toplam-egitim-maliyeti-opt').textContent = formatNumber(stats.toplamMaliyet) + ' TL';
}
function populateHeatmapTable(birimAnalizleri) {
    const tbody = document.getElementById('heatmap-tbody');
    tbody.innerHTML = '';
    if (birimAnalizleri.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Veri bulunamadı</td></tr>';
        return;
    }
    birimAnalizleri.forEach(birim => {
        const row = document.createElement('tr');
        let heatmapClass = '';
        if (birim.aciliyetSkoru >= 70) {
            heatmapClass = 'heatmap-critical';
        } else if (birim.aciliyetSkoru >= 50) {
            heatmapClass = 'heatmap-high';
        } else if (birim.aciliyetSkoru >= 30) {
            heatmapClass = 'heatmap-medium';
        } else {
            heatmapClass = 'heatmap-low';
        }

        row.className = heatmapClass;

        row.innerHTML = `
            <td><span class="priority-badge">${birim.oncelikSirasi}</span></td>
            <td><strong>${birim.birimAdi}</strong></td>
            <td>${birim.toplamPersonel}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 700;">${birim.egitimUyumlulukOrani}%</span>
                    <div style="flex: 1; background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${birim.egitimUyumlulukOrani}%; height: 100%; background: ${birim.egitimUyumlulukOrani >= 70 ? '#10b981' : birim.egitimUyumlulukOrani >= 50 ? '#f59e0b' : '#ef4444'};"></div>
                    </div>
                </div>
            </td>
            <td>
                <span class="aciliyet-badge ${birim.riskRenk === 'red' ? 'critical' : birim.riskRenk === 'orange' ? 'high' : birim.riskRenk === 'yellow' ? 'medium' : 'low'}">
                    ${birim.aciliyetSkoru}
                </span>
            </td>
            <td><strong style="color: ${birim.riskRenk === 'red' ? '#ef4444' : birim.riskRenk === 'orange' ? '#f59e0b' : birim.riskRenk === 'yellow' ? '#f59e0b' : '#10b981'};">${birim.kazaRiski}</strong></td>
            <td style="font-size: 0.85rem;">${birim.eylemOnerisi}</td>
            <td>
                <button class="btn-egitim-optimize" onclick="openBulkTraining('${birim.birimId}', '${birim.birimAdi}', ${birim.egitimEksikligi}, ${birim.toplamEgitimMaliyeti})">
                    📚 Planla
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}
function populateSimBirimSelect(birimAnalizleri) {
    const select = document.getElementById('sim-birim-select');
    select.innerHTML = '<option value="">Simülasyon için birim seçin...</option>';
    birimAnalizleri.forEach(birim => {
        const option = document.createElement('option');
        option.value = birim.birimId || birim.birim_id;
        option.textContent = `${birim.birimAdi || birim.birim_adi || 'Bilinmeyen'} (Aciliyet: ${birim.aciliyetSkoru})`;
        select.appendChild(option);
    });
}
async function calistirSimulasyon() {
    const birimId = document.getElementById('sim-birim-select').value;
    const egitimYatirimi = parseInt(document.getElementById('egitim-yatirim-slider').value);
    if (!birimId) {
        alert('Lütfen bir birim seçin!');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/kds/egitim-yatirim-simulasyonu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ birimId, egitimYatirimi })
        });
        const result = await response.json();
        if (result.success) {
            const data = result.data;
            document.getElementById('simulation-results').style.display = 'block';
            document.getElementById('sim-baslangic-risk').textContent = data.baslangicRiski;
            document.getElementById('sim-sonrasi-risk').textContent = data.yatirimSonrasiRisk;
            document.getElementById('sim-risk-azalma').textContent = `${data.toplamRiskAzalmasi}%`;
            document.getElementById('sim-tasarruf').textContent = formatNumber(data.tasarruf) + ' TL';
            document.getElementById('sim-roi').textContent = `${data.roi}%`;
            const roiElement = document.getElementById('sim-roi');
            if (data.roi > 100) {
                roiElement.style.color = '#10b981';
            } else if (data.roi > 0) {
                roiElement.style.color = '#f59e0b';
            } else {
                roiElement.style.color = '#ef4444';
            }
            createRiskTrendChart(data.riskTrendi);
            console.log('✅ Simülasyon tamamlandı');
        }
    } catch (error) {
        console.error('Simülasyon hatası:', error);
        alert('Simülasyon çalıştırılırken hata oluştu!');
    }
}
function createRiskTrendChart(riskTrendi) {
    if (riskTrendChart) {
        riskTrendChart.destroy();
    }
    const ctx = document.getElementById('riskTrendChart').getContext('2d');
    riskTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: riskTrendi.map(r => r.ay),
            datasets: [{
                label: 'Risk Skoru',
                data: riskTrendi.map(r => r.riskSkoru),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#ef4444',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Risk Skoru: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value;
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
function openBulkTraining(birimId, birimAdi, personelSayisi, maliyet) {
    currentBulkSelection = { birimId, birimAdi, personelSayisi, maliyet };
    document.getElementById('bulk-birim-adi').textContent = birimAdi;
    document.getElementById('bulk-personel-sayisi').textContent = personelSayisi;
    document.getElementById('bulk-maliyet').textContent = formatNumber(maliyet);
    document.getElementById('bulk-butce-etki').textContent = `+${formatNumber(maliyet)} TL eklenir`;
    document.getElementById('bulk-vardiya-etki').textContent = `${personelSayisi} personel 'Eğitimi Planlandı' olur`;
    document.getElementById('bulk-aciliyet-etki').textContent = `-${personelSayisi * 5} puan azalır`;
    document.getElementById('bulk-training-panel').style.display = 'block';
}
function closeBulkPanel() {
    document.getElementById('bulk-training-panel').style.display = 'none';
    currentBulkSelection = null;
}
async function onaylaTopluEgitim() {
    if (!currentBulkSelection) return;
    try {
        const { birimId, birimAdi, personelSayisi, maliyet } = currentBulkSelection;
        const response = await fetch(`${API_BASE_URL}/kds/egitim-toplu-planla`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                birimId,
                egitimMaliyeti: maliyet,
                personelSayisi
            })
        });

        const result = await response.json();

        if (result.success) {
            const data = result.data;
            AppState.updateBudget({
                ekEgitimMaliyeti: AppState.budget.ekEgitimMaliyeti + maliyet,
                riskAzalmasi: AppState.budget.riskAzalmasi + data.riskAzalmasi
            });
            AppState.vardiya.egitimPlanlananlar.push(...Array(personelSayisi).fill(birimId));
            await loadEgitimOptimizasyonu();
            closeBulkPanel();
            showMultiPanelAlert(
                `✅ ${birimAdi} birimi için ${personelSayisi} personele eğitim planlandı!\n\n` +
                `💰 Bütçe Paneli: +${formatNumber(maliyet)} TL eklendi\n` +
                `📅 Vardiya Paneli: ${personelSayisi} personel güncellendi\n` +
                `🎯 Aciliyet Skoru: ${data.eskiAciliyet} → ${data.yeniAciliyet} (${data.riskAzalmasi} puan azaldı)`
            );
            console.log('✅ Toplu eğitim planlandı, 3 panel güncellendi');
        }
    } catch (error) {
        console.error('Toplu eğitim planlama hatası:', error);
        alert('Eğitim planlanırken hata oluştu!');
    }
}
function showMultiPanelAlert(message) {
    const alert = document.getElementById('multi-panel-alert');
    document.getElementById('multi-panel-message').textContent = message;
    alert.style.display = 'flex';
    setTimeout(() => {
        alert.style.display = 'none';
    }, 15000);
}
document.addEventListener('DOMContentLoaded', () => {
    const egitimYatirimSlider = document.getElementById('egitim-yatirim-slider');
    const egitimYatirimValue = document.getElementById('egitim-yatirim-value');
    if (egitimYatirimSlider && egitimYatirimValue) {
        egitimYatirimSlider.addEventListener('input', () => {
            egitimYatirimValue.textContent = formatNumber(parseInt(egitimYatirimSlider.value));
        });
    }
});
console.log('✅ İSG KDS JavaScript yüklendi');
async function loadSertifikaYonetimi() {
    try {
        console.log('📜 Sertifika verileri çekiliyor...');
        const response = await fetch(`${API_BASE_URL}/kds/sertifika-yonetimi`);
        const result = await response.json();
        if (result.success) {
            const data = result.data;
            const totalCertEl = document.getElementById('total-sertifika-count');
            if (totalCertEl && data.istatistikler) {
                totalCertEl.textContent = data.istatistikler.toplamSertifika;
            }
            const critCertEl = document.getElementById('cert-critical-count');
            if (critCertEl && data.istatistikler) {
                critCertEl.textContent = data.istatistikler.kritik;
            }
            const invCertEl = document.getElementById('cert-invalid-count');
            if (invCertEl && data.istatistikler) {
                invCertEl.textContent = data.istatistikler.gecersiz;
            }
            const budgetEl = document.getElementById('cert-budget-total');
            if (budgetEl && data.istatistikler) {
                budgetEl.textContent = formatNumber(data.istatistikler.toplamYenilemeMaliyeti) + ' TL';
            }
            const scoreEl = document.getElementById('compliance-score-text');
            if (scoreEl && data.istatistikler.uyumlulukOrani) {
                scoreEl.textContent = data.istatistikler.uyumlulukOrani;
            }
            populateSertifikaTableCustom(data.sertifikaListesi);
            console.log('✅ Sertifika paneli başarıyla güncellendi');
        }
    } catch (error) {
        console.error('Sertifika yükleme hatası:', error);
    }
}
function populateSertifikaTableCustom(sertifikaListesi) {
    const tbody = document.getElementById('sertifika-tbody');    
    if (!tbody) {
        console.error("HATA: 'sertifika-tbody' ID'sine sahip tablo bulunamadı!");
        return;
    }
    tbody.innerHTML = '';
    if (!sertifikaListesi || sertifikaListesi.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Kayıtlı sertifika bulunamadı.</td></tr>';
        return;
    }
    sertifikaListesi.forEach(item => {
        const row = document.createElement('tr');
        const tarih = new Date(item.gecerlilikSonu).toLocaleDateString('tr-TR');
        row.innerHTML = `
            <td><strong>${item.personelAdi || 'Bilinmiyor'}</strong></td>
            <td>${item.gorevUnvani || '-'}</td>
            <td>${item.egitimAdi || '-'}</td>
            <td><span class="zorunluluk-badge">${item.zorunluluk}</span></td>
            <td>${tarih}</td>
            <td>${item.kalanGun < 0 ? `<span style="color: #ef4444; font-weight: bold;">GEÇMİŞ</span>` : item.kalanGun + ' gün'}</td>
            <td><span class="durum-badge ${item.durumRenk}">${item.durum}</span></td>
            <td><strong>${item.yenilemeMaliyeti.toLocaleString('tr-TR')} TL</strong></td>
        `;
        tbody.appendChild(row);
    });
}
function setProjection(gun) {
    const slider = document.getElementById('projection-slider');
    if (slider) {
        slider.value = gun;
        const event = new Event('input');
        slider.dispatchEvent(event);
        console.log(`📅 Projeksiyon ${gun} güne ayarlandı.`);
    }
}
// STRATEJİK RİSK ANALİZİ
let stackedBarChart = null;
let kazaTuruPastaChart = null;
let birimKazaPastaChart = null;
let kazaYogunlukScatterChart = null;
async function loadStratejikRiskAnalizi() {
    try {
        const response = await fetch(`${API_BASE_URL}/kds/stratejik-risk-analizi`);
        const result = await response.json();
        if (result.success) {
            const data = result.data;
            updateRiskCards(data.topRiskliBirimler);
            createGroupedBarChart(data.groupedChartData);
            if (data.kazaTuruPastaGrafigi) {
                createKazaTuruPastaGrafigi(data.kazaTuruPastaGrafigi);
            }
            if (data.birimBazliKazalar) {
                createBirimKazaPastaGrafigi(data.birimBazliKazalar);
            }
            if (data.kazaDetaylari) {
                createKazaYogunlukScatter(data.kazaDetaylari);
            }
            if (data.topRiskliBirimler) {
                createPriorityInspectionTable(data.topRiskliBirimler);
            }
            loadTehlikeTuruDonutChart();
            updateRiskStats(data.istatistikler);
            console.log('✅ Stratejik Risk Analizi yüklendi');
        }
    } catch (error) {
        console.error('Stratejik Risk Analizi hatası:', error);
    }
}
function updateRiskCards(birimler) {
    birimler.forEach((birim, index) => {
        const card = document.getElementById(`risk-card-${index + 1}`);
        if (!card) return;
        const birimAdi = card.querySelector('.risk-birim-adi');
        if (birimAdi) birimAdi.textContent = birim.birim_adi;
        const riskNumber = card.querySelector('.risk-number');
        if (riskNumber) riskNumber.textContent = birim.kaza_sayisi;
        const badge = card.querySelector('.risk-badge');
        if (badge) {
            badge.textContent = birim.risk_durumu;
            badge.className = `risk-badge ${birim.risk_renk}`;
        }
    });
}
function createGroupedBarChart(chartData) {
    const canvas = document.getElementById('stackedBarChart');
    if (!canvas) return;
    if (stackedBarChart) {
        stackedBarChart.destroy();
    }
    const ctx = canvas.getContext('2d');
    const kazaTuruRenkleri = {
        'Düşme': '#EF4444',             
        'Ezilme': '#8B5CF6',            
        'Kesilme': '#F59E0B',           
        'Yanık': '#F97316',               
        'Elektrik Çarpması': '#3B82F6', 
        'Malzeme Düşmesi': '#10B981',  
        'Kayma/Takılma': '#EC4899',    
        'Sıkışma': '#6366F1'             
    };
    const datasets = chartData.kazaTurleri.map(kazaTuru => {
        const data = chartData.birimler.map(birimAdi => {
            return chartData.veriler[birimAdi][kazaTuru] || 0;
        });
        return {
            label: kazaTuru,
            data: data,
            backgroundColor: kazaTuruRenkleri[kazaTuru],
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 'flex',
            maxBarThickness: 30
        };
    });
    
    stackedBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.birimler,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'rectRounded',
                        boxWidth: 12,
                        boxHeight: 12
                    }
                },
                title: {
                    display: true,
                    text: 'Her birim için 8 kaza türü yan yana gruplandırılmıştır',
                    font: {
                        size: 11,
                        weight: 'normal',
                        style: 'italic'
                    },
                    color: '#64748b',
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    mode: 'nearest',
                    intersect: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 15,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return '📍 ' + context[0].label;
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return ' ' + label + ': ' + value + ' kaza';
                        },
                        afterLabel: function(context) {
                            if (context.parsed.y === 0) {
                                return '(Bu birimde bu tür kaza yok)';
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: 'bold'
                        },
                        color: '#0f172a',
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Kaza Sayısı',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            if (Number.isInteger(value)) {
                                return value;
                            }
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: true
            }
        }
    });
    updateChartLegend(chartData.kazaTurleri, kazaTuruRenkleri);
    updateBirimOrtalamaKiyaslamasi(chartData.birimOrtalamaKiyaslamasi, chartData.genelOrtalama);
}
function updateChartLegend(kazaTurleri, renkler) {
    const legendDiv = document.getElementById('risk-chart-legend');
    if (!legendDiv) return;
    legendDiv.innerHTML = '';
    kazaTurleri.forEach((tur) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = typeof renkler === 'object' && !Array.isArray(renkler) 
            ? renkler[tur] 
            : renkler[kazaTurleri.indexOf(tur)];
        const label = document.createElement('span');
        label.textContent = tur;
        item.appendChild(colorBox);
        item.appendChild(label);
        legendDiv.appendChild(item);
    });
}
function updateRiskStats(stats) {
    const ortalamaKaza = document.getElementById('stat-ortalama-kaza');
    const riskliBirim = document.getElementById('stat-riskli-birim');
    const riskliBirimKaza = document.getElementById('stat-riskli-birim-kaza');
    const toplamBirim = document.getElementById('stat-toplam-birim');  
    if (ortalamaKaza) ortalamaKaza.textContent = stats.ortalamaKazaPerBirim;
    if (riskliBirim) riskliBirim.textContent = stats.enRiskliBirim;
    if (riskliBirimKaza) riskliBirimKaza.textContent = stats.enRiskliBirimKazaSayisi + ' kaza';
    if (toplamBirim) toplamBirim.textContent = stats.toplamBirim;
}
function createKazaTuruPastaGrafigi(pastaData) {
    const canvas = document.getElementById('kazaTuruPastaGrafigi');
    if (!canvas) {
        console.warn('Pasta grafiği canvas elementi bulunamadı');
        return;
    }
    if (kazaTuruPastaChart) {
        kazaTuruPastaChart.destroy();
    }
    const ctx = canvas.getContext('2d');
    const renkler = [
        '#EF4444', 
        '#8B5CF6', 
        '#F59E0B', 
        '#F97316', 
        '#3B82F6', 
        '#10B981', 
        '#6366F1', 
        '#9CA3AF'  
    ];
    const toplamKaza = pastaData.sayilar.reduce((a, b) => a + b, 0);
    kazaTuruPastaChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: pastaData.turler,
            datasets: [{
                data: pastaData.sayilar,
                backgroundColor: renkler,
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 13,
                            weight: '500'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = toplamKaza > 0 ? ((value / toplamKaza) * 100).toFixed(1) : 0;
                                    return {
                                        text: `${label}: ${value} (%${percentage})`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = toplamKaza > 0 ? ((value / toplamKaza) * 100).toFixed(1) : 0;
                            return [
                                `${label}`,
                                `Kaza Sayısı: ${value}`,
                                `Yüzde: %${percentage}`
                            ];
                        }
                    }
                }
            }
        }
    });
    
    console.log('✅ Kaza Türü Pasta Grafiği oluşturuldu');
}
function createBirimKazaPastaGrafigi(birimData) {
    const canvas = document.getElementById('birimKazaPastaGrafigi');
    if (!canvas) {
        console.warn('Birim pasta grafiği canvas elementi bulunamadı');
        return;
    }
    if (birimKazaPastaChart) {
        birimKazaPastaChart.destroy();
    }
    const ctx = canvas.getContext('2d');
    const birimler = birimData.map(b => b.birim_adi);
    const kazaSayilari = birimData.map(b => b.kaza_sayisi);
    const toplamKaza = kazaSayilari.reduce((a, b) => a + b, 0);
    const renkler = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
        '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
    ];
    birimKazaPastaChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: birimler,
            datasets: [{
                data: kazaSayilari,
                backgroundColor: renkler,
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 13,
                            weight: '500'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = toplamKaza > 0 ? ((value / toplamKaza) * 100).toFixed(1) : 0;
                                    return {
                                        text: `${label}: ${value} (%${percentage})`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = toplamKaza > 0 ? ((value / toplamKaza) * 100).toFixed(1) : 0;
                            return [
                                `Birim: ${label}`,
                                `Kaza Sayısı: ${value}`,
                                `Yüzde: %${percentage}`
                            ];
                        }
                    }
                }
            }
        }
    });
    
    console.log('✅ Birim Bazlı Kaza Pasta Grafiği oluşturuldu');
}
function createKazaYogunlukScatter(kazaDetaylari) {
    const canvas = document.getElementById('kazaYogunlukScatter');
    if (!canvas) {
        console.warn('Scatter chart canvas elementi bulunamadı');
        return;
    }
    if (kazaYogunlukScatterChart) {
        kazaYogunlukScatterChart.destroy();
    }   
    const ctx = canvas.getContext('2d');
    const kazaTuruRenkler = {
        'Düşme': '#EF4444',
        'Ezilme': '#8B5CF6',
        'Kesilme': '#F59E0B',
        'Yanık': '#F97316',
        'Elektrik Çarpması': '#3B82F6',
        'Malzeme Düşmesi': '#10B981',
        'Kayma/Takılma': '#EC4899',
        'Sıkışma': '#1E40AF',
        'Diğer': '#9CA3AF'
    };
    const birimler = [...new Set(kazaDetaylari.map(k => k.birim_adi))];
    const birimIndexMap = {};
    birimler.forEach((birim, index) => {
        birimIndexMap[birim] = index;
    });
    const kazaTurleri = {};
    kazaDetaylari.forEach(kaza => {
        const tur = kaza.kaza_turu || 'Diğer';
        if (!kazaTurleri[tur]) {
            kazaTurleri[tur] = [];
        }
        kazaTurleri[tur].push({
            x: kaza.saat,
            y: birimIndexMap[kaza.birim_adi],
            birim: kaza.birim_adi,
            saat: kaza.saat,
            tur: tur
        });
    });
    const datasets = Object.keys(kazaTurleri).map(tur => ({
        label: tur,
        data: kazaTurleri[tur],
        backgroundColor: kazaTuruRenkler[tur] || '#9CA3AF',
        borderColor: '#ffffff',
        borderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 12
    }));
    createScatterLegend(kazaTuruRenkler);
    kazaYogunlukScatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Manuel legend kullanıyoruz
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    padding: 15,
                    titleFont: {
                        size: 15,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 14
                    },
                    callbacks: {
                        title: function(context) {
                            const point = context[0].raw;
                            return `🎯 Kaza Detayı`;
                        },
                        label: function(context) {
                            const point = context.raw;
                            return [
                                `Birim: ${point.birim}`,
                                `Saat: ${point.saat}:00`,
                                `Tür: ${point.tur}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: 0,
                    max: 24,
                    ticks: {
                        stepSize: 2,
                        callback: function(value) {
                            return value + ':00';
                        },
                        font: {
                            size: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Saat (00:00 - 24:00)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    min: -0.5,
                    max: birimler.length - 0.5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return birimler[value] || '';
                        },
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Birimler',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
    
    console.log('✅ Kaza Yoğunluk Scatter Chart oluşturuldu');
}
function createScatterLegend(renkMap) {
    const legendContainer = document.getElementById('scatter-legend');
    if (!legendContainer) return;
    
    legendContainer.innerHTML = Object.keys(renkMap).map(tur => `
        <div class="scatter-legend-item">
            <div class="scatter-legend-color" style="background-color: ${renkMap[tur]};"></div>
            <span>${tur}</span>
        </div>
    `).join('');
}
function updateBirimOrtalamaKiyaslamasi(kiyaslamalar, genelOrtalama) {
    const container = document.getElementById('birim-ortalama-container');
    if (!container) return;
    container.innerHTML = '';
    const baslik = document.createElement('div');
    baslik.style.width = '100%';
    baslik.style.textAlign = 'center';
    baslik.style.marginBottom = '1rem';
    baslik.style.fontSize = '0.9rem';
    baslik.style.fontWeight = '600';
    baslik.style.color = 'var(--text-secondary)';
    baslik.innerHTML = `📊 Birim Bazlı Ortalama Kıyaslaması (Şantiye Ort: ${genelOrtalama} kaza)`;
    container.appendChild(baslik);
    Object.keys(kiyaslamalar).forEach(birimAdi => {
        const kiyas = kiyaslamalar[birimAdi];
        const item = document.createElement('div');
        item.className = 'birim-badge-item';
        const name = document.createElement('div');
        name.className = 'birim-badge-name';
        name.textContent = birimAdi;
        const badge = document.createElement('div');
        badge.className = `birim-badge ${kiyas.renk}`;
        let badgeText = '';
        let badgeIcon = '';
        if (kiyas.durum === 'üzerinde') {
            badgeIcon = '⬆️';
            badgeText = `Ort. %${Math.abs(kiyas.yuzde)} Üzerinde`;
        } else if (kiyas.durum === 'altında') {
            badgeIcon = '⬇️';
            badgeText = `Ort. %${Math.abs(kiyas.yuzde)} Altında`;
        } else {
            badgeIcon = '➖';
            badgeText = 'Ortalamada';
        }
        badge.innerHTML = `<span class="birim-badge-icon">${badgeIcon}</span> ${badgeText}`;
        item.appendChild(name);
        item.appendChild(badge);
        container.appendChild(item);
    });
}
// 4. STRATEJİK RİSK PROJEKSİYONU (6-12 AY)
async function loadRiskProjeksiyonu() {
    try {
        console.log('🔄 6-12 Aylık risk projeksiyonu yükleniyor...');
        const response = await fetch(`${API_BASE_URL}/kds/risk-projeksiyonu`);
        const result = await response.json();
        if (result.success) {
            const { aylar, riskSkorlari } = result.data;
            const decisionText = document.getElementById('decision-text');
            const maxRisk = Math.max(...riskSkorlari);        
            if (decisionText) {
                if (maxRisk > 50) {
                    decisionText.innerHTML = "🚨 <strong>KRİTİK:</strong> 6 ay sonra risk artışı bekleniyor. Şimdiden bütçe planlayın.";
                } else {
                    decisionText.innerHTML = "✅ <strong>STABİL:</strong> Gelecek dönem riskleri kontrol altında görünüyor.";
                }
            }
            const ctx = document.getElementById('riskChart').getContext('2d');            
            if (riskChart) { riskChart.destroy(); }
            riskChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: aylar,
                    datasets: [{
                        label: 'Gelecek Dönem Risk Skoru (6-12 Ay)',
                        data: riskSkorlari,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointBackgroundColor: '#f59e0b'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, max: 100 }
                    }
                }
            });
            console.log('✅ Stratejik projeksiyon grafiği oluşturuldu.');
        }
    } catch (error) {
        console.error('❌ Projeksiyon yükleme hatası:', error);
    }
}
async function loadEkipmanRiskAnalizi() {
    try {
        console.log('🔍 Ekipman risk analizi başlatılıyor...');
        const response = await fetch('http://localhost:3000/api/kds/ekipman-risk-analizi');
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.getElementById('ekipman-risk-tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            result.data.forEach(item => {
                const row = document.createElement('tr');
                let badgeClass = '';
                if (item.durum === 'KRİTİK') badgeClass = 'badge-kritik';
                else if (item.durum === 'RİSKLİ') badgeClass = 'badge-orta';
                else badgeClass = 'badge-guvenli';
                row.innerHTML = `
                    <td><strong>${item.ekipman_adi}</strong></td>
                    <td style="text-align: center;">${item.kaza_sayisi} Vaka</td>
                    <td><span class="${badgeClass}">${item.durum}</span></td>
                    <td>${item.oneri}</td>
                `;
                tbody.appendChild(row);
            });
            console.log('✅ Ekipman risk tablosu başarıyla dolduruldu.');
        }
    } catch (err) {
        console.error("❌ Ekipman tablosu yüklenirken hata oluştu:", err);
    }
}
function createPriorityInspectionTable(birimler) {
    const tbody = document.getElementById('priority-inspection-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const topBirimler = birimler.slice(0, 5);
    topBirimler.forEach((birim, index) => {
        const row = document.createElement('tr');
        let priorityClass = '';
        let priorityText = '';
        if (index === 0) {
            priorityClass = 'badge-kritik';
            priorityText = '🔴 Acil';
        } else if (index <= 2) {
            priorityClass = 'badge-orta';
            priorityText = '🟡 Yüksek';
        } else {
            priorityClass = 'badge-guvenli';
            priorityText = '🟢 Orta';
        }
        const kazaSayisi = birim.kaza_sayisi || 0;
        let riskLevel = '';
        let riskClass = '';
        if (kazaSayisi >= 10) {
            riskLevel = 'Kritik';
            riskClass = 'badge-kritik';
        } else if (kazaSayisi >= 5) {
            riskLevel = 'Yüksek';
            riskClass = 'badge-orta';
        } else {
            riskLevel = 'Orta';
            riskClass = 'badge-guvenli';
        }
        let aksiyon = '';
        if (kazaSayisi >= 10) {
            aksiyon = 'Acil denetim ve risk azaltma planı';
        } else if (kazaSayisi >= 5) {
            aksiyon = 'Haftalık denetim ve eğitim takviyesi';
        } else {
            aksiyon = 'Aylık rutin denetim';
        }
        row.innerHTML = `
            <td><span class="badge ${priorityClass}">${priorityText}</span></td>
            <td><strong>${birim.birim_adi}</strong></td>
            <td style="text-align: center;"><strong>${kazaSayisi}</strong></td>
            <td><span class="badge ${riskClass}">${riskLevel}</span></td>
            <td>${aksiyon}</td>
        `;
        tbody.appendChild(row);
    });

    console.log('✅ Öncelikli denetim listesi oluşturuldu');
}
let tehlikeTuruDonutChart = null;
let allRamakKalaData = []; 
async function loadTehlikeTuruDonutChart(selectedBirim = '') {
    try {
        const response = await fetch(`${API_BASE_URL}/ramak-kala`);
        const result = await response.json();
        if (result.success && result.data) {
            allRamakKalaData = result.data;
            populateTehlikeBirimFilter(result.data);
            updateTehlikeDonutChart(selectedBirim);
            console.log('✅ Tehlike türü donut chart yüklendi');
        }
    } catch (error) {
        console.error('Tehlike türü donut chart hatası:', error);
    }
}
function populateTehlikeBirimFilter(ramakKalaData) {
    const select = document.getElementById('tehlike-birim-filter');
    if (!select) return;
    const birimler = [...new Set(ramakKalaData.map(r => r.birim_adi).filter(b => b))];
    select.innerHTML = '<option value="">Tüm Birimler</option>';
    birimler.forEach(birim => {
        const option = document.createElement('option');
        option.value = birim;
        option.textContent = birim;
        select.appendChild(option);
    });
    select.addEventListener('change', function() {
        updateTehlikeDonutChart(this.value);
    });
}
function updateTehlikeDonutChart(selectedBirim = '') {
    const canvas = document.getElementById('tehlikeTuruDonutChart');
    if (!canvas) return;
    let filteredData = allRamakKalaData;
    if (selectedBirim) {
        filteredData = allRamakKalaData.filter(r => r.birim_adi === selectedBirim);
    }
    const tehlikeTurleri = {};
    filteredData.forEach(kayit => {
        const tehlike = kayit.tehlike_tipi || 'Belirtilmemiş';
        tehlikeTurleri[tehlike] = (tehlikeTurleri[tehlike] || 0) + 1;
    });
    const sortedTehlikeler = Object.entries(tehlikeTurleri)
        .sort((a, b) => b[1] - a[1]);
    const labels = sortedTehlikeler.map(t => t[0]);
    const values = sortedTehlikeler.map(t => t[1]);
    const total = values.reduce((sum, val) => sum + val, 0);
    if (tehlikeTuruDonutChart) {
        tehlikeTuruDonutChart.destroy();
    }
    const ctx = canvas.getContext('2d');
    const colors = [
        '#ef4444', 
        '#f97316',
        '#fbbf24', 
        '#fb923c', 
        '#fcd34d', 
        '#dc2626', 
        '#ea580c', 
        '#f59e0b', 
        '#fdba74', 
        '#fde047'  
    ];
    tehlikeTuruDonutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        font: {
                            size: 13,
                            weight: '600'
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return {
                                        text: `${label}: ${value} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                title: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} kayıt (${percentage}%)`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            cutout: '60%' 
        }
    });
    updateTehlikeKDSNote(sortedTehlikeler, selectedBirim, total);    
    console.log(`✅ Tehlike donut chart güncellendi (${selectedBirim || 'Tüm Birimler'})`);
}
function updateTehlikeKDSNote(sortedTehlikeler, selectedBirim, total) {
    const noteElement = document.getElementById('tehlike-kds-message');
    if (!noteElement || sortedTehlikeler.length === 0) return; 
    const enSikTehlike = sortedTehlikeler[0][0];
    const enSikSayi = sortedTehlikeler[0][1];
    const yuzde = ((enSikSayi / total) * 100).toFixed(1);
    let birimText = selectedBirim ? `<strong>${selectedBirim}</strong> biriminde` : 'Tüm birimlerde';
    noteElement.innerHTML = `
        ${birimText} en yüksek risk <strong style="color: #dc2626;">"${enSikTehlike}"</strong> 
        kaynaklıdır (${enSikSayi} kayıt, %${yuzde}). 
        <br><br>
        <strong style="color: #92400e;">📋 Önerilen Aksiyonlar:</strong>
        <br>
        • Bu alanda acil teknik önlem alınmalı
        <br>
        • Eğitim revizyonu ve güncelleme yapılmalı
        <br>
        • Risk azaltma planı oluşturulmalı
        <br>
        • Haftalık denetim sıklığı artırılmalı
    `;
}
let riskComparisonChart = null;
function createRiskComparisonChart(groupedData) {
    const canvas = document.getElementById('riskComparisonChart');
    if (!canvas) return;
    if (riskComparisonChart) {
        riskComparisonChart.destroy();
    }
    const ctx = canvas.getContext('2d');
    const birimler = groupedData.birimler || [];
    const kazaTurleri = groupedData.kazaTurleri || [];
    const datasets = groupedData.datasets || [];
    const renkler = [
        '#EF4444', 
        '#F59E0B', 
        '#10B981', 
        '#3B82F6', 
        '#8B5CF6', 
        '#EC4899', 
        '#F97316', 
        '#14B8A6'  
    ];

    const chartDatasets = kazaTurleri.map((tur, index) => ({
        label: tur,
        data: datasets[index] || [],
        backgroundColor: renkler[index % renkler.length],
        borderColor: renkler[index % renkler.length],
        borderWidth: 1
    }));
    riskComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: birimler,
            datasets: chartDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    stacked: false,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: false,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Kaza Sayısı'
                    }
                }
            }
        }
    });

    console.log('✅ Risk karşılaştırma grafiği oluşturuldu');
}

