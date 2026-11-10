import imageCompression from 'browser-image-compression';

/**
 * Memproses dan menormalisasi file gambar sebelum dikirim ke server:
 * 1. Deteksi file HEIC / HEIF (dari kamera iPhone) dan konversi ke JPEG blob via heic2any.
 * 2. Kompresi gambar: target < 1MB, maksimal dimensi 1600px.
 * 3. Memastikan orientasi EXIF dinormalisasi lewat re-encoding canvas.
 */
export async function prepareReceiptImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  let processFile: File | Blob = file;

  // 1. Tangani format HEIC / HEIF dari iPhone (FR-02, Q23)
  const isHeic =
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif';

  if (isHeic) {
    try {
      const heic2any = (await import('heic2any')).default;
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      });

      const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      processFile = new File([singleBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
        type: 'image/jpeg',
      });
    } catch (err) {
      console.warn('Gagal mengonversi file HEIC secara otomatis, mencoba proses langsung:', err);
    }
  }

  // 2. Kompresi dan normalisasi orientasi EXIF
  const options = {
    maxSizeMB: 1.0,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/jpeg',
    onProgress: (progress: number) => {
      if (onProgress) onProgress(progress);
    },
  };

  try {
    const compressedFile = await imageCompression(processFile as File, options);
    return compressedFile;
  } catch (err) {
    console.warn('Kompresi browser gagal, menggunakan file asli:', err);
    return file;
  }
}

