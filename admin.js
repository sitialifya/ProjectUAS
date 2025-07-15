
const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
const supabase = createClient(
  'https://lmmiuxgdypnpjdvffxdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbWl1eGdkeXBucGpkdmZmeGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjgyMjQsImV4cCI6MjA2NTEwNDIyNH0.aXRzfjm9uZw5gTHPgs7ZxyB4RQhNposr5AwRi1dofjU'
);

const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const formProduk = document.getElementById('formProduk');
const riwayat = document.getElementById('riwayat');
const produkList = document.getElementById('produkList');
const editForm = document.getElementById('editForm');

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) {
    loginSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    fetchRiwayat();
    fetchProdukAdmin();
  } else {
    alert('Login gagal');
  }
}
window.login = login;

async function logout() {
  await supabase.auth.signOut();
  location.reload();
}
window.logout = logout;

formProduk?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('nama').value;
  const price = parseInt(document.getElementById('harga').value);
  const file = document.getElementById('gambar').files[0];
  const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
  const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
  if (uploadError) return alert('Upload gagal');

  const { data: imageData } = supabase.storage.from('images').getPublicUrl(fileName);

  const { error: insertError } = await supabase.from('products').insert({ name, price, image: imageData.publicUrl });
  if (insertError) return alert('Gagal simpan produk');

  formProduk.reset();
  alert('Produk ditambahkan');
  fetchProdukAdmin(); // Refresh daftar produk
});

async function fetchRiwayat() {
  const { data, error } = await supabase.from('orders').select('*, products(name)');
  if (error) {
    console.error("Gagal ambil riwayat:", error);
    return;
  }

  riwayat.innerHTML = data.map(o => `
    <div class="card">
      <p><strong>Produk:</strong> ${o.products?.name || 'Tidak ditemukan'}</p>
      <p>Ukuran: ${o.size}</p>
      <p>Qty: ${o.quantity}</p>
      <p>Nama Pembeli: ${o.buyer_name}</p>
      <p>Alamat: ${o.address}</p>
      <p>No HP: ${o.phone}</p>
      <p>Metode Bayar: ${o.payment_method}</p>
      <p>Pengiriman: ${o.shipping_method}</p>
      <p><i>${new Date(o.created_at).toLocaleString()}</i></p>
      <button onclick="hapusRiwayat(${o.id})">Hapus Riwayat</button>
    </div>
  `).join('');
}

async function fetchProdukAdmin() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return console.error(error);

  produkList.innerHTML = data.map(p => `
    <div class="card">
      <img src="${p.image}" width="100" />
      <p><strong>${p.name}</strong></p>
      <p>Rp ${p.price.toLocaleString()}</p>
      <button onclick='showEditForm(${p.id}, ${JSON.stringify(p.name)}, ${p.price}, ${JSON.stringify(p.image)})'>Edit</button>
      <button onclick="hapusProduk(${p.id})">Hapus</button>
    </div>
  `).join('');
}

window.hapusProduk = async (id) => {
  const konfirmasi = confirm('Yakin ingin menghapus produk ini?');
  if (!konfirmasi) return;

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return alert('Gagal hapus produk');
  alert('Produk berhasil dihapus');
  fetchProdukAdmin();
};

window.showEditForm = (id, name, price, image) => {
  document.getElementById('editId').value = id;
  document.getElementById('editNama').value = name;
  document.getElementById('editHarga').value = price;
  editForm.classList.remove('hidden');
};

window.cancelEdit = () => {
  editForm.classList.add('hidden');
};

window.submitEdit = async () => {
  const id = document.getElementById('editId').value;
  const name = document.getElementById('editNama').value;
  const price = parseInt(document.getElementById('editHarga').value);
  const file = document.getElementById('editGambar').files[0];

  let imageUrl = null;
  if (file) {
    const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
    if (uploadError) return alert('Upload gambar baru gagal');

    const { data: imageData } = supabase.storage.from('images').getPublicUrl(fileName);
    imageUrl = imageData.publicUrl;
  }

  const updateData = imageUrl ? { name, price, image: imageUrl } : { name, price };
  const { error } = await supabase.from('products').update(updateData).eq('id', id);
  if (error) return alert('Gagal update produk');

  alert('Produk berhasil diupdate');
  editForm.classList.add('hidden');
  fetchProdukAdmin();
};

window.hapusRiwayat = async (id) => {
  const konfirmasi = confirm("Yakin ingin menghapus riwayat ini?");
  if (!konfirmasi) return;

  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) {
    alert("Gagal menghapus riwayat");
    console.error(error);
    return;
  }

  alert("Riwayat berhasil dihapus");
  fetchRiwayat(); // refresh daftar
};

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    loginSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    fetchRiwayat();
    fetchProdukAdmin();
  }
})();
