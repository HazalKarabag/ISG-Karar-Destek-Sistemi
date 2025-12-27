const express = require('express');
const cors = require('cors');
const { testConnection } = require('./models/database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

testConnection();

const baseRoutes = require('./routes/baseRoutes');
const kdsRoutes = require('./routes/kdsRoutes');
const simulationRoutes = require('./routes/simulationRoutes');

app.use('/api', baseRoutes);
app.use('/api/kds', kdsRoutes);
app.use('/api', simulationRoutes);

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>İSG KDS Backend</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    max-width: 1200px;
                    margin: 50px auto;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .container {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                }
                h1 {
                    text-align: center;
                    font-size: 2.5em;
                    margin-bottom: 10px;
                }
                .subtitle {
                    text-align: center;
                    font-size: 1.2em;
                    opacity: 0.9;
                    margin-bottom: 40px;
                }
                .section {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                h2 {
                    color: #ffd700;
                    margin-top: 0;
                }
                .endpoint {
                    background: rgba(0, 0, 0, 0.2);
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 5px;
                    font-family: 'Courier New', monospace;
                }
                .method {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 3px;
                    font-weight: bold;
                    margin-right: 10px;
                }
                .get { background: #28a745; }
                .post { background: #007bff; }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    opacity: 0.8;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 İSG Karar Destek Sistemi</h1>
                <p class="subtitle">MVC Mimarisi ile Yeniden Yapılandırıldı</p>
                
                <div class="section">
                    <h2>📊 Temel API Endpoint'leri</h2>
                    <div class="endpoint"><span class="method get">GET</span> /api/birimler</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/personel</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/egitimler</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/kazalar</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/is-plani</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/ekipmanlar</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/ramak-kala</div>
                </div>

                <div class="section">
                    <h2>🎯 KDS Analiz Endpoint'leri</h2>
                    <div class="endpoint"><span class="method get">GET</span> /api/kds/stratejik-ozet</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/kds/risk-projeksiyonu</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/kds/birim-analizi</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/kds/compliance-score</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/kds/mevsimsel-analiz</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/kds/sertifika-yonetimi</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/kds/egitim-optimizasyonu</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/kds/ekipman-bakim-tahmini</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/kds/ekipman-risk-analizi</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/kds/stratejik-risk-analizi</div>
                </div>

                <div class="section">
                    <h2>🔮 Simülasyon Endpoint'leri</h2>
                    <div class="endpoint"><span class="method post">POST</span> /api/kds/what-if</div>
                    <div class="endpoint"><span class="method post">POST</span> /api/kds/butce-maliyet-analizi</div>
                    <div class="endpoint"><span class="method post">POST</span> /api/kds/vardiya-analizi</div>
                    <div class="endpoint"><span class="method post">POST</span> /api/kds/vardiya-egitim-planla</div>
                    <div class="endpoint"><span class="method post">POST</span> /api/kds/vardiya-personel-degistir</div>
                    <div class="endpoint"><span class="method post">POST</span> /api/kds/egitim-yatirim-simulasyonu</div>
                    <div class="endpoint"><span class="method post">POST</span> /api/kds/egitim-toplu-planla</div>
                    <div class="endpoint"><span class="method get">GET</span> /api/simulation</div>
                </div>

                <div class="footer">
                    <p>✅ Backend MVC yapısına başarıyla taşındı!</p>
                    <p>📁 Klasör Yapısı: controllers/ | models/ | routes/ | public/</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 İSG KDS Backend çalışıyor: http://localhost:${PORT}`);
    console.log(`📊 API Endpoints:`);
    console.log(`   - GET  /api/birimler`);
    console.log(`   - GET  /api/personel`);
    console.log(`   - GET  /api/egitimler`);
    console.log(`   - GET  /api/kazalar`);
    console.log(`   - GET  /api/is-plani`);
    console.log(`   - GET  /api/ekipmanlar`);
    console.log(`   - GET  /api/ramak-kala`);
    console.log(`   - GET  /api/kds/stratejik-ozet`);
    console.log(`   - GET  /api/kds/compliance-score ⚖️`);
    console.log(`   - GET  /api/kds/mevsimsel-analiz 🌦️`);
    console.log(`   - GET  /api/kds/risk-projeksiyonu`);
    console.log(`   - GET  /api/kds/birim-analizi`);
    console.log(`   - POST /api/kds/what-if`);
    console.log(`   - POST /api/kds/butce-maliyet-analizi 💰`);
    console.log(`   - GET  /api/kds/ekipman-bakim-tahmini 🔧`);
    console.log(`   - GET  /api/kds/ekipman-risk-analizi 🔧🚨`);
    console.log(`   - POST /api/kds/vardiya-analizi 📅`);
    console.log(`   - POST /api/kds/vardiya-egitim-planla 🎓`);
    console.log(`   - POST /api/kds/vardiya-personel-degistir 👥`);
    console.log(`   - GET  /api/kds/egitim-optimizasyonu 🎯`);
    console.log(`   - POST /api/kds/egitim-yatirim-simulasyonu 📊`);
    console.log(`   - POST /api/kds/egitim-toplu-planla 📚`);
    console.log(`   - GET  /api/kds/sertifika-yonetimi 📜`);
    console.log(`   - GET  /api/kds/stratejik-risk-analizi 🎯`);
    console.log(`   - GET  /api/simulation 🎯`);
    console.log(`\n✅ MVC Yapısı Aktif!`);
    console.log(`📁 Controllers: ${__dirname}\\controllers`);
    console.log(`📁 Models: ${__dirname}\\models`);
    console.log(`📁 Routes: ${__dirname}\\routes`);
    console.log(`📁 Public: ${__dirname}\\public`);
});
