const { createClient } = require('@supabase/supabase-js');

// Supabase bağlantı bilgileri
const supabaseUrl = 'https://efsisahvgpaloertnnjl.supabase.co';
const supabaseKey = 'sb_publishable_U6hOvzf2VkMsnALPgWb3OQ_6xj1M1Pt';

// Supabase client oluştur
const supabase = createClient(supabaseUrl, supabaseKey);

// Bağlantı testi fonksiyonu
async function testConnection() {
    try {
        const { data, error } = await supabase.from('birimler').select('*').limit(1);
        if (error) {
            console.error('❌ Supabase Bağlantı Hatası:', error.message);
        } else {
            console.log('✅ Supabase Bağlantısı Başarılı!');
        }
    } catch (err) {
        console.error('❌ Beklenmedik Hata:', err.message);
    }
}

// Genel veri çekme fonksiyonu
async function getData(tableName) {
    try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) throw error;
        return data;
    } catch (error) {
        console.error(`Hata (${tableName}):`, error.message);
        return [];
    }
}

module.exports = {
    supabase,
    testConnection,
    getData
};

