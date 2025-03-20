# Document Oracle

## Description
An AI-based web app that reads and understands documents, summarizes them, and answers your questions in a chat interface.

## Usage
This app can be used at this link (https://document-qa-frontend.onrender.com/) or can be run locally using the below instructions. 
Once opened, choose a personality style from:
- Normal: A smart, helpful assistant
- Crazy Salesperson: Has an over-the-top personality, and exaggerates things
- Shakespeare: Speaks poetically in old English

Once chosen, hit 'Choose Files' button which would open your File Explorer. You can upload multiple pdfs by selecting all of them together and hitting Upload PDFs. Once uploaded and processed, the AI will provide a brief summary of all the documents provided. 

You can now go ahead and ask any relevant questions to the AI pertaining to the document and it will answer them! 

## To run locally: Installation and set-up
### Pre-requisites
- Install Node.js and npm (for frontend)
- Install Python 3.7+ (for backend)
- Have an OpenAI API Key
### Clone the repository
```bash
git clone https://github.com/rikoder/Document_QA_AI.git
cd Document_QA_AI
```
### Backend
```bash
cd backend
```
1. Set up a python virtual environment
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```
2. Install backend dependencies
```bash
pip install -r requirements.txt
```
3. Set your OpenAI API key as an environment variable
```bash
# On Windows
set OPENAI_API_KEY=your_api_key_here
# On macOS/Linux
export OPENAI_API_KEY=your_api_key_here
```
4. Start the backend server
```bash
uvicorn main:app --reload --port 8000
```
The backend should now be running at http://localhost:8000

### Frontend
1. Open a new terminal window and navigate to frontend directory
```bash
cd frontend
```
2. Install frontend dependencies
```bash
npm install
```
3. Start the frontend server
```bash
npm start
```
The frontend should now be running at http://localhost:3000

If it doesn't automatically do so, open the browser and go to http://localhost:3000 where you can start usage. Finally, after using, press ctrl+c in both backend and frontend terminals to close them. 