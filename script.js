// [script.js]

const SUPABASE_URL = 'https://hmwtsbgdizxkkhcwaury.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtd3RzYmdkaXp4a2toY3dhdXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjcyMzksImV4cCI6MjA2NTEwMzIzOX0.BSq6ScSU9zQ8UywyM5Z3RrSvcYKzpGmxUjA_xKYsAVY';

let products = [], cart = [];
let shippingCost = 15000;
let shippingMethod = 'Reguler (5-6 hari)';
const virtualAccounts = {
  BCA: '4061723352',
  MANDIRI: '1330027199868',
  DANA: '081280306674'
};

window.onload = () => {
  document.getElementById('roleSelector').classList.remove('hidden');
};

function selectRole(role) {
  document.getElementById('roleSelector').classList.add('hidden');
  if (role === 'user') {
    document.getElementById('userSection').classList.remove('hidden');
    fetchProducts();
  } else {
    document.getElementById('adminLogin').classList.remove('hidden');
  }
}

function backToRoleMenu() {
  location.reload();
}

function loginAdmin() {
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;
  if (user === 'admin@example.com' && pass === '123') {
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');
    loadAdminProducts();
    loadPurchaseHistory();
  } else {
    document.getElementById('adminLoginMsg').innerText = 'Login gagal';
  }
}

function logout() {
  location.reload();
}

function parseHarga(value) {
  return typeof value === 'string' ? parseInt(value.replace(/\./g, '').replace(/,/g, '')) || 0 : value;
}

function formatDateTime(date) {
  return new Date(date).toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short'
  });
}

