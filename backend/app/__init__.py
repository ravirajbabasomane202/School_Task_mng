import os
from flask import Flask, send_from_directory
from config import config
from app.extensions import db, migrate, jwt, socketio, cors, bcrypt, scheduler


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config.get(config_name, config['default']))

    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'tasks'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'reports'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'resumes'), exist_ok=True)

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config['FRONTEND_URL'], "supports_credentials": True}})
    async_mode = os.environ.get('SOCKETIO_ASYNC_MODE')
    if not async_mode:
        async_mode = 'threading' if os.name == 'nt' else 'eventlet'

    socketio_options = {
        'cors_allowed_origins': app.config['FRONTEND_URL'],
        'async_mode': async_mode
    }

    if async_mode == 'eventlet':
        socketio_options['transports'] = ['websocket']

    socketio.init_app(app, **socketio_options)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.departments import departments_bp
    from app.routes.tasks import tasks_bp
    from app.routes.notifications import notifications_bp
    from app.routes.approvals import approvals_bp
    from app.routes.announcements import announcements_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.reports import reports_bp
    from app.routes.meetings import meetings_bp
    from app.routes.housekeeping import housekeeping_bp
    from app.routes.leave import leave_bp
    from app.routes.salary import salary_bp
    from app.routes.recruitment import recruitment_bp
    from app.routes.assets import assets_bp
    from app.routes.purchase_orders import po_bp
    from app.routes.escalations import escalations_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(departments_bp, url_prefix='/api/departments')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(approvals_bp, url_prefix='/api/approvals')
    app.register_blueprint(announcements_bp, url_prefix='/api/announcements')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(meetings_bp, url_prefix='/api/meetings')
    app.register_blueprint(housekeeping_bp, url_prefix='/api/housekeeping')
    app.register_blueprint(leave_bp, url_prefix='/api/leave')
    app.register_blueprint(salary_bp, url_prefix='/api/salary-increments')
    app.register_blueprint(recruitment_bp, url_prefix='/api/recruitment')
    app.register_blueprint(assets_bp, url_prefix='/api/assets')
    app.register_blueprint(po_bp, url_prefix='/api/purchase-orders')
    app.register_blueprint(escalations_bp, url_prefix='/api/escalations')

    # ── APScheduler: auto-escalation every hour ──────────────────────────────
    # Guard against multiple gunicorn workers each starting their own scheduler.
    # We check WORKER_ID (set in gunicorn config) or fall back to checking
    # whether we are the first/only process via a simple env sentinel.
    # Set SCHEDULER_WORKER_ID=1 in your gunicorn preload config so only one
    # worker starts the scheduler; leave unset in dev (single process).
    worker_id = os.environ.get('SCHEDULER_WORKER_ID')
    current_worker = os.environ.get('WORKER_ID', '1')
    is_scheduler_worker = (worker_id is None) or (current_worker == worker_id)

    # Disable scheduler in testing mode or when env var says no
    enable_scheduler = (
        not app.config.get('TESTING', False)
        and os.environ.get('ENABLE_SCHEDULER', 'true').lower() == 'true'
    )
    if enable_scheduler and is_scheduler_worker and not scheduler.running:
        from app.tasks.escalation import run_escalation_job
        hours_threshold = int(os.environ.get('ESCALATION_HOURS', 48))

        def _scheduled_escalation():
            with app.app_context():
                count = run_escalation_job(hours_threshold)
                if count:
                    app.logger.info(f'[Scheduler] Auto-escalated {count} task(s).')

        scheduler.add_job(
            _scheduled_escalation,
            trigger='interval',
            hours=1,
            id='auto_escalation',
            replace_existing=True,
        )
        scheduler.start()
        app.logger.info('[Scheduler] APScheduler started – escalation job runs every hour.')

    # Static file serving for uploads
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Register SocketIO events
    from app.sockets import events  # noqa: F401

    # Register CLI commands
    from app.commands import register_commands
    register_commands(app)

    return app
