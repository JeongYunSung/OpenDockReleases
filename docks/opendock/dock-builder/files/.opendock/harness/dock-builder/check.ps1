$ErrorActionPreference = "Stop"
node .opendock/harness/dock-builder/check.mjs @args
exit $LASTEXITCODE
