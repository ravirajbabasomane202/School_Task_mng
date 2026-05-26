import click
from flask import Flask
from app.extensions import db


DEPARTMENTS = [
    {'name': 'IT', 'description': 'Information Technology & ERP'},
    {'name': 'HR', 'description': 'Human Resources'},
    {'name': 'Finance', 'description': 'Finance & Accounts'},
    {'name': 'Operations', 'description': 'Administration & School Operations'},
    {'name': 'Property', 'description': 'Property & Maintenance'},
    {'name': 'Principal', 'description': 'Academic Leadership'},
    {'name': 'Admission', 'description': 'Admission & Marketing'},
    {'name': 'Purchase', 'description': 'Procurement & Purchase'},
    {'name': 'Transport', 'description': 'Transport Management'},
]

DEFAULT_USERS = [
    {
        'name': 'Chairman',
        'email': 'chairman@school.com',
        'role': 'CHAIRMAN',
        'department': None,
        'password': 'chairman123'
    },
    {
        'name': 'School Manager',
        'email': 'director@school.com',
        'role': 'DIRECTOR',
        'department': None,
        'password': 'director123'
    },
    {
        'name': 'Property & Maintenance Head',
        'email': 'property@school.com',
        'role': 'PROPERTY',
        'department': 'Property',
        'password': 'property123'
    },
    {
        'name': 'Finance Head',
        'email': 'finance@school.com',
        'role': 'FINANCE',
        'department': 'Finance',
        'password': 'finance123'
    },
    {
        'name': 'Admin Head',
        'email': 'admin@school.com',
        'role': 'ADMIN',
        'department': 'Operations',
        'password': 'admin123'
    },
    {
        'name': 'Principal',
        'email': 'principal@school.com',
        'role': 'PRINCIPAL',
        'department': 'Principal',
        'password': 'principal123'
    },
    {
        'name': 'Admission Head',
        'email': 'admission@school.com',
        'role': 'ADMISSION',
        'department': 'Admission',
        'password': 'admission123'
    },
    {
        'name': 'HR Head',
        'email': 'hr@school.com',
        'role': 'HR',
        'department': 'HR',
        'password': 'hr123'
    },
    {
        'name': 'Purchase Head',
        'email': 'purchase@school.com',
        'role': 'PURCHASE',
        'department': 'Purchase',
        'password': 'purchase123'
    },
    {
        'name': 'IT & ERP Head',
        'email': 'it@school.com',
        'role': 'IT',
        'department': 'IT',
        'password': 'it123'
    },
    {
        'name': 'Transport Head',
        'email': 'transport@school.com',
        'role': 'TRANSPORT',
        'department': 'Transport',
        'password': 'transport123'
    }
]


def register_commands(app: Flask):
    @app.cli.command('seed')
    def seed():
        """Seed departments and default leadership users."""
        from app.models.department import Department
        from app.models.user import User

        click.echo('Seeding departments...')
        for dept_data in DEPARTMENTS:
            department = Department.query.filter_by(name=dept_data['name']).first()
            if not department:
                department = Department(**dept_data)
                db.session.add(department)
                click.echo(f"  + {dept_data['name']}")
            else:
                department.description = dept_data['description']
                click.echo(f"  ~ {dept_data['name']} (updated)")
        db.session.commit()

        department_map = {
            department.name: department.id
            for department in Department.query.all()
        }

        click.echo('\nSeeding leadership users...')
        for user_data in DEFAULT_USERS:
            user = User.query.filter_by(email=user_data['email']).first()
            department_id = department_map.get(user_data['department']) if user_data['department'] else None

            if not user:
                user = User(
                    name=user_data['name'],
                    email=user_data['email'],
                    role=user_data['role'],
                    department_id=department_id,
                    is_active=True
                )
                user.set_password(user_data['password'])
                db.session.add(user)
                click.echo(
                    f"  + {user_data['email']} / password: {user_data['password']} ({user_data['role']})"
                )
            else:
                user.name = user_data['name']
                user.role = user_data['role']
                user.department_id = department_id
                user.is_active = True
                click.echo(f"  ~ {user_data['email']} ({user_data['role']})")

        db.session.commit()
        click.echo('\nDone.')
