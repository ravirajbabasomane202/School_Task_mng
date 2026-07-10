import calendar
from datetime import datetime, timezone, date, timedelta

from app.extensions import db

CYCLES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']
PRIORITIES = ['HIGH', 'MEDIUM', 'LOW']
STATUSES = ['IDLE', 'OK', 'REJECTED']


def _add_months(base: date, months: int) -> date:
    """Add calendar months to a date, clamping the day to the target month's length."""
    month_index = base.month - 1 + months
    year = base.year + month_index // 12
    month = month_index % 12 + 1
    day = min(base.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def calculate_next_due_date(from_date, cycle: str):
    """Return the next due date after `from_date` for the given cycle."""
    if isinstance(from_date, datetime):
        from_date = from_date.date()

    cycle = (cycle or '').upper()
    if cycle == 'DAILY':
        return from_date + timedelta(days=1)
    if cycle == 'WEEKLY':
        return from_date + timedelta(days=7)
    if cycle == 'MONTHLY':
        return _add_months(from_date, 1)
    if cycle == 'QUARTERLY':
        return _add_months(from_date, 3)
    if cycle == 'HALF_YEARLY':
        return _add_months(from_date, 6)
    if cycle == 'YEARLY':
        return _add_months(from_date, 12)
    # Fallback: treat unknown cycles like monthly
    return _add_months(from_date, 1)


class Register(db.Model):
    __tablename__ = 'registers'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    register_no = db.Column(db.String(50), nullable=False, unique=True)
    head_name = db.Column(db.String(150), nullable=False)
    cycle = db.Column(db.String(20), nullable=False)  # DAILY, WEEKLY, MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY
    priority = db.Column(db.String(10), nullable=False, default='MEDIUM')  # HIGH, MEDIUM, LOW
    status = db.Column(db.String(20), nullable=False, default='IDLE')  # IDLE, OK, REJECTED
    start_date = db.Column(db.Date, nullable=False)
    next_due_date = db.Column(db.Date, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    creator = db.relationship('User', foreign_keys=[created_by], lazy='joined')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'register_no': self.register_no,
            'head_name': self.head_name,
            'cycle': self.cycle,
            'priority': self.priority,
            'status': self.status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'next_due_date': self.next_due_date.isoformat() if self.next_due_date else None,
            'created_by': self.created_by,
            'created_by_name': self.creator.name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
