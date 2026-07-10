"""
Backend route tests — Register Management

Covers:
  GET    /api/registers                 — list + filters, unauth
  GET    /api/registers/calendar        — calendar events
  GET    /api/registers/<id>            — detail
  POST   /api/registers                 — create (CHAIRMAN only), duplicate check
  PUT    /api/registers/<id>            — update (CHAIRMAN only)
  DELETE /api/registers/<id>            — delete (CHAIRMAN only)
  PATCH  /api/registers/<id>/status     — status update + next-due-date recalculation
  Role-guard enforcement
"""

import uuid
from datetime import date, timedelta


def _payload(**overrides):
    base = {
        'name': 'Attendance Register',
        'register_no': f'REG-{uuid.uuid4().hex[:8]}',
        'head_name': 'Jane Doe',
        'cycle': 'MONTHLY',
        'priority': 'HIGH',
        'start_date': date.today().isoformat(),
    }
    base.update(overrides)
    return base


class TestListRegisters:
    def test_requires_auth(self, client):
        resp = client.get('/api/registers')
        assert resp.status_code == 401

    def test_returns_list(self, client, auth_headers):
        resp = client.get('/api/registers', headers=auth_headers['chairman'])
        assert resp.status_code == 200
        body = resp.get_json()
        assert body['success'] is True
        assert isinstance(body['data'], list)

    def test_view_only_role_can_list(self, client, auth_headers):
        # Non-chairman roles have view access to the register list
        resp = client.get('/api/registers', headers=auth_headers['hr'])
        assert resp.status_code == 200

    def test_filter_by_cycle_and_priority(self, client, auth_headers):
        client.post('/api/registers', json=_payload(cycle='WEEKLY', priority='LOW'), headers=auth_headers['chairman'])
        resp = client.get('/api/registers?cycle=WEEKLY&priority=LOW', headers=auth_headers['chairman'])
        assert resp.status_code == 200
        body = resp.get_json()
        assert all(r['cycle'] == 'WEEKLY' and r['priority'] == 'LOW' for r in body['data'])

    def test_search_by_name_or_number(self, client, auth_headers):
        created = client.post('/api/registers', json=_payload(name='Unique Search Register'), headers=auth_headers['chairman']).get_json()
        reg_no = created['data']['register_no']

        resp = client.get('/api/registers?search=Unique Search', headers=auth_headers['chairman'])
        assert resp.status_code == 200
        assert any(r['register_no'] == reg_no for r in resp.get_json()['data'])


class TestCalendarEvents:
    def test_requires_auth(self, client):
        resp = client.get('/api/registers/calendar')
        assert resp.status_code == 401

    def test_returns_events_with_color(self, client, auth_headers):
        client.post('/api/registers', json=_payload(), headers=auth_headers['chairman'])
        resp = client.get('/api/registers/calendar', headers=auth_headers['chairman'])
        assert resp.status_code == 200
        body = resp.get_json()
        assert body['success'] is True
        for event in body['data']:
            assert event['color'] in ('gray', 'green', 'red')
            assert 'register' in event


class TestCreateRegister:
    def test_requires_auth(self, client):
        resp = client.post('/api/registers', json={})
        assert resp.status_code == 401

    def test_forbidden_for_non_chairman(self, client, auth_headers):
        resp = client.post('/api/registers', json=_payload(), headers=auth_headers['hr'])
        assert resp.status_code == 403

    def test_requires_all_fields(self, client, auth_headers):
        resp = client.post('/api/registers', json={'name': 'Incomplete'}, headers=auth_headers['chairman'])
        assert resp.status_code == 400

    def test_creates_register_with_next_due_date(self, client, auth_headers):
        resp = client.post('/api/registers', json=_payload(cycle='DAILY'), headers=auth_headers['chairman'])
        assert resp.status_code == 201
        body = resp.get_json()
        assert body['success'] is True
        assert body['data']['status'] == 'IDLE'
        expected_due = (date.today() + timedelta(days=1)).isoformat()
        assert body['data']['next_due_date'] == expected_due

    def test_duplicate_register_no_rejected(self, client, auth_headers):
        payload = _payload()
        client.post('/api/registers', json=payload, headers=auth_headers['chairman'])
        resp = client.post('/api/registers', json=payload, headers=auth_headers['chairman'])
        assert resp.status_code == 409
        assert resp.get_json()['success'] is False


