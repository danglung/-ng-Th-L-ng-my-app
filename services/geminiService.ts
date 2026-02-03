
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceType } from "../types";
import { decode, decodeAudioData, audioBufferToWav } from "../utils/audioUtils";

export async function generateTTS(text: string, voiceName: VoiceType): Promise<{ blob: Blob; url: string; duration: number }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Không nhận được dữ liệu âm thanh từ AI.");
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const decodedBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);
    
    const wavBlob = audioBufferToWav(audioBuffer);
    const url = URL.createObjectURL(wavBlob);

    return {
      blob: wavBlob,
      url,
      duration: audioBuffer.duration
    };
  } catch (error) {
    console.error("Lỗi khi chuyển đổi TTS:", error);
    throw error;
  }
}

export async function extractTextFromDocument(file: File): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  // Xác định MIME type chính xác cho các tệp văn phòng
  let mimeType = file.type;
  if (!mimeType) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': mimeType = 'application/pdf'; break;
      case 'docx': mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
      case 'doc': mimeType = 'application/msword'; break;
      case 'txt': mimeType = 'text/plain'; break;
      default: mimeType = 'application/octet-stream';
    }
  }

  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            { text: "Hãy trích xuất toàn bộ nội dung văn bản trong tài liệu này (PDF, DOC hoặc DOCX). Chỉ trả về nội dung văn bản thô của tài liệu, không thêm lời chào, không giải thích, không định dạng Markdown đặc biệt. Nếu tài liệu trống, hãy trả về chuỗi rỗng." }
          ]
        }
      ]
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Lỗi khi trích xuất văn bản:", error);
    throw new Error("Không thể trích xuất văn bản từ tệp này. Vui lòng đảm bảo tệp không có mật khẩu bảo vệ và đúng định dạng.");
  }
}
