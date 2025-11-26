<?php
// =================================================================
// 💰 Modul 1: PHP Proxy Caching (Mengatasi Rate Limit & API Key)
// =================================================================

// 1. KONFIGURASI CMC API KEY DAN CACHE
// =================================================================
// Ubah ini dengan CMC API Key Anda
$CMC_API_KEY = 'eeb2e201e0724df3ad2c245315ba1d39'; 
if (isset($_GET['convert']) && $_GET['convert'] == "true") {
    header("Content-Type: application/json");

    $symbol = $_GET['symbol']; // BTC, ETH, dll
    $amount = floatval($_GET['amount']); 
    $to = $_GET['to']; // USD atau IDR

    $endpoint = "/v1/cryptocurrency/quotes/latest?symbol=$symbol";
    $url = $BASE_URL . $endpoint;

    $headers = [
        "X-CMC_PRO_API_KEY: " . API_KEY,
        "Accepts: application/json"
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);

    // Ambil harga USD
    $priceUSD = $data['data'][$symbol]['quote']['USD']['price'];

    // Konversi
    if ($to == "USD") {
        $result = $amount * $priceUSD;
    } elseif ($to == "IDR") {
        $result = $amount * $priceUSD * 16000;
    }

    echo json_encode([
        "amount" => $amount,
        "symbol" => $symbol,
        "to" => $to,
        "result" => $result
    ]);
    exit();
}
$BASE_URL = 'https://pro-api.coinmarketcap.com';
// Waktu cache data dalam detik. 60 detik = 1 menit (Sesuai dengan Update Frequency CMC)
$CACHE_DURATION = 60; 

// 2. TENTUKAN ENDPOINT YANG DIMINTA
// =================================================================
// Secara default, kita akan mengambil data listing utama (digunakan Teman 2)
$endpoint = '/v1/cryptocurrency/listings/latest'; 

// Jika client (script.js) meminta endpoint lain melalui query parameter
if (isset($_GET['endpoint']) && !empty($_GET['endpoint'])) {
    $endpoint = filter_var($_GET['endpoint'], FILTER_SANITIZE_URL);
}

// Tentukan nama file cache (berdasarkan endpoint yang diminta)
$cache_file = 'cache/' . md5($endpoint) . '.json';

// Pastikan folder cache ada
if (!is_dir('cache')) {
    mkdir('cache', 0777, true);
}

// 3. LOGIKA CACHING: PERIKSA DATA YANG TERSIMPAN
// =================================================================
if (file_exists($cache_file) && (time() - filemtime($cache_file) < $CACHE_DURATION)) {
    // KASUS 1: Cache masih berlaku (Belum 60 detik)
    
    // Set header agar browser tahu bahwa ini adalah JSON
    header('Content-Type: application/json');
    // Tambahkan header khusus untuk debugging (opsional)
    header('X-Cache-Status: HIT'); 
    
    // Baca dan kirim data dari file cache
    echo file_get_contents($cache_file);
    exit;
}

// 4. LOGIKA FETCHING: AMBIL DATA BARU DARI CMC
// =================================================================

// URL lengkap ke CMC
$url = $BASE_URL . $endpoint; 

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
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "GET"
]);

$response = curl_exec($curl);
$err = curl_error($curl);
curl_close($curl);

// 5. KELOLA RESPON DAN SIMPAN KE CACHE
// =================================================================
header('Content-Type: application/json');

if ($err) {
    // KASUS 2: Terjadi Error pada cURL (jaringan atau API Key salah)
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'cURL Error: ' . $err]);
} else {
    $data = json_decode($response, true);
    
    if (isset($data['status']['error_code']) && $data['status']['error_code'] !== 0) {
        // KASUS 3: Error dari CMC (misalnya Rate Limit 429)
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