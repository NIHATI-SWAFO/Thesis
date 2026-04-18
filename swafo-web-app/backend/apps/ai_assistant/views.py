from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import gemini_service

class ChatAssistantView(APIView):
    # For now, allow public access for demonstration as discussed
    permission_classes = [] 

    def post(self, request):
        query = request.data.get('message', '')
        if not query:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        response_text = gemini_service.get_response(query)
        
        # Simple RAG-like citation detection
        # (In a real system, we'd use metadata, but for a text context, we'll let the LLM cite it)
        
        return Response({
            "response": response_text,
            "source": "University Handbook (Digital Reference)"
        })
