import traceback
from pipeline.run_pipeline import run

try:
    run()
except Exception as e:
    traceback.print_exc()