async function fetchProducts() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`,
      'Cache-Control': 'no-cache'
    }
  });
  products = await res.json();
  renderProducts('productList');
  setTimeout(updateAllSizeStocks, 500);
}

function renderProducts(containerId) {
  const list = document.getElementById(containerId);
  list.innerHTML = '';
  products.forEach((p, i) => {
    list.innerHTML += `
      <div class="product-item">
        <img src="${p.image}" width="100%">
        <h3>${p.name}</h3>
        <p>Rp ${parseHarga(p.price).toLocaleString('id-ID')}</p>
        <label>Ukuran:
          <select id="size-${i}" onchange="updateSizeStock(${i})">
            ${[36,37,38,39,40,41,42,43,44,45,46].map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </label>
        <span id="size-stock-${i}">Stok: -</span><br/>
        <button onclick="addToCart(${i})">Tambah ke Keranjang</button>
      </div>`;
  });
}

async function fetchProductSizes(productId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/product_sizes?product_id=eq.${productId}`, {
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`
    }
  });
  return await res.json();
}

async function updateSizeStock(index) {
  const product = products[index];
  const selectedSize = document.getElementById(`size-${index}`).value;
  const sizes = await fetchProductSizes(product.id);
  const sizeData = sizes.find(s => s.size == selectedSize);
  const stokSize = sizeData ? sizeData.stock : 0;
  document.getElementById(`size-stock-${index}`).innerText = `Stok: ${stokSize}`;
}

async function updateAllSizeStocks() {
  for (let i = 0; i < products.length; i++) {
    await updateSizeStock(i);
  }
}

async function addToCart(i) {
  const product = products[i];
  const size = document.getElementById(`size-${i}`).value;
  const sizes = await fetchProductSizes(product.id);
  const sizeData = sizes.find(s => s.size == size);
  const stockSize = sizeData ? sizeData.stock : 0;
  if (stockSize <= 0) return alert("Stok ukuran ini habis!");
  cart.push({ ...product, size, stock_size: stockSize });
  alert(`Ditambahkan: ${product.name} (Ukuran ${size})`);
}

function showCart() {
  document.getElementById('userSection').classList.add('hidden');
  document.getElementById('cartSection').classList.remove('hidden');
  renderCart();
  toggleVASection();
}

function backToShop() {
  document.getElementById('cartSection').classList.add('hidden');
  document.getElementById('userSection').classList.remove('hidden');
}

function renderCart() {
  const cartItems = document.getElementById('cartItems');
  cartItems.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    total += parseHarga(item.price);
    cartItems.innerHTML += `<div>${item.name} (Uk ${item.size}) - Rp ${parseHarga(item.price).toLocaleString('id-ID')}</div>`;
  });
  document.getElementById('totalPrice').innerText = total.toLocaleString('id-ID');
}

function updateShipping() {
  const method = document.getElementById('shippingMethod').value;
  if (method === 'Express') {
    shippingCost = 20000;
    shippingMethod = 'Express (2-3 hari)';
  } else {
    shippingCost = 10000;
    shippingMethod = 'Reguler (5-6 hari)';
  }
  document.getElementById('shippingCost').innerText = shippingCost.toLocaleString('id-ID');
}

function toggleVASection() {
  const method = document.getElementById('paymentMethod').value;
  document.getElementById('bankSelection').classList.add('hidden');
  document.getElementById('danaVA').classList.add('hidden');
  document.getElementById('qrisSection').classList.add('hidden');

  if (method === 'Transfer Bank') {
    document.getElementById('bankSelection').classList.remove('hidden');
    showVA();
  } else if (method === 'DANA') {
    document.getElementById('danaVA').classList.remove('hidden');
  } else if (method === 'QRIS') {
    document.getElementById('qrisSection').classList.remove('hidden');
  }
}

function showVA() {
  const bank = document.getElementById('bankType').value;
  document.getElementById('vaNumber').innerText = virtualAccounts[bank] || '-';
}

async function checkout() {
  const name = document.getElementById('buyerName').value.trim();
  const address = document.getElementById('buyerAddress').value.trim();
  const phone = document.getElementById('buyerPhone').value.trim();
  const method = document.getElementById('paymentMethod').value;
  const bank = document.getElementById('bankType')?.value || '';
  const totalProduk = cart.reduce((sum, item) => sum + parseHarga(item.price), 0);
  const total = totalProduk + shippingCost;
  const paymentDetail = method === 'Transfer Bank' ? `${method} (${bank})` : method;
  let vaNumber = '-';
  if (method === 'Transfer Bank') vaNumber = virtualAccounts[bank];
  else if (method === 'DANA') vaNumber = virtualAccounts['DANA'];
  else if (method === 'QRIS') vaNumber = 'Scan QRIS untuk membayar';

  if (!name || !address || !phone) {
    document.getElementById('cashWarning').innerText = "Semua data wajib diisi!";
    return;
  }

  const waktuTransaksi = new Date().toISOString();

  const groupedItems = {};
  cart.forEach(item => {
    const key = `${item.id}-${item.size}`;
    if (!groupedItems[key]) {
      groupedItems[key] = { ...item, quantity: 0 };
    }
    groupedItems[key].quantity++;
  });

  for (const key in groupedItems) {
    const item = groupedItems[key];

    for (let i = 0; i < item.quantity; i++) {
      await fetch(`${SUPABASE_URL}/rest/v1/sales`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buyer_name: name,
          address,
          phone,
          product_id: item.id,
          product_name: item.name,
          price: parseHarga(item.price),
          size: item.size,
          payment_method: paymentDetail,
          shipping_method: shippingMethod,
          shipping_cost: shippingCost,
          created_at: waktuTransaksi
        })
      });
    }

    await fetch(`${SUPABASE_URL}/rest/v1/product_sizes?product_id=eq.${item.id}&size=eq.${item.size}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stock: item.stock_size - item.quantity })
    });
  }

  savePurchaseToLocalStorage({
    id: Date.now(),
    name,
    address,
    phone,
    payment: paymentDetail,
    shipping: `${shippingMethod} - Rp ${shippingCost.toLocaleString('id-ID')}`,
    items: cart.map(i => ({ name: i.name, size: i.size, price: i.price })),
    total,
    time: waktuTransaksi
  });

  document.getElementById('receiptName').innerText = name;
  document.getElementById('receiptAddress').innerText = address;
  document.getElementById('receiptPhone').innerText = phone;
  document.getElementById('receiptMethod').innerText = paymentDetail;
  document.getElementById('receiptShipping').innerText = `${shippingMethod} - Rp ${shippingCost.toLocaleString('id-ID')}`;
  document.getElementById('receiptTime').innerText = formatDateTime(waktuTransaksi);
  if (vaNumber && vaNumber !== '-') {
    document.getElementById('receiptVA').classList.remove('hidden');
    document.getElementById('receiptVANumber').innerText = vaNumber;
  } else {
    document.getElementById('receiptVA').classList.add('hidden');
  }

  document.getElementById('receiptItems').innerHTML = cart.map(i =>
    `<p>${i.name} (Uk ${i.size}) - Rp ${parseHarga(i.price).toLocaleString('id-ID')}</p>`).join('');
  document.getElementById('receiptTotal').innerText = total.toLocaleString('id-ID');
  document.getElementById('cartSection').classList.add('hidden');
  document.getElementById('receipt').classList.remove('hidden');

  // ✅ Notifikasi berhasil
  alert("🎉 Pembelian berhasil! Terima kasih telah berbelanja.");

  cart = [];
}

