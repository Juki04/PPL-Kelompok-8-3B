function convertCrypto() {
    const amount = parseFloat(document.getElementById("convert-amount").value);
    const from = document.getElementById("convert-from").value;
    const to = document.getElementById("convert-to").value;

    if (!amount) {
        document.getElementById("convert-result").innerText = "Masukkan jumlah yang valid!";
        return;
    }

    // Contoh harga dummy (silakan hubungkan ke API Anda)
    const prices = {
        BTC: 1000000000, // 1 BTC = 1 Milyar
        ETH: 35000000,
        BNB: 4500000,
        USD: 1,
        IDR: 16000
    };

    const result = (amount * prices[from]) / prices[to];

    // Format angka Rupiah
    const formatRupiah = (value) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR"
        }).format(value);

    // Format angka USD
    const formatUSD = (value) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(value);

    let output = "";

    if (to === "IDR") {
        output = `${amount} ${from} = ${formatRupiah(result)}`;
    } else if (to === "USD") {
        output = `${amount} ${from} = ${formatUSD(result)}`;
    }

    document.getElementById("convert-result").innerText = output;
}

