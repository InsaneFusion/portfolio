const technicalContent = {
  hero: {
    badge: "Technical Case Study",
    title: "Peacemakers Mayhem: Desglose Técnico",
    subtitle: "Detalles de sistemas integrados en GameMaker Studio 2",
    techStack: [
      "GML (GameMaker Language)",
      ".OBJ 3D Models",
      "JSON Data Structures",
      "Vertex Buffers",
      "Instancing & Parsing",
      "Dynamic Difficulty Adjustment"
    ]
  },

  sections: [
    {
      title: "Motor de Renderizado 3D Personalizado",
      description: "Dado que GameMaker no ofrece soporte nativo para 3D, se desarrolló un pipeline de importación y renderizado desde cero. Se implementó un sistema de <strong>Instancing</strong> y <strong>Caching de Geometría</strong> para maximizar el rendimiento. El sistema parsea archivos .OBJ manualmente, almacena la geometría única en un <code>vertex_buffer</code> y la reutiliza aplicando matrices de transformación en tiempo real, evitando cargas redundantes.",
      techTag: "GML Custom 3D, Vertex Buffers, OBJ Parsing",
      type: "code",
      content: `
		// Lógica conceptual del Parser de Modelos 3D
		// 1. Lectura y Parseo del archivo .OBJ
		var lines = load_obj_file("model.obj");
		var vertices = ds_grid_create();
		var normals = ds_grid_create();
		var uvs = ds_grid_create();

		// 2. Iteración y extracción de datos
		for (line in lines) {
		if (line starts with "v ") vertices.add(parse_vector(line));
		if (line starts with "vn") normals.add(parse_vector(line));
		if (line starts with "vt") uvs.add(parse_vector(line));
		}

		// 3. Construcción del Vertex Buffer (Renderizado)
		var vbuf = vertex_create_buffer();
		vertex_begin(vbuf, format);

		for (face in faces) {
		// Triangulación y asignación de atributos
		for (i = 0; i < 3; i++) {
		vertex_position(vbuf, vertices[face.v[i]]);
		vertex_normal(vbuf, normals[face.vn[i]]);
		vertex_uv(vbuf, uvs[face.vt[i]]);
		}
		}
		vertex_end(vbuf);
		vertex_freeze(vbuf);

		return vbuf;`
    },
    {
      title: "Pipeline de Assets y Seguridad",
      description: "Para superar la falta de ofuscación nativa de GameMaker, se creó un pipeline de conversión que transforma archivos <code>.OBJ</code> en scripts de código ofuscado. Además, se implementó <strong>Lazy Loading</strong>: los modelos no se cargan al inicio, sino bajo demanda durante la ejecución, reduciendo drásticamente el uso de memoria inicial y los tiempos de carga.",
      techTag: "Ofuscación, Gestión de Memoria, Lazy Loading",
      type: "code",
      content: `
		// Lógica de Lazy Loading y Caché de Modelos
		// 1. Detección de instancias de modelos en la sala
		var model_instances = find_instances_in_room(obj_model);

		// 2. Mapa global de caché: { id_modelo: vertex_buffer }
		if (!global.model_cache) global.model_cache = ds_map_create();

		for (var inst in model_instances) {
		var model_id = inst.mod_id;
			
		// 3. Carga bajo demanda: Solo si no existe en caché
		if (!ds_map_exists(global.model_cache, model_id)) {
		// Construye el buffer una sola vez
		var buffer = scr_geo_builder(model_id); 
		ds_map_add(global.model_cache, model_id, buffer);
		}
		
		// 4. Asignación del buffer compartido a la instancia
		inst.mod_vbuffer = ds_map_find_value(global.model_cache, model_id);
		}

		// 5. Limpieza de recursos si es necesario
		// ds_map_destroy(global.model_cache);`
    },
    {
      title: "Gestión de Estado Persistente & Riesgo",
      description: "El sistema de salud no es local a cada personaje, sino una variable global compartida. Al cambiar de personaje, el **daño acumulado se preserva** mediante un cálculo de ratio de vida. <br><br> " +
                   "El script calcula el porcentaje de vida restante del personaje activo (<code>current / max</code>) y lo aplica al nuevo personaje, ajustando sus HP actuales a su nuevo máximo. Esto fuerza una gestión de riesgo dinámica: cambiar a un personaje con menos HP máx implica recibir un daño proporcionalmente mayor en términos relativos. La muerte es permanente pero reversible con 'Continues', lo que altera el set de personajes disponibles.",
      techTag: "State Persistence, Ratio-Based Health Transfer, Dynamic Character Switching",
      type: "code",
      content: `
		// Lógica de Cambio de Personaje con Transferencia de Daño
		// 1. Capturar estado actual
		var current_hp = obj_player.lv_hp;
		var current_max = obj_player.lv_hp_max;
		var hp_ratio = current_hp / current_max; // Ej: 50/100 = 0.5

		// 2. Instanciar nuevo personaje (ej: el siguiente en la lista)
		var new_char_type = cm_plylist[next_index];
		var new_instance = instance_create_depth(x, y, depth, new_char_type);

		// 3. Transferir daño: Aplicar el ratio al nuevo máximo
		// Si el nuevo tiene 200 HP máx, recibirá 200 * 0.5 = 100 HP
		new_instance.lv_hp = new_instance.lv_hp_max * hp_ratio;

		// 4. Limpieza y actualización de referencias
		instance_destroy(old_instance);
		update_player_reference(new_instance);
		update_emitters(new_instance); // Actualizar efectos visuales

		// El daño se mantiene, el riesgo cambia según el nuevo max_hp`
    },
    {
      title: "Sistema de Spawn Basado en Slots",
      description: "Para evitar colisiones costosas y solapamientos de enemigos en tiempo real, se implementó un sistema de <strong>Particionamiento Espacial Lógico</strong>. El espacio alrededor del jugador se divide en 'slots' (izquierda/derecha). Los enemigos solo se generan si un slot está libre. Esto garantiza una coreografía limpia y una dificultad controlable sin cálculos de física complejos. El sistema incluye un algoritmo de búsqueda de espacio físico que ajusta dinámicamente la posición de spawn si hay obstáculos.",
      techTag: "Spatial Partitioning, Collision Search, Dynamic Spawning",
      type: "code",
      content: `
		// Lógica de Spawn con Rangos y Búsqueda de Espacio
		// 1. Asignación de Slot (Rango) según tipo de enemigo
		var slot_index = get_enemy_slot_index(enemy_type);
		if (global.rangoset[slot_index, side] != noone) {
		// Fallback: Buscar slot disponible si el ideal está ocupado
		slot_index = find_fallback_slot(slot_index, side);
		if (slot_index == -1) return false; // No hay espacio lógico
		}

		// 2. Búsqueda de espacio físico libre (Collision Search)
		var spawn_y = initial_y;
		var offset = 16;
		var multipliers = [1, -1, 2, -2, ...]; // Estrategia de búsqueda en zigzag

		for (var m of multipliers) {
		if (collision_check(x, spawn_y + offset * m, no_collision)) {
		spawn_y += offset * m;
		break; // Espacio encontrado
		}
		}
		if (!collision_check(x, spawn_y, no_collision)) return false; // No hay espacio físico

		// 3. Instanciación y Configuración
		var enemy = instance_create_depth(x, spawn_y, depth, enemy_type);
		enemy.hp_max = scale_stat(enemy.hp_max, difficulty);
		enemy.damage = scale_stat(enemy.damage, difficulty);
		enemy.assigned_slot = slot_index;

		// Registrar ocupación del slot
		global.rangoset[slot_index, side] = enemy.id;
		return true;`
    },
    {
      title: "IA y Comportamiento Adaptativo",
      description: "Los NPCs aliados no usan un NavMesh complejo, sino un sistema de seguimiento basado en distancias relativas que se ajustan dinámicamente mediante triggers del entorno. Por ejemplo, en un ascensor, la distancia máxima se reduce un 30% para 'amontonar' al grupo, y en secciones de platforming, los NPCs imitan el orden de salto del jugador. Esto crea una sensación de coordinación sin sobrecargar el motor con cálculos de pathfinding.",
      techTag: "FSM, Triggers de Comportamiento",
      type: "image",
      image: "media/technical_ai_flow.png",
      alt: "Flujo de Comportamiento de IA"
    },
    {
      title: "Director Dinámico de Dificultad (gp_tension)",
      description: "Implementación de un sistema de balanceo en tiempo real inspirado en el 'Director AI' de Left 4 Dead. Un valor global <code>gp_tension</code> (0.0 - 1.0) monitorea el rendimiento del jugador y ajusta dinámicamente la dificultad. <br><br> " +
                 "Cada zona del nivel posee un <strong>detector de tensión</strong> con un array de 4 tipos de enemigos (de menor a mayor peligrosidad). Según el valor de <code>gp_tension</code>, el sistema limita el pool de spawn: si el jugador rinde bien, el índice de selección sube, introduciendo enemigos más peligrosos. Si el jugador sufre, el índice baja, aliviando la presión. <br><br> " +
                 "Este sistema se combina con un diseño asimétrico donde cada enemigo está diseñado para contrarrestar un personaje específico, obligando al jugador a gestionar su escuadrón tácticamente en función de las amenazas actuales.",
      techTag: "Dynamic Difficulty Adjustment (DDA), AI Director, Asymmetric Balance",
      type: "code",
      content: `
		// Lógica del Director de Dificultad (gp_tension)
		var tension = calculate_tension(player_performance); // 0.0 a 1.0

		// Array de enemigos: [Leve, Medio, Difícil, Élite]
		var enemy_pool = [TYPE_A, TYPE_B, TYPE_C, TYPE_D];

		// Lógica de selección basada en tensión
		// Si tension es 0.8, el rango es [0, 2] (puede salir C)
		// Si tension es 0.2, el rango es [0, 0] (solo sale A)
		var max_index = floor(tension * 3); 
		var selected_enemy = enemy_pool[random(0, max_index)];

		// Verificación de contras (Rock-Paper-Scissors)
		if (selected_enemy.weakness == active_character.type) {
			apply_bonus_damage(selected_enemy);
		}`
    }
  ]
};

