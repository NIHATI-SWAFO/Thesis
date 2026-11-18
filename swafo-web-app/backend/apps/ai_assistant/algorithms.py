import math
import re

STOP_WORDS = {
    'in', 'on', 'at', 'to', 'for', 'of', 'a', 'an', 'the', 'and', 'or', 'by', 
    'with', 'from', 'as', 'is', 'it', 'be', 'are', 'was', 'were', 'any', 'all',
    'which', 'that', 'this', 'these', 'those', 'under', 'into', 'over'
}

KEYWORD_SYNONYMS = {
    'smoke': ['smoking', 'e-cigarette', 'vape', 'vaporizer', 'tobacco'],
    'smoking': ['smoke', 'e-cigarette', 'vape', 'vaporizer', 'tobacco'],
    'vape': ['smoking', 'smoke', 'e-cigarette', 'vaporizer', 'vaporizers'],
    'vaping': ['smoking', 'smoke', 'e-cigarette', 'vaporizer', 'vaporizers'],
    'uniform': ['dress', 'clothes', 'attire', 'clothing', 'blouses', 'jeans', 'shorts', 'slippers'],
    'attire': ['dress', 'clothes', 'uniform', 'clothing'],
    'haircut': ['hair', 'grooming', 'earrings', 'piercing'],
    'hair': ['haircut', 'grooming', 'earrings', 'piercing'],
    'piercing': ['earrings', 'piercings', 'grooming'],
    'id': ['identification', 'school id', 'id card'],
    'alcohol': ['liquor', 'intoxication', 'beer', 'drinking'],
    'liquor': ['alcohol', 'intoxication', 'drinking'],
    'drunk': ['intoxication', 'liquor', 'alcohol'],
    'cheat': ['cheating', 'dishonesty', 'plagiarism'],
    'cheating': ['cheat', 'dishonesty', 'plagiarism'],
    'fight': ['brawls', 'attacking', 'assaulting', 'physical confrontation'],
    'trash': ['littering', 'garbage', 'waste'],
}

class SmartSearchAlgorithm:
    @staticmethod
    def calculate_keyword_score(query, candidate_text):
        query = (query or '').strip().lower()
        candidate = (candidate_text or '').lower()
        if not query:
            return 0.0

        # Direct rule code or exact substring match
        clean_q = query.replace(' ', '')
        if clean_q in candidate.replace(' ', ''):
            if len(query) <= 3:
                # Word boundary for short queries like 'id'
                if re.search(r'\b' + re.escape(query) + r'\b', candidate):
                    return 1.0
            else:
                return 1.0

        q_tokens = [t for t in re.findall(r'\b\w+\b', query) if t not in STOP_WORDS]
        if not q_tokens:
            q_tokens = [t for t in re.findall(r'\b\w+\b', query)]
        if not q_tokens:
            return 0.0

        c_tokens = set(re.findall(r'\b\w+\b', candidate)) - STOP_WORDS

        matched = 0
        for qt in q_tokens:
            if qt in c_tokens:
                matched += 1.0
                continue
            # Prefix or root matching (minimum 4 chars)
            found = False
            for ct in c_tokens:
                if len(qt) >= 4 and len(ct) >= 4:
                    if ct.startswith(qt) or qt.startswith(ct):
                        found = True
                        break
            if found:
                matched += 0.8
                continue
            # Synonym check
            syns = KEYWORD_SYNONYMS.get(qt, [])
            for s in syns:
                if re.search(r'\b' + re.escape(s) + r'\b', candidate):
                    found = True
                    break
            if found:
                matched += 0.75
                continue

        return (matched / len(q_tokens)) if matched > 0 else 0.0

    @staticmethod
    def cosine_similarity(v1, v2):
        if not v1 or not v2: return 0
        dot_product = sum(a * b for a, b in zip(v1, v2))
        mag1 = math.sqrt(sum(a * a for a in v1))
        mag2 = math.sqrt(sum(b * b for b in v2))
        return dot_product / (mag1 * mag2) if mag1 * mag2 > 0 else 0

    @classmethod
    def hybrid_score(cls, query_vec, candidate_vec, query_text, candidate_text):
        k_score = cls.calculate_keyword_score(query_text, candidate_text)
        if not query_vec or not candidate_vec:
            return k_score
        s_score = cls.cosine_similarity(query_vec, candidate_vec)
        if k_score == 0:
            return s_score if s_score > 0.75 else 0.0
        return (s_score * 0.4) + (k_score * 0.6)
