# Study Time

Una web app instalable para registrar y organizar tus sesiones de estudio, mantener una rutina y ver tu progreso.

Está pensada para reducir la fricción de empezar a estudiar y hacer visible cuánto tiempo realmente le estás dedicando (o no).

## ✨ Funciones

* ⏱️ Cronómetro de concentración.
* 🎯 Objetivo semanal (en horas) configurable.
* ✏️ Registro de sesiones sin necesidad de usar el cronómetro.
* 📊 Estadísticas para entender tus hábitos y evolución.
* 🔥 Racha y progreso respecto al objetivo semanal.
* 🗓️ Calendario de actividad inspirado en GitHub, según el esfuerzo realizado cada día.
* 📚 Actividades y recursos personalizados.
* 📱 PWA instalable y usable offline.
* 💾 Exportación e importación de datos para crear respaldos.

## 🔒 Datos y privacidad

Los datos se guardan localmente en el navegador. No hay cuentas y no se envían datos a ningún servidor.

Si querés migrar Study Time a otro navegador o dispositivo, podés exportar tus datos desde el menú de ajustes e importar el archivo `.json` en la nueva instalación.

Tengo planeado integrar sincronización opcional en la nube más adelante.

## 🛠️ Stack

* React
* TypeScript
* TanStack Start
* Tailwind CSS
* shadcn/ui
* Zustand
* TanStack Query
* date-fns

## 🚀 Desarrollo

Este proyecto usa Bun.

```bash
bun install
bun run dev
```

Para generar una build:

```bash
bun run build
```

Otros comandos útiles:

```bash
bun run lint
bun run format
bunx tsc --noEmit
```

## ☁️ Deploy

Actualmente está preparada para desplegarse en Cloudflare Pages.

```bash
bun run build
```

La configuración de deploy se encuentra en `wrangler.toml`.

## 🗺️ Estado

**Beta.**

La aplicación ya es funcional y se puede utilizar como herramienta personal, pero todavía está en desarrollo.

Algunas cosas pueden cambiar mientras voy probando el sistema en el uso diario.
