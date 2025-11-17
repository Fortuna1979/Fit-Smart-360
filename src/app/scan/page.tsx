'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ArrowLeft, CheckCircle, XCircle, Loader2, Upload, Dumbbell, Clock, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  difficulty: string;
  description: string;
}

interface Equipment {
  equipmentName: string;
  category: string;
  muscleGroups: string[];
  description: string;
  detected: boolean;
  imageUrl?: string;
  exercises?: Exercise[];
  tips?: string[];
  commonMistakes?: string[];
}

export default function ScanPage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scannedEquipments, setScannedEquipments] = useState<Equipment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Carregar equipamentos salvos ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem('scanned_equipments');
    if (saved) {
      setScannedEquipments(JSON.parse(saved));
    }
  }, []);

  // Iniciar câmera
  const startCamera = async () => {
    try {
      setError(null);
      
      // Verificar se getUserMedia está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não disponível neste navegador');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Câmera traseira em mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setStream(mediaStream);
        setCameraActive(true);
      }
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      
      let errorMessage = 'Não foi possível acessar a câmera.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Câmera está sendo usada por outro aplicativo.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Câmera não suporta as configurações solicitadas.';
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Acesso à câmera bloqueado por questões de segurança. Use HTTPS.';
      }
      
      setError(errorMessage + ' Use o upload de imagem como alternativa.');
    }
  };

  // Parar câmera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  // Capturar foto da câmera
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
        analyzeImage(imageData);
      }
    }
  };

  // Upload de imagem via input file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setCapturedImage(imageData);
      analyzeImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  // Captura direta da câmera via input capture
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setCapturedImage(imageData);
      analyzeImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  // Analisar imagem chamando a API route
  const analyzeImage = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setError(null);
    setEquipment(null);

    try {
      // Chamar a API route /api/analyze-equipment
      const response = await fetch('/api/analyze-equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        throw new Error('Erro ao analisar imagem');
      }

      const result = await response.json();
      
      if (result.detected) {
        const newEquipment = { ...result, imageUrl: imageBase64 };
        setEquipment(newEquipment);
        
        // Validar se exercícios foram gerados
        if (!result.exercises || result.exercises.length === 0) {
          setError('Equipamento detectado, mas nenhum exercício foi gerado. Tente novamente.');
        }
      } else {
        setError('Nenhum equipamento de academia detectado. Tente outra foto.');
      }
    } catch (err) {
      console.error('Erro na análise:', err);
      setError('Erro ao analisar imagem. Verifique se a OPENAI_API_KEY está configurada.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Adicionar equipamento à lista
  const addEquipment = () => {
    if (equipment) {
      const updatedList = [...scannedEquipments, equipment];
      setScannedEquipments(updatedList);
      
      // Salvar no localStorage
      localStorage.setItem('scanned_equipments', JSON.stringify(updatedList));
      
      resetScan();
    }
  };

  // Resetar scan
  const resetScan = () => {
    setCapturedImage(null);
    setEquipment(null);
    setError(null);
  };

  // Função para obter cor do badge de dificuldade
  const getDifficultyColor = (difficulty: string) => {
    const lower = difficulty.toLowerCase();
    if (lower.includes('iniciante')) return 'bg-green-500/20 text-green-500';
    if (lower.includes('intermediário') || lower.includes('intermediario')) return 'bg-yellow-500/20 text-yellow-500';
    if (lower.includes('avançado') || lower.includes('avancado')) return 'bg-red-500/20 text-red-500';
    return 'bg-gray-500/20 text-gray-500';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold text-yellow-500">Escanear Equipamento</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      <div className="pt-20 pb-10 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Instruções */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <Camera className="w-6 h-6 text-yellow-500" />
              Como funciona
            </h2>
            <ol className="space-y-2 text-gray-300">
              <li>1. Tire uma foto do equipamento ou faça upload de uma imagem</li>
              <li>2. Nossa IA identifica automaticamente o equipamento</li>
              <li>3. Receba exercícios personalizados para esse equipamento</li>
              <li>4. Adicione à sua lista e monte seu treino completo</li>
            </ol>
          </div>

          {/* Área de Captura */}
          {!capturedImage && (
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 mb-8">
              <h3 className="text-xl font-bold mb-6 text-center">Capturar Equipamento</h3>

              {/* Vídeo da Câmera */}
              {cameraActive && (
                <div className="mb-6">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-xl bg-gray-800"
                  />
                  <Button
                    onClick={capturePhoto}
                    className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    size="lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Capturar Foto
                  </Button>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="w-full mt-2 border-gray-600 text-gray-400"
                  >
                    Cancelar
                  </Button>
                </div>
              )}

              {/* Botões de Ação */}
              {!cameraActive && (
                <div className="space-y-4">
                  {/* Botão Câmera Nativa (Mobile-First) */}
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    size="lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Abrir Câmera
                  </Button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    className="hidden"
                  />

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-gray-900 text-gray-500">ou</span>
                    </div>
                  </div>

                  {/* Botão Upload */}
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                    size="lg"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload de Imagem
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Botão Câmera Avançada (Desktop/Fallback) */}
                  <Button
                    onClick={startCamera}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-400 hover:bg-gray-800"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Câmera Avançada (Preview)
                  </Button>
                </div>
              )}

              {/* Mensagem de Erro */}
              {error && !capturedImage && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Análise em Progresso */}
          {isAnalyzing && (
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-12 text-center">
              <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
              <p className="text-xl text-gray-300">Analisando equipamento...</p>
              <p className="text-sm text-gray-500 mt-2">Gerando exercícios personalizados...</p>
            </div>
          )}

          {/* Resultado da Análise */}
          {capturedImage && !isAnalyzing && (
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 mb-8">
              <img
                src={capturedImage}
                alt="Equipamento capturado"
                className="w-full rounded-xl mb-6"
              />

              {equipment && equipment.detected && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-bold text-lg">Equipamento Detectado!</span>
                  </div>

                  {/* Informações do Equipamento */}
                  <div className="bg-gray-800 rounded-xl p-6 space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">Nome:</span>
                      <p className="text-xl font-bold text-yellow-500">{equipment.equipmentName}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 text-sm">Categoria:</span>
                      <p className="text-white">{equipment.category}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 text-sm">Grupos Musculares:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {equipment.muscleGroups.map((muscle, idx) => (
                          <span
                            key={idx}
                            className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-sm"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-400 text-sm">Descrição:</span>
                      <p className="text-gray-300 mt-1">{equipment.description}</p>
                    </div>
                  </div>

                  {/* Exercícios Gerados */}
                  {equipment.exercises && equipment.exercises.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-xl font-bold">Exercícios Gerados ({equipment.exercises.length})</h3>
                      </div>

                      <div className="space-y-4">
                        {equipment.exercises.map((exercise, idx) => (
                          <div key={idx} className="bg-gray-800 rounded-xl p-5 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <h4 className="text-lg font-bold text-yellow-500">{exercise.name}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getDifficultyColor(exercise.difficulty)}`}>
                                {exercise.difficulty}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div className="bg-gray-900 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-gray-400 mb-1">
                                  <Repeat className="w-4 h-4" />
                                  <span>Séries</span>
                                </div>
                                <p className="text-white font-bold">{exercise.sets}</p>
                              </div>
                              <div className="bg-gray-900 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-gray-400 mb-1">
                                  <Dumbbell className="w-4 h-4" />
                                  <span>Reps</span>
                                </div>
                                <p className="text-white font-bold">{exercise.reps}</p>
                              </div>
                              <div className="bg-gray-900 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-gray-400 mb-1">
                                  <Clock className="w-4 h-4" />
                                  <span>Descanso</span>
                                </div>
                                <p className="text-white font-bold text-xs">{exercise.rest}</p>
                              </div>
                            </div>

                            <div>
                              <span className="text-gray-400 text-sm font-semibold">Como executar:</span>
                              <p className="text-gray-300 text-sm mt-1 leading-relaxed">{exercise.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dicas */}
                  {equipment.tips && equipment.tips.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                      <h4 className="font-bold text-blue-400 mb-3">💡 Dicas Importantes</h4>
                      <ul className="space-y-2 text-sm text-gray-300">
                        {equipment.tips.map((tip, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-blue-400">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Erros Comuns */}
                  {equipment.commonMistakes && equipment.commonMistakes.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
                      <h4 className="font-bold text-red-400 mb-3">⚠️ Erros Comuns</h4>
                      <ul className="space-y-2 text-sm text-gray-300">
                        {equipment.commonMistakes.map((mistake, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-red-400">•</span>
                            <span>{mistake}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      onClick={addEquipment}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                      size="lg"
                    >
                      Adicionar à Lista
                    </Button>
                    <Button
                      onClick={resetScan}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-400"
                      size="lg"
                    >
                      Nova Foto
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-500">
                    <XCircle className="w-6 h-6" />
                    <span className="font-bold">{error}</span>
                  </div>
                  <Button
                    onClick={resetScan}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-400"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Lista de Equipamentos Escaneados */}
          {scannedEquipments.length > 0 && (
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">
                Equipamentos Escaneados ({scannedEquipments.length})
              </h3>

              <div className="space-y-4 mb-6">
                {scannedEquipments.map((eq, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex gap-4 mb-4">
                      {eq.imageUrl && (
                        <img
                          src={eq.imageUrl}
                          alt={eq.equipmentName}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-yellow-500 text-lg">{eq.equipmentName}</h4>
                        <p className="text-sm text-gray-400 mb-2">{eq.category}</p>
                        <div className="flex flex-wrap gap-1">
                          {eq.muscleGroups.slice(0, 3).map((muscle, i) => (
                            <span
                              key={i}
                              className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full"
                            >
                              {muscle}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Resumo de Exercícios */}
                    {eq.exercises && eq.exercises.length > 0 && (
                      <div className="bg-gray-900 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <Dumbbell className="w-4 h-4" />
                          <span>{eq.exercises.length} exercícios disponíveis</span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          {eq.exercises.slice(0, 3).map((ex, i) => (
                            <div key={i}>• {ex.name}</div>
                          ))}
                          {eq.exercises.length > 3 && (
                            <div className="text-yellow-500">+ {eq.exercises.length - 3} mais...</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                size="lg"
              >
                Ver Todos os Treinos
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
