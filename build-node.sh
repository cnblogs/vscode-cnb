#!/usr/bin/env bash

npm run package -- --env CLIENTID="${1}" --env CLIENTSECRET="${2}"
npm run ui:package
