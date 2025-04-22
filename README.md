# Aplikasi Konverter PDF

Aplikasi web untuk mengkonversi file PDF ke format Word dan gambar PNG. Aplikasi ini berjalan sepenuhnya di sisi klien (browser) tanpa memerlukan server untuk pemrosesan.

## Fitur

- Konversi PDF ke dokumen Word (.docx)
- Konversi PDF ke gambar PNG
- Preview dokumen PDF
- Antarmuka drag & drop yang mudah digunakan
- Tidak ada transfer data ke server - semua pemrosesan dilakukan di browser
- Responsif untuk berbagai ukuran layar

## Teknologi yang Digunakan

- HTML5
- CSS3
- JavaScript (ES6+)
- [PDF.js](https://mozilla.github.io/pdf.js/) - untuk membaca dan merender file PDF
- [docx.js](https://docx.js.org/) - untuk membuat dokumen Word
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/) - untuk menyimpan file

## Cara Menggunakan

1. Buka aplikasi di browser
2. Tarik dan lepas file PDF ke area yang ditentukan, atau klik untuk memilih file
3. Setelah file diupload, pratinjau akan ditampilkan
4. Pilih tombol "Konversi ke Word" atau "Konversi ke Gambar" sesuai kebutuhan
5. Unduh file hasil konversi

## Hosting di Cloudflare Pages

Aplikasi ini dibuat khusus untuk berjalan di Cloudflare Pages atau layanan hosting statis lainnya. Langkah-langkah untuk men-deploy di Cloudflare Pages:

1. Unggah semua file ke repositori Git (misalnya GitHub)
2. Masuk ke [Cloudflare Pages](https://pages.cloudflare.com/)
3. Hubungkan repositori Git Anda
4. Pilih branch yang ingin di-deploy (biasanya `main` atau `master`)
5. Pada pengaturan build, konfigurasi sebagai berikut:
   - Build command: (kosongkan)
   - Build output directory: / (root)
   - Root directory: (kosongkan)
6. Klik "Save and Deploy"

Cloudflare Pages akan secara otomatis men-deploy aplikasi Anda, dan aplikasi akan tersedia di domain `[project-name].pages.dev`.

### Konfigurasi Khusus untuk Cloudflare Pages

Jika Anda memerlukan konfigurasi khusus, Anda dapat membuat file `_headers` dan `_redirects` di root proyek Anda. Contoh file `_headers` yang mengizinkan PDF.js Worker untuk berjalan dengan benar:

```
/*
  Access-Control-Allow-Origin: *
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
```

## Limitasi

- Konversi PDF ke Word memiliki keterbatasan dalam mempertahankan format yang kompleks
- File PDF yang besar mungkin membutuhkan lebih banyak waktu untuk diproses di browser
- Beberapa PDF yang dienkripsi atau dilindungi mungkin tidak dapat dikonversi

## Catatan Penting

Semua pemrosesan dilakukan di browser pengguna tanpa mengirimkan data ke server. Ini berarti:
- Privasi pengguna terjaga
- Tidak ada biaya pemrosesan server
- Kecepatan konversi bergantung pada perangkat pengguna

## Lisensi

MIT License

---

Dibuat dengan ❤️ untuk memenuhi kebutuhan konversi PDF tanpa server 