import traceback, sys
from pipeline.run_pipeline import run
try:
    run()
except Exception as e:
    traceback.print_exc(file=sys.stdout)
