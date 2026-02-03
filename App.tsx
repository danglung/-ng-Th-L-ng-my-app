
import React, { useState } from 'react';
import { VoiceType, VoiceOption, AudioResult } from './types';
import { generateTTS, extractTextFromDocument } from './services/geminiService';

const VOICE_OPTIONS: VoiceOption[] = [
  { id: VoiceType.NORTH_FEMALE, label: 'Giọng nữ (Kore) - Miền Bắc', description: 'Trẻ trung và truyền cảm' },
  { id: VoiceType.SOUTH_FEMALE, label: 'Giọng nữ (Puck) - Miền Nam', description: 'Ngọt ngào và nhẹ nhàng' },
  { id: VoiceType.MALE, label: 'Giọng nam (Charon)', description: 'Trầm ấm và nam tính' },
  { id: VoiceType.STRONG_MALE, label: 'Giọng nam (Fenrir)', description: 'Mạnh mẽ và uy lực' },
  { id: VoiceType.NATURAL_AI, label: 'Giọng AI (Zephyr)', description: 'Tự nhiên, dễ nghe' },
  { id: VoiceType.LYRICAL_FEMALE, label: 'Giọng nữ (Aoede)', description: 'Trữ tình và sâu lắng' },
  { id: VoiceType.SERIOUS_FEMALE, label: 'Giọng nữ (Ananke)', description: 'Nghiêm túc và chuyên nghiệp' },
  { id: VoiceType.YOUNG_MALE, label: 'Giọng nam (Arcas)', description: 'Trẻ trung và năng động' },
];

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>(VoiceType.NORTH_FEMALE);
  const [loading, setLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AudioResult | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const fileName = file.name.toLowerCase();
    
    // Xử lý tệp .txt thông thường
    if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          setText(content);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
      return;
    }

    // Xử lý tệp .pdf sử dụng Gemini AI (Bỏ qua doc/docx)
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      setIsExtracting(true);
      try {
        const extractedText = await extractTextFromDocument(file);
        if (extractedText) {
          setText(extractedText);
        } else {
          setError('Tài liệu PDF có vẻ trống hoặc không thể trích xuất được văn bản.');
        }
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi đọc tệp tài liệu.');
      } finally {
        setIsExtracting(false);
        event.target.value = '';
      }
    } else {
      setError('Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp .pdf hoặc .txt.');
      event.target.value = '';
    }
  };

  const handleConvert = async () => {
    if (!text.trim()) {
      setError('Vui lòng nhập văn bản hoặc tải tệp lên để chuyển đổi.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { blob, url, duration } = await generateTTS(text, selectedVoice);
      setResult({
        blob,
        url,
        duration,
        voiceName: VOICE_OPTIONS.find(v => v.id === selectedVoice)?.label || ''
      });
    } catch (err: any) {
      setError('Có lỗi xảy ra trong quá trình chuyển đổi giọng nói. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 bg-pink-50">
      {/* Header */}
      <header className="max-w-6xl mx-auto text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-red-600 mb-2 embossed-text tracking-tight uppercase">
          Chuyển Đổi Văn Bản Thành Giọng Nói
        </h1>
        <p className="text-pink-800/80 text-lg font-medium">
          Biến nội dung văn bản của bạn thành âm thanh sống động chỉ trong vài giây.
        </p>
        <div className="inline-block mt-3 px-4 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-pink-200">
           <p className="text-pink-600 text-sm italic font-bold">
            Thiết kế: Đặng Thị Lùng
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column - Input */}
        <section className="bg-white/90 backdrop-blur rounded-2xl shadow-xl shadow-pink-200/50 border border-pink-100 p-6 flex flex-col h-full relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-pink-700 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Nhập Nội Dung
            </h2>
            <div className="flex gap-2">
              <label className={`cursor-pointer ${isExtracting ? 'bg-pink-50 text-pink-300' : 'bg-pink-100 hover:bg-pink-200 text-pink-700'} px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 border border-pink-200`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {isExtracting ? 'Đang đọc...' : 'Tải tệp (.pdf, .txt)'}
                <input 
                  type="file" 
                  accept=".txt,.pdf,application/pdf,text/plain" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  disabled={isExtracting}
                />
              </label>
            </div>
          </div>

          <div className="relative flex-grow">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập hoặc dán văn bản tại đây..."
              disabled={isExtracting}
              className={`w-full h-64 md:h-80 p-4 border-2 border-pink-50 rounded-xl focus:ring-4 focus:ring-pink-200 focus:border-pink-300 outline-none resize-none text-slate-700 bg-pink-50/30 font-medium transition-all ${isExtracting ? 'opacity-50' : ''}`}
            />
            {isExtracting && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-full shadow-xl border border-pink-200">
                  <svg className="animate-spin h-6 w-6 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span className="text-sm font-bold text-pink-700">Đang trích xuất văn bản...</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <label className="block text-sm font-bold text-pink-700 mb-1.5">Chọn giọng đọc</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value as VoiceType)}
                className="w-full bg-white border-2 border-pink-100 text-slate-800 text-sm font-semibold rounded-lg focus:ring-pink-500 focus:border-pink-500 block p-2.5 transition-all outline-none"
              >
                {VOICE_OPTIONS.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.label} - {voice.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleConvert}
                disabled={loading || isExtracting}
                className={`w-full sm:w-auto h-[46px] px-10 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  loading || isExtracting ? 'bg-pink-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Chuyển đổi ngay
                  </>
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-red-700 text-sm font-bold">{error}</p>
            </div>
          )}
        </section>

        {/* Right Column - Results */}
        <section className="bg-white/90 backdrop-blur rounded-2xl shadow-xl shadow-pink-200/50 border border-pink-100 p-6 flex flex-col h-full">
          <h2 className="text-xl font-bold text-pink-700 flex items-center gap-2 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            Kết Quả Giọng Đọc
          </h2>

          {result ? (
            <div className="flex flex-col h-full">
              <div className="bg-pink-50/50 border-2 border-pink-100 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-pink-200 rounded-full flex items-center justify-center text-pink-600 mb-4 animate-pulse shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5v14"/><path d="M22 8v8"/><path d="M7 8v8"/><path d="M2 10v4"/></svg>
                </div>
                <h3 className="font-extrabold text-xl text-pink-800">{result.voiceName}</h3>
                <div className="mt-1 px-3 py-0.5 bg-pink-100 rounded-full">
                  <p className="text-pink-600 text-sm font-bold">Thời lượng: {formatDuration(result.duration)}</p>
                </div>
                
                <div className="mt-8 w-full">
                   <audio key={result.url} controls className="w-full h-14 custom-audio shadow-sm rounded-full">
                     <source src={result.url} type="audio/wav" />
                     Trình duyệt của bạn không hỗ trợ phát âm thanh.
                   </audio>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-1 gap-3">
                <a
                  href={result.url}
                  download={`tts-dang-thi-lung-${Date.now()}.wav`}
                  className="flex items-center justify-center gap-3 bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-pink-200 transition-all active:scale-[0.98]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Tải Về Âm Thanh (.wav)
                </a>
                <button
                  onClick={() => {
                    setResult(null);
                    setText('');
                  }}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-pink-50 text-pink-500 font-bold py-3 px-6 rounded-xl border-2 border-pink-100 transition-all"
                >
                  Làm mới ứng dụng
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 opacity-70">
              <div className="w-28 h-28 bg-pink-50 rounded-full flex items-center justify-center text-pink-200 mb-6 border-4 border-white shadow-lg">
                 <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5v14"/><path d="M22 8v8"/><path d="M7 8v8"/><path d="M2 10v4"/></svg>
              </div>
              <p className="text-pink-700/60 text-lg font-bold max-w-[300px]">
                Vui lòng nhấn <span className="text-red-500 underline decoration-2">Chuyển đổi</span> để tạo và nghe kết quả giọng đọc.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 text-center text-pink-400 font-semibold text-sm">
        <p>&copy; 2024 Vietnamese AI TTS &bull; Thiết kế bởi Đặng Thị Lùng &bull; Gemini AI Technology</p>
      </footer>
    </div>
  );
};

export default App;
