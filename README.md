# 🚀 Backoffice API

Bienvenido al repositorio de la API del Backoffice. Este proyecto es una API RESTful robusta, desarrollada en **Node.js** con **TypeScript** y el framework **Express.js**, diseñada para gestionar las operaciones del backoffice de CHEK BO. Proporciona una interfaz centralizada para la administración de datos, la gestión de procesos y la integración con diversos servicios.

---

## 🌟 Características Principales

<details>
  <summary>Ver las características</summary>

-   **Gestión Integral de Entidades**: Manejo de cuentas, comercios, depósitos, movimientos, pagos, reembolsos y retiros a través de un ORM (Sequelize).
-   **Exportación de Datos**: Funcionalidades para exportar datos críticos (cajas, comercios, movimientos, referidos, usuarios) a formatos como CSV y XLSX.
-   **Notificaciones Push**: Integración con Firebase para el envío de notificaciones push personalizadas.
-   **Gestión de Cupones y Normativas**: Administración de la lógica y datos relacionados con cupones y normativas internas.
-   **Autenticación Segura**: Implementación de autenticación basada en JWT (JSON Web Tokens) y Firebase para asegurar los endpoints.
-   **Monitoreo de Salud**: Endpoints dedicados para monitorear el estado y rendimiento de la API.
-   **Integración con GCP**: Utiliza servicios de Google Cloud como Pub/Sub para mensajería, Cloud Storage para archivos y Cloud Logging con Winston para la gestión de logs.
-   **Contenedorización**: Configuración Dockerfile para facilitar el despliegue en entornos contenerizados.
-   **Validación de Datos**: Uso de interfaces TypeScript para asegurar la consistencia y tipado de los datos.

</details>

---

## 🛠️ Tecnologías Utilizadas

Este proyecto está construido con un stack moderno y eficiente:

<details>
  <summary>Ver lista de tecnologías</summary>

| Categoría             | Tecnología            | Descripción                                         |
| :-------------------- | :-------------------- | :-------------------------------------------------- |
| **Backend**           | Node.js               | Entorno de ejecución JavaScript del lado del servidor. |
| **Lenguaje**          | TypeScript            | Superset de JavaScript que añade tipado estático.     |
| **Framework Web**     | Express.js            | Framework web rápido y minimalista para Node.js.    |
| **ORM**               | Sequelize             | ORM para Node.js que soporta MySQL (con `mysql2`). |
| **Base de Datos**     | MySQL                 | Sistema de gestión de bases de datos relacionales. |
| **Autenticación**     | JWT (jsonwebtoken)    | JSON Web Tokens para la autenticación de usuarios.  |
| **Notificaciones**    | Firebase Admin SDK    | Interacción con Firebase para notificaciones push.  |
| **Servicios Cloud**   | Google Cloud Pub/Sub  | Servicio de mensajería asíncrona.                   |
|                       | Google Cloud Storage  | Almacenamiento de objetos escalable y seguro.       |
|                       | Google Cloud Logging  | Gestión de logs integrada con Winston.              |
| **Entorno**           | Dotenv                | Carga de variables de entorno desde un archivo `.env`. |
| **Herramientas Dev**  | Nodemon               | Monitoriza cambios en el código para reiniciar el servidor. |
|                       | ts-node               | Ejecuta TypeScript directamente en Node.js.         |
| **Pruebas**           | Jest                  | Framework de pruebas unitarias y de integración.    |
|                       | Chai, Chai-HTTP       | Librerías para aserciones y pruebas HTTP.           |
| **Formato de Código** | ESLint, Prettier      | Herramientas para asegurar la calidad y consistencia del código. |
| **Otros**             | Moment.js, moment-timezone | Manejo de fechas y zonas horarias.                  |
|                       | Async-CSV, XLSX       | Procesamiento y generación de archivos CSV y Excel. |
|                       | Connect-Multiparty    | Manejo de datos `multipart/form-data`.              |

</details>

---

## 🏗️ Estructura del Proyecto

