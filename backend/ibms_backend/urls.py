from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.decorators.cache import never_cache
from django.views.generic import TemplateView
from django.views.static import serve


def api_not_found(_request, *_args, **_kwargs):
    return JsonResponse({'error': 'Not found'}, status=404)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('budget_mgmt.urls')),

    # Unknown API routes should return JSON 404 instead of SPA index.html.
    re_path(r'^api/.*$', api_not_found),

    # Serve Vite build assets via Django in integrated mode.
    re_path(r'^assets/(?P<path>.*)$', serve, {
        'document_root': settings.BASE_DIR.parent / 'dist' / 'assets',
    }),
    re_path(r'^(?P<path>(vite\.svg|favicon\.ico|manifest\.json))$', serve, {
        'document_root': settings.BASE_DIR.parent / 'dist',
    }),

    # Frontend SPA fallback.
    re_path(r'^.*$', never_cache(TemplateView.as_view(template_name='index.html'))),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
