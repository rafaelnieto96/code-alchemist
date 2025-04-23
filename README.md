# Code Alchemist

Code Alchemist es una aplicación web que utiliza la IA de Cohere para ayudarte a mejorar tu código, detectar bugs, explicar su funcionalidad o traducirlo a otros lenguajes de programación.

## Características

- **Mejora de código**: Optimiza tu código para hacerlo más eficiente, legible y mantenible.
- **Detección de bugs**: Identifica posibles errores y problemas en tu código.
- **Explicación de código**: Recibe una explicación detallada de lo que hace tu código.
- **Traducción de código**: Traduce tu código a otros lenguajes de programación.

## Requisitos

- Python 3.8 o superior
- Una clave API gratuita de [Cohere](https://cohere.com/)

## Instalación

1. Clona este repositorio:
   ```
   git clone https://github.com/yourusername/code-alchemist.git
   cd code-alchemist
   ```

2. Crea un entorno virtual e instala las dependencias:
   ```
   python -m venv venv
   
   # En Windows
   venv\Scripts\activate
   
   # En macOS/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

3. Configura tu API key de Cohere:
   - Renombra el archivo `.env.example` a `.env`
   - Edita el archivo `.env` y añade tu clave API de Cohere:
     ```
     COHERE_API_KEY=tu_clave_api_aquí
     FLASK_ENV=development
     ```

## Uso

1. Inicia la aplicación:
   ```
   python app.py
   ```

2. Abre tu navegador y ve a `http://127.0.0.1:5000`

3. Pega tu código, selecciona la acción que deseas realizar (mejorar, detectar bugs, explicar o traducir) y haz clic en "Procesar".

## Futuras Mejoras

- Soporte para más lenguajes de programación
- Guardado de historial de código procesado
- Modo oscuro
- Exportación de resultados

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. 