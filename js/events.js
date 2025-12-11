(function (global) {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const chance = (prob) => Math.random() < prob;

  const eventFactories = {
    inspeccion: () => {
      const state = global.GameState.getState();
      return {
        id: 'inspeccion',
        title: 'Inspección sorpresa',
        description: 'El jefe de estudios aparece buscando culpables de no sé qué. ¿Qué haces?',
        options: [
          {
            label: 'Esconderte detrás de las taquillas',
            detail: 'Pierdes algo de dignidad pero quizá evites el estrés.',
            handler: () => {
              const logs = [];
              if (global.GameState.spendEnergy(8)) {
                logs.push('Te camuflas entre mochilas. Nadie nota tu existencia.');
                global.GameState.changeResource('estres', -8);
              } else {
                logs.push('Estás demasiado cansado para correr y te quedas quieto.');
                global.GameState.changeResource('estres', 5);
              }
              return { logs };
            },
          },
          {
            label: 'Dar la cara',
            detail: 'Asumes preguntas incómodas, pero ganas crédito académico.',
            handler: () => {
              global.GameState.changeResource('estres', 8);
              global.GameState.changeResource('progreso', 6);
              return { logs: ['Aguantas la charla sobre “responsabilidad” y hasta te apuntan como delegado.'] };
            },
          },
        ],
      };
    },

    rumor_escape: () => {
      return {
        id: 'rumor_escape',
        title: 'Rumores del escape',
        description: 'Escuchas a dos alumnos hablar de llaves y túneles en el CPD.',
        options: [
          {
            label: 'Anotar en tu libreta',
            handler: () => {
              global.GameState.addItem('pistasEscape', 1);
              global.GameState.setFlag('escapeRumor', true);
              return { logs: ['Guardas la info: “tarjeta + plano + llave = libertad”.'] };
            },
          },
          {
            label: 'Pasar del tema',
            detail: 'Menos estrés por conspiranoias.',
            handler: () => {
              global.GameState.changeResource('estres', -5);
              return { logs: ['Decides que tu prioridad ahora mismo es encontrar un enchufe libre.'] };
            },
          },
        ],
      };
    },

    aliado_luis: () => {
      if (global.GameState.hasAlly('luis')) return null;
      const ally = global.Characters.getAlly('luis');
      return {
        id: 'aliado_luis',
        title: 'Encuentro con Luis',
        description: `${ally.descripcion}. ¿Le propones formar equipo?`,
        options: [
          {
            label: 'Sí, ven conmigo',
            handler: () => {
              global.GameState.addAlly('luis');
              return { logs: ['Luis se une a ti. Tu puñetazo pedagógico mejora.'] };
            },
          },
          {
            label: 'Mejor sigo solo',
            handler: () => ({ logs: ['Luis se encoge de hombros y vuelve a hacer flexiones en medio del pasillo.'] }),
          },
        ],
      };
    },

    snack_pasillo: () => {
      return {
        id: 'snack_pasillo',
        title: 'Máquina expendedora rebelde',
        description: 'La máquina lanza un paquete extra. Jackpot estudiantil.',
        options: [
          {
            label: 'Guardar para después',
            handler: () => {
              global.GameState.addItem('snacks', 1);
              return { logs: ['Guardas el snack en tu mochila (sin prometer que llegue a la hora de comer).'] };
            },
          },
          {
            label: 'Comer ahora mismo',
            handler: () => {
              global.GameState.changeResource('hambre', -20);
              global.GameState.changeResource('energia', 5);
              return { logs: ['Azúcar instantánea. Sientes la vida volver a tus ojos.'] };
            },
          },
        ],
      };
    },

    examen_pop: () => ({
      id: 'examen_pop',
      title: 'Mini examen sorpresa',
      description: 'El profesor deja caer un test de tres preguntas imposibles.',
      options: [
        {
          label: 'Dar el máximo',
          handler: () => {
            if (!global.GameState.spendEnergy(12)) {
              global.GameState.changeResource('estres', 10);
              return { logs: ['Sin energía, confundes DHCP con el menú de la cafetería.'], endTurn: true };
            }
            const success = chance(0.6);
            if (success) {
              global.GameState.changeResource('progreso', 12);
              global.GameState.changeResource('estres', -5);
              return { logs: ['Te sale casi perfecto. El profesor se sorprende (y tú más).'] };
            }
            global.GameState.changeResource('estres', 10);
            return { logs: ['Se te mezclan los conceptos. Respuestas creativas, cero puntos.'] };
          },
        },
        {
          label: 'Improvisar con miradas',
          detail: 'Puede salir muy bien o muy mal.',
          handler: () => {
            const success = chance(0.4);
            if (success) {
              global.GameState.changeResource('progreso', 6);
              global.GameState.changeResource('estres', -2);
              return { logs: ['Copias discretamente los apuntes que alguien dejó abiertos.'] };
            }
            global.GameState.changeResource('progreso', -4);
            global.GameState.changeResource('estres', 12);
            return { logs: ['Te pillan y te toca charla ética. Pierdes progreso.'] };
          },
        },
      ],
    }),

    hallazgo_usb: () => ({
      id: 'hallazgo_usb',
      title: 'USB sospechosamente etiquetado',
      description: 'Reza “Plan_Escape_Final_real_de_verdad.pdf”.',
      options: [
        {
          label: 'Explorar el contenido',
          handler: () => {
            global.GameState.changeResource('progreso', 5);
            global.GameState.addItem('pistasEscape', 1);
            global.GameState.changeResource('estres', 4);
            return { logs: ['Apuntas contraseñas y rumores de túneles. Cada vez huele más a huida.'] };
          },
        },
        {
          label: 'Ignorarlo por seguridad',
          handler: () => ({ logs: ['Lo guardas en el bolsillo “por si acaso” y sigues tu vida.'] }),
        },
      ],
    }),

    enemigo_fernando: () => {
      if (!global.GameState.isBossAlive('fernando')) return null;
      const enemy = global.Characters.getEnemy('fernando');
      return {
        id: 'enemigo_fernando',
        title: 'Fernando, el tutor administrativo',
        description: `${enemy.descripcion}. Parece decidido a frenarte con papeleo de combate.`,
        options: [
          {
            label: 'Entrar en combate',
            handler: () => ({ logs: ['Te preparas para un duelo de sellos oficiales.'], startCombat: 'fernando', endTurn: false }),
          },
          {
            label: 'Evitarlo',
            handler: () => {
              global.GameState.changeResource('estres', 6);
              return { logs: ['Escapas por un pasillo lateral, pero la ansiedad sube.'] };
            },
          },
        ],
      };
    },

    aliado_pablo: () => {
      if (global.GameState.hasAlly('pablo')) return null;
      const ally = global.Characters.getAlly('pablo');
      return {
        id: 'aliado_pablo',
        title: 'Pablo, maestro de agendas',
        description: `${ally.descripcion} ¿Aceptas su ayuda?`,
        options: [
          {
            label: 'Necesito a alguien organizado',
            handler: () => {
              global.GameState.addAlly('pablo');
              return { logs: ['Pablo toma tu horario y elimina pausas innecesarias. Eficiencia al máximo.'] };
            },
          },
          {
            label: 'No, gracias',
            handler: () => ({ logs: ['Pablo se encoge de hombros y se va a revisar Excel.'] }),
          },
        ],
      };
    },

    hallazgo_herramientas: () => ({
      id: 'hallazgo_herramientas',
      title: 'Caja de herramientas olvidada',
      description: 'Incluye destornillador, cinta americana y confianza. ',
      options: [
        {
          label: 'Recogerla',
          handler: () => {
            global.GameState.addItem('llaves', 1);
            global.GameState.changeResource('progreso', 3);
            return { logs: ['Consigues una llave inglesa + una llave de candado. Nunca se sabe.'] };
          },
        },
      ],
    }),

    estudiar_evento: () => ({
      id: 'estudiar_evento',
      title: 'Rincón de estudio improvisado',
      description: 'Un enchufe libre, milagro. Puedes estudiar cómodo.',
      options: [
        {
          label: 'Estudiar con ganas',
          handler: () => {
            const cost = global.GameState.hasAlly('pablo') ? 10 : 14;
            if (!global.GameState.spendEnergy(cost)) {
              return { logs: ['Tu cuerpo se niega a estudiar. Necesitas descanso urgente.'] };
            }
            global.GameState.changeResource('progreso', 15);
            global.GameState.changeResource('estres', -6);
            return { logs: ['Te concentras y avanzas el temario. El silencio ayuda.'] };
          },
        },
        {
          label: 'Dormitar “mientras lees”',
          handler: () => {
            global.GameState.changeResource('energia', 12);
            global.GameState.changeResource('estres', -10);
            return { logs: ['Echas una siesta ninja con libro abierto. Nadie sospecha.'] };
          },
        },
      ],
    }),

    aliado_catalufo: () => {
      if (global.GameState.hasAlly('catalufo')) return null;
      const ally = global.Characters.getAlly('catalufo');
      return {
        id: 'aliado_catalufo',
        title: 'Catalufo aparece cargado de cacharros',
        description: `${ally.descripcion} ¿Lo invitas a unirse?`,
        options: [
          {
            label: 'Claro, necesitamos recursos',
            handler: () => {
              global.GameState.addAlly('catalufo');
              global.GameState.addItem('snacks', 1);
              return { logs: ['Catalufo abre una mochila infinita. Notas que tu suerte mejora.'] };
            },
          },
          {
            label: 'Quizá luego',
            handler: () => ({ logs: ['Catalufo se dedica a pulir destornilladores en tu presencia silenciosa.'] }),
          },
        ],
      };
    },

    comida: () => ({
      id: 'comida',
      title: 'Bandeja abandonada',
      description: 'Alguien dejó tortilla extra. ¿Te la quedas?',
      options: [
        {
          label: 'Comerla',
          handler: () => {
            global.GameState.changeResource('hambre', -35);
            global.GameState.changeResource('energia', 8);
            return { logs: ['El sabor es dudoso pero alimenta.'] };
          },
        },
        {
          label: 'Guardar en táper',
          handler: () => {
            global.GameState.addItem('snacks', 1);
            return { logs: ['Guardas lo mejorcito para más tarde.'] };
          },
        },
      ],
    }),

    descanso: () => ({
      id: 'descanso',
      title: 'Momento zen',
      description: 'Encuentras un banco relativamente limpio.',
      options: [
        {
          label: 'Respirar y meditar',
          handler: () => {
            global.GameState.changeResource('estres', -15);
            global.GameState.changeResource('energia', 10);
            return { logs: ['Respiras hondo. Los ruidos del instituto se disuelven.'] };
          },
        },
      ],
    }),
    ensayo_improvisado: () => ({
      id: 'ensayo_improvisado',
      title: 'Ensayo improvisado',
      description: 'El club de teatro necesita alguien que lea un papel.',
      options: [
        {
          label: 'Improvisar con humor',
          handler: () => {
            global.GameState.changeResource('estres', -12);
            global.GameState.changeResource('progreso', 4);
            return { logs: ['Tu monólogo absurdo levanta la moral y aprendes a hablar en público.'] };
          },
        },
        {
          label: 'Recitar apuntes en voz alta',
          handler: () => {
            global.GameState.changeResource('progreso', 10);
            global.GameState.changeResource('estres', -2);
            return { logs: ['Lees tus apuntes como si fueran poesía y funciona.'] };
          },
        },
      ],
    }),
    cafeteria_midnight: () => ({
      id: 'cafeteria_midnight',
      title: 'Cafetería nocturna',
      description: 'Luces bajas, microondas prestados y olor a croquetas recicladas.',
      options: [
        {
          label: 'Preparar algo caliente',
          handler: () => {
            global.GameState.changeResource('hambre', -40);
            global.GameState.changeResource('estres', -6);
            return { logs: ['La cena improvisada sabe a gloria funcional.'] };
          },
        },
        {
          label: 'Empaquetar snacks',
          handler: () => {
            global.GameState.addItem('snacks', 2);
            return { logs: ['Guardas raciones secretas en la mochila.'] };
          },
        },
      ],
    }),
    cache_snacks: () => ({
      id: 'cache_snacks',
      title: 'Alijo estudiantil',
      description: 'Entre muebles encuentras una caja con comida rescatada.',
      options: [
        {
          label: 'Repartir con el grupo',
          handler: () => {
            global.GameState.changeResource('hambre', -25);
            return { logs: ['Compartes el botín y el ánimo mejora.'] };
          },
        },
        {
          label: 'Guardar todo para ti',
          handler: () => {
            global.GameState.addItem('snacks', 3);
            return { logs: ['Nadie sabrá del escondite... salvo tú.'] };
          },
        },
      ],
    }),
    entrenamiento_gimnasio: () => ({
      id: 'entrenamiento_gimnasio',
      title: 'Circuito intensivo',
      description: 'Raúl dejó montadas unas estaciones de ejercicio.',
      options: [
        {
          label: 'Dar el máximo',
          handler: () => {
            if (!global.GameState.spendEnergy(10)) {
              return { logs: ['Tus piernas se rinden antes de empezar.'], endTurn: false };
            }
            global.GameState.changeResource('salud', 10);
            global.GameState.changeResource('estres', -8);
            return { logs: ['Terminas el circuito y sientes los brazos de acero.'] };
          },
        },
        {
          label: 'Solo estiramientos',
          handler: () => {
            global.GameState.changeResource('energia', 10);
            global.GameState.changeResource('estres', -4);
            return { logs: ['Un poco de movilidad y respiras mejor.'] };
          },
        },
      ],
    }),
    suenio_profetico: () => ({
      id: 'suenio_profetico',
      title: 'Sueño profético',
      description: 'Te echas en una litera y sueñas con el horario del tutor.',
      options: [
        {
          label: 'Anotar lo soñado',
          handler: () => {
            global.GameState.changeResource('progreso', 12);
            global.GameState.changeResource('estres', -6);
            return { logs: ['Apuntas pistas que te ayudarán en el próximo examen.'] };
          },
        },
        {
          label: 'Dormir un poco más',
          handler: () => {
            global.GameState.changeResource('energia', 18);
            global.GameState.changeResource('hambre', 4);
            return { logs: ['Te levantas descansado y con ideas raras sobre túneles.'] };
          },
        },
      ],
    }),

    aliado_iker: () => {
      if (global.GameState.hasAlly('iker')) return null;
      const ally = global.Characters.getAlly('iker');
      return {
        id: 'aliado_iker',
        title: 'Iker realizando parkour',
        description: `${ally.descripcion} ¿Quieres que se una?`,
        options: [
          {
            label: 'Sí, necesitamos defensa',
            handler: () => {
              global.GameState.addAlly('iker');
              return { logs: ['Iker se une y promete esquivar todo lo esquivable.'] };
            },
          },
          {
            label: 'No por ahora',
            handler: () => ({ logs: ['Iker desaparece saltando por encima de un carrito de limpieza.'] }),
          },
        ],
      };
    },

    hallazgo_materiales: () => ({
      id: 'hallazgo_materiales',
      title: 'Materiales útiles',
      description: 'Encuentras tarjetas y llaveros viejos.',
      options: [
        {
          label: 'Recolectar todo',
          handler: () => {
            global.GameState.addItem('llaves', 1);
            global.GameState.addItem('materiales', 2);
            global.GameState.changeResource('progreso', 4);
            return { logs: ['Guardas una llave misteriosa y piezas para futuros inventos.'] };
          },
        },
      ],
    }),
    hallazgo_componentes: () => ({
      id: 'hallazgo_componentes',
      title: 'Cajón de componentes raros',
      description: 'Bobinas, condensadores y placas sin dueño.',
      options: [
        {
          label: 'Clasificar todo',
          handler: () => {
            global.GameState.addItem('materiales', 2);
            global.GameState.changeResource('progreso', 5);
            return { logs: ['Organizas las piezas. Ahora las impresoras te respetan.'] };
          },
        },
        {
          label: 'Solo lo brillante',
          handler: () => {
            global.GameState.addItem('materiales', 1);
            global.GameState.changeResource('estres', -6);
            return { logs: ['Tomas lo más brillante y te relajas mirando LEDs.'] };
          },
        },
      ],
    }),
    apagones: () => ({
      id: 'apagones',
      title: 'Apagón parcial',
      description: 'Las luces se apagan, solo quedan monitores parpadeando.',
      options: [
        {
          label: 'Aprovechar la oscuridad',
          handler: () => {
            const success = chance(0.5);
            if (success) {
              global.GameState.changeResource('estres', -8);
              global.GameState.changeResource('progreso', 6);
              return { logs: ['Encuentras documentos confidenciales a la luz del móvil.'] };
            }
            global.GameState.changeResource('estres', 6);
            return { logs: ['Tropiezas con un cable y discreción cero.'] };
          },
        },
      ],
    }),
    arsenal_robotica: () => {
      const order = ['tecladoRoto', 'lanzaMopa', 'martilloMultiuso', 'katanaImpresora', 'lanzaChispas', 'martilloTitanio', 'canonSonico'];
      const next = order.find((id) => !global.GameState.hasGear('weapon', id));
      if (!next) return null;
      const weapon = global.Items.getWeapon(next);
      return {
        id: 'arsenal_robotica',
        title: 'Arsenal improvisado',
        description: `Las impresoras 3D chirrían listas para fabricar ${weapon.nombre}.`,
        options: [
          {
            label: `Fabricar ${weapon.nombre}`,
            handler: () => {
              const state = global.GameState.getState();
              if (state.inventory.materiales < 1) {
                return { logs: ['Necesitas más materiales. Busca en el taller y almacenes.'], endTurn: false };
              }
              if (!global.GameState.spendEnergy(12)) {
                return { logs: ['Estás demasiado cansado para manejar las herramientas.'], endTurn: false };
              }
              global.GameState.consumeItem('materiales', 1);
              global.GameState.unlockGear('weapon', next);
              global.GameState.changeResource('estres', -5);
              return { logs: [`Fabricas ${weapon.nombre}. Tu ofensiva se siente más seria.`] };
            },
          },
          {
            label: 'Silenciar las máquinas',
            handler: () => ({ logs: ['Decides no llamar la atención con ruidos mecánicos.'] }),
          },
        ],
      };
    },
    proyecto_robotica: () => ({
      id: 'proyecto_robotica',
      title: 'Proyecto de robótica',
      description: 'Te ofrecen colaborar en un robot que pueda abrir puertas automáticamente.',
      options: [
        {
          label: 'Programar el robot',
          handler: () => {
            if (!global.GameState.spendEnergy(15)) {
              return { logs: ['Te caes sobre el teclado antes de terminar el código.'], endTurn: false };
            }
            global.GameState.changeResource('progreso', 18);
            global.GameState.changeResource('estres', 8);
            return { logs: ['Avanzas el proyecto y aprendes trucos para infiltrarte mejor.'] };
          },
        },
        {
          label: 'Escanear planos',
          handler: () => {
            global.GameState.changeResource('progreso', 10);
            global.GameState.changeResource('estres', 2);
            global.GameState.changeResource('energia', -5);
            return { logs: ['Escaneas planos para tu futura huida. Más lento, pero seguro.'] };
          },
        },
      ],
    }),
    armadura_cpd: () => {
      if (global.GameState.hasGear('armor', 'chaquetaAntiestatica')) return null;
      return {
        id: 'armadura_cpd',
        title: 'Chaqueta antiestática olvidada',
        description: 'Sobre una silla cuelga una chaqueta metálica llena de parches.',
        options: [
          {
            label: 'Ponértela sin pensar',
            handler: () => {
              if (!global.GameState.spendEnergy(6)) {
                return { logs: ['Te pesa demasiado solo de verla. Quizá más tarde.'], endTurn: false };
              }
              global.GameState.unlockGear('armor', 'chaquetaAntiestatica');
              return { logs: ['Ahora el ozono del CPD no te asusta. Defensa mejorada.'] };
            },
          },
        ],
      };
    },
    armadura_enfermeria: () => {
      const order = ['chalecoReflectante', 'escudoApuntes'];
      const next = order.find((id) => !global.GameState.hasGear('armor', id));
      if (!next) return null;
      const armor = global.Items.getArmor(next);
      return {
        id: 'armadura_enfermeria',
        title: 'Equipo acolchado',
        description: 'En la enfermería hay cajas de chalecos y carpetas acolchadas.',
        options: [
          {
            label: `Requisar ${armor.nombre}`,
            handler: () => {
              if (!global.GameState.spendEnergy(5)) {
                return { logs: ['Demasiado cansancio como para cargar con más peso.'], endTurn: false };
              }
              global.GameState.unlockGear('armor', next);
              global.GameState.changeResource('estres', -4);
              return { logs: [`Te enfundas ${armor.nombre}. Te sientes más protegido.`] };
            },
          },
        ],
      };
    },
    campamento_evento: () => {
      if (!global.GameState.getFlag('campamentoPatio')) return null;
      const options = [
        {
          label: 'Organizar guardia nocturna',
          handler: () => {
            global.GameState.changeResource('estres', -10);
            global.GameState.changeResource('hambre', 5);
            return { logs: ['Distribuyes turnos con tus aliados. Todos confían más en ti.'] };
          },
        },
        {
          label: 'Cocinar con hornillo',
          handler: () => {
            if (!global.GameState.consumeItem('snacks', 1)) {
              return { logs: ['Sin snacks extra no hay cenas especiales.'], endTurn: false };
            }
            global.GameState.changeResource('hambre', -35);
            global.GameState.changeResource('energia', 5);
            return { logs: ['Preparas una sopa rara pero nutritiva en el campamento.'] };
          },
        },
      ];
      if (!global.GameState.hasGear('armor', 'armaduraCampamento')) {
        options.unshift({
          label: 'Reforzar la parka táctica',
          handler: () => {
            const state = global.GameState.getState();
            if (state.inventory.materiales < 2) {
              return { logs: ['Necesitas más materiales para reforzar la parka.'], endTurn: false };
            }
            if (!global.GameState.spendEnergy(10)) {
              return { logs: ['Te vence el cansancio antes de terminar las costuras.'], endTurn: false };
            }
            global.GameState.consumeItem('materiales', 2);
            global.GameState.unlockGear('armor', 'armaduraCampamento');
            return { logs: ['Creas la Parka de supervivencia. El campamento parece una fortaleza.'] };
          },
        });
      }
      return {
        id: 'campamento_evento',
        title: 'Vida en el campamento',
        description: 'Tu campamento en el patio cobra vida. ¿Cómo lo gestionas hoy?',
        options,
      };
    },
    aliado_sara: () => {
      if (global.GameState.hasAlly('sara')) return null;
      const ally = global.Characters.getAlly('sara');
      return {
        id: 'aliado_sara',
        title: 'Sara te intercepta',
        description: `${ally.descripcion} ¿Haces equipo con ella?`,
        options: [
          {
            label: 'Claro, necesitamos hackeos',
            handler: () => {
              global.GameState.addAlly('sara');
              global.GameState.addItem('pistasEscape', 1);
              return { logs: ['Sara sincroniza sus scripts con tus planes de fuga. Precisión aumentada.'] };
            },
          },
          {
            label: 'Mejor mantener perfil bajo',
            handler: () => ({ logs: ['Sara se encoge de hombros y se va a sabotear routers.'] }),
          },
        ],
      };
    },
    aliado_miriam: () => {
      if (global.GameState.hasAlly('miriam')) return null;
      const ally = global.Characters.getAlly('miriam');
      return {
        id: 'aliado_miriam',
        title: 'Miriam ofrece ayuda',
        description: `${ally.descripcion} ¿Aceptas sus cuidados clandestinos?`,
        options: [
          {
            label: 'Sí, cuida de nosotros',
            handler: () => {
              global.GameState.addAlly('miriam');
              global.GameState.changeResource('salud', 10);
              return { logs: ['Miriam se une y te entrega un botiquín secreto. Te sientes más seguro.'] };
            },
          },
          {
            label: 'No me gustan las agujas',
            handler: () => ({ logs: ['Miriam respeta tu decisión, pero te deja un par de tiritas.'] }),
          },
        ],
      };
    },
    nota_atrio: () => ({
      id: 'nota_atrio',
      title: 'Nota en el tablón',
      description: 'Un post-it dice “la salida no está en secretaría, busca más arriba”.',
      options: [
        {
          label: 'Guardar el recordatorio',
          handler: () => {
            global.GameState.changeResource('progreso', 3);
            global.GameState.addItem('pistasEscape', 1);
            return { logs: ['Pegas la nota en tu cuaderno, nunca se sabe.'] };
          },
        },
      ],
    }),
    armas_audiovisual: () => {
      if (global.GameState.hasGear('weapon', 'canonSonico')) {
        return {
          id: 'armas_audiovisual',
          title: 'Pruebas de sonido',
          description: 'El equipo ya está montado; solo relájate y disfruta del eco.',
          options: [{ label: 'Meditar con ruido blanco', handler: () => ({ logs: ['Un poco de ruido blanco te despeja la mente.'], endTurn: false }) }],
        };
      }
      const weapon = global.Items.getWeapon('canonSonico');
      return {
        id: 'armas_audiovisual',
        title: 'Invento audiovisual',
        description: 'Un altavoz gigante apunta a la puerta principal.',
        options: [
          {
            label: `Construir ${weapon.nombre}`,
            handler: () => {
              if (!global.GameState.spendEnergy(10)) {
                return { logs: ['No puedes con los cables pesados ahora mismo.'], endTurn: false };
              }
              global.GameState.unlockGear('weapon', 'canonSonico');
              return { logs: ['Conectas los amplificadores y nace un arma sónico-legal.'] };
            },
          },
        ],
      };
    },
    almacen_recursos: () => ({
      id: 'almacen_recursos',
      title: 'Inventario olvidado',
      description: 'Hay cajas con etiquetas de años anteriores.',
      options: [
        {
          label: 'Revisar pacientemente',
          handler: () => {
            global.GameState.addItem('materiales', 3);
            global.GameState.changeResource('progreso', 4);
            return { logs: ['Encuentras piezas útiles y las catalogas para tu plan.'] };
          },
        },
        {
          label: 'Cargar con lo posible',
          handler: () => {
            if (!global.GameState.spendEnergy(4)) {
              return { logs: ['Demasiado cansado para cargar cajas.'], endTurn: false };
            }
            global.GameState.addItem('snacks', 1);
            global.GameState.addItem('llaves', 1);
            return { logs: ['Consigues llaves y suministros sin levantar sospechas.'] };
          },
        },
      ],
    }),
    armadura_laboratorio: () => {
      const order = ['chalecoFibra', 'armaduraFibra', 'blindajeImpresora'];
      const next = order.find((id) => !global.GameState.hasGear('armor', id));
      if (!next) return null;
      const armor = global.Items.getArmor(next);
      return {
        id: 'armadura_laboratorio',
        title: 'Blindaje experimental',
        description: 'Placas impresas y cables reforzados esperan dueño.',
        options: [
          {
            label: `Montar ${armor.nombre}`,
            handler: () => {
              if (!global.GameState.spendEnergy(8)) {
                return { logs: ['No tienes pulso fino para ensamblar ahora.'], endTurn: false };
              }
              const state = global.GameState.getState();
              if (state.inventory.materiales < 2) {
                return { logs: ['Necesitas más materiales para completar el blindaje.'], endTurn: false };
              }
              global.GameState.consumeItem('materiales', 2);
              global.GameState.unlockGear('armor', next);
              return { logs: [`La ${armor.nombre} queda lista. Sientes la protección futurista.`] };
            },
          },
        ],
      };
    },
    aliado_nerea: () => {
      if (global.GameState.hasAlly('nerea')) return null;
      const ally = global.Characters.getAlly('nerea');
      return {
        id: 'aliado_nerea',
        title: 'Nerea analiza rutas',
        description: `${ally.descripcion} ¿Te dejas guiar?`,
        options: [
          {
            label: 'Sí, necesito estrategia',
            handler: () => {
              global.GameState.addAlly('nerea');
              global.GameState.changeResource('progreso', 5);
              return { logs: ['Nerea traza atajos y prometes seguirlos.'] };
            },
          },
          {
            label: 'Prefiero improvisar',
            handler: () => ({ logs: ['Ella se encoge de hombros: “no digas que no avisé”.'] }),
          },
        ],
      };
    },
    aliado_raul: () => {
      if (global.GameState.hasAlly('raul')) return null;
      const ally = global.Characters.getAlly('raul');
      return {
        id: 'aliado_raul',
        title: 'Raúl propone entrenar',
        description: `${ally.descripcion} ¿Sigues su ritmo?`,
        options: [
          {
            label: 'Entrenar juntos',
            handler: () => {
              if (!global.GameState.spendEnergy(8)) {
                return { logs: ['Tus músculos dicen que no hoy.'], endTurn: false };
              }
              global.GameState.addAlly('raul');
              global.GameState.changeResource('salud', 5);
              return { logs: ['Raúl se une y mejora tus rutinas de descanso.'] };
            },
          },
          {
            label: 'No gracias',
            handler: () => ({ logs: ['Raúl vuelve a las sentadillas sin insistir.'] }),
          },
        ],
      };
    },
    aliado_yoli: () => {
      if (global.GameState.hasAlly('yoli')) return null;
      const ally = global.Characters.getAlly('yoli');
      return {
        id: 'aliado_yoli',
        title: 'Yoli comparte reservas',
        description: `${ally.descripcion} ¿Aceptas el trato?`,
        options: [
          {
            label: 'Obvio, dame comida',
            handler: () => {
              global.GameState.addAlly('yoli');
              global.GameState.addItem('snacks', 2);
              return { logs: ['Yoli se une y promete que nunca te faltarán snacks.'] };
            },
          },
          {
            label: 'Estoy bien',
            handler: () => ({ logs: ['Yoli sonríe: “cuando gruñas de hambre, vuelve”.'] }),
          },
        ],
      };
    },
    proyecto_final: () => ({
      id: 'proyecto_final',
      title: 'Proyecto integrador',
      description: 'Para terminar el curso debes entregar algo épico.',
      options: [
        {
          label: 'Maratón de trabajo',
          handler: () => {
            if (!global.GameState.spendEnergy(20)) {
              return { logs: ['No aguantas la maratón, necesitas descansar antes.'], endTurn: false };
            }
            global.GameState.changeResource('hambre', 10);
            global.GameState.changeResource('estres', 12);
            global.GameState.changeResource('progreso', 25);
            return { logs: ['Te quedas hasta tarde y presentas algo digno de las leyendas del FP.'] };
          },
        },
        {
          label: 'Coordinar al grupo',
          handler: () => {
            global.GameState.changeResource('progreso', 15);
            global.GameState.changeResource('estres', 4);
            global.GameState.changeResource('energia', -8);
            return { logs: ['Distribuyes tareas y avanzas sin quemarte del todo.'] };
          },
        },
      ],
    }),

    enemigo_inigo: () => {
      if (!global.GameState.isBossAlive('inigo')) return null;
      const enemy = global.Characters.getEnemy('inigo');
      return {
        id: 'enemigo_inigo',
        title: 'Iñigo Romanos aparece',
        description: `${enemy.descripcion} No parece negociar.`,
        options: [
          {
            label: 'Enfrentarlo',
            handler: () => ({ logs: ['Respiras hondo y preparas tu mejor golpe.'], startCombat: 'inigo', endTurn: false }),
          },
          {
            label: 'Replegarte',
            handler: () => {
              global.GameState.changeResource('estres', 6);
              global.GameState.changeResource('energia', -5);
              return { logs: ['Retrocedes lentamente. Iñigo toma nota para un futuro examen.'] };
            },
          },
        ],
      };
    },

    burocracia: () => ({
      id: 'burocracia',
      title: 'Montaña de burocracia',
      description: 'Secretaría exige firmas en quintuplicado.',
      options: [
        {
          label: 'Rellenarlo todo',
          handler: () => {
            global.GameState.changeResource('estres', 12);
            global.GameState.changeResource('energia', -10);
            global.GameState.changeResource('progreso', 5);
            return { logs: ['Tras 15 sellos y tres ventanillas, obtienes algo de reconocimiento académico.'] };
          },
        },
        {
          label: 'Huir discretamente',
          handler: () => {
            global.GameState.changeResource('estres', -5);
            return { logs: ['Sales corriendo antes de que sepan tu nombre completo.'] };
          },
        },
      ],
    }),

    escape_final: () => {
      const ready = global.GameState.getFlag('escapeReady');
      return {
        id: 'escape_final',
        title: 'Puerta de escape',
        description: ready
          ? 'Tienes todo lo necesario: tarjeta, plano y llave. Puedes intentar huir.'
          : 'Necesitas una tarjeta, un plano y alguna llave para abrir esta salida.',
        options: ready
          ? [
              {
                label: 'Forzar la puerta y escapar',
                handler: () => ({ logs: ['Respiras hondo y ejecutas tu plan maestro.'], triggerEscape: true, endTurn: false }),
              },
              {
                label: 'Aún no, repasaré antes',
                handler: () => ({ logs: ['Dejas la puerta en paz… por ahora.'] }),
              },
            ]
          : [
              {
                label: 'Inspeccionar cerraduras',
                handler: () => ({
                  logs: ['Contabilizas los cierres: al menos una tarjeta magnética, plano de conductos y llave buena.'],
                }),
              },
            ],
      };
    },

    enemigo_iniesta: () => {
      if (!global.GameState.isBossAlive('iniesta')) return null;
      const enemy = global.Characters.getEnemy('iniesta');
      return {
        id: 'enemigo_iniesta',
        title: 'Iniesta, guardián del CPD',
        description: `${enemy.descripcion} Bloquea la puerta con un manojo de contraseñas.`,
        options: [
          { label: 'Luchar', handler: () => ({ logs: ['Te preparas para hackearle las intenciones.'], startCombat: 'iniesta', endTurn: false }) },
          { label: 'Retirarte', handler: () => ({ logs: ['Retrocedes, pero Iniesta promete no olvidarlo.'], endTurn: true }) },
        ],
      };
    },

    hallazgo_cpd: () => ({
      id: 'hallazgo_cpd',
      title: 'Archivos del CPD',
      description: 'Encuentras archivos con rutas de mantenimiento.',
      options: [
        {
          label: 'Memorizar rutas',
          handler: () => {
            global.GameState.setFlag('codigoCPD', true);
            global.GameState.setInventoryFlag('tarjetaCPD', true);
            global.GameState.changeResource('estres', 5);
            return { logs: ['Copias una tarjeta vieja y memorizas códigos. Tu plan de huida avanza.'] };
          },
        },
      ],
    }),

    hallazgo_azotea: () => ({
      id: 'hallazgo_azotea',
      title: 'Plano de ventilación',
      description: 'Entre macetas encuentras planos garabateados.',
      options: [
        {
          label: 'Guardarlo',
          handler: () => {
            global.GameState.setInventoryFlag('planoAzotea', true);
            global.GameState.changeResource('estres', -4);
            return { logs: ['El plano marca un túnel hacia la salida de emergencia.'] };
          },
        },
      ],
    }),

    refugio: () => ({
      id: 'refugio',
      title: 'Momento de respiro',
      description: 'Los baños (sorprendentemente) están vacíos y tranquilos.',
      options: [
        {
          label: 'Desahogarte frente al espejo',
          handler: () => {
            global.GameState.changeResource('estres', -12);
            return { logs: ['Te das discurso motivador. Sales con ganas renovadas.'] };
          },
        },
      ],
    }),

    hallazgo_comida: () => ({
      id: 'hallazgo_comida',
      title: 'Huerto clandestino',
      description: 'En el patio hay snacks escondidos en mochilas.',
      options: [
        {
          label: 'Compartir con el grupo',
          handler: () => {
            global.GameState.changeResource('hambre', -25);
            global.GameState.changeResource('estres', -4);
            return { logs: ['Compartes comida imaginaria con tus aliados. Todos felices.'] };
          },
        },
        {
          label: 'Guardar raciones',
          handler: () => {
            global.GameState.addItem('snacks', 2);
            return { logs: ['Rellenas tu inventario de snacks clandestinos.'] };
          },
        },
      ],
    }),
  };

  function buildEvent(id) {
    const factory = eventFactories[id];
    if (!factory) return null;
    return factory();
  }

  const fallbackEvents = [
    () => ({
      id: 'ambiente',
      title: 'Rutina en el centro',
      description: 'Nada especial ocurre, solo el zumbido de los fluorescentes.',
      options: [
        {
          label: 'Respirar hondo y seguir',
          handler: () => ({ logs: ['Los minutos pasan lentos. Aun así, te mantienes firme.'] }),
        },
      ],
    }),
  ];

  const Events = {
    getRandomEvent(roomId) {
      const ids = global.MapManager.getRoomEvents(roomId) || [];
      const pool = ids
        .map((id) => buildEvent(id))
        .filter((ev) => ev !== null && ev !== undefined);
      if (pool.length === 0) {
        return fallbackEvents[rand(0, fallbackEvents.length - 1)]();
      }
      const weights = pool.map((ev) => {
        if (ev.id.includes('hallazgo') && global.GameState.getState().flags.allyCatalufo) {
          return 2;
        }
        return 1;
      });
      const total = weights.reduce((sum, w) => sum + w, 0);
      const pick = Math.random() * total;
      let accum = 0;
      for (let i = 0; i < pool.length; i += 1) {
        accum += weights[i];
        if (pick <= accum) {
          return pool[i];
        }
      }
      return pool[0];
    },

    buildEventById(id) {
      return buildEvent(id);
    },
  };

  global.Events = Events;
})(window);
