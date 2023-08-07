#!/usr/bin/env bash

set -e

./build-wasm.sh
./build-node.sh "${1}" "${2}"