function downloadReceipt() {
  const element = document.getElementById('receipt');
  document.getElementById('btnDownload').style.display = 'none';
  document.getElementById('btnFinish').style.display = 'none';

  setTimeout(() => {
    html2pdf().set({
      margin: 0.5,
      filename: `struk_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(element).save().then(() => {
      document.getElementById('btnDownload').style.display = 'inline-block';
      document.getElementById('btnFinish').style.display = 'inline-block';
    });
  }, 200);
}

function finish() {
  document.getElementById('receipt').classList.add('hidden');
  document.getElementById('userSection').classList.remove('hidden');
}

function savePurchaseToLocalStorage(purchaseData) {
  let history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
  history.push(purchaseData);
  localStorage.setItem('purchaseHistory', JSON.stringify(history));
}

function loadPurchaseHistory() {
  const container = document.getElementById('purchaseHistory');
  const history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
  if (!history.length) {
    container.innerHTML = '<p>Belum ada riwayat pembelian.</p>';
    return;
  }

  container.innerHTML = history.map(p => `
    <div class="history-item" id="history-${p.id}">
      <p><strong>Nama:</strong> ${p.name}</p>
      <p><strong>Telepon:</strong> ${p.phone}</p>
      <p><strong>Alamat:</strong> ${p.address}</p>
      <p><strong>Waktu:</strong> ${formatDateTime(p.time)}</p>
      <p><strong>Pengiriman:</strong> ${p.shipping}</p>
      <p><strong>Nama Sepatu:</strong></p>
      <ul>
        ${p.items.map(i => `<li>${i.name} (Uk ${i.size}) - Rp ${parseHarga(i.price).toLocaleString('id-ID')}</li>`).join('')}
      </ul>
      <p>Total: Rp ${parseHarga(p.total).toLocaleString('id-ID')}</p>
      <button onclick="deletePurchaseHistory(${p.id})">🗑️ Hapus Riwayat Ini</button>
    </div>
  `).join('');
}

function deletePurchaseHistory(id) {
  let history = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
  history = history.filter(p => p.id !== id);
  localStorage.setItem('purchaseHistory', JSON.stringify(history));
  loadPurchaseHistory();
}

async function loadAdminProducts() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`,
      'Cache-Control': 'no-cache'
    }
  });
  const data = await res.json();
  const container = document.getElementById('adminProductList');
  container.innerHTML = '';

  if (!data.length) {
    container.innerHTML = '<p>Belum ada produk.</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'product-grid';

  data.forEach(p => {
    const item = document.createElement('div');
    item.className = 'product-item';
    item.innerHTML = `
      <img src="${p.image}?v=${Math.random()}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>Rp ${parseHarga(p.price).toLocaleString('id-ID')}</p>
      <p><strong>Stok per Ukuran:</strong></p>
      <ul id="sizeStock-${p.id}"><li>Loading...</li></ul>
      <button onclick="editProduct(${p.id}, '${p.name}', ${parseHarga(p.price)}, '${p.image}')">✏️ Edit</button>
      <button onclick="deleteProduct(${p.id})">🗑️ Hapus</button>
    `;
    grid.appendChild(item);
  });

  container.appendChild(grid);
  products = data;
  data.forEach(p => loadAdminSizeStock(p.id));
}

async function loadAdminSizeStock(productId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/product_sizes?product_id=eq.${productId}`, {
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`
    }
  });
  const sizes = await res.json();
  const list = document.getElementById(`sizeStock-${productId}`);
  list.innerHTML = sizes.length
    ? sizes.map(s => `<li>Uk ${s.size}: ${s.stock}</li>`).join('')
    : '<li>Belum ada data ukuran</li>';
}

