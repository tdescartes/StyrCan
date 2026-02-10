"""Logging configuration."""

import logging
import sys
from pathlib import Path
from ..config import settings


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors and labels for different log sources."""
    
    # ANSI color codes
    COLORS = {
        'app': '\033[96m',      # Cyan for app logs
        'sqlalchemy': '\033[93m',  # Yellow for SQLAlchemy
        'uvicorn': '\033[92m',     # Green for Uvicorn
        'reset': '\033[0m',
        'bold': '\033[1m',
    }
    
    def format(self, record):
        # Add color based on logger name
        if record.name.startswith('app.'):
            prefix = f"{self.COLORS['bold']}[APP]{self.COLORS['reset']}{self.COLORS['app']}"
            suffix = self.COLORS['reset']
        elif record.name.startswith('sqlalchemy'):
            prefix = f"{self.COLORS['bold']}[DB]{self.COLORS['reset']}{self.COLORS['sqlalchemy']}"
            suffix = self.COLORS['reset']
        elif record.name.startswith('uvicorn'):
            prefix = f"{self.COLORS['bold']}[SERVER]{self.COLORS['reset']}{self.COLORS['uvicorn']}"
            suffix = self.COLORS['reset']
        else:
            prefix = f"{self.COLORS['bold']}[SYS]{self.COLORS['reset']}"
            suffix = ''
        
        # Format the message
        formatted = super().format(record)
        return f"{prefix} {formatted}{suffix}"


def setup_logging() -> None:
    """Configure application logging with distinct labels for different sources."""
    
    # Create logs directory if it doesn't exist
    log_file_path = Path(settings.log_file)
    log_file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Create formatters
    console_formatter = ColoredFormatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    file_formatter = logging.Formatter(
        "%(asctime)s - [%(name)s] - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Create handlers
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    
    file_handler = logging.FileHandler(settings.log_file)
    file_handler.setFormatter(file_formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if settings.debug else logging.INFO)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    
    # Configure application loggers (your app code)
    app_logger = logging.getLogger("app")
    app_logger.setLevel(logging.DEBUG if settings.debug else logging.INFO)
    
    # Configure SQLAlchemy loggers with distinct levels
    # Engine logger - shows SQL queries
    sqlalchemy_engine = logging.getLogger("sqlalchemy.engine")
    sqlalchemy_engine.setLevel(logging.INFO if settings.debug else logging.WARNING)
    
    # ORM logger - shows ORM operations
    sqlalchemy_orm = logging.getLogger("sqlalchemy.orm")
    sqlalchemy_orm.setLevel(logging.WARNING)
    
    # Pool logger - shows connection pool operations
    sqlalchemy_pool = logging.getLogger("sqlalchemy.pool")
    sqlalchemy_pool.setLevel(logging.WARNING)
    
    # Configure Uvicorn logger
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.setLevel(logging.INFO)
    
    uvicorn_access = logging.getLogger("uvicorn.access")
    uvicorn_access.setLevel(logging.WARNING if not settings.debug else logging.INFO)
