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
		Region of scr_geo_builder()
		
			#region // Sorting
			
				for (var _it = 0; _it < array_length(_lines); _it++){
				
					var _c_line = _lines[_it]
					var _vals = -1
				
					switch string_char_at(_c_line,1) {					
						case "v": 
							switch string_char_at(_c_line,2) {
								case "t":
									_c_line = string_delete(_c_line,1,3)
									_vals = string_split_ext(_c_line,[" "],true,2)
									ds_grid_add(_vertuv,0,_vertuv_i,real(_vals[0]))
									ds_grid_add(_vertuv,1,_vertuv_i,real(_vals[1]))
									ds_grid_resize(_vertuv,ds_grid_width(_vertuv),ds_grid_height(_vertuv)+1)
									_vertuv_i++
								break
								case "n":
									_c_line = string_delete(_c_line,1,3)
									_vals = string_split_ext(_c_line,[" "],true,3)
									ds_grid_add(_vertn,0,_vertn_i,real(_vals[0]))
									ds_grid_add(_vertn,1,_vertn_i,real(_vals[1]))
									ds_grid_add(_vertn,2,_vertn_i,real(_vals[2]))
									ds_grid_resize(_vertn,ds_grid_width(_vertn),ds_grid_height(_vertn)+1)
									_vertn_i++
								break
								case " ":
									_c_line = string_delete(_c_line,1,2)
									_vals = string_split_ext(_c_line,[" "],true,3)
									ds_grid_add(_vert,0,_vert_i,real(_vals[0]))
									ds_grid_add(_vert,1,_vert_i,real(_vals[2]))								
									ds_grid_add(_vert,2,_vert_i,real(_vals[1]))
									ds_grid_resize(_vert,ds_grid_width(_vert),ds_grid_height(_vert)+1)
									_vert_i++
								break
							}				
						break
						case "f": 
						
							_c_line = string_delete(_c_line,1,2) 
							_vals = string_split_ext(_c_line,[" ","/"],true,8) 
							for (var _n = 0; _n < 9; _n++){
								ds_grid_add(_flist,_n,_flist_i,real(_vals[_n])-1)
							}
							ds_grid_resize(_flist,ds_grid_width(_flist),ds_grid_height(_flist)+1)
							_flist_i++
									
						break				
					}
				}
				
			#endregion
		`
    },
    {
      title: "Lazy Loading Asset Pipeline and Obfuscation",
      description: "A further limitation of GameMaker is that it does not obfuscate any elements that are not part of the essential resources the IDE considers native. Since 3D models and external geometry do not fall into this category, they would not be included in the project's executable file.<br><br>To keep everything embedded without sacrificing performance by loading hundreds of models at once, each model was saved as a function that returns geometric values in the same order used by the <em>parsing</em> script. Upon returning the <code>vertex_buffer</code>, it is stored in a <code>ds_list</code> (a structure similar to a tuple without duplicates). Each buffer receives an index in this structure, which is assigned to every instance in the map using that model. When a model is detected at the start of a <em>room</em>, the corresponding function is executed, allocating only the required assets in memory. This way, the engine's built-in obfuscation is maintained without additional steps.",
      techTag: "Obfuscation, Memory Management, Lazy Loading",
      type: "code",
      content: `
		#region // Models list
																
			var _modelslist = ds_list_create()											
			collision_rectangle_list(0,0,room_width,room_height,obj_model,false,false,_modelslist,false)
				
			for (var _n = 0; _n < ds_list_size(_modelslist); _n++){
				with _modelslist[|_n] {			
					var workindex = 0
					if mod_txt_xpos = true {
						workindex = (x/16) mod sprite_get_number(mod_txt)
					}					
					mod_txt = sprite_get_texture(mod_txt,workindex)
					if !ds_map_exists(other.lm_modelsmap,mod_id){
						ds_map_add(other.lm_modelsmap,mod_id,scr_geo_builder(mod_id))
					}
				}
			}
								
			for (var _o = 0; _o < ds_list_size(_modelslist); _o++){
				with _modelslist[|_o] {
					if ds_map_exists(other.lm_modelsmap,mod_id){
						mod_vbuffer = ds_map_find_value(other.lm_modelsmap,mod_id)
					}
				}
			}
								
			ds_list_destroy(_modelslist)
								
		#endregion`
		},
    {
      title: "Modular Procedural Rendering System",
      description: "To achieve a fluid animation system without relying on pre-rendered frames, I developed a sprite assembly engine based on <em>hierarchical articulation</em> (Forward Kinematics). The character is constructed frame-by-frame as a <em>puppet</em>, where each part (legs, torso, arms, head) is calculated in real-time using position and rotation vectors.<br><br>The system implements:<br>1. <strong>Smooth Angular Interpolation:</strong> <em>lerp</em> algorithms to smooth transitions between animation frames, avoiding visual <em>jitter</em>.<br>2. <strong>Dynamic Culling:</strong> Body parts are hidden or shown based on state (e.g., weapon charge, damage, crouching), optimizing rendering.<br>3. <strong>Visual Effects Management:</strong> Specific logic for overlays like damage faces or unique character accessories.<br><br>This architecture allows for infinite pose variability and instant response to player input, maintaining optimal performance by avoiding the loading of large spritesheets.<br><br>The script combines position calculation logic with conditional rendering, demonstrating full control over the character's visual geometry.",
      techTag: "Forward Kinematics, Procedural Animation, Vector Math, Dynamic Culling, Sprite Assembly",
      type: "code",
      content: `
		
		// Example of torso 
		
		function scr_get_torso(_t_x,_t_y,_factor,lv_aux_ang,lv_disp_off,lv_hurtang){
			
			var _ang = 0
			var _t_ang = 0

			_ang = _v1

			if _xs = 1 {
				if _ang >= 0 and _ang <= 90 {
					_t_ang = _ang * _factor
					lv_aux_ang = _t_ang 
				}
					
				else if _ang > 310 {
					_t_ang = (_ang - 360) * _factor
					lv_aux_ang = _t_ang 
				}
				else {
					_t_ang = lv_aux_ang	
				}
				
			}
			else if _xs = -1 {
				if _ang >= 90 and _ang <= 230 {
					_t_ang = (_ang - 180) * _factor
					lv_aux_ang = _t_ang - (lv_disp_off * _xs)
				}
				else {
					_t_ang = lv_aux_ang	
				}
			}
			
			if sign(_xs) = sign(lv_aux_ang) {
				lv_aux_ang = -lv_aux_ang 
			}
			
			_t_ang += (lv_disp_off * _xs) + (lv_hurtang * -_xs)
			
			return _t_ang
		}
		`			
    },
    {
      title: "Slot-Based Spawn System",
      description: "Bots (NPCs operating in opposition to the player) utilize a <em>slot</em>-based generation system designed to prevent instance overlap without overloading the physics engine (Box2D), thus avoiding unwanted collisions and visual artifacts (<em>clipping</em>).<br><br>Each bot has an index determining its type and, associated with it, a minimum distance to the player. When spawning outside the camera view, bots approach the player to the designated distance via a <em>slot</em> search algorithm. In doing so, they automatically find their position while avoiding overlap. <em>Slots</em> are differentiated between left and right, establishing a maximum limit for each side and ensuring distance values are not repeated.<br><br>This solution not only improves gameplay but also resolves issues regarding balance, screen readability, and game flow planning (<em>Game Flow</em>) through dynamic parametrization.",
      techTag: "Spatial Partitioning, Collision Prevention, Dynamic Spawning",
      type: "code",
      content: `
		// Region of Spawn Control Object
		
		#region // Spawning

			if (lm_map_progress < 100 and instance_exists(obj_player) and obj_player.lv_area != noone) {
				
				var _area = obj_player.lv_area;
				var _staff = _area.area_staff;
				var _dice_min = clamp(round(global.gp_tension*4),0,3)
										
				var _dice = irandom_range(_dice_min,9);
				var _index = scr_dice_get_index(_dice)
					
				#region // Spawn signal
				
					var _nbir = instance_number(obj_bot) - instance_number(obj_target)
				
					if _nbir < _area.area_max {
						if (_area.area_rest) > 0 {
							obj_enemy_spawn.area_og = _area;
							obj_enemy_spawn.staff = _staff;
							obj_enemy_spawn.order = _index;
							obj_enemy_spawn.embos = _area.area_emb;
						}
						if (_area.area_rest == 0 and _area.area_cam == true) {
							scr_cam_lock(false)
						}
					}
						
					alarm[1] = _area.area_cad; 
				
					show_debug_message(string("_area.area_rest: {0}",_area.area_rest))
					show_debug_message(string("dv_hordebar_rest: {0}.",dv_hordebar_rest))
				
				#endregion

				debug_show_orders = obj_enemy_spawn.order;
			}
				
			else {
				alarm[1] = 60;
			}

		#endregion
		
		__________________________________________________________________
		
		// Extract of scr_place_solver()
		
		var _freeplace = (collision_rectangle(_xspawn-32, _yspawn-96, _xspawn+32, _yspawn+24, obj_collider, true, false) == noone);

		if (_freeplace) {
			_solved = true;
		} 
		else {
			var _offset_y = 16;
			var _mult = 1;
			
			while (!_solved and abs(_mult) < 50) {
				_freeplace = (collision_rectangle(_xspawn-32, _yspawn-96 + (_offset_y*_mult), _xspawn+32, _yspawn+24 + (_offset_y*_mult), obj_collider, true, false) == noone);
				
				if (_freeplace) {
					_wherex = _xspawn;
					_wherey = _yspawn + (_offset_y * _mult);
					_solved = true;
				} else {
					_mult = (_mult < 0) ? abs(_mult) + 1 : -_mult;
				}
			}
		}

		if (!_solved) {
			return false; // No physical space avaliable
		}
		
		`
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
		// JSON load
		
		function scr_get_lang(_lang = "en"){
			if (!file_exists("gametext.json")) {
				show_debug_message("Error: gametext.json missing.");
				return undefined;
			}
			
			var buffer = buffer_load("gametext.json");
			var json_string = buffer_read(buffer, buffer_string);
			buffer_delete(buffer);
			
			var _alldata = json_parse(json_string);
			
			if (variable_struct_exists(_alldata,_lang)) {
				show_debug_message("Success");
				return _alldata[$ _lang];
			}
			else {
				show_debug_message("Error. Loading support language.");
				return _alldata[$ "en"];	
			}
		}
		________________________________________________________________________________

		// Applied Example of use

		#region // SUBTITLES
					
			if gp_subt_time > 1 {
				gp_subt_time--
			}
						
			else {
				if gp_subt_time = 1 {
					if map_diag_seq > 1 {
						map_diag_index++
						map_diag_seq--
						var _strl = string_length(gp_subt_conpac[gp_subt_conpac_index][$ "content"][$ "dialog"]);
						gp_subt_time = clamp(_strl*3,70,270)
						gp_subt_chars = 0
					}
					else {
						gp_subt_time = 0
					}
				}
			}
												
		#endregion
		`
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