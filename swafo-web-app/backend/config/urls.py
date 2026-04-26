"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

from django.http import HttpResponse

def home_view(request):
    html_content = """
    <html>
        <head><title>SWAFO Backend</title></head>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #F5F5F5; margin: 0;">
            <div style="background: white; padding: 40px; border-radius: 24px; shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; border: 1px solid #E0E0E0;">
                <h1 style="color: #1A5C3A; margin-bottom: 10px;">SWAFO Backend is Running</h1>
                <p style="color: #666; font-size: 18px;">All API systems are operational.</p>
                <div style="margin-top: 20px; padding: 10px; background: #F1F8F1; border-radius: 8px; color: #1A5C3A; font-weight: bold;">
                    Status: Healthy
                </div>
            </div>
        </body>
    </html>
    """
    return HttpResponse(html_content)

urlpatterns = [
    path('', home_view),
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/violations/', include('apps.violations.urls')),
    path('api/handbook/', include('apps.handbook.urls')),
    path('api/ai/', include('apps.ai_assistant.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/patrols/', include('apps.patrols.urls')),
]
