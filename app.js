// Elemen DOM
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const actions = document.getElementById('actions');
const pdfPreview = document.getElementById('pdfPreview');
const convertToWordBtn = document.getElementById('convertToWord');
const convertToImageBtn = document.getElementById('convertToImage');
const loader = document.getElementById('loader');

// Tambahkan log untuk debugging
console.log('App initialized');

// Variabel untuk menyimpan file PDF dan data
let pdfFile = null;
let pdfData = null;
let pdfPages = 0;

// Menangani event drag dan drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropArea.classList.add('active');
}

function unhighlight() {
    dropArea.classList.remove('active');
}

// Menangani file yang di-drop
dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0 && files[0].type === 'application/pdf') {
        fileInput.files = files;
        handleFileChange();
    } else {
        alert('Silakan pilih file PDF saja.');
    }
}

// Menangani file yang dipilih dari input file
fileInput.addEventListener('change', handleFileChange);

function handleFileChange() {
    if (fileInput.files.length > 0) {
        pdfFile = fileInput.files[0];
        
        if (pdfFile.type !== 'application/pdf') {
            alert('Silakan pilih file PDF saja.');
            return;
        }
        
        const fileName = pdfFile.name;
        const fileSize = formatFileSize(pdfFile.size);
        
        fileInfo.innerHTML = `
            <p><strong>Nama File:</strong> ${fileName}</p>
            <p><strong>Ukuran:</strong> ${fileSize}</p>
        `;
        
        actions.style.display = 'flex';
        pdfPreview.innerHTML = '';
        
        // Membaca file PDF untuk preview
        readPDF(pdfFile);
    }
}

