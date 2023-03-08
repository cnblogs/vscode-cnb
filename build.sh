#!/bin/bash

set -e

npm run package -- --env CLIENTID="${1?"Please provide the CLIENTID"}" --env CLIENTSECRET="${2?"Please provide the CLIENTSECRET"}"
npm run ui:package

