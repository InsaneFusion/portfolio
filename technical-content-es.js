const technicalContent = {
  hero: {
    badge: "Vista en detalle",
    title: "Peacemakers Mayhem: Desglose Técnico",
    subtitle: "Detalles de sistemas integrados en GameMaker Studio 2",
    techStack: [
      "GML (GameMaker Language)",
      ".OBJ 3D Models",
      "JSON Data Structures",
      "Buffers y Parsing",
      "Dynamic Difficulty Adjustment"
    ]
  },
  sections: [
    {
      title: "Pipeline de renderizado 3D",
      description: "Gamemaker, como IDE, no ofrece soporte nativo para elementos 3D. Si bien existen funciones concretas para la manipulación de vértices y la construcción de caras, su nivel es superficial. Valiéndome de estos elementos, creé un sistema capaz de generar geometría primitiva y, sobre esa base, un parser para modelos 3D en formato .OBJ. Estos se almacenan en <code>vertex_buffer</code> gestionados por el motor. Posteriormente, estos buffers se integran en otras estructuras de datos para <em>caching</em>, asegurando que su llamada, almacenamiento y liberación estén alineados con el rendimiento óptimo.<br><br>Asimismo, ajustes críticos durante el renderizado, como el <em>depth sorting</em>, el <em>triplanar mapping</em> selectivo y las matrices de transformación TRS, fueron resueltos de manera manual.",
      techTag: "Gamemaker Custom 3D, Vertex Buffers, .OBJ Parsing",
      type: "code",
      content: `
		Lógica conceptual del Parser de Modelos 3D
		
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
      title: "Pipeline de Assets y ofuscación",
      description: "Un problema adicional de Gamemaker es que no ofusca ningún elemento que no forme parte de los recursos esenciales que el IDE considera nativos. Dado que los modelos 3D y la geometría externa no entran en esta categoría, no se incluirían en el archivo ejecutable del proyecto.<br><br>Para mantener todo embebido sin sacrificar el rendimiento cargando cientos de modelos al instante, cada modelo se guardó como una función que devuelve los valores geométricos en el mismo orden que emplea el script de <em>parsing</em>. Al retornar el <code>vertex_buffer</code>, este se almacena en una <code>ds_list</code> (estructura similar a una tupla sin duplicados). Cada buffer recibe un índice en esta estructura, el cual se asigna a cada instancia en el mapa que utilice dicho modelo. Cuando el modelo es detectado al inicio de una <em>room</em>, se ejecuta la función correspondiente, asignando en memoria solo los activos requeridos. De este modo, se mantiene la ofuscación que ofrece el motor sin pasos adicionales.",
      techTag: "Ofuscación, Gestión de Memoria, Lazy Loading",
      type: "code",
      content: `
		Lógica de Lazy Loading y Caché de Modelos
		
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
  title: "Sistema de Renderizado Procedural Modular",
  description: "Para lograr un sistema de animación fluido sin depender de pre-renderizado de frames, desarrollé un motor de ensamblaje de sprites basado en <em>articulación jerárquica</em> (Forward Kinematics). El personaje se construye frame a frame como un <em>puppet</em>, donde cada parte (piernas, torso, brazos, cabeza) se calcula en tiempo real utilizando vectores de posición y rotación.<br><br>El sistema implementa:<br>1. <strong>Interpolación Angular Suave:</strong> Algoritmos de <em>lerp</em> para suavizar transiciones entre frames de animación, evitando el <em>jitter</em> visual.<br>2. <strong>Culling Dinámico:</strong> Las partes del cuerpo se ocultan o muestran según el estado (ej. carga de arma, daño, agacharse), optimizando el render.<br>3. <strong>Gestión de Efectos Visuales:</strong> Lógica específica para superposiciones como caras de daño o accesorios únicos por personaje.<br><br>Esta arquitectura permite una variabilidad infinita de poses y una respuesta instantánea al input del jugador, manteniendo un rendimiento óptimo al evitar la carga de grandes spritesheets.<br><br>El script combina la lógica de cálculo de posiciones con el renderizado condicional, demostrando un control total sobre la geometría visual del personaje.",
  techTag: "Forward Kinematics, Procedural Animation, Vector Math, Dynamic Culling, Sprite Assembly",
  type: "code",
  content: `

		1. MOTOR DE CÁLCULO (Forward Kinematics)
		
		// Calcula posiciones y ángulos de cada articulación en tiempo real
		function scr_draw_character(_dir, _angle) {
			
			// --- Configuración Inicial ---
			var _xs = _dir; // Multiplcador de dirección (1 o -1)
			var _base_y = y - obj_game.pos_y_leg[perso_index];
			
			// --- 1. PIERNAS (Interpolación de Frames / Lerp) ---
			var _l1_anim = obj_game.ang_leg1_anim1;
			var _l2_anim = obj_game.ang_leg2_anim2;
			var _torso_y = obj_game.tor_legs_y[anim_state];
			
			// Suavizado angular para evitar jitter visual en transiciones
			if (anim_state == 1 && lv_frames % 1 < 1) {
				lv_leg1_a += ((_l1_anim[ceil(lv_frames)] - lv_leg1_a) * 0.25);
				lv_leg2_a += ((_l2_anim[ceil(lv_frames)] - lv_leg2_a) * 0.25);
			} else {
				lv_leg1_a = _l1_anim[floor(lv_frames)] * _xs;
				lv_leg2_a = _l2_anim[floor(lv_frames)] * _xs;
			}
			
			// Cálculo de posición absoluta de piernas
			var _l1_x = x + (obj_game.pos_x_l1[perso_index] * _xs);
			var _l2_x = x - (obj_game.pos_x_l2[perso_index] * _xs);

			// --- 2. TORSO (Rotación Relativa Suavizada) ---
			var _t_ang = _angle / 3; // Factor de suavizado para el torso
			if (_xs == -1) _t_ang = -_t_ang;
			_t_ang += lv_disp_off; // Corrección postural por retroceso/empuje
			
			// --- 3. BRAZOS Y ARMAS (Cálculo Vectorial) ---
			var _a1_offset = obj_game.pos_d_a1[perso_index];
			// Posición del brazo usando trigonometría
			var _a1_x = _t_x + lengthdir_x(_a1_offset, 90 + (obj_game.pos_a_a1 * _xs) + _t_ang);
			
			// Lógica específica por personaje (ej: Personaje 4 tiene retroceso diferente)
			var _a1_ang = 0;
			if (perso_index == 4) {
				_a1_ang = clamp(_angle, 0, 230) - (lv_ret * 2);
			} else {
				_a1_ang = clamp(_angle, 0, 230) - (lv_disp_off * 5);
			}
			
			// --- 4. CABEZA Y ACCESORIOS ---
			var _h_ang = clamp(_angle, 0, 210);
			var _extra_pos = (_perso_index == 1) 
				? _h_x + lengthdir_x(30, 132 * _xs + _h_ang) 
				: 0; // Posición condicional para accesorios únicos
		}
		____________________________________________________________
		
		2. MOTOR DE RENDERIZADO (Sprite Assembly)
		
		// Dibuja las partes calculadas aplicando Culling Dinámico
		
		function render_character_parts() {
			
			// --- Piernas: Culling por estado (Agachado) ---
			if (!lv_duck) {
				draw_sprite_ext(_l1, lv_frames, _l1_x, _l_y+_torso_y, _xs, 1, lv_leg1_a, c_white, 1);
				draw_sprite_ext(_l2, lv_frames, _l2_x, _l_y+_torso_y, _xs, 1, lv_leg2_a, c_white, 1);
			}

			// --- Torso: Culling por estado (Recarga) ---
			if (lv_mag_delay == 0) {
				draw_sprite_ext(_t, lv_frames, _t_x, _t_y+_torso_y, _xs * gp_pscale, 1, _t_ang, c_white, 1);
			} else {
				draw_sprite_ext(_tr, lv_reload_frames, _t_x, _t_y+_torso_y, _xs * gp_pscale, 1, _t_ang, c_white, 1);
			}

			// --- Cabeza: Culling por estado (Daño) ---
			if (lv_hurtang > 0) {
				draw_sprite_ext(_hface, lv_caraframe, _h_x, _h_y+_torso_y, 1, 1, _h_ang, c_white, 1);
			} else {
				draw_sprite_ext(_h, lv_caraframe, _h_x, _h_y+_torso_y, 1, 1, _h_ang, c_white, 1);
			}

			// --- Brazos y Arma: Lógica condicional compleja ---
			if (lv_mag_delay == 0) {
				// Brazo 1 (Varía si hay retroceso activo en personaje 4)
				if (perso_index == 4 && lv_ret > 0) {
					draw_sprite_ext(spr_sil_arm3, lv_frames, _a1_x, _a1_y+_torso_y, 1, 1, _a1_ang, c_white, 1);
				} else {
					draw_sprite_ext(_a1, lv_frames, _a1_x, _a1_y+_torso_y, 1, 1, _a1_ang, c_white, 1);
				}
				
				// Arma y Mano (Siempre visibles si no hay recarga)
				draw_sprite_ext(_w, lv_frames, _w_x, _w_y+_torso_y, 1, 1, _w_ang, c_white, 1);
				draw_sprite_ext(_g, lv_frames, _g_x, _g_y+_torso_y, 1, 1, _g_ang, c_white, 1);
			}

			// --- Accesorios Específicos (Personaje 1) ---
			if (perso_index == 1) {
				draw_sprite_ext(spr_irma_extra, lv_irma_ex_frames, _e_x, _e_y, 1, 1, lv_irma_ex_ang, c_white, 1);
			}
		}`
	},
    {
      title: "Sistema de Spawn Basado en Slots",
      description: "Los bots (NPCs que operan en oposición al jugador) poseen un sistema de generación basado en <em>slots</em>, diseñado para evitar el solapamiento de instancias sin sobrecargar el motor de físicas (Box2D), previniendo así colisiones indeseadas y artefactos visuales (<em>clipping</em>).<br><br>Cada bot posee un índice que determina su tipo y, asociado a este, una distancia mínima al jugador. Al generarse fuera de cámara, los bots se aproximan al jugador hasta la distancia designada mediante un algoritmo de búsqueda de <em>slot</em>. De este modo, encuentran su posición evitando automáticamente el solapamiento. Los <em>slots</em> se diferencian entre izquierda y derecha, estableciendo un límite máximo para cada lado y garantizando que los valores de distancia no se repitan.<br><br>Esta solución no solo mejora la jugabilidad, sino que resuelve problemas de balance, legibilidad de la pantalla y planificación del flujo de juego (<em>Game Flow</em>) mediante parametrización dinámica.",
      techTag: "Spatial Partitioning, Collision Search, Dynamic Spawning",
      type: "code",
      content: `
		1. Controlador de Spawn (obj_enemy_spawn): Decisión de generación
		
		// Verifica límites de cantidad y decide el lado de aparición
		if (order != -1) {
			var _enemyType = staff[order];
			var _side = choose(0, 1); // 0: Izquierda, 1: Derecha
		
			// Control de límites globales (ej: máximo de enemigos en pantalla)
			var _currentCount = instance_number(obj_bot);
			if (_currentCount < global.max_enemies) {
				if (scr_genbirmen(_enemyType, _side)) {
					// Llama al script de resolución de posición
					// Spawn exitoso
				}
			}
			order = -1; // Resetear orden
		}
		__________________________________________________________________

		2. Resolver de Posición (obj_game mediante scr_genbirmen): Lógica de colocación
		
		// Busca un slot libre y valida espacio físico sin colisiones
		function scr_genbirmen(_type, _side) {
			// A. Asignación de Slot Lógico (Rango)
			var _slotIndex = get_slot_index(_type);
			if (global.rangoset[_slotIndex, _side] != noone) {
				_slotIndex = find_fallback_slot(_slotIndex, _side); // Buscar alternativa si está ocupado
				if (_slotIndex == -1) return false; // No hay espacio lógico
			}

			// B. Búsqueda de Espacio Físico (Algoritmo de Zig-Zag)
			var _spawnY = initial_y;
			var _offset = 16;
			var _multiplier = 1;
			var _solved = false;

			// Busca arriba/abajo evitando colisiones con obstáculos
			while (!_solved && abs(_multiplier) < 50) {
				var _testY = _spawnY + (_offset * _multiplier);
				if (no_collision_at(_spawnX, _testY)) {
					_spawnY = _testY;
					_solved = true;
				} else {
					_multiplier = (_multiplier < 0) ? abs(_multiplier) + 1 : -_multiplier; // Cambia dirección
				}
			}
			if (!_solved) return false; // No hay espacio físico válido

			// C. Instanciación y Registro
			var _enemy = instance_create_depth(_spawnX, _spawnY, depth, _type);
			_enemy.assigned_slot = _slotIndex;
			global.rangoset[_slotIndex, _side] = _enemy.id; // Marcar slot como ocupado
			
			return true;
		}`
    },
    {
      title: "IA y Comportamiento Adaptativo",
      description: "Los NPCs acompañantes (diferentes a los bots) recorren el escenario junto al jugador, navegándolo con la misma facilidad que este. Inicialmente pensé en utilizar <em>navmesh</em> mediante la herramienta <code>mp_grid</code>, pero finalmente opté por una solución mecánicamente más simple.<br><br>Dado que el plataformeo es trivial y no letal (el peligro debe provenir exclusivamente del combate), no había necesidad de cálculos complejos. Además, la ausencia de <em>hurtbox</em> en los NPCs hacía innecesaria la creación de mecánicas de evasión. Por lo tanto, el escenario posee <em>triggers</em> que modifican la distancia máxima del NPC al jugador en función de su posición en la jerarquía de control y el entorno.<br><br>Los NPCs replican órdenes de salto si el entorno lo requiere y las omiten cuando no es necesario. Navegan por sí mismos los obstáculos e incluso simulan comportamiento de cobertura, incluso cuando el elemento es puramente estético, para favorecer la inmersión.",
      techTag: "FSM, Triggers de Comportamiento",
      type: "image",
      image: "media/technical_ai_flow.png",
      alt: "Flujo de Comportamiento de IA"
    },
    {
	  title: "Motor de Diálogo Dinámico con JSON Anidado",
	  description: "Peacemakers Mayhem está diseñado priorizando la rejugabilidad. Esto requiere que los elementos narrativos y los diálogos se evoquen bajo condiciones específicas de disponibilidad. Para gestionar esto, implementé una estructura basada en archivos JSON jerárquicos. Esta organización no solo permite almacenar y ubicar cada elemento narrativo de forma ordenada, sino que facilita la localización y el soporte multilingüe.<br>La segmentación del archivo JSON permite contener todos los idiomas en un único fichero, optimizando la carga: el sistema extrae y procesa únicamente el bloque de datos del idioma activo, evitando sobrecargar la memoria con información innecesaria."
	  techTag: "GameMaker, JSON, Dialogue System, State Machine, i18n",
	  type: "code",
	  content: `
		1.a Carga global del JSON con fallback automático
		global.text = scr_get_lang(os_get_language());

		_____________________________________________________________________________________

		1.b Detalle del script importador
		
		function scr_get_lang(_idioma = "es") {
			if (!file_exists("gametext.json")) {
				show_debug_message("Error: No se encontró gametext.json");
				return undefined;
			}
			
			// Lectura eficiente mediante Buffer API
			var buffer = buffer_load("gametext.json");
			var json_string = buffer_read(buffer, buffer_string);
			buffer_delete(buffer); // Liberar memoria inmediatamente
			
			var _alldata = json_parse(json_string);
			
			// Fallback automático a 'es' si el idioma no existe
			if (variable_struct_exists(_alldata, _idioma)) {
				return _alldata[$ _idioma];
			}
			return _alldata[$ "es"];
		}

		_____________________________________________________________________________________

		2. Ejemplo aplicado en renderizado de subtitulos
		
		#region // SUBTITULOS

		// Verificación de tiempo de visualización del subtítulo actual
		if (gp_subt_time > 1) {
			gp_subt_time--;
		} 
		else {
			// Tiempo finalizado: preparar siguiente línea
			if (gp_subt_time == 1) {
				if (map_diag_seq > 1) {
					
					// Avanzar índice de diálogo y decrementar secuencia
					map_diag_index++;
					map_diag_seq--;
					
					// Extraer el texto del JSON anidado para calcular el tiempo de lectura
					var _texto_actual = gp_subt_conpac[gp_subt_conpac_index] [$ "content"] [$ "dialogo"];
					var _strl = string_length(_texto_actual);
					
					// Calcular tiempo dinámico: 3ms por carácter, con límites (min 70, max 270)
					gp_subt_time = clamp(_strl * 3, 70, 270);
					
					// Resetear contadores de caracteres para efecto de escritura
					gp_subt_chars = 0;
				} 
				else {
					// Fin del diálogo
					gp_subt_time = 0;
				}
			}
		}

	#endregion`
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