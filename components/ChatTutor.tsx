import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { ChatMessage, TraitDefinition } from '../types';

interface Props {
  onUpdateGenotypes: (p1: string, p2: string, traits?: Partial<TraitDefinition>[]) => void;
}

const ChatTutor: React.FC<Props> = ({ onUpdateGenotypes }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, editingIndex]);

  // Define the tool for the AI
  const updateBoardTool: FunctionDeclaration = {
    name: 'update_punnett_board',
    description: 'Actualiza los campos de genotipos parentales. Úsalo cuando el usuario proponga un problema genético (ej. hemofilia, Mendel).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        parent1: {
          type: Type.STRING,
          description: 'Genotipo Padre 1. Para alelos complejos o ligados al sexo, usa comas: "Xh, Y" o "XH, Xh".'
        },
        parent2: {
          type: Type.STRING,
          description: 'Genotipo Padre 2. Igual formato: "XH, XH" o "aaBb".'
        }
      },
      required: ['parent1', 'parent2']
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !process.env.API_KEY) return;
    
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const historyText = messages.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n');
      
      const prompt = `
        Historial:
        ${historyText}

        Usuario: "${input}"
        
        Instrucciones:
        Eres "MR. Genius", un doctor amigo y experto en genética. 👨‍⚕️
        Tu personalidad es:
        - Amigable, cercano y entusiasta (usa términos como "¡Hola colega!", "¡Mira esto!", "Te explico, amigo").
        - Usas emojis médicos y científicos (🧬, 🩸, 🏥, 💊).
        - Explicas con claridad pero con rigor científico.
        
        1. HERRAMIENTA: Si el usuario plantea un cruce, USA 'update_punnett_board'.
           - LIGADO AL SEXO: Envía gametos separados por coma. Ej: Padre="Xh, Y", Madre="XH, XH".
           - IMPORTANTE: Usa paréntesis si ayuda a la claridad visual del usuario, pero comas es vital para el sistema.
        
        2. EXPLICACIÓN OBLIGATORIA (Especialmente para Sexo):
           - Si preguntan probabilidad de "hijo" vs "hija" o "niño" vs "niña", DEBES separar los porcentajes.
           - Ejemplo: "¡Atención aquí! En varones la probabilidad es del 50%, pero en las chicas es 0%".
           - NO des un porcentaje global (ej. 25% total) sin especificar el sexo si es un rasgo ligado al cromosoma X.
        
        3. ESTRUCTURA:
           - Saludo amistoso de Doctor.
           - Título del caso clínico o problema.
           - Análisis de Gametos (explicado sencillo).
           - Resultados Fenotípicos (Sanos vs Enfermos vs Portadores).
           - Conclusión médica clara.
      `;

      const tools: Tool[] = [{ functionDeclarations: [updateBoardTool] }];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: tools
        }
      });

      const functionCalls = response.functionCalls;
      let aiText = response.text || "";

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
            if (call.name === 'update_punnett_board') {
                const args = call.args as any;
                onUpdateGenotypes(args.parent1, args.parent2);
                
                // Second turn to get the explanation
                if (!aiText) {
                    const secondResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: [
                            { role: 'user', parts: [{ text: prompt }] },
                            { role: 'model', parts: [{ functionCall: call }] },
                            { role: 'user', parts: [{ functionResponse: { name: call.name, response: { result: 'success' } } }] }
                        ]
                    });
                    aiText = secondResponse.text || "¡Listo el cuadro, colega! He actualizado los datos. ¡Analicemos juntos!";
                }
            }
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: aiText || "¡Entendido, colega!" }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "¡Uy! Tengo un problema de conexión en el laboratorio. Intenta de nuevo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Message Management Actions ---

  const handleDeleteMessage = (index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUndoLast = () => {
    setMessages(prev => {
        if (prev.length === 0) return prev;
        return prev.slice(0, -1);
    });
  };

  const handleClearChat = () => {
      if (window.confirm("¿Seguro que quieres borrar toda la conversación, colega?")) {
          setMessages([]);
      }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditText(messages[index].text);
  };

  const handleSaveEdit = (index: number) => {
    setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[index] = { ...newMsgs[index], text: editText };
        return newMsgs;
    });
    setEditingIndex(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-science-200 overflow-hidden flex flex-col h-[500px] md:h-[600px] w-full mx-auto transition-all duration-500 hover:shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-science-600 to-science-500 p-4 text-white flex justify-between items-center">
        <div className="flex flex-col">
            <h3 className="font-bold flex items-center gap-2 text-xl">
            👨‍⚕️ Dr. Genius <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-light">En línea</span>
            </h3>
            <span className="text-xs text-science-100">Consultorio Genético Virtual</span>
        </div>
        <div className="flex items-center gap-1">
            <button 
                onClick={handleUndoLast} 
                disabled={messages.length === 0}
                title="Retroceder"
                className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <button 
                onClick={handleClearChat}
                disabled={messages.length === 0}
                title="Limpiar Chat" 
                className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
        </div>
      </div>
      
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-12 px-4 animate-pop-in">
            <div className="text-6xl mb-4 animate-float">👨‍⚕️</div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">¡Bienvenido al laboratorio!</h2>
            <p className="mb-8 font-medium text-slate-600 max-w-md mx-auto">Soy el Dr. Genius. Plantéame cualquier problema genético o simplemente saluda.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <div className="bg-white border border-science-200 p-4 rounded-xl text-sm text-science-700 cursor-pointer hover:bg-science-50 transition shadow-sm hover:shadow-md transform hover:-translate-y-1"
                     onClick={() => setInput("Si un hombre sano (XY) tiene hijos con una mujer portadora de hemofilia (XH, Xh), ¿qué pasa con las hijas?")}>
                   🩸 <strong>Caso Hemofilia</strong><br/>"Hombre sano y mujer portadora..."
                </div>
                 <div className="bg-white border border-science-200 p-4 rounded-xl text-sm text-science-700 cursor-pointer hover:bg-science-50 transition shadow-sm hover:shadow-md transform hover:-translate-y-1"
                     onClick={() => setInput("Cruce dihíbrido clásico de plantas altas y rojas (AaBb x AaBb)")}>
                   🌱 <strong>Cruce Mendeliano</strong><br/>"Dihíbrido clásico (AaBb x AaBb)..."
                </div>
                 <div className="bg-white border border-science-200 p-4 rounded-xl text-sm text-science-700 cursor-pointer hover:bg-science-50 transition shadow-sm hover:shadow-md transform hover:-translate-y-1"
                     onClick={() => setInput("¿Qué significa heterocigoto y homocigoto?")}>
                   📚 <strong>Conceptos Básicos</strong><br/>"¿Qué es heterocigoto?"
                </div>
                <div className="bg-white border border-science-200 p-4 rounded-xl text-sm text-science-700 cursor-pointer hover:bg-science-50 transition shadow-sm hover:shadow-md transform hover:-translate-y-1"
                     onClick={() => setInput("Explícame la tercera ley de Mendel")}>
                   ⚖️ <strong>Leyes de Mendel</strong><br/>"Tercera ley explicada..."
                </div>
            </div>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} group animate-slide-up`}>
            
            {/* Actions Left */}
            {m.role === 'user' && editingIndex !== i && (
                 <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
                    <button onClick={() => handleStartEdit(i)} className="p-1 text-slate-400 hover:text-science-600 hover:bg-slate-100 rounded" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button onClick={() => handleDeleteMessage(i)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                 </div>
            )}

            {/* Bubble */}
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-sm md:text-base relative shadow-sm ${
              m.role === 'user' 
                ? 'bg-science-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none prose prose-sm prose-sky'
            }`}>
              {m.role === 'model' && <div className="text-xs text-science-600 font-bold mb-1 flex items-center gap-1">👨‍⚕️ Dr. Genius</div>}
              
              {editingIndex === i ? (
                  <div className="flex flex-col gap-2 min-w-[250px]">
                      <textarea 
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full text-slate-800 bg-white border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-science-400 outline-none"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                          <button onClick={handleCancelEdit} className="text-xs px-3 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 font-medium">Cancelar</button>
                          <button onClick={() => handleSaveEdit(i)} className="text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 font-medium">Guardar</button>
                      </div>
                  </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              )}
            </div>

            {/* Actions Right */}
            {m.role === 'model' && editingIndex !== i && (
                 <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button onClick={() => handleDeleteMessage(i)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                 </div>
            )}
            
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
             <div className="bg-white border border-slate-100 text-slate-500 text-sm px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2 shadow-sm">
               <span className="animate-spin">🧬</span> Analizando secuencia genética...
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base focus:outline-none focus:border-science-500 focus:ring-2 focus:ring-science-100 placeholder-slate-400 transition-all"
            placeholder="Escribe tu consulta médica aquí..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-science-600 hover:bg-science-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTutor;