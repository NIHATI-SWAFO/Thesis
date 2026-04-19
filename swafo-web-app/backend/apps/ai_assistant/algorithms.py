import math
import re

class SmartSearchAlgorithm:
    @staticmethod
    def calculate_keyword_score(query, candidate_text):
        query = query.lower()
        candidate = candidate_text.lower()
        query_tokens = set(re.findall(r'\w+', query))
        candidate_tokens = set(re.findall(r'\w+', candidate))
        if not query_tokens: return 0
        overlap = query_tokens.intersection(candidate_tokens)
        overlap_score = len(overlap) / len(query_tokens)
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
        if not v1 or not v2: return 0
        dot_product = sum(a * b for a, b in zip(v1, v2))
        mag1 = math.sqrt(sum(a * a for a in v1))
        mag2 = math.sqrt(sum(b * b for b in v2))
        return dot_product / (mag1 * mag2) if mag1 * mag2 > 0 else 0

    @classmethod
    def hybrid_score(cls, query_vec, candidate_vec, query_text, candidate_text):
        if not query_vec or not candidate_vec:
            return cls.calculate_keyword_score(query_text, candidate_text)
        s_score = cls.cosine_similarity(query_vec, candidate_vec)
        k_score = cls.calculate_keyword_score(query_text, candidate_text)
        return (s_score * 0.6) + (k_score * 0.4)
