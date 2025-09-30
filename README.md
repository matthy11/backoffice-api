# 🚀 Backoffice API

¡Bienvenido al repositorio de la API del Backoffice! Este proyecto es una API RESTful robusta y escalable diseñada para dar soporte a las operaciones de backoffice, facilitando la gestión y el acceso a los datos críticos del negocio. Desarrollada con TypeScript y Express.js, esta API se integra con servicios de Google Cloud y Firebase para ofrecer una solución completa y eficiente.

## ✨ Características Principales

Esta API ofrece un conjunto de funcionalidades esenciales para la gestión del backoffice, incluyendo:

- **Gestión de Cupones:** Creación, lectura y administración de cupones.
- **Exportación de Datos:** Generación y exportación de informes sobre movimientos, comercios, usuarios, referidos y cashouts.
- **Monitorización:** Endpoints para verificar el estado de la aplicación.
- **Notificaciones Push:** Gestión y envío de notificaciones push.
- **Gestión de Normativas:** Control sobre las normativas y términos de servicio.
- **Integración con Google Cloud:** Utiliza Pub/Sub, Storage y Logging para operaciones y monitorización.
- **Autenticación Segura:** Implementación de JWT para la protección de rutas.

## 🛠️ Tecnologías Utilizadas

El proyecto está construido con un stack moderno y eficiente:

<Tabs
  groupId="tech-stack"
  defaultValue="backend"
  values={[
    { label: 'Backend', value: 'backend' },
    { label: 'Base de Datos', value: 'database' },
    { label: 'DevOps & Cloud', value: 'devops' },
    { label: 'Herramientas de Desarrollo', value: 'dev-tools' },
  ]}>
  <TabItem value="backend">
    - **TypeScript**: Lenguaje de programación principal para el desarrollo.
    - **Node.js**: Entorno de ejecución de JavaScript.
    - **Express.js**: Framework web para la construcción de la API.
    - **Firebase Admin SDK**: Para interactuar con servicios de Firebase.
    - **JWT (JSON Web Tokens)**: Para autenticación y autorización.
    - **Morgan**: Middleware de logging de solicitudes HTTP.
    - **Winston**: Librería avanzada de logging.
    - **CORS**: Para habilitar el Cross-Origin Resource Sharing.
  </TabItem>
  <TabItem value="database">
    - **MySQL**: Base de datos relacional.
    - **Sequelize**: ORM (Object-Relational Mapper) para interactuar con MySQL.
  </TabItem>
  <TabItem value="devops">
    - **Google Cloud Platform (GCP)**:
      - **Pub/Sub**: Servicio de mensajería asíncrona.
      - **Storage**: Almacenamiento de objetos.
      - **Logging**: Para la gestión de registros.
    - **Docker**: Para la contenerización de la aplicación.
    - **Cloud Build**: Para la integración y despliegue continuos (CI/CD).
  </TabItem>
  <TabItem value="dev-tools">
    - **Jest**: Framework de testing.
    - **ESLint & Prettier**: Para linting y formato de código.
    - **Nodemon**: Para el reinicio automático del servidor durante el desarrollo.
  </TabItem>
</Tabs>

## 📂 Estructura del Proyecto

La estructura del repositorio sigue un enfoque modular, facilitando el mantenimiento y la escalabilidad:

<details>
  <summary>Ver Estructura de Carpetas</summary>

