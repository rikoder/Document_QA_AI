from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import PyPDF2
from openai import OpenAI
import os
import logging
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI API key
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)

logger.info(f"OpenAI API key configured: {'Yes' if client.api_key else 'No'}")

# Store extracted text and conversation history
pdf_texts = {}
combined_pdf_text = ""
conversation_history = []
personality = "normal"
class Question(BaseModel):
    text: str
class PersonalitySelection(BaseModel):
    type: str  # "normal", "salesperson", or "shakespeare"

@app.post("/set-personality")
async def set_personality(selection: PersonalitySelection):
    global personality
    
    valid_personalities = ["normal", "salesperson", "shakespeare"]
    if selection.type not in valid_personalities:
        raise HTTPException(status_code=400, detail="Invalid personality type. Choose from: normal, salesperson, or shakespeare")
    
    personality = selection.type
    logger.info(f"Personality set to: {personality}")
    return {"message": f"Personality set to {personality}"}

@app.post("/upload")
async def upload_pdfs(files: List[UploadFile] = File(...)):
    global pdf_texts
    global combined_pdf_text
    global conversation_history
    global system_message
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Clear previous data
    pdf_texts = {}
    combined_pdf_text = ""
    conversation_history = []
    
    file_names = []
    
    try:
        for file in files:
            logger.info(f"Processing file: {file.filename}")
            if not file.filename.endswith(".pdf"):
                logger.warning(f"Skipping non-PDF file: {file.filename}")
                continue
                
            contents = await file.read()
            temp_filename = f"temp_{file.filename}"
            with open(temp_filename, "wb") as f:
                f.write(contents)
            
            pdf_reader = PyPDF2.PdfReader(temp_filename)
            extracted_text = ""
            for page in pdf_reader.pages:
                extracted_text += page.extract_text()
            
            # Store the text with filename as key
            pdf_texts[file.filename] = extracted_text
            file_names.append(file.filename)
            
            # Append to combined text
            combined_pdf_text += f"\n\n--- Document: {file.filename} ---\n\n"
            combined_pdf_text += extracted_text
            
            # Clean up temp file
            os.remove(temp_filename)
        
        if not pdf_texts:
            raise HTTPException(status_code=400, detail="No valid PDF files were uploaded")
        
        logger.info(f"Extracted text from {len(pdf_texts)} files, total length: {len(combined_pdf_text)}")
        logger.info(f"First 100 chars of combined text: {combined_pdf_text[:100]}")
        
        # Create a system message based on personality
        system_message = "You're a smart, and helpful assistant."
        if personality == "salesperson":
            system_message = "You're an over-the-top, enthusiastic salesperson. Use exaggerated language, superlatives, and be extremely excited about everything!"
        elif personality == "shakespeare":
            system_message = "You're William Shakespeare. Respond in Shakespearean English with poetic flair, using archaic terms, and the style of Shakespeare's works."
        
        # Create first prompt
        FirstPrompt = f"You're given {len(pdf_texts)} documents with information. You'll be asked questions about these documents, and as a helpful assistant, extract meaningful information and answer questions relevantly. First, provide a 200-word summary of the document{'s' if len(pdf_texts) > 1 else ''}. Start with 'Here's a brief summary of the document{'s' if len(pdf_texts) > 1 else ''}'. The text is as follows: "
        
        conversation_history.append({"role": "user", "content": FirstPrompt + combined_pdf_text})
        logger.info("Sharing PDF texts with OpenAI")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_message},
                *conversation_history
            ]
        )
        answer = response.choices[0].message.content
        logger.info(f"Received answer: {answer[:100]}...")
        conversation_history.append({"role": "assistant", "content": answer})
        
        return {
            "message": f"{len(pdf_texts)} PDF{'s' if len(pdf_texts) > 1 else ''} uploaded and processed successfully", 
            "answer": answer,
            "files": file_names
        }
        
    except Exception as e:
        logger.error(f"Error processing PDFs: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing PDFs: {str(e)}")

@app.post("/ask")
async def ask_question(question: Question):
    
    logger.info(f"Received question: {question.text}")
    
    if not combined_pdf_text:
        logger.warning("No PDF text available")
        raise HTTPException(status_code=400, detail="Please upload a PDF first")

    conversation_history.append({"role": "user", "content": question.text})
    
    try:
        logger.info("Sending request to OpenAI")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"{system_message}. Keeping in mind the instructions provided and information in the document, answer the question. In case the question asked is totally irrelevant to the information provided in the document, mention that the question is irrelevant. If the question asked is ambiguous or unclear, you should gracefully ask for clatification. If there happen to be multiple answers, rank and filter them based on relevance."},
                *conversation_history
            ]
        )
        answer = response.choices[0].message.content
        logger.info(f"Received answer: {answer[:100]}...")
        conversation_history.append({"role": "assistant", "content": answer})
        return {"answer": answer}
    except Exception as e:
        logger.error(f"Error processing question: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")
