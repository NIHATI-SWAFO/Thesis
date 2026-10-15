import google.generativeai as genai
from django.conf import settings
import os

class GeminiService:
    def __init__(self):
        self.is_gemini_active = False
        self.model_name = 'gemini-3.1-flash-lite'
        if getattr(settings, 'GEMINI_API_KEY', None):
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel(self.model_name)
                self.is_gemini_active = True
            except Exception as e:
                print(f"Gemini configure notice: {e}")
                self.is_gemini_active = False
        self.handbook_context = self._load_handbook()
        self._embedding_cache = {}

    def _load_handbook(self):
        try:
            from pathlib import Path
            candidates = [
                Path(__file__).resolve().parent / 'handbook_reference.md',
                Path(settings.HANDBOOK_PATH) if hasattr(settings, 'HANDBOOK_PATH') and settings.HANDBOOK_PATH else None,
                Path(settings.BASE_DIR) / 'data' / 'handbook_reference.md',
                Path(settings.BASE_DIR).parent.parent / 'additional context' / 'handbook_reference.md',
            ]
            for p in candidates:
                if p and p.exists():
                    with open(p, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if content.strip():
                            return content
            return "Handbook context unavailable."
        except Exception as e:
            print(f"Error loading handbook: {e}")
            return "Handbook context unavailable."

    def _local_handbook_response(self, user_query):
        """Intelligent local RAG fallback using the 39,000-char DLSU-D Student Handbook."""
        import re
        q = user_query.lower().strip()

        # 1. Direct Canonical Intents
        if any(w in q for w in ['where can i find', 'where to get', 'find the complete', 'access the handbook', 'download handbook', 'handbook copy', 'read the handbook']):
            return (
                "### DLSU-D Student Handbook (SY 2023-2027)\n\n"
                "You can view, search, and browse the complete official Student Handbook directly within this portal:\n\n"
                "1. **Student Handbook Tab**: Click on **\"Student Handbook\"** in the sidebar navigation to read all policy sections, browse infractions, and review sanction escalation tables.\n"
                "2. **Search Bar**: Use the search bar in the Student Handbook tab to find specific rules by keywords (e.g., dress code, ID confiscation, parking).\n"
                "3. **Physical / Administrative Office**: For certified printed copies or formal consultations, you may visit the **Student Welfare and Formation Office (SWAFO)** at the Student Center building, or download official announcements from the official DLSU-D student portal."
            )

        if any(w in q for w in ['dress code', 'uniform', 'clothing', 'attire', 'wash day', 'prohibited clothes', 'shorts', 'hair', 'earring']):
            return (
                "### DLSU-D Uniform & Dress Code Policy (Section 1 & Section 27.1.2)\n\n"
                "• **Prescribed Uniform**: Students must wear their official college uniform during regular uniform days.\n"
                "• **Wash Days / Civilian Attire**: Attire must remain decent and modest. Strictly prohibited on campus:\n"
                "  - Crop tops, halter tops, backless, or deep plunging necklines\n"
                "  - Shorts or skirts significantly above the knee (micro-minis)\n"
                "  - Beach-type rubber flip-flops during academic hours\n"
                "  - Transparent, see-through, or excessively torn clothing\n"
                "• **Student ID**: Official ID cards must be worn visibly with the approved DLSU-D lanyard at all entry gates and throughout campus grounds."
            )

        if any(w in q for w in ['confiscat', 'id taken', 'claim id', 'get my id', 'lost id']):
            return (
                "### ID Confiscation & Retrieval Procedure (Section 2 & Section 27.1.3)\n\n"
                "If your Student ID was confiscated by a patrol officer for a dress code or campus policy infraction:\n\n"
                "1. **Turn-In**: Patrol officers log and submit all confiscated IDs to the **Student Welfare and Formation Office (SWAFO)** within 24 hours.\n"
                "2. **Reporting**: Visit the SWAFO Office at the Student Center.\n"
                "3. **Claiming**: Attend conduct guidance with an assigned SWAFO formation officer and sign the compliance acknowledgment slip to release your ID.\n"
                "4. **Lost IDs**: If your ID was lost rather than confiscated, secure a temporary gate pass from SWAFO and file an affidavit of loss for replacement."
            )

        if any(w in q for w in ['appeal', 'dispute', 'grievance', 'due process', 'violation notice']):
            return (
                "### Appeals & Disciplinary Due Process (Section 5 & Section 26)\n\n"
                "Students have the right to due process regarding any recorded violation notice:\n\n"
                "1. **Filing Period**: Submit your formal appeal through this portal (navigate to **My Violations -> File Appeal**) within **3 to 5 school days** from receiving the notice.\n"
                "2. **Evidence**: Attach photos, witness explanations, or relevant documentation supporting your defense.\n"
                "3. **Review**: The SWAFO Director and the University Discipline Board (UDB) will evaluate your case.\n"
                "4. **Escalation Warning**: 4 accumulated minor violations automatically escalate into a Major Offense under Section 27.3, placing institutional clearances on conditional status."
            )

        if any(w in q for w in ['clearance', 'good moral', 'gmc', 'probation', 'standing']):
            return (
                "### Student Clearance & Good Moral Standing (Section 14 & Section 27.3.5)\n\n"
                "• **Good Standing**: Maintained when a student has zero active/unresolved major violations and decayed risk standing under Section 14.\n"
                "• **Clearance Hold**: Outstanding violations, unserved community service, or pending disciplinary cases place a temporary hold on institutional clearance, affecting enrollment and graduation.\n"
                "• **Temporal Restoration**: Minor violations decay over time without repeat offenses, allowing students to restore good standing under SWAFO's restorative discipline framework."
            )

        # 2. Dynamic Section Matcher from Handbook Context
        stop_words = {'what', 'is', 'the', 'for', 'in', 'and', 'to', 'of', 'a', 'an', 'are', 'can', 'how', 'do', 'i', 'my', 'on', 'at', 'about', 'rule', 'rules'}
        tokens = [t for t in re.findall(r'[a-z0-9]+', q) if len(t) > 2 and t not in stop_words]

        best_section = None
        best_score = 0

        # Split handbook by markdown headings (## or ###)
        sections = re.split(r'\n(?=#{1,3}\s)', self.handbook_context)
        for sec in sections:
            sec_lower = sec.lower()
            score = 0
            for t in tokens:
                if t in sec_lower:
                    score += 1
                    # Give extra weight if the token appears in the heading line
                    first_line = sec_lower.split('\n')[0]
                    if t in first_line:
                        score += 2

            if score > best_score:
                best_score = score
                best_section = sec

        if best_section and best_score >= 2:
            # Extract clean excerpt (up to 750 characters)
            lines = [l.strip() for l in best_section.split('\n') if l.strip()]
            header = lines[0] if lines else "Handbook Policy Reference"
            body = "\n".join(lines[1:12])
            if len(body) > 650:
                body = body[:650] + "..."

            return (
                f"{header}\n\n"
                f"{body}\n\n"
                f"> *Source: DLSU-D Student Handbook (Official Reference). You can also search the **Student Handbook tab** in this portal for the full text.*"
            )

        return (
            "I am the **SWAFO Assistant** for De La Salle University - Dasmariñas.\n\n"
            "I could not locate an exact match for that specific inquiry in my quick handbook reference. Here are recommended next steps:\n\n"
            "• **Browse Full Policies**: Open the **Student Handbook** tab on the left sidebar to search by section code.\n"
            "• **Inquire with SWAFO**: Visit the Student Welfare and Formation Office at the Student Center building or contact them via official DLSU-D email for case-specific guidance."
        )

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
        if self.is_gemini_active:
            full_prompt = f"System Instruction: {system_prompt}\n\nUser Question: {user_query}"
            models_to_try = [
                'gemini-3.1-flash-lite',
                'gemini-3.5-flash-lite',
                'gemini-flash-lite-latest',
            ]
            for m_name in models_to_try:
                try:
                    m = genai.GenerativeModel(m_name)
                    chat = m.start_chat(history=[])
                    response = chat.send_message(full_prompt)
                    if response and hasattr(response, 'text') and response.text:
                        return response.text
                except Exception as e:
                    print(f"Gemini live API call notice with {m_name}: {e}")
                    continue

        # Intelligent local handbook fallback (100% offline & zero API key / zero quota required)
        return self._local_handbook_response(user_query)

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
