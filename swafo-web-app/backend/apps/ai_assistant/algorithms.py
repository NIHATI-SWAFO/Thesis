import math
import re

class SmartSearchAlgorithm:
    """
    SWAFO Institutional Logic: Hybrid Search Algorithm
    Combines Semantic Embeddings (Gemini) with Keyword Weighting (Levenshtein/Overlap)
    to handle natural language infraction descriptions.
    """
    
    @staticmethod
    def calculate_keyword_score(query, candidate_text):
        """
        Calculates a score based on word overlap and containment.
        Handles cases like 'SMOKED' matching 'SMOKING'.
        """
        query = query.lower()
        candidate = candidate_text.lower()
        
        # Simple tokenization
        query_tokens = set(re.findall(r'\w+', query))
        candidate_tokens = set(re.findall(r'\w+', candidate))
        
        if not query_tokens:
            return 0
            
        # 1. Exact token overlap
        overlap = query_tokens.intersection(candidate_tokens)
        overlap_score = len(overlap) / len(query_tokens)
        
        # 2. Fuzzy containment (handle 'smoked' vs 'smoking')
        containment_count = 0
        for q_t in query_tokens:
            for c_t in candidate_tokens:
                if q_t in c_t or c_t in q_t:
                    containment_count += 1
                    break
        
        containment_score = containment_count / len(query_tokens)
        
        return (overlap_score * 0.4) + (containment_score * 0.6)

    @staticmethod
    def cosine_similarity(v1, v2):
        if not v1 or not v2:
            return 0
        dot_product = sum(a * b for a, b in zip(v1, v2))
        magnitude1 = math.sqrt(sum(a * a for a in v1))
        magnitude2 = math.sqrt(sum(b * b for b in v2))
        if magnitude1 * magnitude2 == 0:
            return 0
        return dot_product / (magnitude1 * magnitude2)

    @classmethod
    def hybrid_score(cls, query_vec, candidate_vec, query_text, candidate_text, semantic_weight=0.6):
        """
        Merges semantic similarity and keyword relevance.
        Resilient to missing vectors by falling back to pure keywords.
        """
        # If AI failed to provide vectors, rely 100% on keywords
        if not query_vec or not candidate_vec:
            return cls.calculate_keyword_score(query_text, candidate_text)

        semantic_score = cls.cosine_similarity(query_vec, candidate_vec)
        keyword_score = cls.calculate_keyword_score(query_text, candidate_text)
        
        # Apply weighting (60% AI, 40% Keywords)
        final_score = (semantic_score * semantic_weight) + (keyword_score * (1 - semantic_weight))
        
        # CRITICAL BOOST: If query word is explicitly in the text, guarantee it shows up
        query_words = set(re.findall(r'\w+', query_text.lower()))
        candidate_words = set(re.findall(r'\w+', candidate_text.lower()))
        if query_words.intersection(candidate_words):
            final_score = max(final_score, 0.4) # Ensure it's above threshold

        return final_score

    @classmethod
    def fallback_keyword_search(cls, query, candidates, top_k=8):
        """
        A pure, fast keyword search that doesn't require any AI calls.
        Used as a safety net.
        """
        results = []
        for item in candidates:
            score = cls.calculate_keyword_score(query, item.get('text', ''))
            if score > 0:
                results.append({
                    'id': item.get('id'),
                    'rule_code': item.get('rule_code'),
                    'description': item.get('description', item.get('text')),
                    'score': score
                })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:top_k]
