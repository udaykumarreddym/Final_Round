FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY Frontend/package*.json ./
RUN npm install

COPY Frontend ./
RUN npm run build

FROM python:3.10-slim AS backend-builder
WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY Backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY Backend ./Backend

FROM python:3.10-slim
WORKDIR /app/Backend

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-builder /usr/local/lib/python3.10 /usr/local/lib/python3.10
COPY --from=backend-builder /usr/local/bin /usr/local/bin

COPY Backend ./ 

COPY --from=frontend-builder /app/frontend/dist ../frontend_dist

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
