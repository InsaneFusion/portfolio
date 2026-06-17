const technicalContent = {
  hero: {
    badge: "Technical Portfolio",
    title: "Peacemakers Mayhem Technical Breakdown",
    subtitle: "Systems engineered for the proyect implemented in GML.",
    techStack: [
      "GML (GameMaker Language)",
      "Hierarchical Animation (Hybrid Forward-Kinematics)",
      "JSON Data Structures",
      "Buffers and Parsing",
      "Memory Management"
    ]
  },
  sections: [
    {
      title: "3D Rendering Pipeline",
      description: "GameMaker, as an IDE, lacks native support for 3D elements. While it offers specific functions for vertex manipulation and face construction, their capabilities are superficial. Leveraging these elements, I created a system capable of generating primitive geometry and, based on that, a parser for 3D models in .OBJ format. These are stored in <code>vertex_buffer</code>s managed by the engine. Subsequently, these buffers are integrated into other data structures for <em>caching</em>, ensuring their loading, storage, and release align with optimal performance.<br><br>Furthermore, critical rendering adjustments, such as <em>depth sorting</em>, selective <em>triplanar mapping</em>, and TRS transformation matrices, were implemented manually.",
      techTag: "GameMaker Custom 3D, Vertex Buffers, .OBJ Parsing",
      type: "code",
      content: `
		function scr_geo_builder(default_model)
	  
			// 1. Reading and Parsing the .OBJ file
			var lines = model_id(); // returns a string. 
			var vertex = ds_grid_create();
			var normals = ds_grid_create();
			var uvs = ds_grid_create();

			// 2. Iteration and data extraction
			for (line in lines) {
				if (line starts with "v ") vertex.add(parse_vector(line));
				if (line starts with "vn") normals.add(parse_vector(line));
				if (line starts with "vt") uvs.add(parse_vector(line));
			}

			// 3. Building the Vertex Buffer (Rendering)
			var vbuf = vertex_create_buffer();
			vertex_begin(vbuf, format);

			for (face in faces) {
				for (i = 0; i < 3; i++) {
					vertex_position(vbuf, vertex[face.v[i]]);
					vertex_normal(vbuf, normals[face.vn[i]]);
					vertex_uv(vbuf, uvs[face.vt[i]]);
				}
			}
			vertex_end(vbuf);
			vertex_freeze(vbuf);

			return vbuf;
		}`
    },
    {
      title: "Lazy Loading Asset Pipeline and Obfuscation",
      description: "A further limitation of GameMaker is that it does not obfuscate any elements that are not part of the essential resources the IDE considers native. Since 3D models and external geometry do not fall into this category, they would not be included in the project's executable file.<br><br>To keep everything embedded without sacrificing performance by loading hundreds of models at once, each model was saved as a function that returns geometric values in the same order used by the <em>parsing</em> script. Upon returning the <code>vertex_buffer</code>, it is stored in a <code>ds_list</code> (a structure similar to a tuple without duplicates). Each buffer receives an index in this structure, which is assigned to every instance in the map using that model. When a model is detected at the start of a <em>room</em>, the corresponding function is executed, allocating only the required assets in memory. This way, the engine's built-in obfuscation is maintained without additional steps.",
      techTag: "Obfuscation, Memory Management, Lazy Loading",
      type: "code",
      content: `
		// 1. Detecting model instances in the room
		var model_instances = find_instances_in_room(obj_model);

		// 2. Global cache map
		if (!global.model_cache) global.model_cache = ds_map_create();

		for (var inst in model_instances) {
			var model_id = inst.mod_id;
				
			// 3. On-demand loading only if not already in cache
			if (!ds_map_exists(global.model_cache, model_id)) {
				var buffer = scr_geo_builder(model_id); 
				ds_map_add(global.model_cache, model_id, buffer);
			}
			
			// 4. Assign the shared buffer to the instance
			inst.mod_vbuffer = ds_map_find_value(global.model_cache, model_id);
		}

		// 5. Resource cleanup
		// ds_map_destroy(global.model_cache);`
    },
    {
      title: "Modular Procedural Rendering System",
      description: "To achieve a fluid animation system without relying on pre-rendered frames, I developed a sprite assembly engine based on <em>hierarchical articulation</em> (Forward Kinematics). The character is constructed frame-by-frame as a <em>puppet</em>, where each part (legs, torso, arms, head) is calculated in real-time using position and rotation vectors.<br><br>The system implements:<br>1. <strong>Smooth Angular Interpolation:</strong> <em>lerp</em> algorithms to smooth transitions between animation frames, avoiding visual <em>jitter</em>.<br>2. <strong>Dynamic Culling:</strong> Body parts are hidden or shown based on state (e.g., weapon charge, damage, crouching), optimizing rendering.<br>3. <strong>Visual Effects Management:</strong> Specific logic for overlays like damage faces or unique character accessories.<br><br>This architecture allows for infinite pose variability and instant response to player input, maintaining optimal performance by avoiding the loading of large spritesheets.<br><br>The script combines position calculation logic with conditional rendering, demonstrating full control over the character's visual geometry.",
      techTag: "Forward Kinematics, Procedural Animation, Vector Math, Dynamic Culling, Sprite Assembly",
      type: "code",
      content: `
		// 1. Calculations (Forward Kinematics)

		// Calculates positions and angles of each joint in real-time
		function scr_draw_character(_dir, _angle) {
			
			// Initial Setup 
			var _xs = _dir; // Direction multiplier (1 or -1)
			var _base_y = y - obj_game.pos_y_leg[perso_index];
			
			// a. LEGS (Frame Interpolation / Lerp)
			var _l1_anim = obj_game.ang_leg1_anim1;
			var _l2_anim = obj_game.ang_leg2_anim2;
			var _torso_y = obj_game.tor_legs_y[anim_state];
			
			// Angular smoothing to avoid visual jitter during transitions
			if (anim_state == 1 andand lv_frames % 1 < 1) {
				lv_leg1_a += ((_l1_anim[ceil(lv_frames)] - lv_leg1_a) * 0.25);
				lv_leg2_a += ((_l2_anim[ceil(lv_frames)] - lv_leg2_a) * 0.25);
			} else {
				lv_leg1_a = _l1_anim[floor(lv_frames)] * _xs;
				lv_leg2_a = _l2_anim[floor(lv_frames)] * _xs;
			}
			
			// Absolute position calculation for legs
			var _l1_x = x + (obj_game.pos_x_l1[perso_index] * _xs);
			var _l2_x = x - (obj_game.pos_x_l2[perso_index] * _xs);

			// b. TORSO
			var _t_ang = _angle / 3; // Smoothing factor for torso
			if (_xs == -1) _t_ang = -_t_ang;
			_t_ang += lv_disp_off; // Posture correction for recoil/pushback
			
			// c. ARMS and WEAPONS
			var _a1_offset = obj_game.pos_d_a1[perso_index];
			// Arm position using trigonometry
			var _a1_x = _t_x + lengthdir_x(_a1_offset, 90 + (obj_game.pos_a_a1 * _xs) + _t_ang);
			
			// Character-specific logic (e.g., Character 4 has different recoil)
			var _a1_ang = 0;
			if (perso_index == 4) {
				_a1_ang = clamp(_angle, 0, 230) - (lv_ret * 2);
			} else {
				_a1_ang = clamp(_angle, 0, 230) - (lv_disp_off * 5);
			}
			
			// d. HEAD and ACCESSORIES
			var _h_ang = clamp(_angle, 0, 210);
			var _extra_pos = (_perso_index == 1) 
				? _h_x + lengthdir_x(30, 132 * _xs + _h_ang) 
				: 0; // Conditional position for unique accessories
		}
		__________________________________________________________________

		// 2. Sprite Assembly

		// Draws calculated parts applying Dynamic Culling

		function render_character_parts() {
			
			// a. LEGS: Culling by state (Crouching)
			if (!lv_duck) {
				draw_sprite_ext(_l1, lv_frames, _l1_x, _l_y+_torso_y, _xs, 1, lv_leg1_a, c_white, 1);
				draw_sprite_ext(_l2, lv_frames, _l2_x, _l_y+_torso_y, _xs, 1, lv_leg2_a, c_white, 1);
			}

			// b. TORSO: Culling by state (Reloading)
			if (lv_mag_delay == 0) {
				draw_sprite_ext(_t, lv_frames, _t_x, _t_y+_torso_y, _xs * gp_pscale, 1, _t_ang, c_white, 1);
			} else {
				draw_sprite_ext(_tr, lv_reload_frames, _t_x, _t_y+_torso_y, _xs * gp_pscale, 1, _t_ang, c_white, 1);
			}

			// c. HEAD: Culling by state (Damage)
			if (lv_hurtang > 0) {
				draw_sprite_ext(_hface, lv_caraframe, _h_x, _h_y+_torso_y, 1, 1, _h_ang, c_white, 1);
			} else {
				draw_sprite_ext(_h, lv_caraframe, _h_x, _h_y+_torso_y, 1, 1, _h_ang, c_white, 1);
			}

			// d. ARMS AND WEAPONS: Complex conditional logic
			if (lv_mag_delay == 0) {
				// Arm 1 (Varies if recoil is active for Character 4)
				if (perso_index == 4 andand lv_ret > 0) {
					draw_sprite_ext(spr_sil_arm3, lv_frames, _a1_x, _a1_y+_torso_y, 1, 1, _a1_ang, c_white, 1);
				} else {
					draw_sprite_ext(_a1, lv_frames, _a1_x, _a1_y+_torso_y, 1, 1, _a1_ang, c_white, 1);
				}
				
				// Weapon and Hand (Always visible if not reloading)
				draw_sprite_ext(_w, lv_frames, _w_x, _w_y+_torso_y, 1, 1, _w_ang, c_white, 1);
				draw_sprite_ext(_g, lv_frames, _g_x, _g_y+_torso_y, 1, 1, _g_ang, c_white, 1);
			}

			// e. EXTRAS (character 1)
			if (perso_index == 1) {
				draw_sprite_ext(spr_irma_extra, lv_irma_ex_frames, _e_x, _e_y, 1, 1, lv_irma_ex_ang, c_white, 1);
			}
		}`
    },
    {
      title: "Slot-Based Spawn System",
      description: "Bots (NPCs operating in opposition to the player) utilize a <em>slot</em>-based generation system designed to prevent instance overlap without overloading the physics engine (Box2D), thus avoiding unwanted collisions and visual artifacts (<em>clipping</em>).<br><br>Each bot has an index determining its type and, associated with it, a minimum distance to the player. When spawning outside the camera view, bots approach the player to the designated distance via a <em>slot</em> search algorithm. In doing so, they automatically find their position while avoiding overlap. <em>Slots</em> are differentiated between left and right, establishing a maximum limit for each side and ensuring distance values are not repeated.<br><br>This solution not only improves gameplay but also resolves issues regarding balance, screen readability, and game flow planning (<em>Game Flow</em>) through dynamic parametrization.",
      techTag: "Spatial Partitioning, Collision Prevention, Dynamic Spawning",
      type: "code",
      content: `
		// 1. Spawn Controller (obj_enemy_spawn): Generation Decision

		// Verifies quantity limits and decides spawn side
		if (order != -1) {
			var _enemyType = staff[order];
			var _side = choose(0, 1); // 0: Left, 1: Right
			
			// Global limit control (e.g., max enemies on screen)
			var _currentCount = instance_number(obj_bot);
			if (_currentCount < global.max_enemies) {
				if (scr_genbirmen(_enemyType, _side)) {
					// Calls position resolution script
					// Spawn successful
				}
			}
			order = -1; // Reset order
		}
		__________________________________________________________________

		// 2. Position Resolver (obj_game via scr_genbirmen): Placement Logic

		// Searches for a free slot and validates physical space without collisions
		function scr_genbirmen(_type, _side) {
			// A. Logical Slot Assignment (Range)
			var _slotIndex = get_slot_index(_type);
			if (global.rangoset[_slotIndex, _side] != noone) {
				_slotIndex = find_fallback_slot(_slotIndex, _side); // Find alternative if occupied
				if (_slotIndex == -1) return false; // No logical space
			}

			// B. Physical Space Search (Zig-Zag Algorithm)
			var _spawnY = initial_y;
			var _offset = 16;
			var _multiplier = 1;
			var _solved = false;

			// Searches up/down avoiding obstacles
			while (!_solved andand abs(_multiplier) < 50) {
				var _testY = _spawnY + (_offset * _multiplier);
				if (no_collision_at(_spawnX, _testY)) {
					_spawnY = _testY;
					_solved = true;
				} else {
					_multiplier = (_multiplier < 0) ? abs(_multiplier) + 1 : -_multiplier; // Change direction
				}
			}
			if (!_solved) return false; // No valid physical space

			// C. Instantiation and Registration
			var _enemy = instance_create_depth(_spawnX, _spawnY, depth, _type);
			_enemy.assigned_slot = _slotIndex;
			global.rangoset[_slotIndex, _side] = _enemy.id; // Mark slot as occupied
			
			return true;
		}`
    },
    {
      title: "Adaptive AI and Behavior",
      description: "Companion NPCs (distinct from enemies) traverse the stage alongside the player, navigating it with the same ease. Initially, I considered using <em>navmesh</em> via the <code>mp_grid</code> tool, but ultimately opted for a mechanically simpler solution.<br><br>Since platforming is trivial and non-lethal (danger must stem exclusively from combat), complex calculations were unnecessary. Additionally, the absence of <em>hurtboxes</em> in NPCs made evasion mechanics redundant. Therefore, the stage features <em>triggers</em> that modify the NPC's maximum distance to the player based on their position in the control hierarchy and the environment.<br><br>NPCs replicate jump orders if the environment requires it and omit them when unnecessary. They navigate obstacles independently and even simulate cover behavior, even when the element is purely aesthetic, to enhance immersion.",
      techTag: "FSM, Behavior Triggers",
      type: "image",
      image: "media/technical_ai_flow.png",
      alt: "AI Behavior Flow",
	  caption: "NPC navigation dynamically adapts to environmental conditions: the absence of enemy projectiles, high obstacle density, or specific triggers reduce proximity to the player and activate jump replication (fig 1). Conversely, the absence of these factors or the presence of inverse triggers disables jump mimicry, allows for looser navigation, and enables cosmetic evasion (fig 2)."
    },
	{
	  title: "Dynamic Dialogue Engine with Nested JSON",
	  description: "Peacemakers Mayhem is designed with replayability as a core pillar. This necessitates a narrative system where dialogue and events trigger based on specific conditional states. To manage this, I implemented a hierarchical JSON architecture. This structure not only organizes narrative elements efficiently but also streamlines localization and multi-language support.\n\nThe modular JSON design allows all target languages to reside in a single file. Crucially, the loading logic parses only the active language block, ensuring optimal memory usage by avoiding the overhead of loading unnecessary linguistic data.",
	  techTag: "JSON, i18n, Buffer API, Dialogue System",
	  type: "code",
	  content: `
		// 1.a Global JSON loading with automatic fallback
		
		global.text = scr_get_lang(os_get_language());
		_____________________________________________________________________________________

		// 1.b Importer Script Details

		function scr_get_lang(_idioma = "es") {
			if (!file_exists("gametext.json")) {
				show_debug_message("Error: gametext.json not found");
				return undefined;
			}
			
			// Efficient reading via Buffer API
			var buffer = buffer_load("gametext.json");
			var json_string = buffer_read(buffer, buffer_string);
			buffer_delete(buffer); // Immediate memory release
			
			var _alldata = json_parse(json_string);
			
			// Automatic fallback to 'es' if the target language doesn't exist
			if (variable_struct_exists(_alldata, _idioma)) {
				return _alldata[$ _idioma];
			}
			return _alldata[$ "es"];
		}
		_____________________________________________________________________________________

		// 2. Applied Example: Subtitle Rendering Logic

		#region // SUBTITLES

		// Check current subtitle display timer
		if (gp_subt_time > 1) {
			gp_subt_time--;
		} 
		else {
			// Timer expired: prepare next line
			if (gp_subt_time == 1) {
				if (map_diag_seq > 1) {
					
					// Advance dialogue index and decrement sequence
					map_diag_index++;
					map_diag_seq--;
					
					// Extract text from nested JSON to calculate reading time
					// Deep access: Array -> Struct -> Struct -> String
					var _texto_actual = gp_subt_conpac[gp_subt_conpac_index] [$ "content"] [$ "dialogo"];
					var _strl = string_length(_texto_actual);
					
					// Dynamic timing: 3ms per character, clamped (min 70, max 270)
					gp_subt_time = clamp(_strl * 3, 70, 270);
					
					// Reset character counter for typing effect
					gp_subt_chars = 0;
				} 
				else {
					// End of dialogue
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

  // Sections
  const container = document.getElementById('tech-sections-container');
  container.innerHTML = '';

  technicalContent.sections.forEach(section => {
    let contentHTML = '';
    
    if (section.type === 'code') {
      contentHTML = `
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
          <h3 class="text-sm font-bold text-gray-700 mb-2">Implementation</h3>
          <div class="code-snippet text-xs text-gray-800 p-4 rounded overflow-x-auto whitespace-pre-wrap">
            ${section.content}
          </div>
        </div>
      `;
    } else if (section.type === 'image') {
      // Si no hay caption, usamos el alt por defecto, pero el estilo se mantiene
      const captionText = section.caption || section.alt;

      contentHTML = `
        <div class="bg-white p-4 rounded-lg border border-gray-200 mt-6 shadow-sm">
          <!-- Imagen -->
          <img 
            src="${section.image}" 
            alt="${section.alt}" 
            class="w-full h-auto rounded border border-gray-100"
            style="max-height: 400px; object-fit: contain;"
            onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNjY2MiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTIiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';"
          />
          
          <!-- Epígrafe estilo Periódico -->
          <div class="mt-3 pt-3 border-t border-gray-200">
            <p class="text-xs text-gray-600 leading-relaxed font-serif italic"> 
			  ${captionText}
            </p>
          </div>
        </div>
      `;
	}

    // Key Change: grid-cols-1 for vertical layout
    const sectionHTML = `
      <section class="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div class="grid grid-cols-1 gap-8">
          <!-- Text (takes full width) -->
          <div>
            <h2 class="text-2xl font-bold text-gray-900 mb-3">${section.title}</h2>
            <div class="text-gray-600 mb-4 leading-relaxed prose prose-sm max-w-none">
              ${section.description}
            </div>
            <div class="mt-4">
              <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wide bg-emerald-50 px-2 py-1 rounded border border-emerald-100">${section.techTag}</span>
            </div>
          </div>
          
          <!-- Content (Code or Image) below -->
          <div>
            ${contentHTML}
          </div>
        </div>
      </section>
    `;
    container.innerHTML += sectionHTML;
  });
} 