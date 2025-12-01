async function convertPrice() {
    // 1. Ambil nilai dari elemen HTML (ID disesuaikan agar cocok dengan price_conversion.html)
    const amount = parseFloat(document.getElementById("amount").value);
    const from = document.getElementById("symbol").value.toUpperCase(); // Sumber
    const to = document.getElementById("convert_to").value.toUpperCase(); // Target

    // Elemen hasil disesuaikan
    const resultElement = document.getElementById("result");

    if (isNaN(amount) || amount <= 0) {
        resultElement.innerHTML = "Masukkan jumlah yang valid!";
        return;
    }

    resultElement.innerHTML = "Memuat...";

    try {
        // 2. Panggil endpoint proxy lokal (Gunakan path relatif, tidak perlu 'http://localhost:3000' jika di-host di server yang sama)
        const response = await fetch(
            `/v1/tools/price-conversion?amount=${amount}&symbol=${from}&convert=${to}`
        );
        
        // Cek status HTTP
        if (!response.ok) {
            // Jika ada error HTTP (400, 500, dll.)
            const errorJson = await response.json();
            resultElement.innerHTML = `Error: ${errorJson.error || 'Gagal mengambil data konversi.'}`;
            return;
        }

        const json = await response.json();

        // 3. Memproses format respons dari ENDPOINT PROXY LOKAL
        // Berdasarkan logika price_converter.py sebelumnya, responsnya adalah:
        // { "source_symbol": "BTC", "target_currency": "USD", "amount": 1.0, "converted_price": 60000.0, ... }
        if (
            !json ||
            typeof json.converted_price !== "number"
        ) {
            resultElement.innerHTML = "Konversi tidak tersedia atau respons server tidak valid!";
            return;
        }

        const converted = json.converted_price;
        const lastUpdated = json.last_updated;

        // 4. Format hasil konversi
        // Menggunakan Intl.NumberFormat untuk pemformatan mata uang yang tepat
        const formatted = new Intl.NumberFormat(
            to === "IDR" ? "id-ID" : "en-US",
            { style: "currency", currency: to }
        ).format(converted);

        // Tampilkan hasil
        resultElement.innerHTML = `
            <p>Konversi dari ${json.amount} ${json.source_symbol}:</p>
            <h3>${formatted}</h3>
            <small>Data diperbarui pada: ${new Date(lastUpdated).toLocaleString()}</small>
        `;

    } catch (err) {
        console.error("Kesalahan Fetch/Jaringan:", err);
        resultElement.innerHTML = "Gagal menghubungi layanan konversi (kesalahan jaringan atau server)!";
    }
}