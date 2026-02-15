"""Tests for the POST agency landing page."""

import pytest
from fastapi.testclient import TestClient

from src.dashboard.app import contact_submissions, create_app


@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)


@pytest.fixture(autouse=True)
def _clear_submissions():
    contact_submissions.clear()
    yield
    contact_submissions.clear()


def test_landing_page_loads(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert "POST" in resp.text


def test_landing_page_has_all_sections(client):
    resp = client.get("/")
    html = resp.text
    assert 'id="hero"' in html
    assert 'id="clients"' in html
    assert 'id="stats"' in html
    assert 'id="philosophy"' in html
    assert 'id="services"' in html
    assert 'id="contact"' in html


def test_contact_form_submission(client):
    resp = client.post(
        "/contact",
        data={"name": "Test", "email": "test@example.com", "artist": "DJ Test", "message": "Hello"},
    )
    assert resp.status_code == 200
    assert "GOT IT" in resp.text
    assert len(contact_submissions) == 1
    assert contact_submissions[0]["name"] == "Test"


def test_static_files_served(client):
    resp = client.get("/static/css/reset.css")
    assert resp.status_code == 200
    assert "box-sizing" in resp.text


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
