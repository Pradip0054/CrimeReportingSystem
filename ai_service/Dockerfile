# Base image
FROM python:3.10-slim

# System dependencies
# libgomp1 এবং অন্যান্য লাইব্রেরি faster-whisper (CTranslate2) এর জন্য প্রয়োজন
RUN apt-get update && apt-get install -y \
    ffmpeg \
    gcc \
    pkg-config \
    default-libmysqlclient-dev \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install torch (CPU version) এবং অন্যান্য লাইব্রেরি
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# spaCy-র জন্য NLP মডেল ডাউনলোড (এটি লোকেশন ডিটেক্ট করতে সাহায্য করবে)
RUN python -m spacy download en_core_web_sm

# Copy project
COPY . .

# Run Django (পোর্ট ৮০০১ যা আপনি নির্দিষ্ট করেছেন)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8001", "--noreload"]