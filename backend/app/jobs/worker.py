import time
import logging
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.database import SessionLocal
from app.services.billing_service import run_billing_engine
from app.services.reminder_service import dispatch_overdue_reminders

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("brightloop.worker")


def execute_overdue_reminders(trigger_source: str = "daily_worker"):
    logger.info(f"Triggering scheduled overdue invoice reminders ({trigger_source})...")
    db = SessionLocal()
    try:
        result = dispatch_overdue_reminders(db)
        logger.info(
            f"Overdue reminder run finished: {result['dispatched_count']}/{result['total_overdue']} dispatched."
        )
    except Exception as exc:
        logger.exception(f"Error executing overdue reminders: {exc}")
    finally:
        db.close()


def execute_billing_cycle(trigger_source: str = "nightly_worker"):
    logger.info(f"Triggering scheduled billing cycle ({trigger_source})...")
    db = SessionLocal()
    try:
        run = run_billing_engine(db, triggered_by=trigger_source)
        logger.info(
            f"Billing cycle completed: {run.created_count} invoices created, {run.failures_count} failures."
        )
    except Exception as exc:
        logger.exception(f"Error executing scheduled billing cycle: {exc}")
    finally:
        db.close()


def heartbeat_job():
    logger.info("Brightloop background worker heartbeat - active.")


def start_worker():
    scheduler = BlockingScheduler()

    # Heartbeat every 5 minutes
    scheduler.add_job(heartbeat_job, IntervalTrigger(minutes=5), id="worker_heartbeat")

    # Nightly billing run at midnight UTC
    scheduler.add_job(
        lambda: execute_billing_cycle("nightly_cron"),
        CronTrigger(hour=0, minute=0),
        id="nightly_billing",
        replace_existing=True,
    )

    # Daily overdue invoice email reminders at 08:00 AM UTC
    scheduler.add_job(
        lambda: execute_overdue_reminders("daily_cron"),
        CronTrigger(hour=8, minute=0),
        id="daily_overdue_reminders",
        replace_existing=True,
    )

    # Periodic catch-up check every 15 minutes in production
    scheduler.add_job(
        lambda: execute_billing_cycle("periodic_worker"),
        IntervalTrigger(minutes=15),
        id="periodic_billing_check",
        replace_existing=True,
    )

    logger.info("Brightloop background worker started with APScheduler.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Stopping Brightloop background worker process...")


if __name__ == "__main__":
    start_worker()
