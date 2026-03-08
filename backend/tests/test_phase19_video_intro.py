"""
Phase 19 — Video Launch Screen Backend Tests
Tests static video endpoint serving intro.mp4
"""
import pytest
import requests
import os
from pathlib import Path
from dotenv import load_dotenv

# Load frontend .env for EXPO_PUBLIC_BACKEND_URL
frontend_env = Path(__file__).parent.parent.parent / 'frontend' / '.env'
load_dotenv(frontend_env)

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
if not BASE_URL:
    raise ValueError("EXPO_PUBLIC_BACKEND_URL not set in frontend/.env")

class TestPhase19VideoIntro:
    """Static video file serving tests for Phase 19"""

    def test_health_check(self):
        """Verify API is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("✓ Health check passed")

    def test_static_video_exists(self):
        """Verify intro.mp4 is served at /api/static/intro.mp4"""
        response = requests.head(f"{BASE_URL}/api/static/intro.mp4")
        assert response.status_code == 200, f"Video endpoint returned {response.status_code}"
        print("✓ Video endpoint returns 200")

    def test_static_video_content_type(self):
        """Verify video has correct content-type"""
        response = requests.head(f"{BASE_URL}/api/static/intro.mp4")
        assert response.status_code == 200
        content_type = response.headers.get('content-type', '')
        assert 'video' in content_type.lower(), f"Expected video content-type, got {content_type}"
        print(f"✓ Video content-type correct: {content_type}")

    def test_static_video_file_size(self):
        """Verify video file has non-zero size"""
        response = requests.head(f"{BASE_URL}/api/static/intro.mp4")
        assert response.status_code == 200
        content_length = response.headers.get('content-length', '0')
        size_mb = int(content_length) / (1024 * 1024)
        assert int(content_length) > 0, "Video file size is 0"
        print(f"✓ Video file size: {size_mb:.2f} MB")

    def test_static_video_get_request(self):
        """Verify video can be downloaded (partial check)"""
        # Only download first 1KB to verify content is accessible
        response = requests.get(
            f"{BASE_URL}/api/static/intro.mp4",
            headers={'Range': 'bytes=0-1023'},
            timeout=10
        )
        assert response.status_code in [200, 206], f"GET request failed with {response.status_code}"
        assert len(response.content) > 0, "No content received"
        print(f"✓ Video download working (partial check: {len(response.content)} bytes)")
