const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
const supabase = createClient(
  'https://lmmiuxgdypnpjdvffxdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbWl1eGdkeXBucGpkdmZmeGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjgyMjQsImV4cCI6MjA2NTEwNDIyNH0.aXRzfjm9uZw5gTHPgs7ZxyB4RQhNposr5AwRi1dofjU'
);

const produkList = document.getElementById('produkList');
const cartSection = document.getElementById('cartSection');
const cartItems = document.getElementById('cartItems');

// Tampilkan produk
async function fetchProduk() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return console.error(error);

  produkList.innerHTML = data.map(p => {
  const sizeOptions = [...Array(11)].map((_, i) => {
    const size = 36 + i;
    return `<option value="${size}">${size}</option>`;
  }).join('');

  return `
    <div class="card">
      <img src="${p.image}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p>Rp ${p.price}</p>
      <select id="size-${p.id}">
        <option value="" disabled selected>Pilih Ukuran</option>
        ${sizeOptions}
      </select>
      <button onclick="addToCart(${p.id}, '${p.name}', ${p.price})">Tambah ke Keranjang</button>
    </div>
  `;
}).join('');

}
fetchProduk();

// Tambah ke keranjang
window.addToCart = (id, name, price) => {
  const sizeElement = document.getElementById(`size-${id}`);
  const size = sizeElement.value;

  if (!size) {
    alert('Silakan pilih ukuran terlebih dahulu.');
    sizeElement.focus();
    return;
  }

  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  // Cek apakah produk dengan ukuran sama sudah ada
  const existingItem = cart.find(item => item.id === id && item.size === size);
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ id, name, price, size, qty: 1 });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  alert(`Sepatu ukuran ${size} berhasil ditambahkan ke keranjang!`);
};


// Tampilkan isi keranjang
window.showCart = () => {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) return alert('Keranjang kosong');

  produkList.classList.add('hidden');
  cartSection.classList.remove('hidden');

  cartItems.innerHTML = cart.map(item => `
    <div class="card">
      <h3>${item.name}</h3>
      <p>Ukuran: ${item.size}</p>
      <p>Harga: Rp ${item.price}</p>
    </div>
  `).join('');
};

// Kembali ke halaman produk
window.backToProducts = () => {
  cartSection.classList.add('hidden');
  produkList.classList.remove('hidden');
};

// Checkout & Simpan ke Supabase
window.checkout = async () => {
  const nama = document.getElementById('namaPembeli').value;
  const alamat = document.getElementById('alamat').value;
  const noHp = document.getElementById('noHp').value;
  const metodeBayar = document.getElementById('metodeBayar').value;
  const bank = document.getElementById('bank')?.value || '';
  const metodeKirim = document.getElementById('metodeKirim').value;
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (!nama || !alamat || !noHp || !metodeBayar || !metodeKirim) {
    return alert('Isi semua data pembeli dengan lengkap');
  }
  if (metodeBayar === 'transfer' && !bank) {
    return alert('Pilih bank jika memilih transfer bank');
  }

  for (const item of cart) {
    await supabase.from('orders').insert({
      product_id: item.id,
      size: item.size,
      quantity: item.qty,
      buyer_name: nama,
      address: alamat,
      phone: noHp,
      payment_method: metodeBayar === 'transfer' ? `Transfer - ${bank}` : metodeBayar,
      shipping_method: metodeKirim,
    });
  }

  alert('Transaksi berhasil!\nStruk sudah dicetak di konsol browser.');
  console.log({ nama, alamat, noHp, metodeBayar, metodeKirim, cart });

  localStorage.removeItem('cart');
  location.reload();
};

