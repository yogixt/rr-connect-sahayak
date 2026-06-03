FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY scripts ./scripts
COPY data ./data

EXPOSE 8000
# Managed hosts (Render, Railway, Fly) inject $PORT; local compose leaves it
# unset and falls back to 8000. Shell form so the variable is expanded.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
