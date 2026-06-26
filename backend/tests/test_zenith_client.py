from unittest.mock import patch, MagicMock

from src.models import Bot
from src.services.zenith_client import ZenithClient, ZenithClientError, get_bot_zenith_client


def test_send_command_success():
    client = ZenithClient("http://localhost:8080", "test-token")
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"embed": "Connected"}

    with patch("src.services.zenith_client.httpx.post", return_value=mock_resp) as mock_post:
        result = client.send_command("status")

    mock_post.assert_called_once_with(
        "http://localhost:8080/api/command",
        headers={"Authorization": "test-token", "Content-Type": "application/json"},
        json={"command": "status"},
        timeout=30.0,
    )
    assert result["embed"] == "Connected"


def test_send_command_unauthorized():
    client = ZenithClient("http://localhost:8080", "bad-token")
    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.text = "Unauthorized"

    with patch("src.services.zenith_client.httpx.post", return_value=mock_resp):
        try:
            client.send_command("status")
            assert False, "expected ZenithClientError"
        except ZenithClientError as exc:
            assert "Invalid ZenithProxy auth token" in str(exc)


def test_get_bot_zenith_client_from_config():
    config = {"web_api": {"url": "http://zenith:8080", "token": "secret"}}
    client = get_bot_zenith_client(config)
    assert client is not None
    assert client.base_url == "http://zenith:8080"
    assert client.auth_token == "secret"


def test_get_bot_zenith_client_missing_config():
    assert get_bot_zenith_client({}) is None


def test_admin_send_zenith_command_uses_bot_config(admin_client, db):
    bot = Bot(
        id="bot-delivery",
        role="delivery-beta",
        bot_type="delivery",
        config={"web_api": {"url": "http://zenith:8080", "token": "bot-secret"}},
    )
    db.add(bot)
    db.commit()

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"embed": "OK"}

    with patch("src.services.zenith_client.httpx.post", return_value=mock_resp) as mock_post:
        resp = admin_client.post(
            "/api/bots/delivery-beta/zenith/command",
            json={"command": "pathfinder goto 100 64 -200"},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["command"] == "pathfinder goto 100 64 -200"
    assert data["response"]["embed"] == "OK"
    mock_post.assert_called_once()
    call_kwargs = mock_post.call_args.kwargs
    assert call_kwargs["headers"]["Authorization"] == "bot-secret"


def test_admin_send_zenith_command_no_config(admin_client, db):
    bot = Bot(
        id="bot-delivery",
        role="delivery-beta",
        bot_type="delivery",
        config={},
    )
    db.add(bot)
    db.commit()

    resp = admin_client.post(
        "/api/bots/delivery-beta/zenith/command",
        json={"command": "status"},
    )
    # No global config in test env, so this should fail with 400.
    assert resp.status_code == 400
