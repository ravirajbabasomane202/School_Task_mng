from datetime import datetime, date, timedelta

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.register import Register, CYCLES, PRIORITIES, STATUSES, calculate_next_due_date
from app.models.user import User, DEPARTMENT_HEAD_ROLES
from app.utils.response import success, error
from app.utils.decorators import roles_required

registers_bp = Blueprint('registers', __name__)

REGISTER_MANAGER_ROLES = ('CHAIRMAN',)

# `head_name` is accepted as a legacy fallback, but `head_id` is the preferred field
# going forward — the register stores the selected user's ID, not free text.
REQUIRED_FIELDS = ['name', 'register_no', 'cycle', 'priority', 'start_date']


def _parse_date(value):
    """Parse an ISO date/datetime string into a date object."""
    if not value:
        return None
    if isinstance(value, date):
        return value
    text = str(value).strip()
    try:
        # Accept both 'YYYY-MM-DD' and full ISO datetime strings
        if 'T' in text:
            return datetime.fromisoformat(text.replace('Z', '+00:00')).date()
        return datetime.strptime(text, '%Y-%m-%d').date()
    except ValueError:
        return None


def _resolve_head(data, partial=False):
    """Resolve the selected Head (User) from `head_id`, falling back to legacy
    free-text `head_name` for backward compatibility.

    Returns (head_user_or_None, head_name_text, error_message_or_None).
    """
    if 'head_id' in data and data['head_id'] not in (None, ''):
        try:
            head_id = int(data['head_id'])
        except (TypeError, ValueError):
            return None, None, 'head_id must be a valid Head ID'
        head_user = db.session.get(User, head_id)
        if not head_user or not head_user.is_active:
            return None, None, 'Selected Head Name is not a valid active user'
        return head_user, head_user.name, None

    if 'head_name' in data and data['head_name']:
        # Legacy fallback: plain text, no linked user.
        return None, str(data['head_name']).strip(), None

    if not partial:
        return None, None, 'head_id is required'

    return None, None, None


def _validate_payload(data, partial=False):
    """Validate register fields. Returns an error message string, or None if valid."""
    fields = REQUIRED_FIELDS if not partial else [f for f in REQUIRED_FIELDS if f in data]
    for field in fields:
        if data.get(field) in (None, ''):
            return f'{field} is required'

    if not partial and 'head_id' not in data and 'head_name' not in data:
        return 'head_id is required'

    if 'cycle' in data and data['cycle'] and data['cycle'].upper() not in CYCLES:
        return f"checking_cycle must be one of {', '.join(CYCLES)}"

    if 'priority' in data and data['priority'] and data['priority'].upper() not in PRIORITIES:
        return f"priority must be one of {', '.join(PRIORITIES)}"

    if 'start_date' in data and data['start_date'] and _parse_date(data['start_date']) is None:
        return 'start_date must be a valid date (YYYY-MM-DD)'

    return None


@registers_bp.route('', methods=['GET'])
@jwt_required()
def list_registers():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return error('User not found', 401)

    query = Register.query

    search = request.args.get('search')
    cycle = request.args.get('cycle')
    priority = request.args.get('priority')
    status = request.args.get('status')

    if search:
        like = f'%{search}%'
        query = query.filter(db.or_(Register.name.ilike(like), Register.register_no.ilike(like)))
    if cycle:
        query = query.filter_by(cycle=cycle.upper())
    if priority:
        query = query.filter_by(priority=priority.upper())
    if status:
        query = query.filter_by(status=status.upper())

    registers = query.order_by(Register.next_due_date.asc()).all()
    return success([r.to_dict() for r in registers])