// Format ukuran file
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Membaca file PDF
function readPDF(file) {
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        pdfData = new Uint8Array(e.target.result);
        
        try {
            console.log("Loading PDF document...");
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            pdfPages = pdf.numPages;
            console.log(`PDF loaded with ${pdfPages} pages`);
            
            // Tampilkan preview untuk beberapa halaman pertama (maksimal 3)
            const previewPages = Math.min(pdfPages, 3);
            
            for (let i = 1; i <= previewPages; i++) {
                const page = await pdf.getPage(i);
                renderPage(page, i);
            }
            
            if (pdfPages > 3) {
                pdfPreview.innerHTML += `<p style="width: 100%; text-align: center;">... dan ${pdfPages - 3} halaman lainnya</p>`;
            }
            
        } catch (error) {
            console.error('Error reading PDF:', error);
            alert('Terjadi kesalahan saat membaca file PDF. Silakan coba file lain.');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Render halaman PDF ke canvas
async function renderPage(page, pageNumber) {
    const scale = 0.5; // Skala untuk thumbnail
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    canvas.className = 'pdf-page';
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    const pageContainer = document.createElement('div');
    pageContainer.className = 'page-container';
    pageContainer.innerHTML = `<div class="page-number">Halaman ${pageNumber}</div>`;
    pageContainer.appendChild(canvas);
    
    pdfPreview.appendChild(pageContainer);
}

// Konversi PDF ke Word
convertToWordBtn.addEventListener('click', async function() {
    if (!pdfData) {
        alert('Silakan unggah file PDF terlebih dahulu.');
        return;
    }
    
    showLoader();
    
    try {
        // Menggunakan setTimeout untuk memberikan waktu bagi UI untuk menampilkan loader
        setTimeout(async () => {
            try {
                await convertPdfToWord(pdfData, pdfFile.name.replace('.pdf', '.docx'));
            } catch (error) {
                console.error('Error in conversion:', error);
                hideLoader();
                alert('Terjadi kesalahan saat konversi ke Word. Silakan coba lagi.');
            }
        }, 100);
    } catch (error) {
        console.error('Error starting conversion:', error);
        hideLoader();
        alert('Terjadi kesalahan saat memulai konversi. Silakan coba lagi.');
    }
});

// Konversi PDF ke gambar
convertToImageBtn.addEventListener('click', async function() {
    if (!pdfData) {
        alert('Silakan unggah file PDF terlebih dahulu.');
        return;
    }
    
    showLoader();
    
    try {
        // Menggunakan setTimeout untuk memberikan waktu bagi UI untuk menampilkan loader
        setTimeout(async () => {
            try {
                await convertPdfToImages(pdfData, pdfFile.name.replace('.pdf', ''));
            } catch (error) {
                console.error('Error in conversion:', error);
                hideLoader();
                alert('Terjadi kesalahan saat konversi ke gambar. Silakan coba lagi.');
            }
        }, 100);
    } catch (error) {
        console.error('Error starting conversion:', error);
        hideLoader();
        alert('Terjadi kesalahan saat memulai konversi. Silakan coba lagi.');
    }
});

// Menampilkan loader
function showLoader() {
    loader.style.display = 'flex';
}

// Menyembunyikan loader
function hideLoader() {
    loader.style.display = 'none';
}

// Menghapus dialog unduhan jika ada
function removeDownloadDialog() {
    const existingDialog = document.getElementById('download-container');
    if (existingDialog) {
        document.body.removeChild(existingDialog);
    }
    
    const existingMultipleDialog = document.getElementById('multiple-download-container');
    if (existingMultipleDialog) {
        document.body.removeChild(existingMultipleDialog);
    }
}

// Fungsi untuk mengkonversi PDF ke Word
async function convertPdfToWord(pdfData, outputFilename) {
    try {
        // Membaca PDF
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const numPages = pdf.numPages;
        
        // Membuat dokumen Word baru dengan docx
        const children = [];
        
        // Memproses setiap halaman
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            let lastY = null;
            let text = '';
            let paragraphs = [];
            
            // Mengelompokkan teks berdasarkan posisi Y untuk membentuk paragraf
            for (const item of textContent.items) {
                if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
                    // Baris baru
                    if (text.trim()) {
                        paragraphs.push(
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun(text.trim())
                                ]
                            })
                        );
                    }
                    text = '';
                }
                text += item.str + ' ';
                lastY = item.transform[5];
            }
            
            // Menambahkan paragraf terakhir
            if (text.trim()) {
                paragraphs.push(
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun(text.trim())
                        ]
                    })
                );
            }
            
            // Menambahkan semua paragraf ke children
            children.push(...paragraphs);
            
            // Tambahkan page break jika bukan halaman terakhir
            if (i < numPages) {
                children.push(
                    new docx.Paragraph({
                        children: [new docx.TextRun("")],
                        pageBreakBefore: true
                    })
                );
            }
        }
        
        // Membuat dokumen final
        const doc = new docx.Document({
            sections: [
                {
                    properties: {},
                    children: children
                }
            ]
        });
        
        // Menghasilkan file Word
        const buffer = await docx.Packer.toBuffer(doc);
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        
        // Coba otomatis download dulu
        try {
            saveAs(blob, outputFilename);
            console.log('SaveAs berhasil dipanggil');
        } catch (saveError) {
            console.error('Error with saveAs:', saveError);
        }
        
        // Buat link download manual sebagai fallback
        const downloadContainer = document.createElement('div');
        downloadContainer.id = 'download-container';
        downloadContainer.style.position = 'fixed';
        downloadContainer.style.top = '50%';
        downloadContainer.style.left = '50%';
        downloadContainer.style.transform = 'translate(-50%, -50%)';
        downloadContainer.style.backgroundColor = 'white';
        downloadContainer.style.padding = '20px';
        downloadContainer.style.borderRadius = '8px';
        downloadContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        downloadContainer.style.zIndex = '9999';
        
        // Tambahkan tombol tutup
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '16px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = function() {
            document.body.removeChild(downloadContainer);
        };
        
        // Susun elemen
        downloadContainer.appendChild(closeButton);
        const headerElement = document.createElement('h3');
        headerElement.textContent = 'Unduhan Siap';
        headerElement.style.marginBottom = '10px';
        headerElement.style.color = '#2c3e50';
        
        const infoElement = document.createElement('p');
        infoElement.textContent = 'File Word telah berhasil dibuat.';
        infoElement.style.marginBottom = '15px';
        
        downloadContainer.appendChild(headerElement);
        downloadContainer.appendChild(infoElement);
        
        // Buat link download
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = outputFilename;
        downloadLink.textContent = 'Klik disini untuk mengunduh file Word';
        downloadLink.style.display = 'block';
        downloadLink.style.margin = '20px auto';
        downloadLink.style.textAlign = 'center';
        downloadLink.style.padding = '10px';
        downloadLink.style.backgroundColor = '#3498db';
        downloadLink.style.color = 'white';
        downloadLink.style.borderRadius = '5px';
        downloadLink.style.textDecoration = 'none';
        downloadLink.style.cursor = 'pointer';
        
        downloadContainer.appendChild(downloadLink);
        
        // Tambahkan container ke body
        document.body.appendChild(downloadContainer);
        
        hideLoader();
    } catch (error) {
        console.error('Error converting to Word:', error);
        hideLoader();
        alert('Terjadi kesalahan saat konversi ke Word. Silakan coba lagi.');
        throw error;
    }
}

