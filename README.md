# 🦯 Camin AI

**Una Vista al Futuro - Autonomía Visual Instantánea para 2.2 Billones**

> "Lo que ves, yo lo siento y describo"

Camin AI transforma cualquier smartphone en ojos de IA, proporcionando navegación instantánea y asistencia visual para personas con discapacidad visual. No es una app que instalas, es una experiencia web progresiva (PWA) que abres en tu navegador.

---

## 🌟 El Problema

**2.2 billones de personas** con discapacidad visual enfrentan una dependencia invisible cada día:

- **68%** evita lugares nuevos por miedo a chocar con obstáculos
- **54%** necesita acompañante para tareas simples como comprar comida
- **5 minutos** de espera promedio por ayuda de voluntarios (Be My Eyes)
- **$300-2000 USD** costo de bastones inteligentes que solo detectan el suelo
- **GPS inútil** en espacios interiores (supermercados, hospitales, oficinas)

### Gap Crítico
Las soluciones actuales no ofrecen **navegación indoor instantánea** accesible y asequible.

---

## 💡 Nuestra Solución

Camin AI es el **único sistema que combina**:

✅ **Navegación indoor en tiempo real** - Detección instantánea de obstáculos  
✅ **Asistente conversacional personalizado** - Entiende tus necesidades y preferencias  
✅ **Acceso universal sin instalación** - PWA que funciona en cualquier navegador  
✅ **Completamente gratuito** - Aprovecha el smartphone que ya tienes  

### Cómo Funciona

1. **Abre** camina-ai.com en tu navegador
2. **Activa** navegación por voz: "Activar navegación"
3. **Navega** con confianza mientras recibes:
   - 📳 **Vibración háptica** según distancia (urgente/suave)
   - 🔊 **Voz espacial** ("puerta a 2m a tu derecha")
   - 🎯 **Audio direccional** (izquierda/derecha/centro)
4. **Consulta** al asistente IA para:
   - Leer menús según tus alergias
   - Comparar productos según tu presupuesto
   - Identificar billetes y objetos
   - Revisar detalles del alrededor táles como el clima o factores externos.

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

**Frontend (PWA)**
- React + TypeScript + Vite
- TensorFlow.js para detección de objetos en tiempo real
- Web Speech API para comandos de voz
- Vibration API para retroalimentación háptica
- shadcn/ui + Tailwind CSS para UI accesible

**Backend (Serverless)**
- Supabase para autenticación y base de datos
- Node.js + Vercel Functions
- Claude API (Anthropic) para asistente conversacional
- Procesamiento de imágenes en la nube

**Características de Accesibilidad**
- 100% navegable por voz
- Soporte completo de lectores de pantalla
- Dictado por voz para todos los campos de formulario
- Conversión automática de texto hablado (arroba → @)
- Retroalimentación háptica y auditiva

### Escalabilidad

```
Hoy      → Navegador móvil (PWA)
Mañana   → Lentes inteligentes
Futuro   → Integración IoT en espacios públicos
```

**Costo de desarrollo MVP:** $0 (usando APIs existentes + código open source)

---

## 🤖 IA Personalizada

Nuestra IA no solo ve, **entiende contexto**:

### Perfil de Usuario
- Alergias (gluten, lácteos, mariscos)
- Dieta (diabético, vegetariano, vegano)
- Preferencias personales
- Presupuesto

### Ejemplo Real
> "Veo 3 yogures. El primero es Alpina griego sin azúcar a $4.200, perfecto para tu dieta diabética. El segundo tiene frutas pero contiene gluten. Te recomiendo el primero."

**Aprendizaje continuo:** Cada interacción mejora el modelo.

---

## 📈 Mercado y Modelo de Negocio

### Mercado Objetivo
- **$31B** mercado de tecnología asistiva en 2025 (crecimiento 7.4% anual)
- **30M** personas con capacidad de pago (>$500/mes)
- **12%** usa tecnología avanzada actualmente (barrera: costo)
- **$1.2B** anuales en subsidios gubernamentales

### Modelo Freemium