@registers_bp.route('/calendar', methods=['GET'])
@jwt_required()
def calendar_events():
    """Return register schedules as calendar events, optionally within a date range."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return error('User not found', 401)

    start = _parse_date(request.args.get('start'))
    end = _parse_date(request.args.get('end'))

    query = Register.query
    if start:
        query = query.filter(Register.next_due_date >= start)
    if end:
        query = query.filter(Register.next_due_date <= end)

    registers = query.order_by(Register.next_due_date.asc()).all()

    today = date.today()
    events = []
    for r in registers:
        is_future_or_pending = r.next_due_date >= today
        computed_status = r.computed_status(today)
        # `color` kept as a 3-value field for backward compatibility with older
        # clients; `dot_color` carries the full 4-state Completed/Pending/Failed/Upcoming.
        color = 'green' if computed_status == 'COMPLETED' else ('red' if computed_status == 'FAILED' else 'gray')

        events.append({
            'id': r.id,
            'title': f'{r.name} ({r.register_no})',
            'date': r.next_due_date.isoformat(),
            'status': r.status,
            'computed_status': computed_status,
            'color': color,
            'dot_color': r.dot_color(today),
            'is_future_or_pending': is_future_or_pending,
            'register': r.to_dict(),
        })

    return success(events)


@registers_bp.route('/<int:register_id>', methods=['GET'])
@jwt_required()
def get_register(register_id: int):
    register = db.session.get(Register, register_id)
    if not register:
        return error('Register not found', 404)
    return success(register.to_dict())


@registers_bp.route('', methods=['POST'])
@roles_required(*REGISTER_MANAGER_ROLES)
def create_register():
    data = request.get_json() or {}
    # Accept `checking_cycle` as the primary field name, `cycle` as legacy alias.
    if 'checking_cycle' in data and 'cycle' not in data:
        data['cycle'] = data['checking_cycle']

    validation_error = _validate_payload(data)
    if validation_error:
        return error(validation_error, 400)

    head_user, head_name, head_error = _resolve_head(data)
    if head_error:
        return error(head_error, 400)

    register_no = str(data['register_no']).strip()
    if Register.query.filter_by(register_no=register_no).first():
        return error('Register No. already exists. Register numbers must be unique.', 409)

    start_date = _parse_date(data['start_date'])
    cycle = data['cycle'].upper()

    user_id = get_jwt_identity()

    register = Register(
        name=data['name'].strip(),
        register_no=register_no,
        head_id=head_user.id if head_user else None,
        head_name=head_name,
        cycle=cycle,
        priority=data['priority'].upper(),
        status=data.get('status', 'IDLE').upper() if data.get('status') else 'IDLE',
        start_date=start_date,
        next_due_date=calculate_next_due_date(start_date, cycle),
        created_by=user_id,
    )
    db.session.add(register)
    db.session.commit()
    return success(register.to_dict(), 'Register added successfully', 201)


@registers_bp.route('/<int:register_id>', methods=['PUT'])
@roles_required(*REGISTER_MANAGER_ROLES)
def update_register(register_id: int):
    register = db.session.get(Register, register_id)
    if not register:
        return error('Register not found', 404)

    data = request.get_json() or {}
    if 'checking_cycle' in data and 'cycle' not in data:
        data['cycle'] = data['checking_cycle']

    validation_error = _validate_payload(data, partial=True)
    if validation_error:
        return error(validation_error, 400)

    if 'head_id' in data or 'head_name' in data:
        head_user, head_name, head_error = _resolve_head(data, partial=True)
        if head_error:
            return error(head_error, 400)
        if head_user:
            register.head_id = head_user.id
            register.head_name = head_name
        elif head_name:
            register.head_id = None
            register.head_name = head_name

    if 'register_no' in data:
        new_register_no = str(data['register_no']).strip()
        if new_register_no != register.register_no:
            existing = Register.query.filter_by(register_no=new_register_no).first()
            if existing and existing.id != register.id:
                return error('Register No. already exists. Register numbers must be unique.', 409)
            register.register_no = new_register_no

    if 'name' in data:
        register.name = data['name'].strip()
    if 'cycle' in data and data['cycle']:
        register.cycle = data['cycle'].upper()
    if 'priority' in data and data['priority']:
        register.priority = data['priority'].upper()
    if 'start_date' in data and data['start_date']:
        register.start_date = _parse_date(data['start_date'])
    if 'status' in data and data['status']:
        if data['status'].upper() not in STATUSES:
            return error(f"status must be one of {', '.join(STATUSES)}", 400)
        register.status = data['status'].upper()

    # Recalculate next due date if the start date or cycle changed
    if 'start_date' in data or 'cycle' in data:
        register.next_due_date = calculate_next_due_date(register.start_date, register.cycle)

    db.session.commit()
    return success(register.to_dict(), 'Register updated successfully')


@registers_bp.route('/<int:register_id>', methods=['DELETE'])
@roles_required(*REGISTER_MANAGER_ROLES)
def delete_register(register_id: int):
    register = db.session.get(Register, register_id)
    if not register:
        return error('Register not found', 404)

    db.session.delete(register)
    db.session.commit()
    return success(None, 'Register deleted successfully')


@registers_bp.route('/<int:register_id>/status', methods=['PATCH'])
@roles_required(*REGISTER_MANAGER_ROLES)
def update_status(register_id: int):
    register = db.session.get(Register, register_id)
    if not register:
        return error('Register not found', 404)

    data = request.get_json() or {}
    new_status = (data.get('status') or '').upper()

    if not new_status:
        return error('status is required', 400)
    if new_status not in STATUSES:
        return error(f"status must be one of {', '.join(STATUSES)}", 400)

    register.status = new_status

    # Automatically calculate the next due date based on the cycle after
    # each completed update (i.e. whenever the status moves out of IDLE).
    if new_status in ('OK', 'REJECTED'):
        base_date = register.next_due_date or register.start_date or date.today()
        if new_status == 'OK':
            register.last_completed_date = base_date
        register.next_due_date = calculate_next_due_date(base_date, register.cycle)

    db.session.commit()
    return success(register.to_dict(), 'Register status updated')


@registers_bp.route('/heads', methods=['GET'])
@jwt_required()
def list_register_heads():
    """Active users eligible to be selected as a Register's Head Name."""
    query = User.query.filter(
        User.is_active.is_(True),
        User.role.in_(DEPARTMENT_HEAD_ROLES),
    )
    users = query.order_by(User.name).all()
    return success([
        {
            'id': u.id,
            'name': u.name,
            'role': u.role,
            'department_id': u.department_id,
            'department_name': u.department.name if u.department else None,
        }
        for u in users
    ])