// Fungsi untuk mengkonversi PDF ke gambar
async function convertPdfToImages(pdfData, outputFilenameBase) {
    try {
        // Membaca PDF
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const numPages = pdf.numPages;
        
        // Proses setiap halaman
        if (numPages > 1) {
            const scale = 2.0; // Kualitas gambar (2x)
            
            // Buat container untuk semua link download
            const multipleDownloadContainer = document.createElement('div');
            multipleDownloadContainer.id = 'multiple-download-container';
            multipleDownloadContainer.style.position = 'fixed';
            multipleDownloadContainer.style.top = '50%';
            multipleDownloadContainer.style.left = '50%';
            multipleDownloadContainer.style.transform = 'translate(-50%, -50%)';
            multipleDownloadContainer.style.backgroundColor = 'white';
            multipleDownloadContainer.style.padding = '20px';
            multipleDownloadContainer.style.maxHeight = '80vh';
            multipleDownloadContainer.style.overflow = 'auto';
            multipleDownloadContainer.style.borderRadius = '8px';
            multipleDownloadContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
            multipleDownloadContainer.style.zIndex = '9999';
            
            const closeButton = document.createElement('button');
            closeButton.textContent = 'X';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.background = 'none';
            closeButton.style.border = 'none';
            closeButton.style.fontSize = '16px';
            closeButton.style.cursor = 'pointer';
            closeButton.onclick = function() {
                document.body.removeChild(multipleDownloadContainer);
            };
            
            multipleDownloadContainer.appendChild(closeButton);
            
            const headerElement = document.createElement('h3');
            headerElement.textContent = 'Unduhan Gambar Siap';
            headerElement.style.marginBottom = '10px';
            headerElement.style.color = '#2c3e50';
            
            const infoElement = document.createElement('p');
            infoElement.textContent = `${numPages} gambar telah berhasil dibuat. Klik link di bawah untuk mengunduh:`;
            infoElement.style.marginBottom = '15px';
            
            multipleDownloadContainer.appendChild(headerElement);
            multipleDownloadContainer.appendChild(infoElement);
            
            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale });
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;
                
                // Buat link download untuk setiap halaman
                await new Promise((resolve) => {
                    canvas.toBlob((blob) => {
                        const filename = `${outputFilenameBase}_halaman_${i}.png`;
                        
                        // Coba saveAs terlebih dahulu
                        try {
                            saveAs(blob, filename);
                        } catch (saveError) {
                            console.error(`Error with saveAs for page ${i}:`, saveError);
                        }
                        
                        // Buat fallback link dalam container
                        const downloadLink = document.createElement('a');
                        downloadLink.href = URL.createObjectURL(blob);
                        downloadLink.download = filename;
                        downloadLink.textContent = `Unduh Halaman ${i}`;
                        downloadLink.style.display = 'block';
                        downloadLink.style.margin = '10px';
                        downloadLink.style.padding = '8px 12px';
                        downloadLink.style.backgroundColor = '#3498db';
                        downloadLink.style.color = 'white';
                        downloadLink.style.borderRadius = '4px';
                        downloadLink.style.textDecoration = 'none';
                        downloadLink.style.textAlign = 'center';
                        downloadLink.style.cursor = 'pointer';
                        
                        multipleDownloadContainer.appendChild(downloadLink);
                        resolve();
                    }, 'image/png');
                });
                
                // Jeda kecil antara setiap proses halaman
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Tambahkan container ke body setelah semua link siap
            document.body.appendChild(multipleDownloadContainer);
            hideLoader();
            
        } else {
            // Jika hanya 1 halaman
            const page = await pdf.getPage(1);
            const scale = 2.0;
            const viewport = page.getViewport({ scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // Buat dialog download untuk satu halaman
            const downloadContainer = document.createElement('div');
            downloadContainer.id = 'download-container';
            downloadContainer.style.position = 'fixed';
            downloadContainer.style.top = '50%';
            downloadContainer.style.left = '50%';
            downloadContainer.style.transform = 'translate(-50%, -50%)';
            downloadContainer.style.backgroundColor = 'white';
            downloadContainer.style.padding = '20px';
            downloadContainer.style.borderRadius = '8px';
            downloadContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
            downloadContainer.style.zIndex = '9999';
            
            const closeButton = document.createElement('button');
            closeButton.textContent = 'X';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.background = 'none';
            closeButton.style.border = 'none';
            closeButton.style.fontSize = '16px';
            closeButton.style.cursor = 'pointer';
            closeButton.onclick = function() {
                document.body.removeChild(downloadContainer);
            };
            
            downloadContainer.appendChild(closeButton);
            
            const headerElement = document.createElement('h3');
            headerElement.textContent = 'Unduhan Siap';
            headerElement.style.marginBottom = '10px';
            headerElement.style.color = '#2c3e50';
            
            const infoElement = document.createElement('p');
            infoElement.textContent = 'Gambar telah berhasil dibuat.';
            infoElement.style.marginBottom = '15px';
            
            downloadContainer.appendChild(headerElement);
            downloadContainer.appendChild(infoElement);
            
            // Konversi canvas ke PNG dan tambahkan link
            canvas.toBlob((blob) => {
                const filename = `${outputFilenameBase}.png`;
                
                // Coba saveAs terlebih dahulu
                try {
                    saveAs(blob, filename);
                } catch (saveError) {
                    console.error('Error with saveAs for image:', saveError);
                }
                
                // Buat fallback download link
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(blob);
                downloadLink.download = filename;
                downloadLink.textContent = 'Klik disini untuk mengunduh gambar';
                downloadLink.style.display = 'block';
                downloadLink.style.margin = '20px auto';
                downloadLink.style.textAlign = 'center';
                downloadLink.style.padding = '10px';
                downloadLink.style.backgroundColor = '#3498db';
                downloadLink.style.color = 'white';
                downloadLink.style.borderRadius = '5px';
                downloadLink.style.textDecoration = 'none';
                downloadLink.style.cursor = 'pointer';
                
                downloadContainer.appendChild(downloadLink);
                document.body.appendChild(downloadContainer);
            }, 'image/png');
            
            hideLoader();
        }
    } catch (error) {
        console.error('Error converting to images:', error);
        hideLoader();
        alert('Terjadi kesalahan saat konversi ke gambar. Silakan coba lagi.');
        throw error;
    }
} 