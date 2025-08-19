# Stage 1: Build Frontend (React + Vite)
FROM node:18-bullseye-slim AS frontend-builder
WORKDIR /app/frontend

COPY ./frontend/package*.json ./
RUN npm install

COPY ./frontend ./
RUN npm run build

# Stage 2: Build Backend (FastAPI)
FROM python:3.10-slim AS backend-builder
WORKDIR /app

# Install build tools + libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    libssl-dev \
    libffi-dev \
    cargo \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY ./backend/requirements.txt .

# Upgrade pip and install deps
RUN pip install --upgrade pip setuptools wheel \
 && pip install --no-cache-dir -r requirements.txt

COPY ./backend ./backend


# Stage 3: Final Runtime Image
FROM python:3.10-slim
WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-builder /usr/local/lib/python3.10 /usr/local/lib/python3.10
COPY --from=backend-builder /usr/local/bin /usr/local/bin

COPY ./backend ./backend
COPY --from=frontend-builder /app/frontend/dist ./frontend_dist

EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