@registers_bp.route('/<int:register_id>/calendar', methods=['GET'])
@jwt_required()
def register_calendar(register_id: int):
    """Calendar dots for a single Register, for the small popup view.

    Only the register's own scheduled due date (per its Checking Cycle) is
    surfaced with a computed status; every other day in the visible range is
    rendered blank on the frontend.
    """
    register = db.session.get(Register, register_id)
    if not register:
        return error('Register not found', 404)

    today = date.today()
    month_str = request.args.get('month')  # 'YYYY-MM', defaults to the due date's month
    if month_str:
        try:
            year, month = (int(part) for part in month_str.split('-'))
            anchor = date(year, month, 1)
        except (ValueError, TypeError):
            return error('month must be in YYYY-MM format', 400)
    else:
        anchor = register.next_due_date.replace(day=1) if register.next_due_date else today.replace(day=1)

    entries = []
    # Always surface the current cycle's due date if it's the one being viewed.
    if register.next_due_date and register.next_due_date.year == anchor.year and register.next_due_date.month == anchor.month:
        entries.append({
            'date': register.next_due_date.isoformat(),
            'status': register.computed_status(today),
            'dot_color': register.dot_color(today),
        })
    if register.last_completed_date and register.last_completed_date.year == anchor.year and register.last_completed_date.month == anchor.month:
        entries.append({
            'date': register.last_completed_date.isoformat(),
            'status': 'COMPLETED',
            'dot_color': 'green',
        })

    return success({
        'register': register.to_dict(),
        'month': anchor.strftime('%Y-%m'),
        'entries': entries,
    })
