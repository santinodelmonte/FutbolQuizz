/* =====================================================================
 *  DATOS TÁCTICOS · Independiente CAI Sub-17 · Sistema 1-4-1-3-2
 *  ---------------------------------------------------------------------
 *  Este archivo es solo contenido: se puede editar a mano sin tocar la lógica.
 *
 *  COORDENADAS (todas relativas a la cancha):
 *    x: 0 = banda izquierda ... 100 = banda derecha (mirando al arco rival)
 *    y: 0 = nuestra línea de fondo ... 100 = línea de fondo rival
 *    Una posición se escribe [x, y].
 *
 *  FASES: cada fase tiene "pasos". Cada paso es una foto de la cancha.
 *    - propios: { ROL: [x, y], ... }. En el paso 1 van los 11.
 *      En los pasos siguientes alcanza con poner SOLO los que cambian:
 *      el resto se queda donde estaba en el paso anterior.
 *    - rivales: lista de [x, y]. Si un paso no la trae, se repite la del paso anterior.
 *      Mantené siempre el mismo orden y la misma cantidad (para que la animación sepa quién es quién).
 *    - pelota: 'ROL' (al pie de ese jugador propio), [x, y] o null (sin pelota).
 *    - flechas (opcional): { tipo: 'pase' | 'mov', de, a, curva }
 *        de / a: 'ROL' (posición de ese rol en este paso) o [x, y].
 *        curva (opcional): [x, y] punto de control para dibujar la flecha curva.
 *
 *  TEXTOS POR ROL (roles: {...} dentro de cada fase):
 *    hago: qué hago en esta fase.   si: lista de { si: 'situación', hago: 'respuesta' }.
 *    propuesta: true = texto propuesto por la demo, PARA REVISAR por el cuerpo técnico.
 *
 *  ZONAS de los juegos: elipses { x, y, rx, ry } en las mismas unidades.
 * ===================================================================== */

