$ErrorActionPreference = "Stop"
node .opendock/harness/opendock__kitchen-ultrawork/check.mjs
exit $LASTEXITCODE
