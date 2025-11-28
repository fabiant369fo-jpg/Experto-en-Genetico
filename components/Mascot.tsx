import React, { useState } from 'react';

const FACTS = [
  "¿Sabías que compartimos el 50% de nuestro ADN con las bananas? 🍌",
  "Mendel era un monje y usó casi 30,000 plantas de guisantes para sus experimentos. 🌱",
  "Los seres humanos tienen entre 20,000 y 25,000 genes. 🧬",
  "El cromosoma Y es mucho más pequeño que el cromosoma X. 🔬",
  "¡La hemofilia afectó a la realeza europea durante años! 👑",
  "El ADN si se desenrollara llegaría de la Tierra al Sol y volvería (varias veces). ☀️",
  "Solo el 0.1% de tu ADN te hace diferente a cualquier otra persona. 👯‍♂️",
  "¡Tú puedes, futuro genetista! Sigue experimentando. 🚀"
];

const Mascot: React.FC = () => {
  const [showBubble, setShowBubble] = useState(false);
  const [fact, setFact] = useState(FACTS[0]);

  const handleClick = () => {
    const randomFact = FACTS[Math.floor(Math.random() * FACTS.length)];
    setFact(randomFact);
    setShowBubble(true);
    
    // Auto hide after 5 seconds
    setTimeout(() => setShowBubble(false), 6000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Speech Bubble */}
      <div 
        className={`bg-white border-2 border-science-500 p-4 rounded-2xl rounded-br-none shadow-xl mb-2 max-w-xs transition-all duration-300 transform origin-bottom-right ${showBubble ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
      >
        <p className="text-sm text-slate-700 font-medium">
            {fact}
        </p>
      </div>

      {/* Avatar Button */}
      <button 
        onClick={handleClick}
        className="pointer-events-auto bg-white p-2 rounded-full shadow-lg border-4 border-science-400 hover:border-science-600 transition-all hover:scale-110 active:scale-95 animate-float group"
        title="¡Haz clic para un dato curioso!"
      >
        <div className="text-5xl group-hover:animate-wiggle">👨‍⚕️</div>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-science-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-science-500"></span>
        </span>
      </button>
    </div>
  );
};

export default Mascot;