window.CAI_DATA = {

  roles: [
    { id: 'ARQ', nombre: 'Arquero', nota: 'Inicia la salida, achica la espalda de la línea cuando el bloque está alto.' },
    { id: 'LD', nombre: 'Lateral derecho', nota: 'Principal fuente de amplitud por derecha (el sistema no tiene extremos).' },
    { id: 'ZD', nombre: 'Zaguero derecho', nota: 'Se abre en la salida; queda en la última línea cuando atacamos.' },
    { id: 'ZI', nombre: 'Zaguero izquierdo', nota: 'Se abre en la salida; queda en la última línea cuando atacamos.' },
    { id: 'LI', nombre: 'Lateral izquierdo', nota: 'Amplitud por izquierda. Regla: los dos laterales no suben a la vez.' },
    { id: '5', nombre: 'Volante central (pivote)', nota: 'Equilibrio. Protege la zona delante de los zagueros y da la salida por dentro.' },
    { id: 'VD', nombre: 'Volante derecho', nota: 'Interior: cubre al lateral, salta a presionar al lateral rival, llega al área.' },
    { id: 'VI', nombre: 'Volante izquierdo', nota: 'Interior: cubre al lateral, salta a presionar al lateral rival, llega al área.' },
    { id: '10', nombre: '10 (volante interno)', nota: 'Volante interno: va en el centro de la línea de tres con VI y VD. En presión alta sube al pivote rival.' },
    { id: 'DD', nombre: 'Delantero derecho', nota: 'Fija a un central rival, ataca el espacio, cierra el pase al lateral en presión alta.' },
    { id: 'DI', nombre: 'Delantero izquierdo', nota: 'Fija a un central rival, ataca el espacio, cierra el pase al lateral en presión alta.' }
  ],

  /* ------------------------------------------------------------------ */
  fases: [

    /* ================= FASE 1 ================= */
    {
      id: 'f1',
      nombre: 'Posición base',
      subtitulo: 'Bloque medio, sin pelota en juego',
      texto: 'Así nos paramos de base: cuatro atrás, el 5 adelante de los zagueros, una línea de tres volantes (VI, 10 y VD) y los dos delanteros.',
      pasos: [
        {
          titulo: 'El 1-4-1-3-2 armado',
          pelota: null,
          propios: {
            ARQ: [50, 4], LD: [85, 26], ZD: [62, 20], ZI: [38, 20], LI: [15, 26],
            '5': [50, 33], VD: [72, 44], VI: [28, 44], '10': [50, 44], DD: [60, 64], DI: [40, 64]
          },
          rivales: []
        }
      ],
      roles: {
        ARQ: { propuesta: true, hago: 'Me paro unos metros adelante del arco, atento a la espalda de los zagueros. Hablo y ordeno la línea.',
          si: [{ si: 'tiran un pase largo a la espalda de la defensa', hago: 'Salgo a cortar si llego primero. Si no llego, me quedo y achico.' }] },
        LD: { propuesta: true, hago: 'Me paro abierto, un poco más arriba que los zagueros. Soy el ancho del equipo por derecha.',
          si: [{ si: 'sube el LI', hago: 'No subo: me cierro con los zagueros y quedamos tres atrás.' }] },
        ZD: { propuesta: true, hago: 'Me paro a la derecha del ZI, en la misma línea. Cuido el espacio entre él y el LD.',
          si: [{ si: 'el LD queda arriba', hago: 'Me abro un poco para cubrir su espalda y aviso al 5 para que se acerque.' }] },
        ZI: { propuesta: true, hago: 'Me paro a la izquierda del ZD, en la misma línea. Cuido el espacio entre él y el LI.',
          si: [{ si: 'el LI queda arriba', hago: 'Me abro un poco para cubrir su espalda y aviso al 5 para que se acerque.' }] },
        LI: { propuesta: true, hago: 'Me paro abierto, un poco más arriba que los zagueros. Soy el ancho del equipo por izquierda.',
          si: [{ si: 'sube el LD', hago: 'No subo: me cierro con los zagueros y quedamos tres atrás.' }] },
        '5': { propuesta: true, hago: 'Me paro solo delante de los zagueros, detrás de la línea de tres. Soy el equilibrio: no me voy lejos de mi zona.',
          si: [{ si: 'un volante sale a presionar', hago: 'Me corro un poco para su lado y protejo delante de los zagueros; el 10 tapa el pase por dentro.' }] },
        VD: { propuesta: true, hago: 'Me paro por dentro, entre el LD y el 5. Cubro el espacio que deja el lateral cuando sube.',
          si: [{ si: 'la pelota va a mi banda', hago: 'Salto a presionar al lateral rival; el LD me cubre la espalda.' }] },
        VI: { propuesta: true, hago: 'Me paro por dentro, entre el LI y el 5. Cubro el espacio que deja el lateral cuando sube.',
          si: [{ si: 'la pelota va a mi banda', hago: 'Salto a presionar al lateral rival; el LI me cubre la espalda.' }] },
        '10': { propuesta: true, hago: 'Me paro en el centro de la línea de tres volantes, entre el VI y el VD. Soy un volante interno más.',
          si: [{ si: 'un volante sale a presionar al lateral', hago: 'Me corro hacia su lado y ocupo su carril de adentro; el volante del otro lado se cierra.' }] },
        DD: { propuesta: true, hago: 'Me paro arriba, cerca del DI. Fijo a un central rival y tapo el pase al medio.',
          si: [{ si: 'la pelota va al lateral rival de mi lado', hago: 'Me cierro para que no la devuelva por dentro; sale el VD.' }] },
        DI: { propuesta: true, hago: 'Me paro arriba, cerca del DD. Fijo a un central rival y tapo el pase al medio.',
          si: [{ si: 'la pelota va al lateral rival de mi lado', hago: 'Me cierro para que no la devuelva por dentro; sale el VI.' }] }
      }
    },

    /* ================= FASE 2 ================= */
    {
      id: 'f2',
      nombre: 'Salida desde el arco',
      subtitulo: 'Rival presionando con 2 delanteros y un 10',
      texto: 'Los zagueros se abren, el 5 se ofrece entre los dos delanteros rivales. Si nos tapan el medio, salimos por el lateral y el volante del lado baja a ayudar. El 10 se corre hacia ese lado, en la línea de volantes, para el segundo pase. El otro lateral no sube.',
      pasos: [
        {
          titulo: 'Saque del arquero',
          pelota: 'ARQ',
          propios: {
            ARQ: [50, 5], ZD: [76, 12], ZI: [24, 12], LD: [92, 34], LI: [8, 34],
            '5': [50, 22], VD: [70, 36], VI: [30, 36], '10': [50, 40], DD: [62, 70], DI: [38, 70]
          },
          rivales: [
            [58, 20], [42, 20], [50, 32],
            [80, 40], [20, 40], [62, 46], [38, 46], [75, 62], [25, 62], [58, 68], [42, 68],
            [50, 96]
          ]
        },
        {
          titulo: 'Pase al ZD: el LD sube un poco y el VD baja a ofrecerse',
          pelota: 'ZD',
          propios: { LD: [92, 42], VD: [74, 30], '5': [56, 24], '10': [56, 40] },
          // El delantero rival de ese lado sale al ZD; el resto bascula 4 hacia la derecha (el arquero rival no se mueve).
          // Ajuste: el rival que quedaba en [62, 68] se subió a [62, 66] para no taparlo al DD.
          rivales: [
            [68, 15], [46, 20], [54, 32],
            [84, 40], [24, 40], [66, 46], [42, 46], [79, 62], [29, 62], [62, 66], [46, 68],
            [50, 96]
          ],
          flechas: [
            { tipo: 'pase', de: [50, 5], a: 'ZD' },
            { tipo: 'mov', de: [70, 36], a: 'VD' }
          ]
        },
        {
          titulo: 'El ZD juega al VD por dentro; el VD gira y conduce',
          pelota: 'VD',
          propios: { VD: [70, 40], LD: [92, 52], '10': [58, 48], DD: [66, 72], DI: [44, 72], LI: [14, 30] },
          flechas: [
            { tipo: 'pase', de: 'ZD', a: [74, 34] },
            { tipo: 'mov', de: [74, 34], a: 'VD' },
            { tipo: 'mov', de: [92, 42], a: 'LD' }
          ]
        }
      ],
      roles: {
        ARQ: { propuesta: true, hago: 'Saco corto para un zaguero abierto. Si nos tapan el medio, la salida va por afuera.',
          si: [{ si: 'me la devuelven', hago: 'Me ofrezco de costado para ser el pase atrás y juego al zaguero libre.' }] },
        LD: { propuesta: true, hago: 'Me abro pegado a la raya y subo a medida que la pelota avanza por mi lado.',
          si: [{ si: 'el ZD juega al VD por dentro', hago: 'Sigo subiendo por afuera para darle otra opción y estirar al rival.' }] },
        ZD: { propuesta: true, hago: 'Me abro bien para recibir de frente. Con pelota busco al VD por dentro o al LD por afuera.',
          si: [{ si: 'me sale a presionar un delantero', hago: 'Juego rápido al VD que baja o al LD. No conduzco hacia adentro.' }] },
        ZI: { propuesta: true, hago: 'Me abro para darle pase al arquero. Si la salida va a la derecha, me cierro hacia el medio.',
          si: [{ si: 'la pelota está del otro lado', hago: 'Me quedo atrás con el LI: somos la seguridad si la perdemos.' }] },
        LI: { propuesta: true, hago: 'Salimos por derecha: no subo. Me cierro con los zagueros.',
          si: [{ si: 'perdemos la pelota en la salida', hago: 'Ya estoy en mi lugar: cierro por dentro y cubro.' }] },
        '5': { propuesta: true, hago: 'Me ofrezco entre los dos delanteros rivales para recibir de frente.',
          si: [{ si: 'me tapa el 10 rival', hago: 'Me corro para abrir el pase por dentro al volante que baja.' }] },
        VD: { propuesta: true, hago: 'Bajo a ofrecerme por dentro para ayudar al ZD. Recibo perfilado, giro y conduzco.',
          si: [{ si: 'me toman de espaldas', hago: 'No giro forzado: juego de primera al LD o de vuelta al ZD.' }] },
        VI: { propuesta: true, hago: 'Me quedo por dentro a la izquierda, atento a cubrir si perdemos.',
          si: [{ si: 'la salida cambia a la izquierda', hago: 'Bajo yo a ofrecerme, como hizo el VD, y sube el LI.' }] },
        '10': { propuesta: true, hago: 'Me corro hacia el lado de la salida, en la línea de volantes, para recibir el segundo pase.',
          si: [{ si: 'el VD gira con pelota', hago: 'Me ofrezco de frente por dentro para atacar rápido.' }] },
        DD: { propuesta: true, hago: 'Me quedo arriba fijando a un central rival, para que no salga a presionar.',
          si: [{ si: 'el VD gira y conduce', hago: 'Ataco el espacio entre central y lateral rival.' }] },
        DI: { propuesta: true, hago: 'Me quedo arriba fijando al otro central rival y estiro su defensa.',
          si: [{ si: 'el VD gira y conduce', hago: 'Me muevo para darle una línea de pase por dentro.' }] }
      }
    },

    /* ================= FASE 3 ================= */
    {
      id: 'f3',
      nombre: 'Ataque organizado por la derecha',
      subtitulo: 'Un lateral sube, el otro cierra',
      texto: 'Sube un lateral y el otro se mete con los zagueros: siempre quedan 3 + el 5 atrás. Al área llegan los dos delanteros, el 10 y el volante contrario.',
      pasos: [
        {
          titulo: 'La tiene el VD, el LD pasa por afuera',
          pelota: 'VD',
          propios: {
            ARQ: [50, 14], ZD: [64, 34], ZI: [38, 32], LI: [22, 40], '5': [50, 44], LD: [92, 66],
            VD: [70, 58], VI: [36, 60], '10': [51, 64], DD: [62, 82], DI: [42, 82]
          },
          rivales: [
            [70, 88], [56, 90], [44, 90], [30, 88],
            [74, 74], [58, 72], [42, 72], [26, 74],
            [56, 62], [44, 62],
            [50, 97]
          ]
        },
        {
          titulo: 'Desborde del lateral y llegada al área',
          pelota: 'LD',
          propios: { LD: [93, 82], VD: [74, 70], '10': [54, 80], DD: [58, 90], DI: [42, 90], VI: [34, 76], '5': [50, 50] },
          // Rivales: el documento no los definía para este paso; se corren hacia la pelota para no tapar a DD y DI.
          rivales: [
            [84, 84], [61, 93], [47, 93], [34, 90],
            [80, 76], [63, 77], [46, 76], [29, 79],
            [58, 66], [46, 66],
            [54, 97]
          ],
          flechas: [
            { tipo: 'pase', de: [70, 58], a: 'LD' },
            { tipo: 'mov', de: [62, 82], a: 'DD' },
            { tipo: 'mov', de: [42, 82], a: 'DI' },
            { tipo: 'mov', de: [36, 60], a: 'VI' },
            { tipo: 'mov', de: [51, 64], a: '10' }
          ]
        }
      ],
      roles: {
        ARQ: { propuesta: true, hago: 'Me adelanto hasta el borde del área: si nos contraatacan, cubro la espalda de los zagueros.',
          si: [{ si: 'tiran un pase largo', hago: 'Salgo a cortar fuera del área si llego primero.' }] },
        LD: { propuesta: true, hago: 'Subo por afuera, bien abierto. Doy la amplitud por derecha y busco el desborde.',
          si: [{ si: 'me cierran el desborde', hago: 'Toco atrás al VD y me vuelvo a ofrecer por afuera.' },
               { si: 'perdemos la pelota', hago: 'Corro hacia atrás ya; el VD me cubre mientras vuelvo.' }] },
        ZD: { propuesta: true, hago: 'Me quedo en la última línea, un poco abierto para cubrir la espalda del LD.',
          si: [{ si: 'perdemos y atacan la espalda del LD', hago: 'Salgo a esa banda; el 5 y el ZI cierran el medio.' }] },
        ZI: { propuesta: true, hago: 'Me quedo en la última línea, cerrado hacia el medio, con el LI al lado.',
          si: [{ si: 'perdemos y sale el ZD a la banda', hago: 'Me corro al medio para cubrirlo.' }] },
        LI: { propuesta: true, hago: 'No subo. Me cierro con los zagueros: quedamos tres atrás más el 5.',
          si: [{ si: 'nos contraatacan por mi lado', hago: 'Retrocedo de frente y no me tiro: espero la ayuda.' }] },
        '5': { propuesta: true, hago: 'Me quedo detrás de la pelota, delante de los zagueros. Doy el apoyo y equilibro.',
          si: [{ si: 'perdemos la pelota', hago: 'Tapo el pase por dentro y presiono al que la recupera si está cerca.' }] },
        VD: { propuesta: true, hago: 'Abro para el LD que pasa por afuera y lo acompaño por dentro.',
          si: [{ si: 'el LD no puede subir', hago: 'Me abro yo para dar amplitud.' }] },
        VI: { propuesta: true, hago: 'Soy el volante contrario: llego a la medialuna para el rebote o el pase atrás.',
          si: [{ si: 'la pelota vuelve atrás', hago: 'Me ofrezco para cambiar de frente.' }] },
        '10': { propuesta: true, hago: 'Como volante interno, llego al borde del área listo para el pase atrás.',
          si: [{ si: 'rechazan el centro', hago: 'Ataco el rebote o presiono ahí mismo.' }] },
        DD: { propuesta: true, hago: 'Ataco el primer palo.',
          si: [{ si: 'el LD tira el centro atrás', hago: 'Freno y me ofrezco entre los centrales.' }] },
        DI: { propuesta: true, hago: 'Ataco el segundo palo.',
          si: [{ si: 'el centro va al primer palo', hago: 'Sigo cerrando por si queda el rebote.' }] }
      }
    },

    /* ================= FASE 4 ================= */
    {
      id: 'f4',
      nombre: 'Bloque medio y basculación',
      subtitulo: 'Pelota del rival en nuestra banda izquierda',
      texto: 'Pelota en una banda: todo el equipo se corre para ese lado. Sale el volante de esa banda, el lateral le cubre la espalda y el 10 ocupa su carril de adentro. El otro volante se cierra, el 5 protege delante de los zagueros y el lateral del otro lado se cierra. Lejos de la pelota no hay nada que defender.',
      pasos: [
        {
          titulo: 'Bloque medio armado',
          pelota: [18, 56],
          propios: {
            ARQ: [50, 6], LI: [14, 30], ZI: [34, 24], ZD: [56, 24], LD: [76, 28], '5': [42, 36],
            VI: [22, 48], VD: [60, 46], '10': [40, 48], DI: [32, 62], DD: [54, 62]
          },
          rivales: [
            [18, 56], [30, 70], [50, 74], [66, 62], [40, 52], [60, 50], [82, 56], [38, 40], [56, 38], [46, 30],
            [50, 95]
          ]
        },
        {
          titulo: 'Salta el VI al lateral, todo el bloque se corre',
          pelota: [18, 56],
          propios: {
            VI: [20, 53], LI: [14, 40], '5': [40, 36], '10': [32, 50], DI: [28, 66],
            VD: [50, 46], LD: [68, 28], ZD: [50, 24], ZI: [30, 26]
          },
          flechas: [
            { tipo: 'mov', de: [22, 48], a: 'VI' },
            { tipo: 'mov', de: [14, 30], a: 'LI' },
            { tipo: 'mov', de: [40, 48], a: '10' },
            { tipo: 'mov', de: [60, 46], a: 'VD' },
            { tipo: 'mov', de: [76, 28], a: 'LD' }
          ]
        }
      ],
      roles: {
        ARQ: { propuesta: true, hago: 'Me corro hacia el lado de la pelota y ordeno la línea.',
          si: [{ si: 'tiran un pase largo a la espalda', hago: 'Salgo si llego primero; si no, cubro el arco.' }] },
        LD: { propuesta: true, hago: 'Me cierro hacia el centro. Lejos de la pelota no hay nada que defender.',
          si: [{ si: 'cambian de frente a mi lado', hago: 'Vuelvo a abrirme mientras viaja la pelota; sale el VD al lateral.' }] },
        ZD: { propuesta: true, hago: 'Me cierro hacia el medio, cerca del ZI. No me quedo abierto.',
          si: [{ si: 'cambian de frente', hago: 'Me corro de nuevo junto con toda la línea.' }] },
        ZI: { propuesta: true, hago: 'Me corro hacia mi banda para estar cerca del LI.',
          si: [{ si: 'atacan la espalda del LI', hago: 'Salgo a cubrir y el ZD se cierra al medio.' }] },
        LI: { propuesta: true, hago: 'Cubro la espalda del VI que sale a presionar. No subo.',
          si: [{ si: 'el lateral rival supera al VI', hago: 'Le salgo yo y el ZI me cubre.' }] },
        '5': { propuesta: true, hago: 'Me corro un poco hacia la pelota y protejo delante de los zagueros, a la espalda del 10 y del VI.',
          si: [{ si: 'un rival recibe a la espalda de los volantes', hago: 'Salgo a presionarlo sin dejarlo girar; los zagueros cierran atrás.' },
               { si: 'cambian de frente', hago: 'Me corro por el medio hacia el otro lado, con todo el bloque.' }] },
        VD: { propuesta: true, hago: 'Me cierro hacia el medio: la línea de tres se corre junta.',
          si: [{ si: 'cambian de frente a mi lado', hago: 'Salto yo al lateral rival y el VI vuelve a su lugar.' }] },
        VI: { propuesta: true, hago: 'Salto a presionar al lateral rival, de afuera hacia adentro.',
          si: [{ si: 'me supera', hago: 'No lo sigo: me doy vuelta y recupero mi lugar; me cubre el LI.' }] },
        '10': { propuesta: true, hago: 'Me corro hacia la pelota y ocupo el carril de adentro que deja el VI: tapo el pase por dentro.',
          si: [{ si: 'cambian de frente', hago: 'Me corro con la línea por el medio; sale el VD y yo cubro su carril de adentro.' }] },
        DD: { propuesta: true, hago: 'Me cierro al medio y tapo el pase al pivote rival.',
          si: [{ si: 'cambian de frente', hago: 'Me corro con el bloque y el DI se cierra.' }] },
        DI: { propuesta: true, hago: 'Cierro el pase atrás del lateral hacia su central.',
          si: [{ si: 'la juega igual para atrás', hago: 'Salgo a presionar al que recibe.' }] }
      }
    },

    /* ================= FASE 5 ================= */
    {
      id: 'f5',
      nombre: 'Presión alta',
      subtitulo: 'En el saque del arquero rival',
      // Revisado: con el 10 en la línea de volantes, al zaguero rival lo presiona el delantero de ese lado
      // (está a unos 8 m); el 10 queda a unos 20 m y no llega. El 10 sube al pivote rival.
      texto: 'Los delanteros esperan abiertos, en la línea del pase a los laterales. Cuando el arquero juega a un zaguero, el delantero de ese lado lo presiona en curva, de afuera hacia adentro: con la espalda le tapa el pase al lateral. El otro delantero cierra el pase al otro zaguero y el 10 sube al pivote rival. Si la pelota llega igual al lateral, salta el volante de ese lado.',
      pasos: [
        {
          titulo: 'Saque del arquero rival',
          pelota: [50, 96],
          propios: {
            DD: [66, 82], DI: [34, 82], VD: [70, 68], '10': [50, 70], VI: [30, 68], '5': [50, 60],
            LD: [82, 52], LI: [18, 52], ZD: [60, 44], ZI: [40, 44], ARQ: [50, 22]
          },
          rivales: [
            [64, 90], [36, 90], [88, 80], [12, 80], [50, 78],
            [64, 70], [36, 70], [72, 58], [28, 58], [50, 54],
            [50, 96]
          ]
        },
        {
          titulo: 'Juega al zaguero izquierdo rival: el DI lo presiona en curva',
          pelota: [36, 90],
          propios: {
            DI: [33, 87], DD: [54, 86], '10': [45, 82], VI: [20, 76], '5': [46, 68],
            VD: [60, 72], LI: [16, 62], LD: [74, 54], ZI: [38, 50], ZD: [58, 50], ARQ: [50, 26]
          },
          flechas: [
            { tipo: 'pase', de: [50, 96], a: [36, 90] },
            { tipo: 'mov', de: [34, 82], a: 'DI', curva: [27, 86] },
            { tipo: 'mov', de: [66, 82], a: 'DD' },
            { tipo: 'mov', de: [50, 70], a: '10' },
            { tipo: 'mov', de: [30, 68], a: 'VI' }
          ]
        }
      ],
      roles: {
        ARQ: { propuesta: true, hago: 'Me adelanto bastante: el bloque está alto y cubro la espalda de la línea.',
          si: [{ si: 'le pegan largo', hago: 'Salgo a cortar fuera del área si llego primero.' }] },
        LD: { propuesta: true, hago: 'Subo hasta cerca de mitad de cancha para que el equipo quede corto.',
          si: [{ si: 'la pelota va al otro lado', hago: 'Me cierro hacia el medio con la línea.' }] },
        ZD: { propuesta: true, hago: 'Subo la línea. Con el ZI cuidamos a los delanteros rivales.',
          si: [{ si: 'le pegan largo', hago: 'Corro hacia atrás de frente a la pelota; el arquero me cubre.' }] },
        ZI: { propuesta: true, hago: 'Subo la línea. Con el ZD cuidamos a los delanteros rivales.',
          si: [{ si: 'le pegan largo', hago: 'Corro hacia atrás de frente a la pelota; el arquero me cubre.' }] },
        LI: { propuesta: true, hago: 'Subo para acortar y tomo la referencia del atacante rival de mi lado.',
          si: [{ si: 'salta el VI al lateral', hago: 'Subo un poco más para cubrir su espalda.' }] },
        '5': { propuesta: true, hago: 'Me paro detrás de la línea de tres. Cuando sube el 10, cubro su espalda.',
          si: [{ si: 'un volante rival recibe a la espalda del 10', hago: 'Salgo a presionarlo sin dejarlo girar.' }] },
        VD: { propuesta: true, hago: 'Me paro alto, en la línea de volantes, listo para saltar sobre el lateral rival de mi lado.',
          si: [{ si: 'la pelota va al otro lado', hago: 'Me cierro hacia el medio para tapar pases.' }] },
        VI: { propuesta: true, hago: 'Me paro alto, en la línea de volantes, listo para saltar sobre el lateral rival de mi lado.',
          si: [{ si: 'la pelota llega al lateral', hago: 'Salto a presionarlo; el LI me cubre.' }] },
        '10': { propuesta: true, hago: 'Estoy en el centro de la línea de volantes, cerca del pivote rival.',
          si: [{ si: 'el arquero juega a un zaguero', hago: 'Subo al pivote rival y me paro en la línea del pase, para que el zaguero no pueda jugar al medio.' }] },
        DD: { propuesta: true, hago: 'Espero abierto, en la línea del pase al lateral rival. Dejo que el arquero juegue al zaguero.',
          si: [{ si: 'juega al zaguero de mi lado', hago: 'Lo presiono en curva, de afuera hacia adentro: con la espalda le tapo el pase al lateral.' },
               { si: 'juega al zaguero del otro lado', hago: 'Me cierro hacia el medio para tapar el pase de vuelta.' }] },
        DI: { propuesta: true, hago: 'Espero abierto, en la línea del pase al lateral rival. Dejo que el arquero juegue al zaguero.',
          si: [{ si: 'juega al zaguero de mi lado', hago: 'Lo presiono en curva, de afuera hacia adentro: con la espalda le tapo el pase al lateral.' },
               { si: 'juega al zaguero del otro lado', hago: 'Me cierro hacia el medio para tapar el pase de vuelta.' }] }
      }
    },

    /* ================= FASE 6 ================= */
    {
      id: 'f6',
      nombre: 'Transición: perdemos la pelota',
      subtitulo: 'Presión tras pérdida',
      texto: 'Perdimos: los tres más cerca presionan ya. Somos muchos por dentro y eso es una ventaja. Si en 5 segundos no la recuperamos, todos atrás de la pelota.',
      pasos: [
        {
          titulo: 'El VD pierde la pelota',
          pelota: [72, 64],
          propios: {
            ARQ: [50, 14], ZD: [64, 34], ZI: [38, 32], LI: [22, 40], '5': [50, 44], LD: [92, 66],
            VD: [70, 62], VI: [36, 60], '10': [51, 64], DD: [62, 82], DI: [42, 82]
          },
          rivales: [
            [70, 88], [56, 90], [44, 90], [30, 88],
            [74, 67], [58, 72], [42, 72], [26, 74],
            [56, 62], [44, 62],
            [50, 97]
          ]
        },
        {
          titulo: 'Presión tras pérdida: primeros segundos',
          pelota: [75, 68],
          propios: {
            VD: [71, 65], '10': [66, 70], DD: [74, 74], '5': [60, 56], LD: [88, 56],
            ZD: [63, 30], ZI: [39, 28], LI: [24, 36], VI: [44, 58], DI: [46, 78], ARQ: [50, 12]
          },
          rivales: [
            [72, 86], [58, 88], [44, 90], [30, 88],
            [75, 68], [60, 70], [44, 70], [26, 74],
            [52, 52], [40, 56],
            [50, 97]
          ],
          flechas: [
            { tipo: 'mov', de: [51, 64], a: '10' },
            { tipo: 'mov', de: [62, 82], a: 'DD' },
            { tipo: 'mov', de: [50, 44], a: '5' },
            { tipo: 'mov', de: [92, 66], a: 'LD' }
          ]
        }
      ],
      roles: {
        ARQ: { propuesta: true, hago: 'Me quedo atento: si sale un pase largo, cubro la espalda de los zagueros.',
          si: [{ si: 'rompen la presión', hago: 'Ordeno a gritos: todos atrás de la pelota.' }] },
        LD: { propuesta: true, hago: 'Había subido: corro hacia atrás a mi zona.',
          si: [{ si: 'juegan a mi espalda', hago: 'Sigo corriendo; el ZD sale a cubrir hasta que llegue.' }] },
        ZD: { propuesta: true, hago: 'No avanzo: retrocedo unos metros y cuido la espalda.',
          si: [{ si: 'tiran largo a la espalda del LD', hago: 'Salgo a esa banda; el ZI y el LI se cierran.' }] },
        ZI: { propuesta: true, hago: 'No avanzo: retrocedo unos metros y me cierro con el ZD.',
          si: [{ si: 'sale el ZD a la banda', hago: 'Me corro al medio para cubrirlo.' }] },
        LI: { propuesta: true, hago: 'Estaba cerrado: no avanzo, retrocedo unos metros con los zagueros.',
          si: [{ si: 'cambian de frente a mi lado', hago: 'Salgo a mi banda sin dejar sola a la línea.' }] },
        '5': { propuesta: true, hago: 'Me acerco a la pelota y tapo el pase por dentro.',
          si: [{ si: 'la juegan por dentro igual', hago: 'Presiono al que recibe sin dejarlo girar.' }] },
        VD: { propuesta: true, hago: 'Perdí la pelota: presiono ya, ahí mismo.',
          si: [{ si: 'en 5 segundos no la recuperamos', hago: 'Me repliego atrás de la pelota.' }] },
        VI: { propuesta: true, hago: 'Me cierro al medio para tapar pases y estar cerca del rebote.',
          si: [{ si: 'en 5 segundos no la recuperamos', hago: 'Vuelvo a mi lugar en el bloque.' }] },
        '10': { propuesta: true, hago: 'Soy de los tres más cerca: cierro sobre la pelota desde adentro.',
          si: [{ si: 'se escapa por afuera', hago: 'Lo acompaño hacia la banda; no lo dejo entrar.' }] },
        DD: { propuesta: true, hago: 'Soy de los tres más cerca: cierro desde arriba para que no la juegue atrás.',
          si: [{ si: 'en 5 segundos no la recuperamos', hago: 'Vuelvo a mi lugar en el bloque.' }] },
        DI: { propuesta: true, hago: 'Me acerco al medio y tapo el pase atrás hacia los centrales.',
          si: [{ si: 'la recuperamos', hago: 'Me ofrezco rápido para atacar con el rival desordenado.' }] }
      }
    },

    /* ================= FASE 7 ================= */
    {
      id: 'f7',
      nombre: 'Bloque bajo',
      subtitulo: 'Dos líneas de cuatro',
      texto: 'Cuando nos meten atrás, la línea de tres volantes baja a la altura del 5 y quedan dos líneas de cuatro bien juntas.',
      pasos: [
        {
          titulo: 'Dos líneas de cuatro',
          pelota: [50, 40],
          propios: {
            LD: [80, 14], ZD: [60, 14], ZI: [40, 14], LI: [20, 14], ARQ: [50, 3],
            VD: [74, 26], '5': [56, 26], '10': [44, 26], VI: [26, 26],
            DD: [60, 40], DI: [40, 40]
          },
          rivales: [
            [50, 40], [50, 50], [62, 56], [38, 56], [86, 44], [14, 44],
            [70, 31], [30, 31], [57, 19], [43, 19],
            [50, 95]
          ]
        }
      ],
      roles: {
        ARQ: { propuesta: true, hago: 'Me quedo en el arco y ordeno las dos líneas para que estén juntas.',
          si: [{ si: 'tiran un centro', hago: 'Si es mío, salgo y grito fuerte para que me dejen.' }] },
        LD: { propuesta: true, hago: 'Línea de cuatro bien junta, cerca del área. No salgo de la línea sin cobertura.',
          si: [{ si: 'la pelota va a mi banda', hago: 'Salgo al atacante y el ZD se corre a cubrirme.' }] },
        ZD: { propuesta: true, hago: 'Línea de cuatro bien junta. Cuido el espacio entre el ZI y el LD.',
          si: [{ si: 'un delantero rival me pica al vacío', hago: 'Lo acompaño sin dejarlo girar; el arquero achica.' }] },
        ZI: { propuesta: true, hago: 'Línea de cuatro bien junta. Cuido el espacio entre el ZD y el LI.',
          si: [{ si: 'un delantero rival me pica al vacío', hago: 'Lo acompaño sin dejarlo girar; el arquero achica.' }] },
        LI: { propuesta: true, hago: 'Línea de cuatro bien junta, cerca del área. No salgo de la línea sin cobertura.',
          si: [{ si: 'la pelota va a mi banda', hago: 'Salgo al atacante y el ZI se corre a cubrirme.' }] },
        '5': { propuesta: true, hago: 'Estoy en la línea de cuatro del medio, con el 10 al lado.',
          si: [{ si: 'quieren pasar por dentro', hago: 'Cierro con el 10: nadie recibe entre nosotros.' }] },
        VD: { propuesta: true, hago: 'Hago línea de cuatro con el 5, el 10 y el VI, delante de los defensores.',
          si: [{ si: 'la pelota va a mi banda', hago: 'Salgo al lateral rival y el LD me cubre.' }] },
        VI: { propuesta: true, hago: 'Hago línea de cuatro con el 5, el 10 y el VD, delante de los defensores.',
          si: [{ si: 'la pelota va a mi banda', hago: 'Salgo al lateral rival y el LI me cubre.' }] },
        '10': { propuesta: true, hago: 'Bajo con el VI y el VD a la línea del 5. Somos cuatro en el medio.',
          si: [{ si: 'la recuperamos', hago: 'Soy el primero en salir: busco al DD o al DI.' }] },
        DD: { propuesta: true, hago: 'Me quedo a la altura de la pelota y tapo el pase al medio.',
          si: [{ si: 'la recuperamos', hago: 'Me abro para recibir y salir rápido.' }] },
        DI: { propuesta: true, hago: 'Me quedo a la altura de la pelota y tapo el pase al medio.',
          si: [{ si: 'la recuperamos', hago: 'Me abro para recibir y salir rápido.' }] }
      }
    }
  ],

  /* ------------------------------------------------------------------
   *  JUEGO A · ¿A dónde pasás?
   *  base: fase y paso (desde 1) de donde se toman las posiciones.
   *  propios / rivales / pelota: cambios sobre esa base (opcional).
   *  ideal = 100 %, aceptable = 60 %, afuera = 0 %.
   * ------------------------------------------------------------------ */
  juegoA: [
    {
      id: 'A1', rol: '5',
      titulo: 'Salida desde el arco',
      consigna: 'El arquero te la dio a vos entre los dos delanteros rivales. ¿A dónde pasás?',
      base: { fase: 'f2', paso: 1 },
      pelota: '5',
      ideal: { x: 72, y: 36, rx: 7, ry: 6, nombre: 'VD que baja a ofrecerse por dentro' },
      aceptable: { x: 76, y: 12, rx: 6, ry: 5, nombre: 'ZD abierto' },
      explicacion: 'El volante libre entre líneas te deja girar al equipo; atrás al zaguero es seguro pero no avanza.'
    },
    {
      id: 'A2', rol: 'VD',
      titulo: 'Ataque por la derecha',
      consigna: 'Tenés la pelota por dentro y el rival está metido atrás. ¿A dónde pasás?',
      base: { fase: 'f3', paso: 1 },
      ideal: { x: 92, y: 72, rx: 6, ry: 8, nombre: 'LD que pasa por afuera' },
      aceptable: { x: 51, y: 64, rx: 6, ry: 5, nombre: '10 por dentro' },
      explicacion: 'Sin extremos, la amplitud la da el lateral: abrirle es estirar al rival.'
    },
    {
      id: 'A3', rol: '10',
      titulo: 'Transición ofensiva',
      consigna: 'Recuperaste en el medio y el rival quedó mal parado. ¿A dónde pasás?',
      // Situación armada para este escenario (no sale de una fase).
      pelota: '10',
      propios: {
        ARQ: [50, 10], ZD: [62, 26], ZI: [38, 26], LD: [82, 38], LI: [18, 36], '5': [50, 42],
        VD: [70, 52], VI: [30, 50], '10': [50, 56], DD: [62, 68], DI: [40, 70]
      },
      rivales: [
        [57, 51], [44, 61], [86, 52], [14, 58], [67, 44], [33, 46],
        [58, 34], [40, 30], [58, 75], [42, 77],
        [50, 95]
      ],
      ideal: { x: 64, y: 84, rx: 8, ry: 6, nombre: 'Espalda de la defensa, en diagonal para el DD' },
      aceptable: { x: 40, y: 70, rx: 6, ry: 6, nombre: 'DI al pie' },
      explicacion: 'Recién recuperada, la defensa rival está mal parada: el primer pase va al espacio.'
    }
  ],

  /* ------------------------------------------------------------------
   *  JUEGO B · ¿Dónde me paro?
   *  Se muestran todos menos el rol del escenario. Una sola zona correcta.
   * ------------------------------------------------------------------ */
  juegoB: [
    {
      id: 'B1', rol: 'LI',
      titulo: 'Bloque medio',
      consigna: 'El VI salió a presionar al lateral rival. ¿Dónde te parás?',
      base: { fase: 'f4', paso: 2 },
      zona: { x: 14, y: 40, rx: 7, ry: 6 },
      explicacion: 'Salió el VI a presionar: tu trabajo es cubrirle la espalda, no subir.'
    },
    {
      id: 'B2', rol: 'LI',
      titulo: 'Ataque por derecha',
      consigna: 'Atacamos por derecha y el LD pasó por afuera. ¿Dónde te parás?',
      base: { fase: 'f3', paso: 1 },
      zona: { x: 22, y: 40, rx: 7, ry: 6 },
      explicacion: 'Subió el LD: vos te cerrás con los zagueros. Si subís también, quedamos con 2 atrás.'
    },
    {
      id: 'B3', rol: '5',
      titulo: 'Presión tras pérdida',
      consigna: 'Perdimos la pelota y los de cerca ya presionan. ¿Dónde te parás?',
      base: { fase: 'f6', paso: 2 },
      zona: { x: 60, y: 56, rx: 7, ry: 6 },
      explicacion: 'Presionan los de cerca; vos tapás el pase por el medio.'
    },
    {
      id: 'B4', rol: '10',
      titulo: 'Presión alta',
      consigna: 'El arquero rival jugó al zaguero izquierdo. ¿Dónde te parás?',
      base: { fase: 'f5', paso: 2 },
      zona: { x: 45, y: 82, rx: 6, ry: 5 },
      explicacion: 'Al zaguero lo presiona el DI; vos subís al pivote rival y te parás en la línea del pase para que no pueda jugar al medio.'
    },
    {
      id: 'B5', rol: 'DI',
      titulo: 'Presión alta',
      consigna: 'El arquero rival tiene la pelota para sacar. ¿Dónde te parás?',
      base: { fase: 'f5', paso: 1 },
      zona: { x: 34, y: 82, rx: 7, ry: 6 },
      explicacion: 'Abierto, en la línea del pase al lateral: dejás que el arquero juegue al zaguero y desde ahí lo presionás en curva.'
    }
  ],

  /* ------------------------------------------------------------------
   *  CÓMO JUGAMOS · 8 ideas, una por línea.
   *  alerta: true = se muestra en rojo (algo a cuidar).
   * ------------------------------------------------------------------ */
  comoJugamos: [
    { titulo: 'Somos cuatro por dentro', lineas: [
      'Atrás de los delanteros jugamos con el 5 y una línea de tres volantes: VI, 10 y VD.',
      'El 10 es un volante interno más.',
      'Por dentro somos más que el rival.',
      'No tenemos extremos: el ancho lo dan los laterales.',
      'Por eso los volantes de afuera cubren el espacio que deja el lateral.'
    ] },
    { titulo: 'Los laterales no suben juntos', lineas: [
      'Si sube uno, el otro se cierra.',
      'Queda una línea de tres con los zagueros.',
      'El 5 se para adelante de esa línea.',
      'Esa es nuestra seguridad si perdemos la pelota.'
    ] },
    { titulo: 'La línea de tres se mueve junta', lineas: [
      'Un volante puede bajar al lado de los zagueros para que suba el lateral.',
      'Si el lateral no puede subir, el volante se abre.',
      'Cuando un volante deja su lugar, el 10 se corre para ese lado.',
      'El volante del otro lado se cierra al medio: siempre hay alguien por dentro.'
    ] },
    { titulo: 'Presión alta', lineas: [
      'Es en el saque del arquero rival.',
      'Los delanteros esperan abiertos, en la línea del pase a los laterales.',
      'Si el arquero juega a un zaguero, el delantero de ese lado lo presiona en curva, de afuera hacia adentro.',
      'El 10 sube al pivote rival. El 5 le cubre la espalda.',
      'Si la pelota llega al lateral, salta el volante de ese lado.'
    ] },
    { titulo: 'Bloque medio', lineas: [
      'Todo el equipo se corre hacia la pelota.',
      'El volante de ese lado sale al lateral rival.',
      'El 10 ocupa su lugar por dentro y el otro volante se cierra.',
      'Si cambian de frente, la línea se corre por el medio y sale el otro volante.'
    ] },
    { titulo: 'Bloque bajo', lineas: [
      'Los tres volantes bajan a la altura del 5: dos líneas de cuatro.',
      'Bien juntos, sin espacios entre las líneas.',
      'Los delanteros tapan el pase al medio.'
    ] },
    { titulo: 'Lo que tenemos que cuidar', alerta: true, lineas: [
      'Al rival le es fácil atacarnos por las bandas.',
      'Lo que más nos lastima es un pase a la espalda del lateral.',
      'También los costados del 5: si salta la línea de tres, el 5 solo no tapa todo.',
      'Por eso las coberturas de volantes y zagueros son clave.'
    ] },
    { titulo: 'Nuestra fuerza', lineas: [
      'Con el 5 y la línea de tres somos cuatro por dentro.',
      'Cuando la perdemos hay varios cerca: podemos presionar enseguida.',
      'Los de cerca presionan ya.'
    ] }
  ]
};