window.printReceipt = async () => {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) return alert('Keranjang kosong');

  const nama = document.getElementById('namaPembeli').value;
  const alamat = document.getElementById('alamat').value;
  const noHp = document.getElementById('noHp').value;
  const metodeBayar = document.getElementById('metodeBayar').value;
  const bank = document.getElementById('bank')?.value || '';
  const metodeKirim = document.getElementById('metodeKirim').value;

  if (!nama || !alamat || !noHp || !metodeBayar || !metodeKirim) {
    return alert('Isi lengkap data pembeli terlebih dahulu');
  }

  if (metodeBayar === 'transfer' && !bank) {
    return alert('Pilih bank jika menggunakan metode Transfer Bank');
  }

  // Hitung total harga produk
  let subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Tentukan ongkir berdasarkan metode kirim
  let ongkir = 0;
  let metodeKirimLabel = "";
  if (metodeKirim === "reguler") {
    ongkir = 10000;
    metodeKirimLabel = "Reguler (5-6 hari)";
  } else if (metodeKirim === "express") {
    ongkir = 20000;
    metodeKirimLabel = "Express (2-3 hari)";
  }

  const total = subtotal + ongkir;

  // Buat isi struk
  let html = `
    <p><strong>Nama:</strong> ${nama}</p>
    <p><strong>Alamat:</strong> ${alamat}</p>
    <p><strong>No HP:</strong> ${noHp}</p>
    <p><strong>Pembayaran:</strong> ${
      metodeBayar === 'transfer' ? `Transfer Bank - ${bank}` : metodeBayar.toUpperCase()
    }</p>
    <p><strong>Pengiriman:</strong> ${metodeKirimLabel} - Rp ${ongkir.toLocaleString()}</p>
    <h3>Detail Barang</h3>
    <ul>
  `;

  cart.forEach(item => {
    html += `<li>${item.name} - Size ${item.size} - Rp ${item.price.toLocaleString()}</li>`;
  });

  html += `
    </ul>
    <p><strong>Subtotal:</strong> Rp ${subtotal.toLocaleString()}</p>
    <p><strong>Ongkir:</strong> Rp ${ongkir.toLocaleString()}</p>
    <p><strong>Total Bayar:</strong> Rp ${total.toLocaleString()}</p>
  `;

  const receiptContent = document.getElementById('receiptContent');
  receiptContent.innerHTML = html;

  const receipt = document.getElementById('receipt');
  receipt.classList.remove('hidden');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  await html2canvas(receipt).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    doc.save(`struk_${Date.now()}.pdf`);
  });

  receipt.classList.add('hidden');
};

window.toggleBankDropdown = () => {
  const metode = document.getElementById('metodeBayar').value;
  const bankDropdown = document.getElementById('bankDropdown');
  const vaInfo = document.getElementById('vaInfo');
  const qrImage = document.getElementById('qrImage');
  const qrCode = document.getElementById('qrCode');

  // Reset tampilan
  bankDropdown.classList.add('hidden');
  vaInfo.classList.add('hidden');
  qrImage.classList.add('hidden');
  vaInfo.innerHTML = '';

  if (metode === 'transfer') {
    bankDropdown.classList.remove('hidden');
  } else if (metode === 'dana') {
    vaInfo.classList.remove('hidden');
    vaInfo.innerHTML = `<p><strong>No VA DANA:</strong> 081280306674</p>`;
  } else if (metode === 'qris') {
    qrImage.classList.remove('hidden');
    qrCode.src = 'qr-code.jpg'; 
  }
};

window.handleBankChange = () => {
  const bank = document.getElementById('bank').value;
  const vaInfo = document.getElementById('vaInfo');

  vaInfo.classList.remove('hidden');
  vaInfo.innerHTML = ''; // Reset

  if (bank === 'BCA') {
    vaInfo.innerHTML = `<p><strong>No VA BCA:</strong> 4061723352</p>`;
  } else if (bank === 'BNI') {
    vaInfo.innerHTML = `<p><strong>No VA BNI:</strong> 9876543210</p>`;
  } else if (bank === 'Mandiri') {
    vaInfo.innerHTML = `<p><strong>No VA Mandiri:</strong> 1330027199868</p>`;
  }
};

  

// Saat halaman dimuat, cek apakah ada keranjang
window.addEventListener('DOMContentLoaded', () => {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length > 0) {
    //showCart();
  }
});
