import google.generativeai as genai
from django.conf import settings
import os

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-flash-latest')
        self.handbook_context = self._load_handbook()
        self._embedding_cache = {}

    def _load_handbook(self):
        try:
            if not os.path.exists(settings.HANDBOOK_PATH):
                return "Handbook context unavailable."
            with open(settings.HANDBOOK_PATH, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error loading handbook: {e}")
            return "Handbook context unavailable."

    def get_response(self, user_query, chat_history=None):
        system_prompt = f"""
        You are the SWAFO AI Assistant for De La Salle University - Dasmariñas (DLSU-D).
        Your primary knowledge source is the following Student Handbook extract:
        
        {self.handbook_context}
        
        Instructions:
        1. Answer queries based ONLY on the handbook context provided.
        2. If the user asks something not covered in the handbook, say: "I'm sorry, but that information is not available in my current handbook reference. Please consult the SWAFO office directly for official clarification."
        3. Be professional, helpful, and concise.
        4. Use the specific section codes (e.g., Section 27.1) when citing rules.
        5. If the user mentions their ID being confiscated or common violations, refer to the escalation logic (e.g., 4th minor = major).
        """
        
        chat = self.model.start_chat(history=[])
        full_prompt = f"System Instruction: {system_prompt}\n\nUser Question: {user_query}"
        
        try:
            response = chat.send_message(full_prompt)
            return response.text
        except Exception as e:
            return f"Error connecting to AI engine: {str(e)}"

    def prewarm_handbook_cache(self, candidates):
        """Batches embeddings for all rules to avoid per-item API calls."""
        texts = [c['text'] for c in candidates]
        try:
            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=texts,
                task_type="retrieval_document"
            )
            for i, vec in enumerate(result['embeddings']):
                self._embedding_cache[texts[i]] = vec
            print(f"Pre-warmed {len(texts)} handbook embeddings.")
        except Exception as e:
            print(f"Pre-warm error: {e}")

    def get_embedding(self, text):
        """Generates an embedding for the given text, with simple local caching."""
        if text in self._embedding_cache:
            return self._embedding_cache[text]
            
        try:
            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=text,
                task_type="retrieval_query"
            )
            vec = result['embedding']
            self._embedding_cache[text] = vec
            return vec
        except Exception as e:
            print(f"Embedding error: {e}")
            return None

    def semantic_search(self, query, candidates, top_k=8):
        """Ranks candidates using original Hybrid Search logic."""
        from .algorithms import SmartSearchAlgorithm
        
        try:
            query_vec = self.get_embedding(query)
            scored_candidates = []
            
            for item in candidates:
                item_text = item.get('text', '')
                item_vec = self._embedding_cache.get(item_text)
                
                similarity = SmartSearchAlgorithm.hybrid_score(
                    query_vec, 
                    item_vec, 
                    query, 
                    item_text
                )
                
                if similarity > 0.1:
                    scored_candidates.append({
                        'id': item.get('id'),
                        'rule_code': item.get('rule_code'),
                        'description': item.get('description', item.get('text')),
                        'score': similarity
                    })

            scored_candidates.sort(key=lambda x: x['score'], reverse=True)
            return scored_candidates[:top_k]
        except Exception as e:
            print(f"Search error: {e}")
            return []

gemini_service = GeminiService()