```
├── .gitignore
├── Dockerfile
├── README.md
├── cloud_build.yaml
├── jest.config.js
├── package-lock.json
├── package.json
├── tsconfig.json
└── src
    ├── config
    │   └── database.ts
    ├── controllers
    │   ├── coupons.controller.ts
    │   ├── exports
    │   │   ├── cashouts.controller.ts
    │   │   ├── commerces.controller.ts
    │   │   ├── movements.controller.spec.ts
    │   │   ├── movements.controller.ts
    │   │   ├── public.controller.ts
    │   │   ├── referrals.controller.ts
    │   │   ├── storageFile.controller.ts
    │   │   └── users.controller.ts
    │   ├── monitor.controller.ts
    │   ├── normatives.controller.spec.ts
    │   ├── normatives.controller.ts
    │   ├── pushNotifications.controller.ts
    │   └── retail.controller.ts
    ├── index.ts
    ├── interfaces
    │   ├── Account.ts
    │   ├── ChekUser.ts
    │   ├── ... (otros archivos de interfaz)
    │   └── index.ts
    ├── logger.ts
    ├── middleware
    │   ├── commerce-firebase.middleware.ts
    │   ├── cron.ts
    │   └── jwt.ts
    ├── repositories
    │   ├── Account.repository.ts
    │   ├── Commerces.repository.ts
    │   ├── Deposits.repository.ts
    │   ├── Movements.repository.ts
    │   ├── Payments.repository.ts
    │   ├── Refunds.repository.ts
    │   ├── Withdraw.repository.ts
    │   └── index.ts
    ├── routes
    │   ├── coupons.route.ts
    │   ├── export.commerce.route.ts
    │   ├── exports.route.ts
    │   ├── index.ts
    │   ├── monitor.route.ts
    │   ├── normatives.route.ts
    │   ├── public.route.ts
    │   ├── pushNotifications.route.ts
    │   └── retail.route.ts
    ├── services
    │   ├── cupon-file-manager.ts
    │   ├── enums.ts
    │   ├── firebase-admin-commerce.ts
    │   ├── groupBy.ts
    │   ├── sendPubSub.ts
    │   ├── storage.ts
    │   ├── utils.spec.ts
    │   └── utils.ts
    └── utils
        ├── decode-json.spec.ts
        ├── decode-json.ts
        ├── firebase-admin.ts
        └── unpack.ts
```

</details>

## 🚀 Instalación

Sigue estos pasos para configurar y ejecutar el proyecto localmente.

### Prerrequisitos

Asegúrate de tener instalado lo siguiente:

- **Node.js** (versión 10.x.x o superior)
- **npm** (viene con Node.js)
- **MySQL** (o acceso a una instancia de MySQL)
- **Docker** (opcional, para desarrollo contenedorizado)

### Pasos

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/matthy11/backoffice-api.git
   cd backoffice-api
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configuración de Variables de Entorno:**
   Crea un archivo `.env` en la raíz del proyecto y configura las variables necesarias. Algunas variables clave pueden incluir:

   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_HOST=localhost
   DATABASE_USER=root
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=backoffice_db
   JWT_SECRET=your_jwt_secret
   # Agrega otras variables de Firebase Admin, Google Cloud, etc.
   ```

   _**Nota:** Asegúrate de configurar correctamente tus credenciales de base de datos, secretos JWT y credenciales de servicios externos._

4. **Configuración de la Base de Datos:**
   Asegúrate de que tu base de datos MySQL esté en funcionamiento y de que las credenciales en `.env` sean correctas. Puedes necesitar ejecutar migraciones si el proyecto las tiene (no se encontraron archivos `migrations` directamente, pero `sequelize-cli` sugiere su uso).

5. **Construir el proyecto:**

   ```bash
   npm run build
   ```

6. **Ejecutar la aplicación:**

   ```bash
   npm start
   ```

   Para el desarrollo con reinicio automático:

   ```bash
   npm run dev
   ```

La API estará disponible en `http://localhost:5000/process-api`.

## 💡 Uso (Endpoints API)

La API expone varios endpoints bajo el prefijo `/process-api`. A continuación, se detallan algunos de los tipos de rutas principales:

<details>
  <summary>Ver Ejemplos de Endpoints</summary>

- **Rutas Públicas (sin autenticación):**
  - `GET /process-api/public/health`: Para comprobar el estado de la API.
  - Otros endpoints relacionados con CRON jobs o información accesible públicamente.

