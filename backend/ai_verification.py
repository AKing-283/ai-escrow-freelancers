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

def extract_requirements(client_description: str) -> list:
    """Extract specific requirements from client description."""
    prompt = f"""Extract specific requirements from this client description. Return as a JSON array of strings:
{client_description}"""
    
    try:
        response = model.generate_content(prompt)
        requirements = json.loads(response.text)
        return requirements if isinstance(requirements, list) else []
    except:
        return []

def verify_task(client_description: str, freelancer_submission: str) -> dict:
    """Verify if the freelancer's submission meets the client's requirements."""
    try:
        # Extract requirements
        requirements = extract_requirements(client_description)
        
        # Create detailed prompt for verification
        prompt = f"""Task Verification for Freelance Work:

Client Requirements:
{client_description}

Freelancer Submission:
{freelancer_submission}

Specific Requirements to Check:
{json.dumps(requirements, indent=2)}

Analyze the submission thoroughly and provide a detailed assessment. Consider:
1. Technical accuracy and completeness
2. Quality of work
3. Meeting of specific requirements
4. Professional standards
5. Potential improvements

Respond in this exact JSON format:
{{
    "is_approved": boolean,
    "explanation": "detailed explanation (max 200 words)",
    "key_points": ["point1", "point2", "point3"],
    "quality_score": number (0-100),
    "requirements_met": [
        {{
            "requirement": "specific requirement",
            "met": boolean,
            "explanation": "brief explanation"
        }}
    ]
}}"""

        # Generate response with optimized parameters
        response = model.generate_content(
            prompt,
            generation_config={
                'temperature': 0.2,  # Lower temperature for more consistent results
                'max_output_tokens': 500,  # Increased for more detailed analysis
                'top_p': 0.8,
                'top_k': 40
            }
        )

        # Parse the response
        try:
            result = json.loads(response.text)
            
            # Validate and normalize the result
            if not isinstance(result.get('quality_score'), (int, float)):
                result['quality_score'] = 0
            if not isinstance(result.get('key_points'), list):
                result['key_points'] = []
            if not isinstance(result.get('requirements_met'), list):
                result['requirements_met'] = []
            
            return result

        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "is_approved": False,
                "explanation": "Error in verification process",
                "key_points": ["Verification failed"],
                "quality_score": 0,
                "requirements_met": []
            }

    except Exception as e:
        return {
            "is_approved": False,
            "explanation": f"Error during verification: {str(e)}",
            "key_points": ["Verification failed"],
            "quality_score": 0,
            "requirements_met": []
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