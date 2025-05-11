from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import time
from functools import lru_cache
import hashlib
import json

# Load environment variables
load_dotenv()

# Configure API key
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=GOOGLE_API_KEY)

app = Flask(__name__)
CORS(app)

# Rate limiting configuration
RATE_LIMIT = 60  # requests per minute
request_timestamps = []

# Cache configuration
CACHE_SIZE = 100  # number of results to cache
CACHE_TTL = 3600  # cache time-to-live in seconds (1 hour)

# Initialize the model with optimized settings
model = genai.GenerativeModel('gemini-pro')

def get_cache_key(client_description: str, freelancer_submission: str) -> str:
    """Generate a cache key from the input parameters."""
    combined = f"{client_description}:{freelancer_submission}"
    return hashlib.md5(combined.encode()).hexdigest()

@lru_cache(maxsize=CACHE_SIZE)
def cached_verify_task(cache_key: str, client_description: str, freelancer_submission: str) -> dict:
    """Cached version of task verification."""
    return verify_task(client_description, freelancer_submission)

def check_rate_limit():
    """Check if the current request exceeds rate limits."""
    current_time = time.time()
    # Remove timestamps older than 1 minute
    global request_timestamps
    request_timestamps = [ts for ts in request_timestamps if current_time - ts < 60]
    
    if len(request_timestamps) >= RATE_LIMIT:
        return False
    
    request_timestamps.append(current_time)
    return True

def verify_task(client_description: str, freelancer_submission: str) -> dict:
    """Verify if the freelancer's submission meets the client's requirements."""
    try:
        # Optimized prompt to reduce token usage
        prompt = f"""Task Verification:
Client Requirements: {client_description}
Freelancer Submission: {freelancer_submission}

Analyze if the submission meets the requirements. Respond in JSON format:
{{
    "is_approved": boolean,
    "explanation": "brief explanation (max 100 words)",
    "key_points": ["point1", "point2", "point3"]
}}"""

        # Generate response with optimized parameters
        response = model.generate_content(
            prompt,
            generation_config={
                'temperature': 0.3,  # Lower temperature for more consistent results
                'max_output_tokens': 200,  # Limit response length
                'top_p': 0.8,
                'top_k': 40
            }
        )

        # Parse the response
        try:
            result = json.loads(response.text)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            result = {
                "is_approved": False,
                "explanation": "Error in verification process",
                "key_points": ["Verification failed"]
            }

        return result

    except Exception as e:
        return {
            "is_approved": False,
            "explanation": f"Error during verification: {str(e)}",
            "key_points": ["Verification failed"]
        }

@app.route('/verify', methods=['POST'])
def verify():
    """API endpoint for task verification."""
    try:
        # Check rate limit
        if not check_rate_limit():
            return jsonify({
                "error": "Rate limit exceeded. Please try again in a minute."
            }), 429

        data = request.get_json()
        client_description = data.get('clientDescription', '')
        freelancer_submission = data.get('freelancerSubmission', '')

        if not client_description or not freelancer_submission:
            return jsonify({
                "error": "Missing required fields"
            }), 400

        # Generate cache key
        cache_key = get_cache_key(client_description, freelancer_submission)
        
        # Get result from cache or compute new result
        result = cached_verify_task(cache_key, client_description, freelancer_submission)

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 