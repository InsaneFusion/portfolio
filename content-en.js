const portfolioContent = {
  hero: {
    title: "Juan Merlo",
    subtitle: "Indie videogame developer",
    description: "Game design, programming, art, and sound."
  },

  project: {
    title: "Peacemakers Mayhem",
    description: "Real-time action video game with squad management, designed with a focus on replayability and readability in chaotic environments."
  },

  cards: [
    {
      title: "Twin-stick Controls",
      image: "media/gif1.gif",
      description: "Introduces an additional layer of complexity to the Run n' Gun element, favoring player saturation when required, allowing encounter intensity to be finely tuned."
    },
    {
      title: "Multi-level Designed Flow",
      image: "media/gif2.gif",
      description: "Micro, Macro, and Meta Loop management elements that ensure player retention. These elements have cross-influences that alter gameplay behavior in real-time."
    },
    {
      title: "Narrative Gameplay",
      image: "media/gif3.gif",
      description: "A permanent death system, real-time character switching, and endings based on squad survival that encourage quick decision-making, replayability, and the exploration of possibilities."
    },
    {
      title: "Playtesting",
      image: "media/gif4.gif",
      description: "UX/UI elements were designed and positioned in response to player needs, refined through observation and testing with users from various backgrounds, ranging from casual to hardcore, and with different levels of genre affinity."
    },
    {
      title: "Systems Aligned with Human Reaction",
      image: "media/gif5.gif",
      description: "Skills designed to adapt to any skill level. For an advanced player, a powerful tool. For a novice, a panic button. In both cases, it fulfills its function."
    },
    {
      title: "Multi-layered Audiovisual Feedback",
      image: "media/gif6.gif",
      description: "Deliberate redundancy to provide critical information for match longevity. Skill status is communicated via aura, bottom UI, and audio cues for start, end, and availability."
    },
    {
      title: "Non-Discrete Exclusive States",
      image: "media/gif7.gif",
      description: "A condition system allowing for the organic overlapping of states. Each condition is evaluated independently, permitting their overlap. Conversely, during the design phase, exceptions or extra conditions must be reasoned out for each one to achieve premeditated results."
    },
    {
      title: "Scalability",
      image: "media/gif8.gif",
      description: "Information composing the elements is hosted in indices within the system core, not a particular instance. These values can be accessed to create new instances without altering existing structures."
    },
    {
      title: "NPC Assistance",
      image: "media/gif9.gif",
      description: "A concept superficially explored by the 1992 SNES title 'Contra Force'. The gameplay was quickly envisioned for cooperative multiplayer, and the AI was designed to behave like a sub-optimal human player."
    },
    {
      title: "Concept Exploration and Compatibility Evaluation",
      image: "media/gif10.gif",
      description: "Systems like enabling or disabling tracking were implemented but ultimately discarded as they contradicted the game's fundamental dynamics. The same applies to mechanics such as vision cones, stealth, corpses, and cover, which were also discarded, among others."
    },
  ]
};

function loadPortfolioContent() {
  // Hero
  document.getElementById('hero-title').textContent = portfolioContent.hero.title;
  document.getElementById('hero-subtitle').textContent = portfolioContent.hero.subtitle;
  document.getElementById('hero-description').textContent = portfolioContent.hero.description;

  // Project
  document.getElementById('project-title').textContent = portfolioContent.project.title;
  document.getElementById('project-description').textContent = portfolioContent.project.description;

  // Cards
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