async function addProduct() {
  const name = document.getElementById('newName').value;
  const price = parseInt(document.getElementById('newPrice').value);
  const image = document.getElementById('newImage').value;

  if (!name || !price || !image) return alert("Isi semua field!");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, price, image })
  });

  if (res.ok) {
    alert("Produk ditambahkan!");
    document.getElementById('newName').value = '';
    document.getElementById('newPrice').value = '';
    document.getElementById('newImage').value = '';
    loadAdminProducts();
  } else {
    alert("Gagal menambahkan produk.");
  }
}

function editProduct(id, name, price, image) {
  const newName = prompt("Edit Nama Produk:", name);
  const newPriceStr = prompt("Edit Harga Produk:", price);
  const newImage = prompt("Edit URL Gambar Produk:", image);

  if (!newName || !newPriceStr || !newImage) {
    alert("Semua field harus diisi!");
    return;
  }

  const newPrice = parseInt(newPriceStr);
  if (isNaN(newPrice)) {
    alert("Harga harus berupa angka!");
    return;
  }

  fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({ name: newName, price: newPrice, image: newImage })
  }).then(async res => {
    if (res.ok) {
      const updatedProduct = await res.json();
      const productId = updatedProduct[0].id;

      const existingSizesRes = await fetch(`${SUPABASE_URL}/rest/v1/product_sizes?product_id=eq.${productId}`, {
        headers: {
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_API_KEY}`
        }
      });
      const existingSizes = await existingSizesRes.json();

      for (let size = 36; size <= 46; size++) {
        const inputStock = prompt(`Stok untuk Ukuran ${size}:`, "0");
        const stock = parseInt(inputStock);
        if (!isNaN(stock)) {
          const existing = existingSizes.find(s => s.size === size);
          if (existing) {
            await fetch(`${SUPABASE_URL}/rest/v1/product_sizes?product_id=eq.${productId}&size=eq.${size}`, {
              method: 'PATCH',
              headers: {
                apikey: SUPABASE_API_KEY,
                Authorization: `Bearer ${SUPABASE_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ stock })
            });
          } else {
            await fetch(`${SUPABASE_URL}/rest/v1/product_sizes`, {
              method: 'POST',
              headers: {
                apikey: SUPABASE_API_KEY,
                Authorization: `Bearer ${SUPABASE_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ product_id: productId, size, stock })
            });
          }
        }
      }

      loadAdminProducts();
    } else {
      alert("Gagal update.");
    }
  });
}

async function deleteProduct(id) {
  if (!confirm("Yakin ingin menghapus produk ini beserta semua ukuran?")) return;

  console.log("Menghapus ukuran untuk product ID:", id);
  const resSize = await fetch(`${SUPABASE_URL}/rest/v1/product_sizes?product_id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`
    }
  });
  console.log("Respon hapus ukuran:", resSize.status);

  console.log("Menghapus produk utama:", id);
  const resProduct = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`
    }
  });
  console.log("Respon hapus produk:", resProduct.status);

  if (resProduct.ok) {
    alert("Produk berhasil dihapus!");
    loadAdminProducts();
  } else {
    alert("Gagal menghapus produk.");
    const errorMsg = await resProduct.text();
    console.error("Error detail:", errorMsg);
  }
}
