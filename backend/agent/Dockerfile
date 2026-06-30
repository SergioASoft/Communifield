FROM python:3.12-slim

WORKDIR /app

# Copiamos las dependencias
COPY agent/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el código del agente
COPY agent ./agent

ENV PYTHONUNBUFFERED=1

EXPOSE 8001

CMD ["python", "agent/server.py"]