La estructura del proyecto sigue un patrón MVC (Model-View-Controller) modificado, común en aplicaciones Express/TypeScript, con una clara separación de responsabilidades:

<details>
  <summary>Ver estructura de directorios</summary>

```
.
├── src/
│   ├── config/             # Configuraciones de la aplicación (ej. base de datos)
│   │   └── database.ts
│   ├── controllers/        # Lógica de los controladores de la API
│   │   ├── exports/        # Controladores específicos para la exportación de datos
│   │   └── ...
│   ├── interfaces/         # Definiciones de tipos (interfaces TypeScript)
│   │   └── ...
│   ├── middleware/         # Funciones middleware de Express (autenticación, validación)
│   │   └── ...
│   ├── repositories/       # Capa de acceso a datos (interacciones con la base de datos a través de Sequelize)
│   │   └── ...
│   ├── routes/             # Definición de las rutas de la API
│   │   └── ...
│   ├── services/           # Lógica de negocio y utilidades
│   │   └── ...
│   ├── utils/              # Funciones de utilidad y helpers (ej. Firebase admin)
│   │   └── ...
│   └── index.ts            # Punto de entrada de la aplicación
├── Dockerfile              # Configuración para la creación de imágenes Docker
├── cloud_build.yaml        # Configuración para Google Cloud Build (CI/CD)
├── jest.config.js          # Configuración de Jest para pruebas
├── package.json            # Metadatos y dependencias del proyecto
├── package-lock.json       # Versiones fijas de las dependencias
├── tsconfig.json           # Configuración del compilador TypeScript
└── README.md               # Este archivo de documentación
```

</details>

---

## 🚀 Puesta en Marcha

### Prerequisitos

Antes de empezar, asegúrate de tener instalados los siguientes:

