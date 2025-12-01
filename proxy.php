<?php
// =================================================================
// 💰 Modul 1: PHP Proxy Caching - FINAL CLEAN VERSION
// Bertanggung jawab untuk mengatasi CORS, Rate Limit, dan API Key.
// =================================================================

// ⚠️ KONFIGURASI CMC API KEY ⚠️
// Ganti ini dengan CMC API Key Anda yang sebenarnya
$CMC_API_KEY = 'eeb2e201e0724df3ad2c245315ba1d39'; 
$BASE_URL = 'https://pro-api.coinmarketcap.com';
$CACHE_DURATION = 60; // Cache data selama 60 detik (1 menit)

// -----------------------------------------------------------------

// 1. PENCEGAHAN OUTPUT RUSAK (Membantu mengatasi net::ERR_FAILED)
// Memastikan tidak ada output sebelum header dikirim.
ob_clean();
header('Content-Type: application/json');

// 2. TENTUKAN ENDPOINT DARI CLIENT
// Default: Listing Utama (Digunakan untuk pengujian)
$endpoint = '/v1/cryptocurrency/listings/latest'; 

if (isset($_GET['endpoint']) && !empty($_GET['endpoint'])) {
    $endpoint = filter_var($_GET['endpoint'], FILTER_SANITIZE_URL);
}

// Tentukan nama file cache (berdasarkan endpoint yang diminta)
$cache_dir = 'cache/';
$cache_file = $cache_dir . md5($endpoint) . '.json';

// Pastikan folder cache ada
if (!is_dir($cache_dir)) {
    mkdir($cache_dir, 0777, true);
}

// 3. LOGIKA CACHING: PERIKSA DATA TERSIMPAN
if (file_exists($cache_file) && (time() - filemtime($cache_file) < $CACHE_DURATION)) {
    // KASUS 1: Cache masih berlaku (HIT)
    header('X-Cache-Status: HIT'); 
    echo file_get_contents($cache_file);
    exit;
}

// 4. LOGIKA FETCHING: AMBIL DATA BARU DARI CMC (MISS)
$url = $BASE_URL . $endpoint; 

// Pengecekan cURL (Untuk membantu debugging)
if (!function_exists('curl_init')) {
    http_response_code(500);
    die(json_encode(['status' => ['error_code' => 9999, 'error_message' => 'PHP cURL extension is not enabled. Please check php.ini.']]));
}

$curl = curl_init();
$headers = [
    'Accepts: application/json',
    'X-CMC_PRO_API_KEY: ' . $CMC_API_KEY
];

curl_setopt_array($curl, [
    CURLOPT_URL => $url,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_TIMEOUT => 30,
]);

$response = curl_exec($curl);
$err = curl_error($curl);
curl_close($curl);

// 5. KELOLA RESPON DAN SIMPAN KE CACHE
if ($err) {
    // KASUS 2: Error jaringan cURL
    http_response_code(500);
    echo json_encode(['status' => ['error_code' => 9998, 'error_message' => 'cURL Network Error: ' . $err]]);
} else {
    $data = json_decode($response, true);
    
    // KASUS 3: Error dari CMC (misalnya Rate Limit 429 atau API Key Salah 1001)
    if (isset($data['status']['error_code']) && $data['status']['error_code'] !== 0) {
        // Teruskan kode status CMC ke client
        http_response_code($data['status']['error_code']);
        echo $response;
    } else {
        // KASUS 4: Sukses! Simpan data baru ke cache
        file_put_contents($cache_file, $response);
        header('X-Cache-Status: MISS');
        echo $response;
    }
}
?>