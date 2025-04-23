from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai
from PyPDF2 import PdfReader

# Initialize Flask app
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)  # Enable CORS for cross-origin requests

# Home route to render chatbot HTML UI
@app.route('/')
def index():
    return render_template("chatbot.html")

# Load environment variables (e.g. API Key)
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Gemini model configuration
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config=generation_config,
    system_instruction="""
    You are an intelligent assistant buitl by Emmanuel Sfiso Nkosi, a Data Scientist at University of Witwatersrand designed to help users either:

    1. Ask general knowledge questions about topics like customer experience, anaslytics, sentiment trends, business insights, and more.
    2. Analyze uploaded documents (such as PDFs or spreadsheets) and answer questions based only on the content of those documents.

    When working with documents:
    - Focus on extracting meaningful insights, summaries, patterns, and answering specific user questions.
    - Be clear and professional.
    - Help structure answers for reports, dashboards, or business reviews.
    - Tag themes (e.g., Billing, Network, Churn) when relevant.
    - Link findings to possible strategic or operational improvements.

    When working with general knowledge:
    - Be informative and concise.
    - Provide clear examples or suggestions when needed.
    - If you are unsure, suggest how the user might rephrase or explore further.

    Always ask clarifying questions if needed, and adapt your responses to suit business, student, or analyst needs.
    """
)

# Start a new chat session
chat_session = model.start_chat(history=[])

# Route for handling user prompts
@app.route('/ask', methods=['POST'])
def ask():
    user_message = request.json.get("message")
    response = chat_session.send_message(user_message)
    return jsonify({"response": response.text})

# Route for handling file uploads
@app.route('/upload', methods=['POST'])
def upload():
    if "file" not in request.files:
        return jsonify({"response": "No file uploaded."})

    file = request.files["file"]
    filename = file.filename

    if filename.endswith(".pdf"):
        reader = PdfReader(file)
        text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
    elif filename.endswith(".txt"):
        text = file.read().decode("utf-8")
    else:
        return jsonify({"response": "Unsupported file type. Please upload a PDF or TXT file."})

    prompt = f"Analyze the uploaded document and summarize its key points:\n\n{text[:4000]}"
    response = chat_session.send_message(prompt)
    return jsonify({"response": response.text})

# Run the app
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
