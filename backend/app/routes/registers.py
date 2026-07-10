from datetime import datetime, date

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.register import Register, CYCLES, PRIORITIES, STATUSES, calculate_next_due_date
from app.models.user import User
from app.utils.response import success, error
from app.utils.decorators import roles_required

registers_bp = Blueprint('registers', __name__)

REGISTER_MANAGER_ROLES = ('CHAIRMAN',)

REQUIRED_FIELDS = ['name', 'register_no', 'head_name', 'cycle', 'priority', 'start_date']


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


def _validate_payload(data, partial=False):
    """Validate register fields. Returns an error message string, or None if valid."""
    fields = REQUIRED_FIELDS if not partial else [f for f in REQUIRED_FIELDS if f in data]
    for field in fields:
        if data.get(field) in (None, ''):
            return f'{field} is required'

    if 'cycle' in data and data['cycle'] and data['cycle'].upper() not in CYCLES:
        return f"cycle must be one of {', '.join(CYCLES)}"

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

    events = []
    for r in registers:
        is_future_or_pending = r.next_due_date >= date.today()
        if r.status == 'OK':
            color = 'green'
        elif r.status == 'REJECTED':
            color = 'red'
        else:
            color = 'gray'  # IDLE - future or not completed

        events.append({
            'id': r.id,
            'title': f'{r.name} ({r.register_no})',
            'date': r.next_due_date.isoformat(),
            'status': r.status,
            'color': color,
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

    validation_error = _validate_payload(data)
    if validation_error:
        return error(validation_error, 400)

    register_no = str(data['register_no']).strip()
    if Register.query.filter_by(register_no=register_no).first():
        return error('Register No. already exists. Register numbers must be unique.', 409)

    start_date = _parse_date(data['start_date'])
    cycle = data['cycle'].upper()

    user_id = get_jwt_identity()

    register = Register(
        name=data['name'].strip(),
        register_no=register_no,
        head_name=data['head_name'].strip(),
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

    validation_error = _validate_payload(data, partial=True)
    if validation_error:
        return error(validation_error, 400)

    if 'register_no' in data:
        new_register_no = str(data['register_no']).strip()
        if new_register_no != register.register_no:
            existing = Register.query.filter_by(register_no=new_register_no).first()
            if existing and existing.id != register.id:
                return error('Register No. already exists. Register numbers must be unique.', 409)
            register.register_no = new_register_no

    if 'name' in data:
        register.name = data['name'].strip()
    if 'head_name' in data:
        register.head_name = data['head_name'].strip()
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
        register.next_due_date = calculate_next_due_date(base_date, register.cycle)

    db.session.commit()
    return success(register.to_dict(), 'Register status updated')