class TestUpdateRegister:
    def test_forbidden_for_non_chairman(self, client, auth_headers):
        created = client.post('/api/registers', json=_payload(), headers=auth_headers['chairman']).get_json()
        resp = client.put(f"/api/registers/{created['data']['id']}", json={'name': 'x'}, headers=auth_headers['hr'])
        assert resp.status_code == 403

    def test_updates_register(self, client, auth_headers):
        created = client.post('/api/registers', json=_payload(), headers=auth_headers['chairman']).get_json()
        register_id = created['data']['id']

        resp = client.put(
            f'/api/registers/{register_id}',
            json={'name': 'Renamed Register', 'head_name': 'New Head'},
            headers=auth_headers['chairman'],
        )
        assert resp.status_code == 200
        body = resp.get_json()
        assert body['data']['name'] == 'Renamed Register'
        assert body['data']['head_name'] == 'New Head'

    def test_updating_to_duplicate_register_no_is_rejected(self, client, auth_headers):
        first = client.post('/api/registers', json=_payload(), headers=auth_headers['chairman']).get_json()
        second = client.post('/api/registers', json=_payload(), headers=auth_headers['chairman']).get_json()

        resp = client.put(
            f"/api/registers/{second['data']['id']}",
            json={'register_no': first['data']['register_no']},
            headers=auth_headers['chairman'],
        )
        assert resp.status_code == 409


class TestDeleteRegister:
    def test_forbidden_for_non_chairman(self, client, auth_headers):
        created = client.post('/api/registers', json=_payload(), headers=auth_headers['chairman']).get_json()
        resp = client.delete(f"/api/registers/{created['data']['id']}", headers=auth_headers['hr'])
        assert resp.status_code == 403

    def test_deletes_register(self, client, auth_headers):
        created = client.post('/api/registers', json=_payload(), headers=auth_headers['chairman']).get_json()
        register_id = created['data']['id']

        resp = client.delete(f'/api/registers/{register_id}', headers=auth_headers['chairman'])
        assert resp.status_code == 200

        get_resp = client.get(f'/api/registers/{register_id}', headers=auth_headers['chairman'])
        assert get_resp.status_code == 404


class TestUpdateStatus:
    def test_forbidden_for_non_chairman(self, client, auth_headers):
        created = client.post('/api/registers', json=_payload(), headers=auth_headers['chairman']).get_json()
        resp = client.patch(
            f"/api/registers/{created['data']['id']}/status",
            json={'status': 'OK'},
            headers=auth_headers['hr'],
        )
        assert resp.status_code == 403

    def test_invalid_status_rejected(self, client, auth_headers):
        created = client.post('/api/registers', json=_payload(), headers=auth_headers['chairman']).get_json()
        resp = client.patch(
            f"/api/registers/{created['data']['id']}/status",
            json={'status': 'BOGUS'},
            headers=auth_headers['chairman'],
        )
        assert resp.status_code == 400

    def test_status_update_recalculates_next_due_date(self, client, auth_headers):
        created = client.post('/api/registers', json=_payload(cycle='WEEKLY'), headers=auth_headers['chairman']).get_json()
        register_id = created['data']['id']
        old_due_date = created['data']['next_due_date']

        resp = client.patch(
            f'/api/registers/{register_id}/status',
            json={'status': 'OK'},
            headers=auth_headers['chairman'],
        )
        assert resp.status_code == 200
        body = resp.get_json()
        assert body['data']['status'] == 'OK'
        assert body['data']['next_due_date'] != old_due_date
