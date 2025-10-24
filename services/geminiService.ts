
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LandmarkInfo, GroundingSource } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
  
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ImagePart {
    inlineData: {
        data: string;
        mimeType: string;
    }
}

export async function analyzeImage(imagePart: ImagePart): Promise<LandmarkInfo> {
    const prompt = "Analyze this image and identify the landmark. Provide its name, location (city, country), and a brief one-sentence description.";
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the landmark." },
                    location: { type: Type.STRING, description: "The city and country where the landmark is located." },
                    description: { type: Type.STRING, description: "A brief one-sentence description of the landmark." }
                },
                required: ["name", "location", "description"]
            }
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as LandmarkInfo;
}

export async function fetchLandmarkHistory(landmarkName: string): Promise<{ text: string; sources: GroundingSource[] }> {
    const prompt = `Provide a concise and engaging history of ${landmarkName}. Focus on its origin, key historical events, and its significance today. Format the response in markdown.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Untitled Source',
        }))
        .filter(source => source.uri) || [];
        
    return { text: response.text, sources };
}

export async function generateNarration(textToNarrate: string): Promise<string> {
    const prompt = `Narrate the following text in a clear, engaging, and slightly enthusiastic tone, as if you are a tour guide: ${textToNarrate}`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // A friendly and clear voice
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Failed to generate audio narration.");
    }
    return base64Audio;
}
