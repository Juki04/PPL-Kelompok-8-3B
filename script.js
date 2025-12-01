// =================================================================
// 💰 Modul 1: script.js (Client-Side Fetcher) - FINAL CLEAN VERSION
// =================================================================

// ⚠️ KONFIGURASI XAMPP LOKAL: GANTI JIKA PERLU!
// Ganti 'Kelompok-3' dengan nama folder proyek Anda di htdocs
const PROJECT_FOLDER_NAME = 'Kelompok-3'; 
const PROXY_URL = 'http://localhost/' + PROJECT_FOLDER_NAME + '/proxy.php'; 

// Endpoint yang akan diminta ke proxy (Contoh: Listing Utama)
const TARGET_ENDPOINT = '/v1/cryptocurrency/listings/latest'; 
const FULL_FETCH_URL = PROXY_URL + '?endpoint=' + encodeURIComponent(TARGET_ENDPOINT);


// Helper: Fungsi untuk menampilkan waktu saat ini
function formatLocalTime() {
    const date = new Date();
    return date.toLocaleString('id-ID', {
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', 
        timeZoneName: 'short'
    });
}

// Fungsi utama untuk memanggil Proxy PHP
async function checkProxyStatus() {
    const statusElement = document.getElementById('api-status');
    const timeElement = document.getElementById('server-time-value');
    const apiUrlElement = document.getElementById('api-url');
    const proofElement = document.getElementById('api-proof');

    apiUrlElement.textContent = FULL_FETCH_URL; 
    statusElement.className = 'status-pending';
    statusElement.textContent = 'Menghubungi Proxy Lokal...';
    timeElement.textContent = 'Memuat...';
    proofElement.textContent = 'Menunggu...';

    try {
        const response = await fetch(FULL_FETCH_URL);
        
        // 1. Cek Status HTTP (404 dari XAMPP, 429 dari CMC, dll.)
        if (!response.ok) {
            // Coba baca body untuk error yang lebih spesifik jika ada
            let errorMessage = `HTTP Error! Status: ${response.status} (${response.statusText})`;
            try {
                const errorData = await response.json();
                if (errorData.status && errorData.status.error_message) {
                    errorMessage = `CMC/Proxy Error: ${errorData.status.error_message}`;
                }
            } catch (e) {
                // Jika tidak bisa di-parse sebagai JSON, gunakan status HTTP default
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // 2. Cek Status Cache (Header dari proxy.php)
        const cacheStatus = response.headers.get('X-Cache-Status') || 'HIT/MISS';

        // 3. Cek Error CMC (di dalam body JSON, jika kode statusnya 200 tapi ada error CMC)
        if (data.status && data.status.error_code !== 0) {
             throw new Error(`CMC Logic Error: ${data.status.error_message} (Code: ${data.status.error_code})`);
        }

        // --- BERHASIL ---
        statusElement.className = 'status-success';
        statusElement.textContent = `TERHUBUNG & CACHING: ${cacheStatus}`;
        timeElement.textContent = `Data di-fetch pada: ${formatLocalTime()}`;
        
        const assetCount = data.data.length;
        // Kita hanya akan menampilkan aset yang Anda minta di awal
        const targetSymbols = ['BTC', 'ETH', 'USDT', 'SOL', 'XRP', 'BNB', 'DOGE', 'USDC', 'TRON', 'LTC', 'AVAX'];
        const foundSymbols = data.data.filter(asset => targetSymbols.includes(asset.symbol)).map(asset => asset.symbol);
        
        proofElement.textContent = `Berhasil mengambil ${assetCount} aset. ${foundSymbols.length} dari 11 aset target Anda ditemukan: ${foundSymbols.slice(0, 5).join(', ')}${foundSymbols.length > 5 ? ', dll.' : '.'}`;

    } catch (error) {
        // --- GAGAL ---
        console.error('Proxy Check Failed:', error);
        statusElement.className = 'status-error';
        timeElement.textContent = 'Gagal mengambil data.';
        statusElement.textContent = `GAGAL TOTAL: ${error.message}`;
        proofElement.textContent = 'Tidak ada data yang ditampilkan.';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkProxyStatus();
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', checkProxyStatus);
    }
});