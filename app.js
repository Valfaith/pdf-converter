// Memastikan PDF.js workers tersedia
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

// Elemen DOM
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const actions = document.getElementById('actions');
const pdfPreview = document.getElementById('pdfPreview');
const convertToWordBtn = document.getElementById('convertToWord');
const convertToImageBtn = document.getElementById('convertToImage');
const loader = document.getElementById('loader');

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
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            pdfPages = pdf.numPages;
            
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
                hideLoader();
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
                hideLoader();
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
        saveAs(new Blob([buffer]), outputFilename);
        
        alert('Konversi ke Word berhasil!');
    } catch (error) {
        console.error('Error converting to Word:', error);
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
                
                // Konversi canvas ke PNG dan download
                canvas.toBlob((blob) => {
                    saveAs(blob, `${outputFilenameBase}_halaman_${i}.png`);
                }, 'image/png');
                
                // Jeda kecil antara setiap proses halaman
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            alert(`Konversi berhasil! ${numPages} gambar telah diunduh.`);
        } else {
            // Jika hanya 1 halaman, langsung konversi dan download
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
            
            // Konversi canvas ke PNG dan download
            canvas.toBlob((blob) => {
                saveAs(blob, `${outputFilenameBase}.png`);
                alert('Konversi berhasil! Gambar telah diunduh.');
            }, 'image/png');
        }
    } catch (error) {
        console.error('Error converting to images:', error);
        throw error;
    }
} 
} 