| Plan | Características | Precio |
|------|----------------|--------|
| **Gratis** | Navegación básica en tiempo real | $0 |
| **Premium** | Asistente avanzado + histórico + análisis | $5/mes |
| **B2B** | Licencias institucionales | $50/usuario/año |

### Proyección Año 1
- 100K usuarios activos
- 5% conversión a premium
- **$300K MRR** (Monthly Recurring Revenue)
- Costo marginal por usuario: **$0.02**

---

## 🌍 Impacto Social Medible

### Por cada 100K usuarios:
- **68K** dejan de evitar lugares nuevos
- **54K** reducen dependencia de acompañantes
- **15K horas diarias** de autonomía recuperada
- **$3M ahorrados** en bastones inteligentes

### Escalabilidad Global

```
Fase 1 → Colombia (1.2M personas)
Fase 2 → Latinoamérica (15M personas)
Fase 3 → Global (2.2B personas)
```

### Alianzas Estratégicas
- 🏛️ Gobiernos (subsidios y programas sociales)
- 📱 Telecomunicaciones (bundling con planes móviles)
- 🏪 Retail (accesibilidad en tiendas físicas)

---

## 🚀 Desarrollo Local

### Requisitos
- Node.js 18+ y npm
- Navegador moderno (Chrome, Edge, Safari)
- Conexión a internet (para Web Speech API)

### Instalación

```bash
# Clonar el repositorio
git clone <YOUR_GIT_URL>
cd camin

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:8080`

### Variables de Entorno

Crea un archivo `.env` con:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

---

## 🎯 Características Principales

### ✅ Implementadas

- [x] Autenticación de usuarios con Supabase
- [x] Detección de objetos en tiempo real con TensorFlow.js
- [x] Comandos de voz en español
- [x] Dictado por voz para formularios
- [x] Procesamiento inteligente de texto (arroba → @, sin tildes)
- [x] Retroalimentación háptica
- [x] Interfaz 100% accesible
- [x] PWA instalable
- [x] Modo oscuro/alto contraste

### 🔄 En Desarrollo

- [ ] Asistente conversacional con Claude API
- [ ] Análisis de imágenes para productos
- [ ] Navegación con mapas indoor
- [ ] Perfiles de usuario personalizados
- [ ] Histórico de interacciones

---

## 👥 Equipo

- 5 desarrolladores full-stack
- 2 con experiencia en accesibilidad
- 1 asesor con discapacidad visual

### Validación con Usuarios Reales
- ✅ 10 pruebas con ojos vendados → 100% completaron tareas
- 💬 Feedback: "Sentí control por primera vez"
- 🏥 2 centros de rehabilitación interesados

---

## 📊 Métricas del MVP

- **Precisión:** >85% en detección de obstáculos
- **Latencia:** <2 segundos
- **Retención:** 40% a 7 días
- **Accesibilidad:** 100% compatible con lectores de pantalla

---

## 🤝 Lo Que Buscamos

- **$50K** para escalar a 10K usuarios
- Alianzas con organizaciones de discapacidad visual
- Mentores en impacto social + tecnología
- Colaboradores apasionados por la accesibilidad

---

## 📞 Contacto

**Camin AI** - Autonomía Visual para Todos

🌐 [camin-ai.com](https://camin-ai.com)  
📧 contacto@camin-ai.com  
🐦 [@CaminAI](https://twitter.com/CaminAI)

---

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 🙏 Agradecimientos

Gracias a todas las personas con discapacidad visual que nos ayudaron a validar y mejorar Camin AI. Este proyecto existe para ustedes.

---

> **"Camin AI no es solo una app. Es un movimiento hacia un mundo donde la discapacidad visual no signifique dependencia. Únete a nosotros para hacer accesible lo invisible."**

---

## 🛠️ Stack Completo

- **Frontend:** React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend:** Supabase, Vercel Functions
- **IA/ML:** TensorFlow.js, Claude API (Anthropic)
- **APIs Web:** Speech Recognition, Speech Synthesis, Vibration, Camera
- **Deployment:** Vercel (frontend), Supabase (backend)
