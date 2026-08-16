# Study Time

Aplicación web local-first para registrar y sostener el hábito de estudio. Sin cuentas, sin internet, sin fricción: abrir y empezar en segundos. Estética oscura, calma y densa en información, inspirada en Linear, GitHub y Arc.

## Decisiones ya cerradas

- Datos 100% locales en el navegador (IndexedDB). Sin login, sin nube.
- Alcance v1 completo: dashboard, modo concentración, calendario, sesiones, categorías/actividades, recursos, deadlines y estadísticas.
- Solo tema oscuro.

## Pantallas

Navegación de un solo nivel: Dashboard · Sesiones · Actividades · Estadísticas. El modo concentración es una capa aparte, a pantalla completa.

**Dashboard** (todo sin scroll en escritorio)

- Botón gigante "Comenzar sesión" que abre un selector de actividad de un paso.
- Próximo examen y próximo TP con contador regresivo.
- Tiempo hoy · tiempo esta semana · racha · objetivo semanal con barra de progreso.
- Calendario tipo GitHub.
- Materias favoritas como botones de arranque directo.
- Últimas sesiones, editables inline.

**Modo concentración**
Pantalla completa, negro, sin navegación: actividad, cronómetro grande, hora actual, pausar, finalizar. Al finalizar, un panel breve pide energía inicial, resultado, distracciones, notas y próximo paso, todo saltable.

**Calendario**
Cuadrícula de días al estilo contribution graph, con cinco niveles de intensidad (0, 15, 45, 90, 180+ min). Tooltip con día, tiempo total, actividades y número de sesiones. Rangos: 3 meses, 6 meses, 1 año, toda la vida.

**Sesiones**
Lista/tabla con filtros por categoría, actividad y fecha. Edición inline de cualquier campo, incluida la duración manual. Alta manual de sesiones pasadas.

**Actividades**
Categorías fijas (Estudio, Desarrollo, Entrenamiento, Personal), cada una con color propio. Actividades creadas por el usuario dentro de cada categoría, marcables como favoritas. Cada actividad tiene sus recursos rápidos (botones grandes con icono y enlace) y sus deadlines (TP, Parcial, Final) con días restantes, prioridad y color según urgencia.

**Estadísticas**
Solo lo útil: tiempo por semana, tiempo por categoría, racha, promedio diario, promedio semanal, sesión más larga, horas acumuladas y el calendario.

## Interacción

- Atajos: Ctrl+N nueva sesión, Espacio pausar, Enter guardar, Esc cancelar. Panel de ayuda con "?".
- Edición inline en todas partes; nada de formularios largos.
- Animaciones de 150–250 ms, fades y desplazamientos mínimos.
- Tono siempre positivo: la ausencia de actividad nunca se marca en rojo ni con mensajes de culpa.

## Detalles técnicos

- React + TypeScript sobre el stack del proyecto (TanStack Router y Query, Tailwind, shadcn/ui, Framer Motion, React Hook Form + Zod, date-fns, Recharts, Zustand).
- Persistencia en IndexedDB mediante una capa `repository` (categorías, actividades, sesiones, recursos, deadlines, ajustes). TanStack Query envuelve ese repositorio, de modo que cambiar a un backend remoto en el futuro solo toca la capa de datos.
- Zustand solo para el estado efímero del temporizador (sesión activa, pausas, tiempo acumulado), con persistencia para sobrevivir a recargas y cierres del navegador.
- Estructura por features: `src/features/{sessions,activities,dashboard,stats,focus}` con `components`, `hooks`, `lib` y `types` propios; `src/components/ui` para shadcn y `src/components/common` para piezas reutilizables (StatCard, ContributionGrid, InlineEdit, CountdownBadge).
- Cálculos derivados (racha, agregados diarios/semanales, niveles del calendario) en funciones puras testeables, separadas de la UI.
- Tokens semánticos en `src/styles.css`: superficies oscuras, un acento único, colores de categoría y escala de 5 pasos del calendario. Sin colores fijos en componentes.
- PWA: manifest, iconos y service worker con precache del shell; la app arranca y funciona sin conexión.
- SSR desactivado o diferido en las vistas que dependen de IndexedDB, para evitar desajustes de hidratación.
- Puntos de extensión previstos para el futuro (IA, importación de calendario, sincronización, bloqueador): interfaz del repositorio, tipos de sesión con campos opcionales y capa de "proveedores" sin implementación aún.

## Orden de construcción

1. Diseño base: tokens, tipografía, layout de la app y navegación.
2. Capa de datos IndexedDB + repositorio + seeds de categorías.
3. Actividades, recursos y deadlines.
4. Temporizador y modo concentración, con guardado de sesión.
5. Sesiones: lista, filtros, edición inline, alta manual.
6. Calendario tipo GitHub con rangos y tooltip.
7. Dashboard completo en una sola pantalla.
8. Estadísticas con Recharts.
9. Atajos de teclado, animaciones y PWA offline.
