import os
import sys

# Add the project root to the system path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.app import app

# Vercel expects the WSGI application to be available as 'app'
# This is already provided by the import
