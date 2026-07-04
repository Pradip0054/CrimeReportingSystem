import os
import uuid
import subprocess
import spacy
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from faster_whisper import WhisperModel

try:
    nlp = spacy.load("en_core_web_sm")
except:
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

whisper_model = WhisperModel("small", device="cpu", compute_type="int8")

@api_view(['POST'])
@permission_classes([AllowAny])
def process_voice(request):
    temp_files = []
    try:
        audio_file = request.FILES.get('audio')
        if not audio_file:
            return Response({"error": "No audio file received"}, status=400)

        uid = uuid.uuid4()
        webm_path = f"/tmp/{uid}.webm"
        wav_path = f"/tmp/{uid}.wav"
        temp_files.extend([webm_path, wav_path])

        with open(webm_path, "wb") as f:
            for chunk in audio_file.chunks():
                f.write(chunk)

        subprocess.run([
            "ffmpeg", "-y", "-i", webm_path, 
            "-ar", "16000", "-ac", "1", 
            "-af", "highpass=f=200, lowpass=f=3000", 
            wav_path
        ], check=True, capture_output=True)

        segments, info = whisper_model.transcribe(
            wav_path, 
            beam_size=5,
            task="translate",
            language="bn",
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
            initial_prompt="A theft report. Stolen item details. Crime complaint.",
            suppress_blank=True,
            condition_on_previous_text=False,
            temperature=0.0
        )
        
        translated_text = " ".join([s.text for s in segments]).strip()

        if not translated_text:
            return Response({"error": "No clear speech detected. Please try again."}, status=400)

        doc = nlp(translated_text)
        location = "Not Specified"
        for ent in doc.ents:
            if ent.label_ in ["GPE", "LOC", "FAC"]:
                location = ent.text
                break

        response_data = {
            "success": True,
            "text": translated_text,
            "detected_language": info.language,
            "original_text": translated_text, 
            "translated_text": translated_text,
            "extracted_data": {
                "location": location,
                "description": translated_text
            }
        }
        
        return JsonResponse(response_data, json_dumps_params={'ensure_ascii': False})

    except Exception as e:
        return Response({"error": f"AI Processing Failed: {str(e)}"}, status=500)
    finally:
        for f in temp_files:
            if os.path.exists(f): 
                os.remove(f)