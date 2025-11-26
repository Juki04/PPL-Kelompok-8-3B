// =================================================================
// 💰 Modul 1: script.js (Client-Side Fetcher)
// =================================================================

// ⚠️ KONFIGURASI XAMPP LOKAL: GANTI JIKA PERLU!
// Ganti 'rest-client-project' dengan nama folder proyek Anda di htdocs
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

    // Tampilkan URL proxy lokal yang dipanggil
    apiUrlElement.textContent = FULL_FETCH_URL; 

    // Reset status tampilan
    statusElement.className = 'status-pending';
    statusElement.textContent = 'Menghubungi Proxy Lokal...';
    timeElement.textContent = 'Memuat...';
    proofElement.textContent = 'Menunggu...';

    try {
        const response = await fetch(FULL_FETCH_URL);
        
        // 1. Cek Status HTTP (misalnya 404 dari XAMPP atau 429 dari CMC via Proxy)
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status} (${response.statusText})`);
        }
        
        const data = await response.json();
        
        // 2. Cek Status Cache (Header dari proxy.php)
        const cacheStatus = response.headers.get('X-Cache-Status') || 'MISS/NEW';

        // 3. Cek Error dari CMC (di dalam body JSON)
        if (data.status && data.status.error_code !== 0) {
             throw new Error(`CMC Error: ${data.status.error_message} (Code: ${data.status.error_code})`);
        }

        // --- BERHASIL ---
        
        // Update Status
        statusElement.className = 'status-success';
        statusElement.textContent = `TERHUBUNG & CACHING: ${cacheStatus}`;
        timeElement.textContent = `Data di-fetch pada: ${formatLocalTime()}`;
        
        // Update Bukti Data CMC
        const assetCount = data.data.length;
        const firstThreeAssets = data.data.slice(0, 3).map(asset => asset.symbol).join(', ');
        
        proofElement.textContent = `Berhasil mengambil ${assetCount} aset! Contoh aset: ${firstThreeAssets}`;

    } catch (error) {
        // --- GAGAL ---
        console.error('Proxy Check Failed:', error);
        statusElement.className = 'status-error';
        timeElement.textContent = 'Gagal mengambil data.';
        statusElement.textContent = `GAGAL TOTAL: ${error.message}`;
        proofElement.textContent = 'Tidak ada data yang ditampilkan.';
    }
}

// Panggil fungsi saat halaman dimuat dan tambahkan event listener
document.addEventListener('DOMContentLoaded', () => {
    checkProxyStatus();
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', checkProxyStatus);
    }
});