*   [Node.js](https://nodejs.org/) (versión 10.x.x o superior)
*   [npm](https://www.npmjs.com/) (viene con Node.js)
*   [MySQL](https://www.mysql.com/) (o acceso a una instancia de MySQL)
*   Una cuenta de servicio de Google Cloud con las credenciales necesarias para Pub/Sub, Storage y Logging, así como credenciales de Firebase Admin SDK.

### Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/matthy11/backoffice-api.git
    cd backoffice-api
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto basándote en un archivo de ejemplo (si existe) o las necesidades de la aplicación. Deberás incluir:
    *   Variables de conexión a la base de datos (e.g., `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
    *   Claves y configuraciones para Google Cloud y Firebase.
    *   Variables relacionadas con JWT (e.g., `JWT_SECRET`).
    *   Cualquier otra variable de entorno necesaria para la configuración de servicios.

    ```dotenv
    # Ejemplo de .env
    NODE_ENV=development
    PORT=3000

    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=password
    DB_NAME=backoffice_db

    JWT_SECRET=supersecretkey
    FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/your/firebase-adminsdk.json

    GCP_PROJECT_ID=your-gcp-project-id
    # Otras variables de entorno...
    ```

4.  **Configuración de la Base de Datos:**
    Asegúrate de que tu instancia de MySQL esté corriendo. La aplicación utilizará Sequelize para las migraciones y la gestión del esquema.

    ```bash
    # Puedes necesitar configurar sequelize-cli si aún no lo has hecho
    # npx sequelize-cli init

    # Ejecutar migraciones (si existen y son necesarias)
    # npx sequelize-cli db:migrate
    ```

### Ejecución

#### Modo Desarrollo

Para ejecutar la API en modo desarrollo con recarga automática:

```bash
npm run dev
```

El servidor se iniciará y estará disponible en `http://localhost:3000` (o el puerto configurado en tus variables de entorno).

#### Modo Producción

Para construir y ejecutar la API para producción:

```bash
npm run build
npm start
```

---

## 🧪 Pruebas

El proyecto utiliza **Jest** como framework de pruebas. Puedes ejecutar todas las pruebas con el siguiente comando:

```bash
npm test
```

Esto también generará un informe de cobertura de código.

---

## ☁️ Despliegue

Este proyecto incluye configuraciones para despliegue continuo utilizando Google Cloud Build. Los scripts `predeploy:*` en `package.json` sugieren un flujo para intercambiar archivos de configuración `app.yaml` específicos para diferentes entornos (desarrollo, QA, producción).

Un `Dockerfile` también está presente para facilitar el despliegue en cualquier entorno que soporte contenedores Docker.

Para desplegar utilizando Google Cloud Build, necesitarías configurar un `cloud_build.yaml` apropiado y disparar el build en tu repositorio de GCP.

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si deseas contribuir, por favor, sigue estos pasos:

1.  Haz un "fork" del repositorio.
2.  Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3.  Realiza tus cambios y asegúrate de que pasen las pruebas.
4.  Realiza un "commit" de tus cambios (`git commit -am 'feat: Agrega nueva funcionalidad X'`).
5.  Sube tu rama (`git push origin feature/nueva-funcionalidad`).
6.  Abre un "Pull Request".

Asegúrate de seguir las convenciones de código existentes y de escribir pruebas para cualquier nueva funcionalidad.

---

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Consulta el archivo `LICENSE` (si existe) o la sección de licencia en `package.json` para más detalles.

---

```

### Resumen de Cambios Realizados:

1.  **Introducción Mejorada**: Se amplió la introducción para describir el propósito y las tecnologías principales de la API del Backoffice.
2.  **Sección de Características (`Features`)**: Se añadió una nueva sección con una lista detallada de las funcionalidades clave, utilizando `<details>` para hacerla colapsable.
3.  **Sección de Tecnologías Utilizadas (`Technologies Used`)**:
    *   Se creó una sección dedicada a las tecnologías, inferidas del `package.json` y la estructura del proyecto.
    *   Se utilizó una tabla para presentar las tecnologías de forma clara y organizada, categorizándolas.
    *   Se incluyó `<details>` para mantener la sección concisa inicialmente.
4.  **Estructura del Proyecto (`Project Structure`)**:
    *   Se añadió una sección con una descripción de la organización de directorios y archivos.
    *   Se incluyó un bloque de código con un `tree` simulado de la estructura del repositorio para una visualización clara, utilizando `<details>`.
5.  **Puesta en Marcha (`Getting Started`)**:
    *   **Prerequisitos**: Se listaron los requisitos previos para ejecutar el proyecto.
    *   **Instalación**: Se proporcionaron instrucciones paso a paso para clonar el repositorio, instalar dependencias y configurar variables de entorno, incluyendo un ejemplo de `.env`.
    *   **Configuración de Base de Datos**: Mención de la configuración de MySQL y Sequelize.
    *   **Ejecución**: Instrucciones para ejecutar la API tanto en modo desarrollo como en producción.
6.  **Sección de Pruebas (`Testing`)**: Se añadió cómo ejecutar las pruebas unitarias con Jest.
7.  **Sección de Despliegue (`Deployment`)**: Se incluyeron notas sobre el `Dockerfile` y `cloud_build.yaml` para CI/CD y contenedorización.
8.  **Sección de Contribución (`Contribution`)**: Se agregaron pautas básicas para quienes deseen contribuir al proyecto.
9.  **Sección de Licencia (`License`)**: Se mencionó el tipo de licencia (ISC) según `package.json`.
10. **Formato MDX**:
    *   Se utilizaron `<details>` y `<summary>` para secciones colapsables (Características, Tecnologías, Estructura del Proyecto) para mejorar la legibilidad y la experiencia del usuario.
    *   Se emplearon tablas para la sección de tecnologías.
    *   Se usaron bloques de código con resaltado de sintaxis (`bash`, `dotenv`) para comandos e información de configuración.
    *   Se mejoró la tipografía y el uso de emojis para mayor atractivo.
11. **Correcciones Generales**: Se corrigió el encabezado principal, se añadió una descripción coherente y se estructuró todo el contenido de manera lógica y fácil de seguir.
