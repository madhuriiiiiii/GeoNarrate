
import React, { useState, useEffect, useRef } from 'react';
import { LandmarkInfo, GroundingSource } from '../types';
import { PlayIcon, PauseIcon, RedoIcon, LinkIcon } from './IconComponents';
import { marked } from 'marked';

interface ResultDisplayProps {
  imageUrl: string;
  landmarkInfo: LandmarkInfo;
  history: string;
  sources: GroundingSource[];
  audioBuffer: AudioBuffer | null;
  onReset: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ imageUrl, landmarkInfo, history, sources, audioBuffer, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Fix: Cast window to any to access webkitAudioContext for older browser compatibility
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const togglePlayback = () => {
    if (!audioBuffer || !audioContextRef.current) return;
    
    if (isPlaying) {
      audioSourceRef.current?.stop();
      audioSourceRef.current = null;
      setIsPlaying(false);
    } else {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        setIsPlaying(false);
        audioSourceRef.current = null;
      };
      source.start();
      audioSourceRef.current = source;
      setIsPlaying(true);
    }
  };

  const createMarkup = (markdownText: string) => {
    return { __html: marked(markdownText, { sanitize: true }) };
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 animate-fade-in">
      <div className="lg:w-1/2 flex flex-col items-center">
        <img src={imageUrl} alt={landmarkInfo.name} className="w-full h-auto object-cover rounded-xl shadow-lg mb-4" />
        <button 
          onClick={onReset}
          className="mt-4 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-5 rounded-lg transition-colors"
        >
          <RedoIcon className="w-5 h-5" />
          Analyze Another Photo
        </button>
      </div>
      <div className="lg:w-1/2">
        <h2 className="text-3xl font-bold text-white">{landmarkInfo.name}</h2>
        <p className="text-lg text-gray-400 mb-4">{landmarkInfo.location}</p>
        <p className="text-gray-300 italic mb-6">"{landmarkInfo.description}"</p>
        
        {audioBuffer && (
          <div className="mb-6">
            <button
              onClick={togglePlayback}
              className="flex items-center gap-3 w-full text-left bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md"
            >
              {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6" />}
              <span className="text-lg">{isPlaying ? 'Pause Narration' : 'Play Narration'}</span>
            </button>
          </div>
        )}

        <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white max-w-none bg-gray-900/50 p-4 rounded-lg">
          <div dangerouslySetInnerHTML={createMarkup(history)} />
        </div>

        {sources.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-300 mb-2">Sources:</h4>
            <ul className="space-y-2">
              {sources.map((source, index) => (
                <li key={index}>
                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-blue-400 hover:text-blue-300 transition-colors group">
                    <LinkIcon className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span className="group-hover:underline break-all">{source.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;
