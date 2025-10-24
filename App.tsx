
import React, { useState, useCallback } from 'react';
import { AppState, LandmarkInfo, GroundingSource } from './types';
import { analyzeImage, fetchLandmarkHistory, generateNarration } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audioUtils';
import FileUpload from './components/FileUpload';
import ResultDisplay from './components/ResultDisplay';
import Spinner from './components/Spinner';
import { CameraIcon, SparklesIcon } from './components/IconComponents';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [landmarkInfo, setLandmarkInfo] = useState<LandmarkInfo | null>(null);
  const [landmarkHistory, setLandmarkHistory] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const resetState = () => {
    setAppState(AppState.IDLE);
    setImageFile(null);
    setImageUrl(null);
    setLandmarkInfo(null);
    setLandmarkHistory(null);
    setGroundingSources([]);
    setAudioBuffer(null);
    setErrorMessage(null);
    setLoadingMessage('');
  };

  const handleFileChange = (file: File) => {
    if (file) {
      resetState();
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      processImage(file);
    }
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const processImage = useCallback(async (file: File) => {
    try {
      // Step 1: Analyze Image
      setLoadingMessage('Recognizing landmark...');
      setAppState(AppState.ANALYZING);
      const imagePart = await fileToGenerativePart(file);
      const analysisResult = await analyzeImage(imagePart);
      setLandmarkInfo(analysisResult);

      if (!analysisResult || !analysisResult.name) {
          throw new Error("Could not identify a landmark in the image. Please try another photo.");
      }
      
      // Step 2: Fetch History with Search Grounding
      setLoadingMessage(`Fetching history for ${analysisResult.name}...`);
      setAppState(AppState.FETCHING_HISTORY);
      const historyResult = await fetchLandmarkHistory(analysisResult.name);
      setLandmarkHistory(historyResult.text);
      setGroundingSources(historyResult.sources);
      
      // Step 3: Generate Audio Narration
      setLoadingMessage('Generating audio narration...');
      setAppState(AppState.GENERATING_AUDIO);
      const audioDataB64 = await generateNarration(historyResult.text);
      
      // Fix: Cast window to any to access webkitAudioContext for older browser compatibility
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decodedBuffer = await decodeAudioData(decode(audioDataB64), audioContext, 24000, 1);
      setAudioBuffer(decodedBuffer);
      
      setAppState(AppState.RESULT);
    } catch (error) {
      console.error("Processing failed:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      setErrorMessage(message);
      setAppState(AppState.ERROR);
    }
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.ANALYZING:
      case AppState.FETCHING_HISTORY:
      case AppState.GENERATING_AUDIO:
        return (
            <div className="flex flex-col items-center justify-center text-center">
                {imageUrl && <img src={imageUrl} alt="Uploaded landmark" className="max-h-60 rounded-lg shadow-lg mb-6 animate-pulse"/>}
                <Spinner />
                <p className="mt-4 text-lg text-gray-300">{loadingMessage}</p>
            </div>
        );
      case AppState.RESULT:
        if (imageUrl && landmarkInfo && landmarkHistory !== null) {
          return (
            <ResultDisplay
              imageUrl={imageUrl}
              landmarkInfo={landmarkInfo}
              history={landmarkHistory}
              sources={groundingSources}
              audioBuffer={audioBuffer}
              onReset={resetState}
            />
          );
        }
        return null; // Should not happen
      case AppState.ERROR:
        return (
            <div className="text-center p-6 bg-red-900/50 border border-red-700 rounded-lg">
                <h3 className="text-xl font-bold text-red-400 mb-2">Analysis Failed</h3>
                <p className="text-red-300 mb-4">{errorMessage}</p>
                <button 
                    onClick={resetState}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
      case AppState.IDLE:
      default:
        return (
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <SparklesIcon className="w-10 h-10 text-yellow-400" />
              <h2 className="ml-3 text-3xl sm:text-4xl font-extrabold text-white">GeoNarrate AI</h2>
            </div>
            <p className="max-w-xl mx-auto text-lg text-gray-300 mb-8">
              Your personal photo tour guide. Upload a picture of a landmark to get its history and a narrated audio clip.
            </p>
            <FileUpload onFileSelect={handleFileChange} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {appState === AppState.IDLE ? (
          <header className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text mb-4">
              Photo Tourism AI
            </h1>
            <p className="text-xl text-gray-400">Snap a landmark, get the story.</p>
          </header>
        ) : null }

        <main className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl p-6 sm:p-10 backdrop-blur-sm transition-all duration-500">
          {renderContent()}
        </main>

        <footer className="text-center mt-8 text-gray-500">
          <p>Powered by Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
