import React, { useState } from 'react';
import { 
  FileText, 
  Wand2, 
  Loader2, 
  Settings2,
  Copy,
  CheckCircle2,
  Clock,
  Sparkles,
  Upload,
  X
} from 'lucide-react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const TONES = [
  "Hard Selling (Langsung jualan, semangat, urgen)",
  "Soft Selling (Bercerita/Storytelling, halus)",
  "Review Jujur (Testimoni, kasual, gaya UGC)",
  "Lucu/Kocak (Trend Tiktok, menghibur)",
  "Aesthetic (Sangat santai, elegan, puitis)"
];

const DURATIONS = [
  { id: 'short', label: '10 - 15 Detik (Video Sangat Pendek)', words: 30 },
  { id: 'medium', label: '20 - 30 Detik (Video Standar Tiktok/Reels)', words: 65 },
  { id: 'long', label: '45 - 60 Detik (Video Penjelasan/Review Detail)', words: 130 }
];

export default function App() {
  const [productText, setProductText] = useState('');
  const [productImageBase64, setProductImageBase64] = useState(null);
  const [imageMimeType, setImageMimeType] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const [tone, setTone] = useState(TONES[0]);
  const [duration, setDuration] = useState(DURATIONS[1]);
  
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("Ukuran gambar terlalu besar! Maksimal 4MB.");
        return;
      }
      setPreviewUrl(URL.createObjectURL(file));
      setImageMimeType(file.type);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        setProductImageBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProductImageBase64(null);
    setPreviewUrl('');
    setImageMimeType('');
  };

  const handleGenerateScript = async () => {
    if (!productText.trim() && !productImageBase64) {
      alert("Harap upload foto produk ATAU ketik nama produknya!");
      return;
    }
    if (!GEMINI_API_KEY) {
      alert("API Key belum disetting di Cloudflare!");
      return;
    }

    setIsGenerating(true);
    setScript('');
    setIsCopied(false);

    try {
      // Menggunakan versi model yang paling stabil dan terbaru
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      const promptInstruction = `Anda adalah copywriter konten TikTok/Shopee Affiliate profesional. Tolong buatkan naskah/skrip Voice Over. INFORMASI: - Detail Tambahan: ${productText || 'Tolong analisis dari gambar terlampir untuk mengetahui apa produknya.'} - Gaya Bahasa: ${tone} - Perkiraan Durasi Teks: ${duration.words} kata. - Bahasa: Indonesia yang natural, gaul, dan relevan dengan tren saat ini. FORMAT YANG WAJIB DIIKUTI: [HOOK] (Tulis 1-2 kalimat pembuka yang sangat memancing rasa penasaran atau relate dengan masalah penonton di awal video) [ISI SKRIP] (Tulis isi skrip promosi yang mengalir natural, tanpa tanda baca aneh, karena teks ini akan dibaca oleh AI Voice Over di CapCut. Pastikan menyebutkan ajakan bertindak seperti 'cek keranjang kuning' di akhir)`;

      const contents = { parts: [{ text: promptInstruction }] };

      if (productImageBase64) {
        contents.parts.unshift({
          inlineData: { mimeType: imageMimeType, data: productImageBase64 }
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [contents] })
      });

      const data = await response.json();
      
      if (!response.ok) {
         throw new Error(data.error?.message || "Terjadi kesalahan API");
      }

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (generatedText) {
        const cleanText = generatedText.split('*').join('');
        setScript(cleanText.trim());
      } else {
        throw new Error("Gemini tidak mengembalikan teks.");
      }
    } catch (error) {
      console.error(error);
      alert("Gagal membuat skrip: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!script) return;
    navigator.clipboard.writeText(script).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      const textArea = document.createElement("textarea");
      textArea.value = script;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-indigo-50 text-slate-800 font-sans p-3 md:p-8 flex items-center justify-center">
      <div className="max-w-3xl w-full space-y-4 md:space-y-6">
        
        <header className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-indigo-100 flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 text-center md:text-left">
          <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Sparkles size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">AI Script Writer</h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1">Upload foto produk Anda, otomatis jadi kata-kata promosi.</p>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="p-4 md:p-6 bg-slate-50/50 border-b border-indigo-50 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">1. Upload Foto / Screenshot</label>
                {!previewUrl ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 md:h-36 border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50 hover:bg-indigo-100 cursor-pointer transition-colors">
                    <Upload className="text-indigo-500 mb-2" size={24} />
                    <span className="text-xs md:text-sm text-indigo-700 font-semibold text-center px-4">Pilih Gambar dari HP</span>
                    <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleImageUpload} />
                  </label>
                ) : (
                  <div className="relative w-full h-32 md:h-36 rounded-xl overflow-hidden border-2 border-indigo-200 bg-white flex items-center justify-center shadow-inner">
                    <img src={previewUrl} alt="Preview Produk" className="h-full w-full object-contain" />
                    <button onClick={removeImage} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md transition-all">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">2. Info Promo (Opsional)</label>
                  <textarea 
                    rows={2}
                    value={productText}
                    onChange={(e) => setProductText(e.target.value)}
                    placeholder="Contoh: Diskon 50% khusus hari ini."
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm bg-white shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs md:text-sm bg-white cursor-pointer">
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <select value={duration.id} onChange={(e) => setDuration(DURATIONS.find(d => d.id === e.target.value))} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs md:text-sm bg-white cursor-pointer">
                      {DURATIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerateScript}
              disabled={isGenerating || (!productText.trim() && !productImageBase64)}
              className={isGenerating || (!productText.trim() && !productImageBase64) ? 'w-full py-3.5 md:py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-base md:text-lg mt-2 bg-slate-200 text-slate-400 cursor-not-allowed' : 'w-full py-3.5 md:py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-base md:text-lg mt-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 active:scale-[0.98]'}
            >
              {isGenerating ? <><Loader2 className="animate-spin" size={20} /> AI Sedang Membaca...</> : <><Wand2 size={20} /> Tuliskan Hook & Skrip Saya!</>}
            </button>
          </div>

          <div className="p-4 md:p-6 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText size={18} className="text-indigo-500"/> Hasil Skrip (Siap Copy)
              </label>
              {script && (
                <button onClick={copyToClipboard} className={isCopied ? 'text-xs md:text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shadow-sm border bg-green-50 text-green-700 border-green-200' : 'text-xs md:text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shadow-sm border bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'}>
                  {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  {isCopied ? 'Tersalin!' : 'Copy Semua Teks'}
                </button>
              )}
            </div>
            <textarea 
              rows={8}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Hasil Hook dan Skrip dari AI Gemini akan muncul di sini..."
              className="w-full p-4 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm md:text-base leading-relaxed bg-white font-medium text-slate-800 placeholder-slate-400"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
