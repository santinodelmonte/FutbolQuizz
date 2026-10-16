# Pizarra táctica Sub-17 · Independiente CAI (demo)

Demo solo front (HTML + CSS + JS puro, sin dependencias) del sistema **1-4-1-3-2**.

## Cómo abrirla
- **Local:** doble clic en `index.html`.
- **Hosting estático:** subir la carpeta tal cual (Netlify, GitHub Pages, cualquier servidor de archivos).

## Archivos
| Archivo | Qué tiene |
|---|---|
| `index.html` | Estructura, barra superior e inferior (`noindex`). |
| `styles.css` | Estilos (mobile first, azul/blanco, rojo de acento). |
| `js/data.js` | **Todo el contenido táctico**: roles, 7 fases, textos por rol, escenarios de los juegos y "Cómo jugamos". Se edita a mano; las instrucciones están al principio del archivo. |
| `js/core.js` | Guardado seguro en `localStorage` y validación de datos al arrancar. |
| `js/pitch.js` | Cancha SVG vertical: fichas, pelota, flechas, zonas, rastro y carriles. |
| `js/app.js` | Navegación y pantallas: Pizarra + Mi rol, Juegos A y B, Mi ficha, Cómo jugamos. |

## Notas para el cuerpo técnico
- Los textos de "Mi rol" están marcados con `propuesta: true` en `data.js`: son una propuesta para revisar.
- Si un dato queda mal cargado (rol que falta, coordenada fuera de 0–100, paso vacío, escenario que apunta a un paso inexistente), la app lo informa arriba de la pantalla y en la consola, y sigue funcionando.
- Para probar los juegos más de una vez: **Mi ficha → Opciones de demo → Reiniciar mis intentos**.
