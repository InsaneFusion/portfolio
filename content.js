const portfolioContent = {
  hero: {
    title: "Juan Merlo",
    subtitle: "Game Interaction and System Designer",
    description: "Diseño de UX/UI y modelos de interacción humana adecuado a sistemas dinámicos"
  },

  project: {
    title: "Peacemakers Mayhem",
    description: "Videojuego de acción en tiempo real con gestión de escuadra, diseñado con enfoque en rejugabilidad y legibilidad en entornos caoticos."
  },

  cards: [
    {
      title: "Controles twin-stick",
      image: "media/gif1.gif",
      description: "Introduce una capa de complejidad adicional al elemento Run n' Gun favoreciendo la saturacion del jugador cuando asi sea requerido, de modo que la intensidad de los encuentros puede ser medida finamente."
    },
{
      title: "Flow diseñado a multiples niveles",
      image: "media/gif2.gif",
      description: "Elementos de gestion en Micro, Macro y Meta Loop que garantizan retencion del jugador. Estos elementos tienen influencias cruzadas entre si que alteran el comportamiento del juego en tiempo real."
    },
{
      title: "Gameplay narrativo",
      image: "media/gif3.gif",
      description: "Sistema de muerte permanente, cambio de personajes en tiempo real y finales según supervivencia de la escuadra que fomentan la toma de desiciones rapida, la rejugabilidad y la exploracion de posibilidades."
    },
{
      title: "Playtesting",
      image: "media/gif4.gif",
      description: "Los elementos UX/UI fueron diseñados y ubicados respondiendo a las necesidades del jugador, pulidos a traves de la observacion y el testing en usuarios de diferentes ambitos, ya sea casual o gamer y con distintos niveles de afinidad con el genero."
    },
{
      title: "Sistema adecuado a reaccion humana",
      image: "media/gif5.gif",
      description: "Skills pensados para ser adecuados a cualquier nivel de habilidad. Para un jugador avanzado, una herramienta poderosa. Para un jugador novato, un boton de panico. En ambos casos, cumple su funcion"
    },
{
      title: "Feedback multi-capa audiovisual",
      image: "media/gif6.gif",
      description: "Redundancia deliberada en orden de suministrar informacion critica para la longevidad de la partida. Informacion como el estado de las skills es otorgada via aura, interfaz inferior (UI), y señales sonoras de inicio, termino y disponibilidad."
    },
{
      title: "Estados excluyentes no discretos",
      image: "media/gif7.gif",
      description: "Sistema de condiciones que permite la solapacion organica de estados. Cada condicion se evalua por si sola permitiendo el solapamiento de ellas. A cambio, en la etapa de diseño se deben razonar excepciones o condiciones extra para cada una, llevando a los resultados premeditados."
    },
{
      title: "Escalabilidad",
      image: "media/gif8.gif",
      description: "La informacion que compone los elementos se encuentra alojada en indices dentro del nucleo del sistema y no una instancia particular. Estos valores se pueden acceder para crear nuevas instancias sin necesidad de alterar estructuras existentes."
    },
{
      title: "Asistencia por NPCs",
      image: "media/gif9.gif",
      description: "Concepto explorado superficialmente por el titulo 'Contra Force' para SNES del año 1992. El gameplay fue rapidamente pensado para un multijugador Cooperativo, y la IA fue diseñada para comportarse como un jugador de habilidad sub-optima."
    },
{
      title: "Exploracion de conceptos y evaluacion de compatibilidad",
      image: "media/gif10.gif",
      description: "Sistemas como activar o desactivar el seguimiento fueron implementadas, pero al final se descartaron por ir en contra de la dinamica fundamental del juego. Lo mismo ocurre con mecanicas como campos de vision, ocultamiento, cadaveres y coberturas que fueron descartadas, entre otras."
    },
  ]
};

function loadPortfolioContent() {
  // Hero
  document.getElementById('hero-title').textContent = portfolioContent.hero.title;
  document.getElementById('hero-subtitle').textContent = portfolioContent.hero.subtitle;
  document.getElementById('hero-description').textContent = portfolioContent.hero.description;

  // Proyecto
  document.getElementById('project-title').textContent = portfolioContent.project.title;
  document.getElementById('project-description').textContent = portfolioContent.project.description;

  // Tarjetas
  const container = document.getElementById('cards-container');
  container.innerHTML = '';

  portfolioContent.cards.forEach(card => {
    const cardHTML = `
      <div class="bg-zinc-900 p-6 rounded-2xl card-hover">
        <h3 class="text-xl font-semibold text-emerald-400 mb-4">${card.title}</h3>
        <div class="media-container mb-4 aspect-video">
          <img src="${card.image}" alt="${card.title}" class="w-full h-full object-cover">
        </div>
        <p class="text-zinc-400">${card.description}</p>
      </div>
    `;
    container.innerHTML += cardHTML;
  });
}