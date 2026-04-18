from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import HandbookEntry
from .serializers import HandbookEntrySerializer
from apps.ai_assistant.services import gemini_service

class HandbookListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = HandbookEntry.objects.all().order_by('rule_code')
    serializer_class = HandbookEntrySerializer

class HandbookSmartSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response([])

        # Pre-fetch all entries for semantic matching
        entries = HandbookEntry.objects.all()
        candidates = [
            {
                'id': e.id,
                'rule_code': e.rule_code,
                'description': e.description,
                'text': f"{e.rule_code} {e.category} {e.description}"
            }
            for e in entries
        ]

        # Auto pre-warm cache on first run
        if not gemini_service._embedding_cache:
            gemini_service.prewarm_handbook_cache(candidates)

        # Use the Gemini Semantic Search logic
        results = gemini_service.semantic_search(query, candidates, top_k=8)
        
        return Response(results)