function loadTechnicalContent() {
  // Hero
  document.getElementById('tech-badge').textContent = technicalContent.hero.badge;
  document.getElementById('tech-title').textContent = technicalContent.hero.title;
  document.getElementById('tech-subtitle').textContent = technicalContent.hero.subtitle;

  // Tech Stack Badges
  const stackContainer = document.getElementById('tech-stack');
  stackContainer.innerHTML = '';
  technicalContent.hero.techStack.forEach(tech => {
    const badge = document.createElement('span');
    badge.className = 'px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md border border-gray-200';
    badge.textContent = tech;
    stackContainer.appendChild(badge);
  });

  // Secciones
  const container = document.getElementById('tech-sections-container');
  container.innerHTML = '';

  technicalContent.sections.forEach(section => {
    let contentHTML = '';
    
    if (section.type === 'code') {
      contentHTML = `
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
          <h3 class="text-sm font-bold text-gray-700 mb-2">Implementación</h3>
          <div class="code-snippet text-xs text-gray-800 p-4 rounded overflow-x-auto whitespace-pre-wrap">
            ${section.content}
          </div>
        </div>
      `;
    } else if (section.type === 'image') {
      contentHTML = `
        <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 flex items-center justify-center h-48 mt-6">
          <div class="text-center text-gray-400">
            <i class="fas fa-project-diagram text-5xl mb-3 text-emerald-400"></i>
            <p class="text-sm font-semibold text-gray-700">${section.alt}</p>
            <p class="text-xs text-gray-500 mt-1">[Imagen: ${section.alt}]</p>
          </div>
        </div>
      `;
    }

    // CAMBIO CLAVE: grid-cols-1 para layout vertical
    const sectionHTML = `
      <section class="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div class="grid grid-cols-1 gap-8">
          <!-- Texto (ocupa todo el ancho) -->
          <div>
            <h2 class="text-2xl font-bold text-gray-900 mb-3">${section.title}</h2>
            <div class="text-gray-600 mb-4 leading-relaxed prose prose-sm max-w-none">
              ${section.description}
            </div>
            <div class="mt-4">
              <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wide bg-emerald-50 px-2 py-1 rounded border border-emerald-100">${section.techTag}</span>
            </div>
          </div>
          
          <!-- Contenido (Código o Imagen) abajo -->
          <div>
            ${contentHTML}
          </div>
        </div>
      </section>
    `;
    container.innerHTML += sectionHTML;
  });
}