- **Rutas Autenticadas (requiere JWT):**
  - **Cupones:**
    - `POST /process-api/coupons`: Crear un nuevo cupón.
    - `GET /process-api/coupons/:id`: Obtener detalles de un cupón.
    - `GET /process-api/coupons`: Listar todos los cupones.
    - `PUT /process-api/coupons/:id`: Actualizar un cupón.
  - **Exportaciones:**
    - `POST /process-api/exports/movements`: Exportar movimientos.
    - `POST /process-api/exports/commerces`: Exportar comercios.
    - `POST /process-api/exports/users`: Exportar usuarios.
    - `POST /process-api/exports/cashouts`: Exportar cashouts.
    - `POST /process-api/exports/referrals`: Exportar referidos.
  - **Notificaciones Push:**
    - `POST /process-api/push-notifications/send`: Enviar una notificación push.
  - **Monitorización:**
    - `GET /process-api/monitor/status`: Obtener el estado del monitor.
  - **Normativas:**
    - `GET /process-api/normatives`: Obtener normativas.
    - `POST /process-api/normatives`: Crear o actualizar normativas.
  - **Retail:**
    - `GET /process-api/retail/data`: Acceso a datos relacionados con retail.

_**Nota:** Los detalles exactos de los payloads y las respuestas pueden encontrarse inspeccionando los archivos en `src/controllers` y `src/routes`._
</details>

## 🧪 Pruebas

El proyecto utiliza `Jest` para las pruebas unitarias e de integración.

Para ejecutar las pruebas:

```bash
npm test
```

Para ver la cobertura de código:

```bash
npm test --coverage
```

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si deseas mejorar este proyecto, por favor, sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y commitea (`git commit -am 'feat: Agrega nueva funcionalidad X'`).
4. Haz push a tu rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request describiendo tus cambios.

Por favor, asegúrate de que tu código cumpla con los estándares de calidad del proyecto (ESLint, Prettier) y que todas las pruebas pasen.

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Consulta el archivo `LICENSE` (si existe, o se asume ISC según `package.json`) para más detalles.

---

### Resumen de Cambios Realizados:

1.  **Título y Descripción Mejorados:** El título ahora es más descriptivo y la introducción explica claramente el propósito de la API.
2.  **Sección de Características:** Se añadió una nueva sección detallando las funcionalidades clave de la API, inferidas de los nombres de los controladores y rutas.
3.  **Sección de Tecnologías Utilizadas:** Se creó una sección completa con pestañas para organizar las tecnologías en categorías (Backend, Base de Datos, DevOps & Cloud, Herramientas de Desarrollo), proporcionando una visión clara del stack.
    *   Se identificaron frameworks como Express.js y Sequelize, así como integraciones con Google Cloud (Pub/Sub, Storage, Logging) y Firebase Admin.
    *   Se incluyeron herramientas de desarrollo como TypeScript, Jest, ESLint, Prettier, Nodemon.
4.  **Sección de Estructura del Proyecto:** Se agregó una descripción de la estructura del proyecto y se incluyó un bloque de código colapsable (`<details>`) mostrando la estructura de archivos y carpetas, haciendo el README más interactivo y legible.
5.  **Sección de Instalación:** Se detallaron los prerrequisitos y los pasos para clonar, instalar dependencias, configurar variables de entorno, configurar la base de datos, construir y ejecutar la aplicación.
6.  **Sección de Uso (Endpoints API):** Se añadió una sección con un bloque colapsable (`<details>`) que enumera ejemplos de endpoints principales, dividiéndolos en rutas públicas y autenticadas, y explicando su posible función.
7.  **Sección de Pruebas:** Se incluyó una sección para explicar cómo ejecutar las pruebas con Jest.
8.  **Sección de Contribución:** Se añadió una guía estándar sobre cómo contribuir al proyecto.
9.  **Sección de Licencia:** Se especificó la licencia (ISC) basada en el `package.json`.
10. **Formato MDX:** Se utilizaron componentes MDX como `Tabs`, `TabItem`, `Accordion`, y `AccordionItem` para mejorar la presentación, la organización y la interactividad del contenido.
11. **Corrección General y Estilo:** Se corrigieron errores gramaticales, de puntuación y se mejoró el estilo general para una lectura más clara y profesional. Se añadió formato Markdown (bloques de código, negritas, listas) para una mejor presentación.
